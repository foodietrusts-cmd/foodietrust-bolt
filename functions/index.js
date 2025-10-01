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
  Groq: "llama-3.1-70b-versatile",
  Mistral: "mistral-large-latest",
  Cerebras: "llama3.1-70b",
  HuggingFace: "mistralai/Mixtral-8x7B-Instruct-v0.1",
  Cohere: "command-r",
};

const http = axios.create({
  timeout: 20000,
});

function sanitizePrompt(query, extras = {}) {
  const base = typeof query === "string" ? query.trim() : "";
  const location = typeof extras.location === "string" ? extras.location.trim() : "";
  const extraContext = typeof extras.context === "string" ? extras.context.trim() : "";

  let prompt = base;
  if (location) prompt += `\n\nUser location/context: ${location}`;
  if (extraContext) prompt += `\n\nAdditional context: ${extraContext}`;
  return prompt;
}

// Provider Clients
async function callGoogleAI(prompt, model) {
  const key = functions.config().googleai?.key;
  if (!key) throw new Error("Missing Google AI key");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`;

  const payload = {
    contents: [{ role: "user", parts: [{ text: prompt }] }],
  };

  const res = await http.post(url, payload);
  const text = res?.data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join(" ") || "";
  if (!text) throw new Error("Google AI: Empty response");
  return { provider: "GoogleAI", result: text };
}

async function callGroq(prompt, model) {
  const key = functions.config().groq?.key;
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

async function tryProvidersInOrder(prompt, models) {
  const attempts = [
    async () => await callGoogleAI(prompt, models.GoogleAI),
    async () => await callGroq(prompt, models.Groq),
  ];

  for (let i = 0; i < attempts.length; i++) {
    try {
      return await attempts[i]();
    } catch (err) {
      console.error(`[Provider ${i + 1} failed]`, {
        message: err?.message,
        stack: err?.stack,
        responseStatus: err?.response?.status,
        responseData: err?.response?.data,
      });

      const status = err?.response?.status;
      const isNetwork = !!err.code;
      if (status === 429 || status === 408 || isNetwork) {
        continue;
      }
      continue;
    }
  }

  throw new Error("All providers failed.");
}

exports.aiMultiProvider = functions
  .runWith(runtimeOptions)
  .https.onCall(async (data, context) => {
    try {
      const query = data?.query;
      if (typeof query !== "string" || !query.trim()) {
        throw new functions.https.HttpsError("invalid-argument", "Field 'query' is required and must be a non-empty string.");
      }

      const extras = {
        location: data?.location,
        context: data?.context,
      };

      const models = {
        GoogleAI: data?.models?.GoogleAI || DEFAULT_MODELS.GoogleAI,
        Groq: data?.models?.Groq || DEFAULT_MODELS.Groq,
      };

      const prompt = sanitizePrompt(query, extras);
      const result = await tryProvidersInOrder(prompt, models);

      return result;
    } catch (err) {
      console.error("[aiMultiProvider error]", {
        message: err?.message,
        stack: err?.stack,
        responseStatus: err?.response?.status,
        responseData: err?.response?.data,
      });

      throw new functions.https.HttpsError("internal", "AI service temporarily unavailable. Please try again.");
    }
  });
