/**
 * Firebase Cloud Functions - Multi-API Fallback for AI Queries
 */

const functions = require("firebase-functions");
const axios = require("axios");

const runtimeOptions = {
  timeoutSeconds: 30,
  memory: "256MB",
};

const DEFAULT_MODELS = {
  GoogleAI: "gemini-1.5-flash",
  OpenRouter: "meta-llama/llama-3.1-70b-instruct",
  Groq: "llama-3.1-8b-instant",
  Mistral: "mistral-large-latest",
  Cerebras: "llama3.1-70b",
  HuggingFace: "mistralai/Mixtral-8x7B-Instruct-v0.1",
  Cohere: "command-r",
};

const http = axios.create({
  timeout: 20000,
});

// Location extraction from query
function extractLocationFromQuery(query) {
  const locationPatterns = [
    /in\s+([a-z\s,]+)$/i,
    /at\s+([a-z\s,]+)$/i,
    /near\s+([a-z\s,]+)$/i,
    /around\s+([a-z\s,]+)$/i
  ];

  for (const pattern of locationPatterns) {
    const match = query.match(pattern);
    if (match) {
      const location = match[1].trim();
      const dishQuery = query.replace(match[0], '').trim();
      return { location, dishQuery };
    }
  }

  // Handle "near me" and similar cases
  if (query.toLowerCase().includes('near me') || query.toLowerCase().includes('nearby')) {
    const dishQuery = query.toLowerCase().replace(/near\s+me|nearby/g, '').trim();
    return { location: "current", dishQuery };
  }

  return { location: null, dishQuery: query };
}

// Simple in-memory cache (resets on cold start)
const cache = new Map();
const CACHE_TTL = 3600000; // 1 hour in milliseconds

// API Key validation and logging
function validateApiKey(provider, key) {
  if (!key) {
    console.error(`[${provider}] API key missing or invalid`);
    return false;
  }

  if (key.length < 10) {
    console.error(`[${provider}] API key too short (length: ${key.length})`);
    return false;
  }

  console.log(`[${provider}] API key validated (length: ${key.length})`);
  return true;
}

function getCacheKey(query, location) {
  return `${query.toLowerCase().trim()}_${(location || "").toLowerCase().trim()}`;
}

function getFromCache(key) {
  const cached = cache.get(key);
  if (!cached) return null;

  const now = Date.now();
  if (now - cached.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }

  console.log("[Cache] HIT for key:", key);
  return cached.data;
}

function setCache(key, data) {
  console.log("[Cache] SET for key:", key);
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });

  // Limit cache size to 100 entries
  if (cache.size > 100) {
    const firstKey = cache.keys().next().value;
    cache.delete(firstKey);
  }
}

async function getNearbyRestaurants(location, query) {
  try {
    const googleMapsKey = process.env.GOOGLE_MAPS_KEY || functions.config().googlemaps?.key;
    if (!googleMapsKey) {
      console.log("[Places API] No Google Maps key configured");
      return null;
    }

    // Parse location (lat,lng)
    const [lat, lng] = location.split(",").map(s => parseFloat(s.trim()));
    if (!lat || !lng) return null;

    // Extract food type from query
    const foodType = query.toLowerCase().match(/\b(biryani|pizza|sushi|burger|pasta|tacos|chinese|indian|italian|thai|mexican)\b/)?.[0] || "restaurant";

    console.log(`[Places API] Searching for ${foodType} near ${lat},${lng} within ${16000}m radius`);
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=16000&keyword=${foodType}&type=restaurant&key=${googleMapsKey}`;

    const response = await http.get(url);
    const places = response.data.results?.slice(0, 5) || [];
    console.log(`[Places API] Found ${places.length} restaurants near ${lat},${lng}`);

    if (places.length === 0) return null;

    return places.map(place => ({
      name: place.name,
      address: place.vicinity,
      rating: place.rating || "N/A",
      userRatings: place.user_ratings_total || 0,
      isOpen: place.opening_hours?.open_now ? "Open now" : "Closed",
    }));
  } catch (err) {
    console.error("[Places API] Error:", err.message);
    return null;
  }
}

function sanitizePrompt(query, extras = {}) {
  const base = typeof query === "string" ? query.trim() : "";
  const location = typeof extras.location === "string" ? extras.location.trim() : "";
  const extraContext = typeof extras.context === "string" ? extras.context.trim() : "";
  const nearbyPlaces = extras.nearbyPlaces;

  // Build location context
  let locationContext = "";
  if (location === "current") {
    locationContext = "User has enabled location services. Use their current coordinates to find nearby restaurants.";
  } else if (location && location.includes(",")) {
    locationContext = `User coordinates provided: ${location}. Find restaurants within 5-10 miles of these coordinates in Round Rock area only.`;
  } else if (location) {
    locationContext = `User is searching for restaurants in: ${location}. Provide restaurant recommendations specifically for ${location}, not the user's current location.`;
  } else {
    locationContext = "Provide general restaurant recommendations.";
  }

  let prompt = "";
  if (location && location.includes(",") && location === "current") {
    // User provided coordinates for "near me" search - use Round Rock context
    prompt = `Find the best restaurants that serve ${base} within a 5-10 mile radius of the provided coordinates.

CRITICAL: The user has provided their exact coordinates: ${extras.location}. This is their precise location in Round Rock, Texas area. You MUST find restaurants within 5-10 miles of these exact coordinates. Do NOT provide restaurants from Austin proper, downtown Austin, or other distant areas.

IMPORTANT LOCATION DETAILS:
- User's coordinates: ${extras.location}
- This is Round Rock, TX area (north of Austin)
- Search radius: MAXIMUM 10 miles from these coordinates
- Do NOT include restaurants in Austin (78701, 78704, etc.)
- Focus ONLY on restaurants in Round Rock, Pflugerville, or immediately adjacent areas

${nearbyPlaces && nearbyPlaces.length > 0 ? `Here are some nearby restaurants found via Google Places API:\n${nearbyPlaces.map((place, idx) => `${idx + 1}. ${place.name} - ${place.address} (${place.rating}/5, ${place.userRatings} reviews)`).join('\n')}\n` : ''}

STRICT GEOGRAPHIC BOUNDARIES:
- Restaurant addresses must be in Round Rock (78664, 78681) or Pflugerville (78660)
- Do NOT include Austin restaurants (787xx zip codes)
- Maximum distance: 10 miles from coordinates
- All restaurants must be in Williamson County, TX

Provide 3-5 restaurant recommendations in Round Rock area only.`;
  } else if (location && location !== "current" && !location.includes(",")) {
    // User specified a named location
    prompt = `Find the best restaurants that serve ${base} in ${location}.

IMPORTANT: The user is specifically searching for restaurants in ${location}, not their current location. Provide restaurant recommendations for ${location} only.

Provide 3-5 restaurant recommendations specifically in ${location} with complete details including names, addresses, ratings, and reviews.`;
  } else {
    // No specific location - provide general recommendations
    prompt = `Find the best restaurants that serve ${base}.

IMPORTANT: This is a general search for ${base} restaurants. Provide popular and highly-rated restaurant recommendations that serve ${base}. Do not restrict to any specific location unless explicitly requested.

Provide 3-5 restaurant recommendations with complete details including:
- Restaurant names and addresses
- Star ratings and review counts
- Why each restaurant is recommended for ${base}
- Specific dishes they serve

Focus on well-known and popular restaurants that serve excellent ${base}.`;
  }

  if (extraContext) prompt += `\n\nAdditional context: ${extraContext}`;
  return prompt;
}

// Food-only content filtering
function isFoodRelatedQuery(query) {
  const nonFoodKeywords = ['movie', 'hotel', 'flight', 'booking', 'shop', 'electronics', 'clothes', 'phone', 'laptop', 'car', 'bus', 'train'];
  const queryLower = query.toLowerCase();

  if (nonFoodKeywords.some(kw => queryLower.includes(kw))) {
    return false;
  }
  return true;
}

// Extract food part from query (remove common prefixes/suffixes)
function extractFoodFromQuery(query) {
  let foodPart = query.toLowerCase();

  // Remove common prefixes
  const prefixes = ['best', 'top', 'good', 'great', 'delicious', 'tasty', 'amazing', 'find', 'show', 'recommend', 'suggest'];
  prefixes.forEach(prefix => {
    if (foodPart.startsWith(prefix + ' ')) {
      foodPart = foodPart.substring(prefix.length + 1);
    }
  });

  // Remove common suffixes
  const suffixes = ['near me', 'nearby', 'around me', 'in my area'];
  suffixes.forEach(suffix => {
    if (foodPart.endsWith(' ' + suffix)) {
      foodPart = foodPart.substring(0, foodPart.length - suffix.length - 1);
    }
  });

  // Clean up extra spaces and return
  foodPart = foodPart.trim();

  // If nothing left or too short, return original
  if (foodPart.length < 2) {
    return query;
  }

  return foodPart;
}
// Provider Clients
async function callGoogleAI(prompt, model) {
  const key = process.env.GOOGLEAI_KEY || functions.config().googleai?.key;
  if (!validateApiKey("GoogleAI", key)) throw new Error("Missing or invalid Google AI key");
  console.log("[GoogleAI] Key exists:", !!key, "Key length:", key?.length);
  const url = `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

  const payload = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  };

  const res = await http.post(url, payload);
  const text = res?.data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join(" ") || "";
  if (!text) throw new Error("Google AI: Empty response");
  return { provider: "GoogleAI", result: text };
}

async function callGroq(prompt, model) {
  const key = process.env.GROQ_KEY || functions.config().groq?.key;
  if (!validateApiKey("Groq", key)) throw new Error("Missing or invalid Groq key");
  console.log("[Groq] Key exists:", !!key, "Key length:", key?.length);
  const url = "https://api.groq.com/openai/v1/chat/completions";

  const payload = {
    model,
    messages: [{ role: "user", content: prompt }],
    temperature: 0.2,
  };

  const res = await http.post(url, payload, {
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
  });
  const text = res?.data?.choices?.[0]?.message?.content || "";
  if (!text) throw new Error("Groq: Empty response");
  return { provider: "Groq", result: text };
}

async function callOpenRouter(prompt, model) {
  const key = process.env.OPENROUTER_KEY || functions.config().openrouter?.key;
  if (!validateApiKey("OpenRouter", key)) throw new Error("Missing or invalid OpenRouter key");
  console.log("[OpenRouter] Key exists:", !!key, "Key length:", key?.length);
  const url = "https://openrouter.ai/api/v1/chat/completions";

  const payload = {
    model,
    messages: [{ role: "user", content: prompt }],
  };

  const res = await http.post(url, payload, {
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://foodietrusts.com",
      "X-Title": "FoodieTrust AI Search",
    },
  });
  const text = res?.data?.choices?.[0]?.message?.content || "";
  if (!text) throw new Error("OpenRouter: Empty response");
  return { provider: "OpenRouter", result: text };
}

async function tryProvidersInOrder(prompt, models) {
  const errors = [];
  const TIMEOUT_MS = 8000; // 8 seconds per provider

  // Try Google AI
  try {
    console.log("[Provider 1] Trying Google AI...");
    const result = await Promise.race([
      callGoogleAI(prompt, models.GoogleAI),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Google AI timeout")), TIMEOUT_MS)
      )
    ]);
    console.log("[Provider 1] Google AI SUCCESS!");
    return result;
  } catch (err) {
    const errorInfo = {
      provider: "GoogleAI",
      message: err?.message,
      status: err?.response?.status,
      data: err?.response?.data,
      code: err?.code,
    };
    console.error("[Provider 1] Google AI FAILED:", JSON.stringify(errorInfo));
    errors.push(errorInfo);
  }

  // Try Groq
  try {
    console.log("[Provider 2] Trying Groq...");
    const result = await Promise.race([
      callGroq(prompt, models.Groq),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Groq timeout")), TIMEOUT_MS)
      )
    ]);
    console.log("[Provider 2] Groq SUCCESS!");
    return result;
  } catch (err) {
    const errorInfo = {
      provider: "Groq",
      message: err?.message,
      status: err?.response?.status,
      data: err?.response?.data,
      code: err?.code,
    };
    console.error("[Provider 2] Groq FAILED:", JSON.stringify(errorInfo));
    errors.push(errorInfo);
  }

  // Try OpenRouter (if key available)
  try {
    console.log("[Provider 3] Trying OpenRouter...");
    const result = await Promise.race([
      callOpenRouter(prompt, models.OpenRouter),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("OpenRouter timeout")), TIMEOUT_MS)
      )
    ]);
    console.log("[Provider 3] OpenRouter SUCCESS!");
    return result;
  } catch (err) {
    const errorInfo = {
      provider: "OpenRouter",
      message: err?.message,
      status: err?.response?.status,
      data: err?.response?.data,
      code: err?.code,
    };
    console.error("[Provider 3] OpenRouter FAILED:", JSON.stringify(errorInfo));
    errors.push(errorInfo);
  }

  console.error("[All providers failed]", JSON.stringify(errors));
  throw new Error("All providers failed. Errors: " + JSON.stringify(errors));
}

exports.aiMultiProvider = functions.https.onCall(async (data, context) => {
  try {
    const query = data.query;
    const userLocation = data.location;

    console.log('=== SEARCH REQUEST ===');
    console.log('Query:', query);
    console.log('Location data received:', userLocation);

    // STEP 1: VALIDATE LOCATION - with fallback
    let locationString = 'Round Rock, TX';
    let coordinates = '30.2672,-97.7431';

    if (userLocation?.lat && userLocation?.lng) {
      locationString = `${userLocation.city || 'Round Rock'}, ${userLocation.state || 'TX'}`;
      coordinates = `${userLocation.lat},${userLocation.lng}`;
      console.log('✅ Using provided location:', locationString);
    } else {
      console.log('⚠️ No location provided, using default Round Rock coordinates');
    }

    console.log('Final location string:', locationString);
    console.log('Final coordinates:', coordinates);

    // STEP 2: EXTRACT DISH NAME
    const dishName = query
      .replace(/best/gi, '')
      .replace(/near me/gi, '')
      .replace(/in [a-z\s]+$/gi, '')
      .trim();

    // STEP 3: GET REAL RESTAURANTS FROM GOOGLE PLACES
    const googleMapsKey = functions.config().googlemaps.key;

    const placesResponse = await axios.get(
      'https://maps.googleapis.com/maps/api/place/textsearch/json',
      {
        params: {
          query: `${dishName} restaurant ${locationString}` ,
          location: coordinates,
          radius: 10000, // 10km
          type: 'restaurant',
          key: googleMapsKey
        }
      }
    );

    const restaurants = placesResponse.data.results || [];

    console.log(`Found ${restaurants.length} real restaurants from Google Places` );

    // STEP 4: VALIDATE WE HAVE REAL DATA
    if (restaurants.length === 0) {
      return {
        response: `No restaurants found for "${dishName}" near ${locationString}. Try a different search term.` ,
        restaurantCount: 0
      };
    }

    // STEP 5: FORMAT REAL RESTAURANT DATA
    const formattedRestaurants = restaurants.slice(0, 5).map((place, index) => {
      return {
        rank: index + 1,
        name: place.name,
        address: place.formatted_address,
        rating: place.rating || 'N/A',
        reviewCount: place.user_ratings_total || 0,
        priceLevel: place.price_level ? '$'.repeat(place.price_level) : 'N/A',
        isOpen: place.opening_hours?.open_now ? 'Open now' : 'Closed',
        placeId: place.place_id
      };
    });

    console.log('Formatted restaurants:', JSON.stringify(formattedRestaurants, null, 2));

    // STEP 6: CREATE STRICT AI PROMPT
    const aiPrompt = `You are a restaurant recommendation assistant.

USER LOCATION: ${locationString}
USER SEARCH: ${query}

REAL RESTAURANT DATA FROM GOOGLE PLACES API:
${JSON.stringify(formattedRestaurants, null, 2)}

STRICT INSTRUCTIONS:
1. Use ONLY the restaurants listed above - DO NOT invent or suggest any other restaurants
2. Present exactly these ${formattedRestaurants.length} restaurants in order
3. Use the EXACT names and addresses provided
4. Use the EXACT ratings and review counts provided
5. DO NOT say "I don't know your location" - the location is ${locationString}
6. DO NOT ask for clarification - respond with the data above
7. Format each restaurant as:

[Rank]. **[Exact Restaurant Name]**
   Address: [Exact Address from data]
   Rating: [Exact Rating from data] ⭐ ([Exact Review Count] reviews)
   Price: [Price Level]
   Status: [Open/Closed status]

   Why visit: [Brief 1-2 sentence recommendation based on ratings and the dish type]

Start your response with: "Here are the top ${formattedRestaurants.length} restaurants for ${dishName} near ${locationString}:"

DO NOT ADD ANY DISCLAIMERS OR NOTES. Just present the data.`;

    // STEP 7: CALL AI WITH STRICT PROMPT
    const googleAIKey = functions.config().googleai.key;

    const aiResponse = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${googleAIKey}` ,
      {
        contents: [{
          parts: [{ text: aiPrompt }]
        }],
        generationConfig: {
          temperature: 0.3, // Low temperature for factual responses
          maxOutputTokens: 2000
        }
      }
    );

    const aiText = aiResponse.data.candidates[0].content.parts[0].text;

    // STEP 8: VERIFY AI DIDN'T HALLUCINATE
    const responseIncludesRealRestaurants = formattedRestaurants.every(r =>
      aiText.includes(r.name)
    );

    if (!responseIncludesRealRestaurants) {
      console.error('AI HALLUCINATED! Returning raw data instead.');
      // Fallback: Return formatted data directly
      const fallbackResponse = `Here are the top ${formattedRestaurants.length} restaurants for ${dishName} near ${locationString}:\n\n`  +
        formattedRestaurants.map(r =>
          `${r.rank}. **${r.name}**\n`  +
          `   Address: ${r.address}\n`  +
          `   Rating: ${r.rating} ⭐ (${r.reviewCount} reviews)\n`  +
          `   Price: ${r.priceLevel}\n`  +
          `   Status: ${r.isOpen}\n\n`
        ).join('');

      return {
        response: fallbackResponse,
        location: locationString,
        restaurantCount: formattedRestaurants.length,
        dataSource: 'fallback'
      };
    }

    // STEP 9: RETURN REAL DATA
    return {
      response: aiText,
      location: locationString,
      restaurantCount: formattedRestaurants.length,
      restaurants: formattedRestaurants, // Raw data for debugging
      dataSource: 'google-places'
    };

  } catch (error) {
    console.error('Error in aiMultiProvider:', error);
    return {
      error: error.message,
      details: error.response?.data || 'Unknown error'
    };
  }
});

/**
 * Swiggy Menu Fetcher - Get dish-level menu for a restaurant
 */
exports.getSwiggyMenu = functions.runWith(runtimeOptions).https.onCall(async (data, context) => {
  const { lat, lng, restaurantId } = data;

  // Validate inputs
  if (!lat || !lng || !restaurantId) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      "Missing required parameters: lat, lng, restaurantId"
    );
  }

  console.log(`[getSwiggyMenu] Fetching menu for restaurant ${restaurantId} at ${lat},${lng}`);

  try {
    const swiggyUrl = `https://www.swiggy.com/dapi/menu/pl?page-type=REGULAR_MENU&complete-menu=true&lat=${lat}&lng=${lng}&restaurantId=${restaurantId}`;
    
    const response = await http.get(swiggyUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        "Accept": "application/json",
      },
    });

    if (!response.data || !response.data.data) {
      throw new Error("Invalid response from Swiggy API");
    }

    // Extract menu items from Swiggy's nested structure
    const menuData = response.data.data;
    const cards = menuData?.cards || [];
    
    const dishes = [];
    
    // Parse through Swiggy's card structure to find menu items
    for (const card of cards) {
      const groupedCard = card?.groupedCard?.cardGroupMap?.REGULAR?.cards || [];
      
      for (const menuCard of groupedCard) {
        const itemCards = menuCard?.card?.card?.itemCards || [];
        
        for (const item of itemCards) {
          const info = item?.card?.info || {};
          
          if (info.name) {
            dishes.push({
              id: info.id || `dish-${dishes.length}`,
              name: info.name,
              price: info.price ? info.price / 100 : info.defaultPrice ? info.defaultPrice / 100 : 0,
              description: info.description || "",
              isVeg: info.isVeg === 1 || info.itemAttribute?.vegClassifier === "VEG",
              rating: info.ratings?.aggregatedRating?.rating || null,
              ratingCount: info.ratings?.aggregatedRating?.ratingCountV2 || null,
              imageId: info.imageId || null,
              category: menuCard?.card?.card?.title || "General",
            });
          }
        }
      }
    }

    console.log(`[getSwiggyMenu] Found ${dishes.length} dishes for restaurant ${restaurantId}`);

    return {
      success: true,
      restaurantId,
      restaurantName: menuData?.cards?.[0]?.card?.card?.info?.name || "Unknown",
      dishes,
      totalDishes: dishes.length,
    };

  } catch (err) {
    console.error("[getSwiggyMenu error]", {
      message: err?.message,
      status: err?.response?.status,
      data: err?.response?.data,
    });

    // Handle specific error cases
    if (err?.response?.status === 404) {
      throw new functions.https.HttpsError("not-found", "Restaurant menu not found on Swiggy");
    }

    throw new functions.https.HttpsError(
      "internal",
      `Failed to fetch menu: ${err.message}`
    );
  }
});
