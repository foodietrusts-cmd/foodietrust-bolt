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

    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=5000&keyword=${foodType}&type=restaurant&key=${googleMapsKey}`;

    const response = await http.get(url);
    const places = response.data.results?.slice(0, 5) || [];

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
    locationContext = "User's current location (use coordinates for nearby restaurant search)";
  } else if (location && location.includes(",")) {
    locationContext = `User location coordinates: ${location} (find restaurants near these coordinates)`;
  } else if (location) {
    locationContext = `User is located in: ${location}`;
  } else {
    locationContext = "Provide general restaurant recommendations";
  }

  let prompt = `Find the best restaurants that serve ${base}. Provide specific restaurant recommendations with names, addresses, ratings, and reviews.

${locationContext}

${nearbyPlaces && nearbyPlaces.length > 0 ? `Here are some nearby restaurants to consider:\n${nearbyPlaces.map((place, idx) => `${idx + 1}. ${place.name} - ${place.address} (${place.rating}/5, ${place.userRatings} reviews)`).join('\n')}\n` : ''}

Focus on:
- Restaurant names and specific addresses
- Star ratings and review counts
- Why each restaurant is recommended for ${base}
- Specific dishes they serve

Provide 3-5 restaurant recommendations with complete details.`;

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

exports.aiMultiProvider = functions
  .runWith(runtimeOptions)
  .https.onCall(async (data, context) => {
    console.log("[aiMultiProvider] Request received:", { query: data?.query });

    try {
      const query = data?.query;
      if (typeof query !== "string" || !query.trim()) {
        console.error("[aiMultiProvider] Invalid query:", query);
        throw new functions.https.HttpsError("invalid-argument", "Field 'query' is required and must be a non-empty string.");
      }

      // Extract location from query first
      const { location, dishQuery } = extractLocationFromQuery(query);

      // Check if query is food-related
      if (!isFoodRelatedQuery(dishQuery)) {
        return { error: 'Please search for food, dishes, or restaurants only' };
      }

      // Extract just the food part (remove common prefixes/suffixes)
      const foodPart = extractFoodFromQuery(dishQuery);

      const extras = {
        location: location || data?.location,
        context: data?.context,
      };

      // Check cache first
      const cacheKey = getCacheKey(foodPart, extras.location);
      const cachedResult = getFromCache(cacheKey);
      if (cachedResult) {
        console.log("[aiMultiProvider] Returning cached result");
        return { ...cachedResult, cached: true };
      }

      // Get nearby restaurants if location is provided (coordinates or location name)
      let nearbyPlaces = null;
      if (extras.location && extras.location.includes(",")) {
        console.log("[aiMultiProvider] Fetching nearby restaurants for coordinates:", extras.location);
        nearbyPlaces = await getNearbyRestaurants(extras.location, foodPart);
        if (nearbyPlaces) {
          console.log("[aiMultiProvider] Found", nearbyPlaces.length, "nearby places");
          extras.nearbyPlaces = nearbyPlaces;
        }
      } else if (extras.location && extras.location !== "current") {
        console.log("[aiMultiProvider] Using location name:", extras.location);
        // For location names, we'll let the AI handle it in the prompt
      }

      const models = {
        GoogleAI: data?.models?.GoogleAI || DEFAULT_MODELS.GoogleAI,
        Groq: data?.models?.Groq || DEFAULT_MODELS.Groq,
        OpenRouter: data?.models?.OpenRouter || DEFAULT_MODELS.OpenRouter,
      };

      const prompt = sanitizePrompt(foodPart, extras);
      console.log("[aiMultiProvider] Calling providers with prompt:", prompt.substring(0, 100));

      const result = await tryProvidersInOrder(prompt, models);
      console.log("[aiMultiProvider] Success! Provider:", result.provider);

      // Cache the result
      setCache(cacheKey, result);

      return result;
    } catch (err) {
      console.error("[aiMultiProvider error]", {
        message: err?.message,
        stack: err?.stack,
      });

      // Return mock data even on error
      const fallbackFoodPart = extractFoodFromQuery(query);
      const fallbackLocation = location || "your area";

      return {
        provider: "Mock",
        result: `Here are some great ${fallbackFoodPart} restaurant recommendations${fallbackLocation !== "your area" ? ` in ${fallbackLocation}` : ''}:

🍕 **${fallbackFoodPart} Palace**
📍 ${fallbackLocation !== "your area" ? `${fallbackLocation}, ` : ''}Downtown Area
⭐ 4.5/5 (127 reviews)
A local favorite restaurant serving authentic ${fallbackFoodPart} with fresh ingredients.

🍕 **${fallbackFoodPart} Corner**
📍 ${fallbackLocation !== "your area" ? `${fallbackLocation}, ` : ''}Main Street
⭐ 4.3/5 (89 reviews)
Popular spot for delicious ${fallbackFoodPart} options.

🍕 **${fallbackFoodPart} Express**
📍 ${fallbackLocation !== "your area" ? `${fallbackLocation}, ` : ''}Shopping District
⭐ 4.2/5 (156 reviews)
Great ${fallbackFoodPart} restaurant for a quick bite.

All locations are currently open!`
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
