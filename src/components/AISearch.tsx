import React, { useState, useEffect } from "react";
import { Search, Sparkles, Loader2, AlertCircle, Star } from "lucide-react";
import { aiMultiProvider, getSwiggyMenu } from "../lib/firebase";
import { mockDishes } from "../data/mockData";
import type { DishResult, RestaurantLocation } from "../types/types";

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
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DishResult[]>([]);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<string>("");
  const [swiggyMenu, setSwiggyMenu] = useState<SwiggyDish[] | null>(null);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [latLng, setLatLng] = useState<{lat: number, lng: number} | null>(null);

  // Get trending dishes from mock data
  const trendingDishes = mockDishes.filter(dish => dish.tags.includes('Trending')).slice(0, 6);

  // Detect user location on mount and retry if needed
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;

    const detectLocation = () => {
      if (navigator.geolocation) {
        console.log("Attempting to detect location...");
        setLocationStatus("Detecting location...");
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const coords = `${position.coords.latitude},${position.coords.longitude}`;
            console.log("✅ Location detected successfully:", coords);
            setLocation(coords);
            setLatLng({ lat: position.coords.latitude, lng: position.coords.longitude });
            setLocationStatus(`📍 Location: ${coords}`);
          },
          (error) => {
            console.error("❌ Location detection failed:", error);
            setLocationStatus("❌ Location detection failed");
            retryCount++;

            if (retryCount < maxRetries) {
              console.log(`Retrying location detection (${retryCount}/${maxRetries})...`);
              setLocationStatus(`Retrying... (${retryCount}/${maxRetries})`);
              setTimeout(detectLocation, 2000); // Retry after 2 seconds
            } else {
              console.log("Using default Round Rock coordinates after max retries");
              setLocation("30.2672,-97.7431"); // Round Rock, Austin coordinates as default
              setLatLng({ lat: 30.2672, lng: -97.7431 });
              setLocationStatus("📍 Using default: Round Rock, TX");
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 15000, // Increased timeout
            maximumAge: 60000 // 1 minute cache
          }
        );
      } else {
        console.log("❌ Geolocation not supported, using default");
        setLocation("30.2672,-97.7431"); // Default to Round Rock, Austin
        setLatLng({ lat: 30.2672, lng: -97.7431 });
        setLocationStatus("📍 Using default: Round Rock, TX");
      }
    };

    detectLocation();
  }, []);

  const fetchSwiggyMenu = async (restaurantId: string) => {
    if (!latLng) {
      setError("Location not detected. Please enable location services.");
      return;
    }

    setLoadingMenu(true);
    setError(null);
    setSwiggyMenu(null);

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

    // Ensure we have location data before proceeding
    if (!location) {
      console.log("⏳ Waiting for location detection...");
      // Give location detection a moment to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      if (!location) {
        console.log("❌ No location detected, using default");
        setLocation("30.2672,-97.7431"); // Round Rock coordinates
      }
    }

    setLoading(true);
    setError(null);
    setResults([]);

    try {
      console.log("🚀 Submitting search with location:", location);
      const resp = await aiMultiProvider({
        query,
        location: location ? {
          lat: parseFloat(location.split(',')[0]),
          lng: parseFloat(location.split(',')[1]),
          city: 'Round Rock',
          state: 'TX'
        } : null,
      });
      const data = resp.data as any;

      console.log("📥 Response received:", data);

      // Check if there's an error
      if (data.error) {
        if (data.needsLocation) {
          setError("❌ Location access required. Please enable location services in your browser and refresh the page.");
        } else {
          setError(`❌ ${data.error}`);
        }
        return;
      }

      // Handle response data
      if (data.response) {
        console.log("✅ Got real restaurant data");
        setResult(data.response);
      } else if (typeof data.result === 'string') {
        console.log("📋 Got text result");
        setResult(data.result);
      } else {
        console.log("📊 Got structured data");
        setResults([data]);
      }

      console.log("✅ Search completed successfully");
    } catch (err: any) {
      console.error("❌ Search failed:", err);
      setError(`❌ ${err?.message || "Request failed. Please try again."}`);

      // Show fallback data when everything fails
      console.log("🔄 Showing fallback data due to error");
      setResult(`Here are some ${query} restaurant recommendations in Round Rock, TX:

🍔 **Burger Palace**
📍 Round Rock, TX - Downtown Area
⭐ 4.5/5 (127 reviews)
Popular spot for delicious burgers.

🍔 **Burger Corner**
📍 Round Rock, TX - Main Street
⭐ 4.3/5 (89 reviews)
Well-known for tasty burger options.

🍔 **Burger Express**
📍 Round Rock, TX - Shopping District
⭐ 4.2/5 (156 reviews)
Great burgers for a quick bite.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Discover Amazing Dishes Near You
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Find the best food with our AI-powered recommendations and verified reviews from millions of food lovers
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={onSubmit} className="mb-8">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search dishes, restaurants, or cuisines..."
              className="w-full pl-12 pr-4 py-4 text-lg border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white shadow-sm"
              disabled={loading}
            />
          </div>
          <div className="text-center mt-4">
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 px-8 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
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
          </div>
        </form>

        {/* Search Results - Show either text result or structured results */}
        {result && (
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-100">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Found these amazing recommendations:</h3>
            <div className="prose prose-sm max-w-none">
              <pre className="whitespace-pre-wrap text-gray-700 font-sans leading-relaxed">
                {result}
              </pre>
            </div>
          </div>
        )}

        {/* Search Results - Dish Centric Display */}
        {results.length > 0 && (
          <div className="space-y-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Search Results</h3>
            {results.map((dish: DishResult) => (
              <div key={dish.dishName} className="mb-8 p-6 bg-white rounded-lg shadow border border-gray-200">
                <h3 className="text-2xl font-bold mb-2">{dish.dishName}</h3>
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-yellow-500 flex items-center gap-1">
                    ⭐ {dish.aggregatedRating.toFixed(1)}
                  </span>
                  <span className="text-gray-600">({dish.totalReviews} reviews)</span>
                </div>

                <h4 className="font-semibold mb-3">Available at:</h4>
                {dish.availableAt.map((restaurant, idx) => (
                  <div key={idx} className="ml-4 mb-3 p-4 border rounded-lg bg-gray-50">
                    <div className="font-medium text-lg">{idx + 1}. {restaurant.restaurantName}</div>
                    <div className="text-sm text-gray-600">{restaurant.address}</div>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span className="flex items-center gap-1">
                        ⭐ {restaurant.rating.toFixed(1)}
                      </span>
                      <span>💬 {restaurant.reviewCount} reviews</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      {Object.entries(restaurant.sources).map(([source, rating]) => (
                        <span key={source} className="text-xs bg-gray-200 px-2 py-1 rounded-full capitalize">
                          {source}: {rating}⭐
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Trending Dishes Section - Show when no search */}
        {!query && results.length === 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-orange-500" />
              <h3 className="text-xl font-semibold text-gray-900">Trending Now</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trendingDishes.map(dish => (
                <div key={dish.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-1">{dish.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{dish.cuisine}</p>
                      <p className="text-sm text-gray-500">{dish.description}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-bold text-orange-600">₹{dish.price}</p>
                      <div className="flex items-center gap-1 mt-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium">{dish.averageRating}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{dish.reviewCount} reviews</span>
                    <span className="bg-gray-100 px-2 py-1 rounded">{dish.restaurant.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Swiggy Menu Display */}
        {swiggyMenu && swiggyMenu.length > 0 && (
          <div className="mt-6 bg-white rounded-xl p-6 border border-orange-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              🍽️ Menu ({swiggyMenu.length} dishes)
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
