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
  GoogleAI: "gemini-1.5-flash-latest",
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

// Simple in-memory cache (resets on cold start)
const cache = new Map();
const CACHE_TTL = 3600000; // 1 hour in milliseconds

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

  let prompt = base;
  
  if (nearbyPlaces && nearbyPlaces.length > 0) {
    prompt += `\n\nHere are the top nearby restaurants based on the user's location:\n`;
    nearbyPlaces.forEach((place, idx) => {
      prompt += `\n${idx + 1}. **${place.name}**`;
      prompt += `\n   - Address: ${place.address}`;
      prompt += `\n   - Rating: ${place.rating}/5 (${place.userRatings} reviews)`;
      prompt += `\n   - Status: ${place.isOpen}`;
    });
    prompt += `\n\nPlease provide a detailed recommendation based on these actual nearby restaurants. Include specific names, addresses, and why each is recommended.`;
  } else if (location) {
    prompt += `\n\nUser location: ${location}`;
  }
  
  if (extraContext) prompt += `\n\nAdditional context: ${extraContext}`;
  
  return prompt;
}

// Provider Clients
async function callGoogleAI(prompt, model) {
  const key = process.env.GOOGLEAI_KEY || functions.config().googleai?.key;
  console.log("[GoogleAI] Key exists:", !!key, "Key length:", key?.length);
  if (!key) throw new Error("Missing Google AI key");
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
  console.log("[Groq] Key exists:", !!key, "Key length:", key?.length);
  if (!key) throw new Error("Missing Groq key");
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
  console.log("[OpenRouter] Key exists:", !!key, "Key length:", key?.length);
  if (!key) throw new Error("Missing OpenRouter key");
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
  
  // Try Google AI
  try {
    console.log("[Provider 1] Trying Google AI...");
    const result = await callGoogleAI(prompt, models.GoogleAI);
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
    const result = await callGroq(prompt, models.Groq);
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
    const result = await callOpenRouter(prompt, models.OpenRouter);
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

      const extras = {
        location: data?.location,
        context: data?.context,
      };

      // Check cache first
      const cacheKey = getCacheKey(query, extras.location);
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

      const prompt = sanitizePrompt(query, extras);
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
