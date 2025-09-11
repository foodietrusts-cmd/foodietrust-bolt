import React from 'react';
import { Star, MapPin, Heart, Camera, Shield, TrendingUp, Clock, Users, MessageSquare } from 'lucide-react';
import { ReferralOrderButtons } from './ReferralOrderButtons';
import type { Dish } from '../types/types';

interface DishCardProps {
  dish: Dish;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onWriteReview?: () => void;
  onReferralClick?: (platform: string, dishId: string) => void;
  showOrderButtons?: boolean;
}

export const DishCard: React.FC<DishCardProps> = ({ 
  dish, 
  isFavorite, 
  onToggleFavorite, 
  onWriteReview,
  onReferralClick,
  showOrderButtons = true
}) => {
  const getTagColor = (tag: string) => {
    switch (tag) {
      case 'Trending': return 'bg-red-100 text-red-700';
      case 'Hidden Gem': return 'bg-purple-100 text-purple-700';
      case 'Highly Recommended': return 'bg-green-100 text-green-700';
      case 'Seasonal': return 'bg-amber-100 text-amber-700';
      case 'Classic': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 group">
      {/* Image Container */}
      <div className="relative overflow-hidden h-48">
        <img 
          src={dish.image} 
          alt={dish.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Favorite Button */}
        <button
          onClick={onToggleFavorite}
          className={`absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
            isFavorite 
              ? 'bg-red-500 text-white' 
              : 'bg-white/90 text-gray-600 hover:bg-red-50 hover:text-red-500'
          }`}
        >
          <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        {/* Tags */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1">
          {dish.tags.slice(0, 2).map((tag, index) => (
            <span
              key={index}
              className={`px-2 py-1 rounded-full text-xs font-medium ${getTagColor(tag)}`}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Trust Score */}
        <div className="absolute bottom-3 right-3 bg-white/95 px-2 py-1 rounded-lg flex items-center space-x-1">
          <Shield className="w-3 h-3 text-green-500" />
          <span className="text-xs font-semibold text-gray-700">{dish.trustScore}</span>
        </div>

        {/* Photo Count */}
        <div className="absolute bottom-3 left-3 bg-black/60 px-2 py-1 rounded-lg flex items-center space-x-1">
          <Camera className="w-3 h-3 text-white" />
          <span className="text-xs font-medium text-white">{dish.photoCount}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Header */}
        <div className="mb-3">
          <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-orange-600 transition-colors">
            {dish.name}
          </h3>
          <p className="text-sm text-gray-600 font-medium">{dish.cuisine} • {dish.category}</p>
        </div>

        {/* Restaurant Info */}
        <div className="flex items-center space-x-2 mb-3">
          <MapPin className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-600 font-medium">{dish.restaurant.name}</span>
        </div>

        {/* Rating & Reviews */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <Star className="w-4 h-4 text-yellow-400 fill-current" />
              <span className="font-semibold text-gray-900">{dish.averageRating}</span>
            </div>
            <div className="flex items-center space-x-1 text-sm text-gray-600">
              <Users className="w-3 h-3" />
              <span>{dish.reviewCount} reviews</span>
            </div>
          </div>
          <div className="text-lg font-bold text-orange-600">₹{dish.price}</div>
        </div>

        {/* Description */}
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {dish.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>Updated 3h ago</span>
            </div>
            
            {onWriteReview && (
              <button
                onClick={onWriteReview}
                className="flex items-center space-x-1 text-xs text-orange-600 hover:text-orange-700 font-medium"
              >
                <MessageSquare className="w-3 h-3" />
                <span>Review</span>
              </button>
            )}
          </div>
          
          {dish.tags.includes('Trending') && (
            <div className="flex items-center space-x-1 text-red-600">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium">Trending</span>
            </div>
          )}
        </div>
      </div>

      {/* Order Buttons */}
      {showOrderButtons && onReferralClick && (
        <div className="px-5 pb-5">
          <ReferralOrderButtons 
            dish={dish} 
            onReferralClick={onReferralClick}
          />
        </div>
      )}
    </div>
  );
};