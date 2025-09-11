import React from 'react';
import { Search, Filter, MapPin, TrendingUp } from 'lucide-react';

interface SearchHeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
}

export const SearchHeader: React.FC<SearchHeaderProps> = ({
  searchQuery,
  onSearchChange,
  showFilters,
  onToggleFilters
}) => {
  return (
    <div className="mb-8">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">
          Discover Amazing Dishes Near You
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Find the best food with our AI-powered recommendations and verified reviews from millions of food lovers
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 max-w-4xl mx-auto">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search dishes, restaurants, or cuisines..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-12 pr-4 py-4 text-lg border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white shadow-sm"
          />
        </div>

        {/* Quick Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={onToggleFilters}
            className={`flex items-center space-x-2 px-6 py-4 rounded-2xl border transition-all duration-200 ${
              showFilters 
                ? 'bg-orange-500 text-white border-orange-500' 
                : 'bg-white text-gray-700 border-gray-200 hover:border-orange-300'
            }`}
          >
            <Filter className="w-5 h-5" />
            <span className="font-medium">Filters</span>
          </button>

          <button className="flex items-center space-x-2 px-6 py-4 rounded-2xl border border-gray-200 bg-white text-gray-700 hover:border-orange-300 transition-all duration-200">
            <MapPin className="w-5 h-5" />
            <span className="font-medium">Near Me</span>
          </button>

          <button className="flex items-center space-x-2 px-6 py-4 rounded-2xl border border-gray-200 bg-white text-gray-700 hover:border-orange-300 transition-all duration-200">
            <TrendingUp className="w-5 h-5" />
            <span className="font-medium">Trending</span>
          </button>
        </div>
      </div>
    </div>
  );
};