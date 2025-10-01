import React, { useState } from "react";
import { Search, Sparkles, Loader2, AlertCircle } from "lucide-react";
import { aiMultiProvider } from "../lib/firebase";

interface AIResponse {
  provider: string;
  result: string;
}

export const AISearch: React.FC = () => {
  const [query, setQuery] = useState("Best biryani near me");
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setProvider(null);

    try {
      const resp = await aiMultiProvider({
        query,
        location: "Current location",
      });
      const data = resp.data as AIResponse;
      setProvider(data.provider);
      setResult(data.result);
    } catch (err: any) {
      setError(err?.message || "Request failed. Please try again.");
      console.error("AI Search Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">AI Food Search</h2>
            <p className="text-sm text-gray-500">Powered by multi-provider AI fallback</p>
          </div>
        </div>

        {/* Search Form */}
        <form onSubmit={onSubmit} className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ask anything about food, restaurants, recipes..."
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all outline-none text-gray-900"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="mt-4 w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Ask AI
              </>
            )}
          </button>
        </form>

        {/* Provider Badge */}
        {provider && (
          <div className="mb-4 inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-green-700">
              Powered by {provider}
            </span>
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">AI Response</h3>
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-gray-700 font-sans leading-relaxed">
                {result}
              </pre>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900 mb-1">Error</h4>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-sm text-blue-800">
            <strong>Multi-Provider Fallback:</strong> This search automatically tries Google AI, OpenRouter, Groq, Mistral, Cerebras, HuggingFace, and Cohere in sequence until one succeeds.
          </p>
        </div>
      </div>
    </div>
  );
};
