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
    /near\s+([a-z\s,]+)$/i
  ];

  for (const pattern of locationPatterns) {
    const match = query.match(pattern);
    if (match) {
      const location = match[1].trim();
      const dishQuery = query.replace(match[0], '').trim();
      return { location, dishQuery };
    }
  }
  return { location: null, dishQuery: query };
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

      const extras = {
        location: location || data?.location,
        context: data?.context,
      };

      // Check cache first
      const cacheKey = getCacheKey(dishQuery, extras.location);
      const cachedResult = getFromCache(cacheKey);
      if (cachedResult) {
        console.log("[aiMultiProvider] Returning cached result");
        return { ...cachedResult, cached: true };
      }

      // Get nearby restaurants if location is provided
      let nearbyPlaces = null;
      if (extras.location && extras.location.includes(",")) {
        console.log("[aiMultiProvider] Fetching nearby restaurants...");
        nearbyPlaces = await getNearbyRestaurants(extras.location, query);
        if (nearbyPlaces) {
          console.log("[aiMultiProvider] Found", nearbyPlaces.length, "nearby places");
          extras.nearbyPlaces = nearbyPlaces;
        }
      }

      const models = {
        GoogleAI: data?.models?.GoogleAI || DEFAULT_MODELS.GoogleAI,
        Groq: data?.models?.Groq || DEFAULT_MODELS.Groq,
        OpenRouter: data?.models?.OpenRouter || DEFAULT_MODELS.OpenRouter,
      };

      const prompt = sanitizePrompt(dishQuery, extras);
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
        responseStatus: err?.response?.status,
        responseData: JSON.stringify(err?.response?.data),
      });

      throw new functions.https.HttpsError("internal", "AI service temporarily unavailable: " + err.message);
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
