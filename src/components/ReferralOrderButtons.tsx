import React, { useState, useEffect } from 'react';
import { ShoppingBag, Clock, ExternalLink, Truck, Star } from 'lucide-react';
import type { Dish, ReferralLink } from '../types/types';

interface ReferralOrderButtonsProps {
  dish: Dish;
  onReferralClick: (platform: string, dishId: string) => void;
}

export const ReferralOrderButtons: React.FC<ReferralOrderButtonsProps> = ({ 
  dish, 
  onReferralClick 
}) => {
  const [referralLinks, setReferralLinks] = useState<ReferralLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call to check availability on delivery platforms
    const fetchReferralLinks = async () => {
      setIsLoading(true);
      
      // Mock referral links - in real app, this would call actual APIs
      const mockLinks: ReferralLink[] = [
        {
          platform: 'swiggy',
          url: `https://swiggy.com/restaurants/${dish.restaurant.name.toLowerCase().replace(/\s+/g, '-')}-${dish.restaurant.id}?ref=foodietrust`,
          isAvailable: Math.random() > 0.3,
          estimatedDeliveryTime: '25-30 mins',
          platformLogo: 'https://logos-world.net/wp-content/uploads/2020/11/Swiggy-Logo.png',
          platformName: 'Swiggy'
        },
        {
          platform: 'zomato',
          url: `https://zomato.com/restaurant/${dish.restaurant.name.toLowerCase().replace(/\s+/g, '-')}-${dish.restaurant.id}?ref=foodietrust`,
          isAvailable: Math.random() > 0.3,
          estimatedDeliveryTime: '30-35 mins',
          platformLogo: 'https://b.zmtcdn.com/web_assets/b40b97e677bc7b2ca77c58c61db266fe1603954218.png',
          platformName: 'Zomato'
        },
        {
          platform: 'ubereats',
          url: `https://ubereats.com/store/${dish.restaurant.name.toLowerCase().replace(/\s+/g, '-')}-${dish.restaurant.id}?ref=foodietrust`,
          isAvailable: Math.random() > 0.4,
          estimatedDeliveryTime: '20-25 mins',
          platformLogo: 'https://d3i4yxtzktqr9n.cloudfront.net/web-eats-v2/97c43f8974e6c876.svg',
          platformName: 'Uber Eats'
        }
      ];

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setReferralLinks(mockLinks.filter(link => link.isAvailable));
      setIsLoading(false);
    };

    fetchReferralLinks();
  }, [dish]);

  const handleReferralClick = (link: ReferralLink) => {
    onReferralClick(link.platform, dish.id);
    window.open(link.url, '_blank');
  };

  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border border-green-200">
        <div className="flex items-center space-x-2 mb-3">
          <Truck className="w-5 h-5 text-green-600" />
          <h4 className="font-semibold text-gray-900">Order This Dish</h4>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (referralLinks.length === 0) {
    return (
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
        <div className="flex items-center space-x-2 mb-2">
          <ShoppingBag className="w-5 h-5 text-gray-500" />
          <h4 className="font-semibold text-gray-700">Currently Unavailable</h4>
        </div>
        <p className="text-sm text-gray-600">
          This dish isn't available for delivery right now. Check back later!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 border border-green-200">
      <div className="flex items-center space-x-2 mb-3">
        <Truck className="w-5 h-5 text-green-600" />
        <h4 className="font-semibold text-gray-900">Order This Dish</h4>
        <div className="flex items-center space-x-1 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
          <Star className="w-3 h-3" />
          <span>Trusted Partners</span>
        </div>
      </div>
      
      <div className="space-y-2">
        {referralLinks.map((link) => (
          <button
            key={link.platform}
            onClick={() => handleReferralClick(link)}
            className="w-full flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-md transition-all duration-200 group"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-gray-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900 capitalize">
                  {link.platformName}
                </div>
                {link.estimatedDeliveryTime && (
                  <div className="flex items-center space-x-1 text-xs text-gray-600">
                    <Clock className="w-3 h-3" />
                    <span>{link.estimatedDeliveryTime}</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-green-600">Order Now</span>
              <ExternalLink className="w-4 h-4 text-green-600 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        ))}
      </div>
      
      <div className="mt-3 text-xs text-gray-500 text-center">
        🎉 Support FoodieTrust by ordering through our trusted partners
      </div>
    </div>
  );
};