import React from 'react';
import { Sparkles, Target } from 'lucide-react';
import { DishCard } from './DishCard';
import type { Dish } from '../types/types';

interface PersonalizedRecommendationsProps {
  dishes: Dish[];
  favorites: Set<string>;
  onToggleFavorite: (dishId: string) => void;
}

export const PersonalizedRecommendations: React.FC<PersonalizedRecommendationsProps> = ({ 
  dishes, 
  favorites, 
  onToggleFavorite 
}) => {
  if (dishes.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-full flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Recommended for You</h2>
          <p className="text-gray-600">Handpicked dishes based on your taste preferences</p>
        </div>
        <div className="flex-1" />
        <div className="flex items-center space-x-2 text-sm text-purple-600 font-medium">
          <Target className="w-4 h-4" />
          <span>AI Powered</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {dishes.slice(0, 4).map(dish => (
          <DishCard 
            key={dish.id} 
            dish={dish} 
            isFavorite={favorites.has(dish.id)}
            onToggleFavorite={() => onToggleFavorite(dish.id)}
          />
        ))}
      </div>

      <div className="text-center mt-8">
        <button className="px-8 py-3 bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200">
          See More Recommendations
        </button>
      </div>
    </div>
  );
};