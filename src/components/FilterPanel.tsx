import React from 'react';
import { X, Star } from 'lucide-react';
import type { FilterOptions } from '../types/types';

interface FilterPanelProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onFiltersChange }) => {
  const cuisines = ['Indian', 'Chinese', 'Italian', 'Mexican', 'Thai', 'Mediterranean', 'Japanese', 'Korean'];
  const categories = ['Breakfast', 'Lunch', 'Dinner', 'Snacks', 'Dessert', 'Beverages', 'Street Food'];
  const dietaryOptions = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Dairy-Free', 'Keto', 'Low-Carb'];

  const updateCuisine = (cuisine: string) => {
    const newCuisines = filters.cuisine.includes(cuisine)
      ? filters.cuisine.filter(c => c !== cuisine)
      : [...filters.cuisine, cuisine];
    onFiltersChange({ ...filters, cuisine: newCuisines });
  };

  const updateCategory = (category: string) => {
    const newCategories = filters.category.includes(category)
      ? filters.category.filter(c => c !== category)
      : [...filters.category, category];
    onFiltersChange({ ...filters, category: newCategories });
  };

  const updateDietary = (dietary: string) => {
    const newDietary = filters.dietary.includes(dietary)
      ? filters.dietary.filter(d => d !== dietary)
      : [...filters.dietary, dietary];
    onFiltersChange({ ...filters, dietary: newDietary });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      cuisine: [],
      category: [],
      priceRange: [0, 1000],
      rating: 0,
      dietary: []
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Filter Dishes</h3>
        <button
          onClick={clearAllFilters}
          className="text-sm text-orange-600 hover:text-orange-700 font-medium"
        >
          Clear All
        </button>
      </div>

      <div className="space-y-6">
        {/* Cuisine Filter */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Cuisine</h4>
          <div className="flex flex-wrap gap-2">
            {cuisines.map(cuisine => (
              <button
                key={cuisine}
                onClick={() => updateCuisine(cuisine)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  filters.cuisine.includes(cuisine)
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                }`}
              >
                {cuisine}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Category</h4>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => updateCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  filters.category.includes(category)
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Price Range */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Price Range</h4>
          <div className="flex items-center space-x-4">
            <input
              type="range"
              min="0"
              max="1000"
              value={filters.priceRange[1]}
              onChange={(e) => onFiltersChange({
                ...filters,
                priceRange: [filters.priceRange[0], parseInt(e.target.value)]
              })}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <span className="text-sm font-medium text-gray-700 min-w-16">
              ₹{filters.priceRange[1]}
            </span>
          </div>
        </div>

        {/* Rating Filter */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Minimum Rating</h4>
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map(rating => (
              <button
                key={rating}
                onClick={() => onFiltersChange({ ...filters, rating: rating })}
                className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-all duration-200 ${
                  filters.rating === rating
                    ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                    : 'bg-gray-100 text-gray-600 hover:bg-yellow-50'
                }`}
              >
                <Star className="w-4 h-4" />
                <span className="text-sm font-medium">{rating}+</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dietary Options */}
        <div>
          <h4 className="font-medium text-gray-900 mb-3">Dietary Preferences</h4>
          <div className="flex flex-wrap gap-2">
            {dietaryOptions.map(dietary => (
              <button
                key={dietary}
                onClick={() => updateDietary(dietary)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  filters.dietary.includes(dietary)
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-green-50 hover:text-green-600'
                }`}
              >
                {dietary}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};