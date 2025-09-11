import React from 'react';
import { Search, MessageSquare, Sparkles, BarChart3 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface TabNavigationProps {
  activeTab: 'discover' | 'reviews' | 'promotions' | 'analytics';
  onTabChange: (tab: 'discover' | 'reviews' | 'promotions' | 'analytics') => void;
}

export const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  const { user } = useAuth();

  const tabs = [
    {
      id: 'discover' as const,
      label: 'Discover',
      icon: Search,
      description: 'Find amazing dishes'
    },
    {
      id: 'reviews' as const,
      label: 'Reviews',
      icon: MessageSquare,
      description: 'Community experiences'
    },
    {
      id: 'promotions' as const,
      label: 'Featured',
      icon: Sparkles,
      description: 'Restaurant specials'
    },
    ...(user ? [{
      id: 'analytics' as const,
      label: 'Analytics',
      icon: BarChart3,
      description: 'Revenue insights'
    }] : [])
  ];

  const getTabStyles = (tab: typeof tabs[0]) => {
    const isActive = activeTab === tab.id;
    let baseStyles = 'flex items-center space-x-2 py-4 px-2 border-b-2 transition-all duration-200';
    
    if (isActive) {
      if (tab.id === 'analytics') {
        return `${baseStyles} border-purple-500 text-purple-600`;
      }
      return `${baseStyles} border-orange-500 text-orange-600`;
    }
    
    return `${baseStyles} border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300`;
  };

  const getIconColor = (tab: typeof tabs[0]) => {
    if (activeTab === tab.id && tab.id === 'analytics') {
      return 'text-purple-600';
    }
    return '';
  };

  return (
    <div className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={getTabStyles(tab)}
              >
                <Icon className={`w-5 h-5 ${getIconColor(tab)}`} />
                <div className="text-left">
                  <div className="font-semibold">{tab.label}</div>
                  <div className="text-xs opacity-75">{tab.description}</div>
                </div>
                {(tab.id === 'promotions' || tab.id === 'analytics') && (
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};