import React, { useState, useEffect } from "react";
import { Search, Sparkles, Loader2, AlertCircle, MapPin, Zap, ChevronRight, Star, Utensils } from "lucide-react";
import { aiMultiProvider, getSwiggyMenu } from "../lib/firebase";

interface AIResponse {
  provider: string;
  result: string;
}

interface SwiggyDish {
  id: string;
  name: string;
  price: number;
  description: string;
  isVeg: boolean;
  rating: string | null;
  ratingCount: string | null;
  imageId: string | null;
  category: string;
}

export const AISearch: React.FC = () => {
  const [query, setQuery] = useState("Best biryani near me");
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<string>("");
  const [cached, setCached] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [swiggyMenu, setSwiggyMenu] = useState<SwiggyDish[] | null>(null);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<string | null>(null);
  const [latLng, setLatLng] = useState<{lat: number, lng: number} | null>(null);

  // Detect user location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      setDetectingLocation(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation(`${position.coords.latitude},${position.coords.longitude}`);
          setLatLng({ lat: position.coords.latitude, lng: position.coords.longitude });
          setDetectingLocation(false);
        },
        () => {
          setDetectingLocation(false);
        }
      );
    }
  }, []);

  const fetchSwiggyMenu = async (restaurantId: string) => {
    if (!latLng) {
      setError("Location not detected. Please enable location services.");
      return;
    }

    setLoadingMenu(true);
    setError(null);
    setSwiggyMenu(null);
    setSelectedRestaurant(restaurantId);

    try {
      const resp = await getSwiggyMenu({
        lat: latLng.lat,
        lng: latLng.lng,
        restaurantId,
      });
      const data = resp.data as any;
      
      if (data.success && data.dishes) {
        setSwiggyMenu(data.dishes);
      } else {
        setError("No menu items found");
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load menu");
      console.error("Swiggy Menu Error:", err);
    } finally {
      setLoadingMenu(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setProvider(null);
    setCached(false);

    try {
      const resp = await aiMultiProvider({
        query,
        location: location || "Current location",
      });
      const data = resp.data as any;
      setProvider(data.provider);
      setResult(data.result);
      setCached(data.cached || false);
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
        {/* Search Form */}
        <form onSubmit={onSubmit} className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Best biryani near me"
              className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all outline-none text-gray-900"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="mt-4 w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Searching...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Ask FoodieTrust
              </>
            )}
          </button>
        </form>

        {/* Provider Badge */}
        {provider && (
          <div className="mb-4 flex gap-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700">
                Found by {provider}
              </span>
            </div>
            {cached && (
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                <Zap className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">
                  Quick result
                </span>
              </div>
            )}
          </div>
        )}

        {/* Result */}
        {result && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Found these amazing dishes:</h3>
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-gray-700 font-sans leading-relaxed">
                {result}
              </pre>
            </div>
          </div>
        )}

        {/* Swiggy Menu Display */}
        {swiggyMenu && swiggyMenu.length > 0 && (
          <div className="mt-6 bg-white rounded-xl p-6 border border-orange-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Utensils className="w-5 h-5 text-orange-600" />
              Menu ({swiggyMenu.length} dishes)
            </h3>
            <div className="grid gap-4">
              {swiggyMenu.map((dish) => (
                <div key={dish.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{dish.isVeg ? '🥦' : '🍗'}</span>
                        <h4 className="font-semibold text-gray-900">{dish.name}</h4>
                      </div>
                      {dish.description && (
                        <p className="text-sm text-gray-600">{dish.description}</p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-bold text-orange-600">₹{dish.price}</p>
                      {dish.rating && (
                        <div className="flex items-center gap-1 mt-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium">{dish.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{dish.category}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {loadingMenu && (
          <div className="mt-6 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-orange-500" />
            <p className="text-sm text-gray-600 mt-2">Loading menu...</p>
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
      </div>
    </div>
  );
};
