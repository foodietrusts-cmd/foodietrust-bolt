import React from 'react';
import { TrendingUp, Siren as Fire } from 'lucide-react';
import { DishCard } from './DishCard';
import type { Dish } from '../types/types';

interface TrendingSectionProps {
  dishes: Dish[];
  favorites: Set<string>;
  onToggleFavorite: (dishId: string) => void;
}

export const TrendingSection: React.FC<TrendingSectionProps> = ({ 
  dishes, 
  favorites, 
  onToggleFavorite 
}) => {
  if (dishes.length === 0) return null;

  return (
    <div className="mb-12">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-full flex items-center justify-center">
          <Fire className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Trending Now</h2>
          <p className="text-gray-600">What food lovers are talking about right now</p>
        </div>
        <div className="flex-1" />
        <div className="flex items-center space-x-2 text-sm text-red-600 font-medium">
          <TrendingUp className="w-4 h-4" />
          <span>Live Updates</span>
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
        <button className="px-8 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200">
          View All Trending Dishes
        </button>
      </div>
    </div>
  );
};