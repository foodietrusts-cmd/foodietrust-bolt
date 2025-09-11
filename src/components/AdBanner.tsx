import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Star, TrendingUp } from 'lucide-react';
import type { AdPlacement } from '../types/types';

interface AdBannerProps {
  placement: 'top' | 'sidebar' | 'inline' | 'bottom';
  onAdClick: (adId: string) => void;
  onAdClose?: (adId: string) => void;
}

export const AdBanner: React.FC<AdBannerProps> = ({ placement, onAdClick, onAdClose }) => {
  const [currentAd, setCurrentAd] = useState<AdPlacement | null>(null);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Mock ad data - in real app, this would fetch from ad networks
    const mockAds: AdPlacement[] = [
      {
        id: 'ad-1',
        type: 'banner',
        position: placement,
        content: {
          title: 'Discover Premium Restaurants',
          description: 'Get 50% off your first order at top-rated restaurants near you',
          image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400',
          ctaText: 'Explore Now',
          targetUrl: 'https://example.com/premium-restaurants'
        },
        isActive: true,
        impressions: 1250,
        clicks: 89,
        revenue: 45.50,
        targetAudience: ['food-lovers', 'premium-dining']
      },
      {
        id: 'ad-2',
        type: 'banner',
        position: placement,
        content: {
          title: 'Master Chef Cooking Classes',
          description: 'Learn to cook restaurant-quality dishes at home with expert chefs',
          image: 'https://images.pexels.com/photos/3338681/pexels-photo-3338681.jpeg?auto=compress&cs=tinysrgb&w=400',
          ctaText: 'Join Classes',
          targetUrl: 'https://example.com/cooking-classes'
        },
        isActive: true,
        impressions: 980,
        clicks: 67,
        revenue: 33.25,
        targetAudience: ['cooking-enthusiasts', 'home-chefs']
      },
      {
        id: 'ad-3',
        type: 'banner',
        position: placement,
        content: {
          title: 'Food Photography Workshop',
          description: 'Take Instagram-worthy food photos like a pro photographer',
          image: 'https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?auto=compress&cs=tinysrgb&w=400',
          ctaText: 'Learn More',
          targetUrl: 'https://example.com/photography-workshop'
        },
        isActive: true,
        impressions: 756,
        clicks: 45,
        revenue: 22.75,
        targetAudience: ['photography', 'social-media']
      }
    ];

    // Rotate ads every 30 seconds
    const rotateAds = () => {
      const activeAds = mockAds.filter(ad => ad.isActive && ad.position === placement);
      if (activeAds.length > 0) {
        const randomAd = activeAds[Math.floor(Math.random() * activeAds.length)];
        setCurrentAd(randomAd);
      }
    };

    rotateAds();
    const interval = setInterval(rotateAds, 30000);

    return () => clearInterval(interval);
  }, [placement]);

  const handleAdClick = () => {
    if (currentAd) {
      onAdClick(currentAd.id);
      window.open(currentAd.content.targetUrl, '_blank');
    }
  };

  const handleClose = () => {
    if (currentAd && onAdClose) {
      onAdClose(currentAd.id);
      setIsVisible(false);
    }
  };

  if (!currentAd || !isVisible) return null;

  const getAdStyles = () => {
    switch (placement) {
      case 'top':
        return 'w-full max-w-4xl mx-auto mb-6';
      case 'sidebar':
        return 'w-full max-w-sm';
      case 'inline':
        return 'w-full max-w-2xl mx-auto my-6';
      case 'bottom':
        return 'w-full max-w-4xl mx-auto mt-6';
      default:
        return 'w-full';
    }
  };

  return (
    <div className={`${getAdStyles()} relative`}>
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-200 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        {/* Ad Label */}
        <div className="absolute top-2 left-2 z-10">
          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-medium">
            Sponsored
          </span>
        </div>

        {/* Close Button */}
        {onAdClose && (
          <button
            onClick={handleClose}
            className="absolute top-2 right-2 z-10 w-6 h-6 bg-white/80 rounded-full flex items-center justify-center hover:bg-white transition-colors"
          >
            <X className="w-3 h-3 text-gray-600" />
          </button>
        )}

        <div 
          className="cursor-pointer"
          onClick={handleAdClick}
        >
          <div className="flex items-center space-x-4 p-4">
            <img
              src={currentAd.content.image}
              alt={currentAd.content.title}
              className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
            />
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 mb-1 truncate">
                {currentAd.content.title}
              </h3>
              <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                {currentAd.content.description}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>{currentAd.impressions} views</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3" />
                    <span>Trusted Partner</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1 text-purple-600 font-medium text-sm">
                  <span>{currentAd.content.ctaText}</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};