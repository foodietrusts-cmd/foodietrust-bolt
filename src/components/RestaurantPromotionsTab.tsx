import React, { useState, useEffect } from 'react';
import { Star, MapPin, Clock, TrendingUp, Award, Camera, Search, Filter, Sparkles } from 'lucide-react';
import type { RestaurantPromotion } from '../types/types';

export const RestaurantPromotionsTab: React.FC = () => {
  const [promotions, setPromotions] = useState<RestaurantPromotion[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCuisine, setFilterCuisine] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'price'>('popular');

  // Mock promotions data
  useEffect(() => {
    const mockPromotions: RestaurantPromotion[] = [
      {
        id: 'p1',
        restaurantId: 'r1',
        restaurantName: 'Spice Junction',
        dishName: 'Signature Butter Chicken Deluxe',
        description: 'Our award-winning butter chicken with premium ingredients and secret spice blend',
        sellingPoints: ['Award-winning recipe', 'Premium chicken', 'Secret spice blend', 'Creamy tomato base'],
        images: ['https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&w=800'],
        specialOffer: '20% off on weekdays',
        price: 320,
        cuisine: 'Indian',
        category: 'Dinner',
        isActive: true,
        createdAt: '2024-01-15T10:00:00Z',
        expiresAt: '2024-02-15T23:59:59Z',
        targetAudience: ['Indian food lovers', 'Spice enthusiasts'],
        promotionScore: 95
      },
      {
        id: 'p2',
        restaurantId: 'r2',
        restaurantName: 'Bella Italia',
        dishName: 'Truffle Mushroom Risotto',
        description: 'Creamy Arborio rice with wild mushrooms and authentic Italian truffle oil',
        sellingPoints: ['Authentic Italian truffle', 'Wild mushrooms', 'Creamy Arborio rice', 'Chef\'s special'],
        images: ['https://images.pexels.com/photos/1279330/pexels-photo-1279330.jpeg?auto=compress&cs=tinysrgb&w=800'],
        specialOffer: 'Free garlic bread with every order',
        price: 480,
        cuisine: 'Italian',
        category: 'Dinner',
        isActive: true,
        createdAt: '2024-01-14T15:30:00Z',
        targetAudience: ['Italian cuisine lovers', 'Fine dining enthusiasts'],
        promotionScore: 88
      },
      {
        id: 'p3',
        restaurantId: 'r3',
        restaurantName: 'Thai Garden',
        dishName: 'Royal Thai Green Curry',
        description: 'Authentic green curry with coconut milk, Thai basil, and your choice of protein',
        sellingPoints: ['Authentic Thai recipe', 'Fresh coconut milk', 'Thai basil', 'Customizable protein'],
        images: ['https://images.pexels.com/photos/2347311/pexels-photo-2347311.jpeg?auto=compress&cs=tinysrgb&w=800'],
        specialOffer: 'Buy 2 get 1 jasmine rice free',
        price: 380,
        cuisine: 'Thai',
        category: 'Lunch',
        isActive: true,
        createdAt: '2024-01-13T12:00:00Z',
        expiresAt: '2024-01-30T23:59:59Z',
        targetAudience: ['Thai food lovers', 'Spicy food enthusiasts'],
        promotionScore: 92
      },
      {
        id: 'p4',
        restaurantId: 'r4',
        restaurantName: 'Sweet Dreams Cafe',
        dishName: 'Belgian Chocolate Fondant',
        description: 'Rich Belgian chocolate cake with molten center, served with vanilla bean ice cream',
        sellingPoints: ['Premium Belgian chocolate', 'Molten center', 'Vanilla bean ice cream', 'Instagram-worthy'],
        images: ['https://images.pexels.com/photos/2144112/pexels-photo-2144112.jpeg?auto=compress&cs=tinysrgb&w=800'],
        specialOffer: 'Free coffee with every dessert',
        price: 220,
        cuisine: 'Continental',
        category: 'Dessert',
        isActive: true,
        createdAt: '2024-01-12T16:45:00Z',
        targetAudience: ['Dessert lovers', 'Chocolate enthusiasts'],
        promotionScore: 90
      }
    ];
    setPromotions(mockPromotions);
  }, []);

  const filteredPromotions = promotions.filter(promotion => {
    const matchesSearch = promotion.dishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         promotion.restaurantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         promotion.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCuisine = filterCuisine === '' || promotion.cuisine === filterCuisine;
    return matchesSearch && matchesCuisine && promotion.isActive;
  });

  const sortedPromotions = [...filteredPromotions].sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.promotionScore - a.promotionScore;
      case 'price':
        return a.price - b.price;
      case 'recent':
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const cuisines = ['Indian', 'Italian', 'Thai', 'Continental', 'Chinese', 'Mexican'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Featured Dishes</h2>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Discover handpicked specialties from top restaurants, featuring exclusive offers and chef recommendations
        </p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search featured dishes or restaurants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
          
          <div className="flex gap-3">
            <select
              value={filterCuisine}
              onChange={(e) => setFilterCuisine(e.target.value)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">All Cuisines</option>
              {cuisines.map(cuisine => (
                <option key={cuisine} value={cuisine}>{cuisine}</option>
              ))}
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="popular">Most Popular</option>
              <option value="recent">Recently Added</option>
              <option value="price">Price: Low to High</option>
            </select>
          </div>
        </div>
      </div>

      {/* Promotions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedPromotions.map((promotion) => (
          <PromotionCard key={promotion.id} promotion={promotion} />
        ))}
      </div>

      {sortedPromotions.length === 0 && (
        <div className="text-center py-12">
          <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No featured dishes found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
};

const PromotionCard: React.FC<{ promotion: RestaurantPromotion }> = ({ promotion }) => {
  const isExpiringSoon = promotion.expiresAt && 
    new Date(promotion.expiresAt).getTime() - new Date().getTime() < 7 * 24 * 60 * 60 * 1000;

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group relative">
      {/* Featured Badge */}
      <div className="absolute top-3 left-3 z-10">
        <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
          <Award className="w-3 h-3" />
          <span>Featured</span>
        </div>
      </div>

      {/* Expiring Soon Badge */}
      {isExpiringSoon && (
        <div className="absolute top-3 right-3 z-10">
          <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
            Limited Time
          </div>
        </div>
      )}

      {/* Image Container */}
      <div className="relative overflow-hidden h-48">
        <img 
          src={promotion.images[0]} 
          alt={promotion.dishName}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Promotion Score */}
        <div className="absolute bottom-3 right-3 bg-white/95 px-2 py-1 rounded-lg flex items-center space-x-1">
          <TrendingUp className="w-3 h-3 text-purple-500" />
          <span className="text-xs font-semibold text-gray-700">{promotion.promotionScore}</span>
        </div>

        {/* Photo Count */}
        <div className="absolute bottom-3 left-3 bg-black/60 px-2 py-1 rounded-lg flex items-center space-x-1">
          <Camera className="w-3 h-3 text-white" />
          <span className="text-xs font-medium text-white">{promotion.images.length}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Header */}
        <div className="mb-3">
          <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-purple-600 transition-colors">
            {promotion.dishName}
          </h3>
          <p className="text-sm text-gray-600 font-medium">{promotion.cuisine} • {promotion.category}</p>
        </div>

        {/* Restaurant Info */}
        <div className="flex items-center space-x-2 mb-3">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600 font-medium">{promotion.restaurantName}</span>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {promotion.description}
        </p>

        {/* Selling Points */}
        <div className="mb-3">
          <div className="flex flex-wrap gap-1">
            {promotion.sellingPoints.slice(0, 3).map((point, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
              >
                {point}
              </span>
            ))}
          </div>
        </div>

        {/* Special Offer */}
        {promotion.specialOffer && (
          <div className="mb-3 p-2 bg-gradient-to-r from-orange-50 to-red-50 rounded-lg border border-orange-200">
            <p className="text-sm font-semibold text-orange-700">
              🎉 {promotion.specialOffer}
            </p>
          </div>
        )}

        {/* Price and CTA */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="text-xl font-bold text-purple-600">₹{promotion.price}</div>
          <button className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg transition-all duration-200 text-sm">
            Order Now
          </button>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>Added {new Date(promotion.createdAt).toLocaleDateString()}</span>
          </div>
          
          {promotion.expiresAt && (
            <div className="flex items-center space-x-1">
              <span>Expires {new Date(promotion.expiresAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};