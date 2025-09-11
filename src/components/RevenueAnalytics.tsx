import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, MousePointer, Eye, Award, BarChart3 } from 'lucide-react';
import type { RevenueAnalytics } from '../types/types';

export const RevenueAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<RevenueAnalytics | null>(null);
  const [timeRange, setTimeRange] = useState<'today' | 'week' | 'month'>('week');

  useEffect(() => {
    // Mock analytics data - in real app, this would fetch from backend
    const mockAnalytics: RevenueAnalytics = {
      referralRevenue: {
        total: 1247.50,
        byPlatform: {
          swiggy: 567.25,
          zomato: 423.75,
          ubereats: 256.50
        },
        conversions: 89,
        clickThroughRate: 12.4
      },
      adRevenue: {
        total: 892.30,
        impressions: 15420,
        clicks: 234,
        ctr: 1.52
      },
      topPerformingDishes: [
        {
          dishId: '1',
          dishName: 'Butter Chicken with Garlic Naan',
          revenue: 156.75,
          conversions: 23
        },
        {
          dishId: '3',
          dishName: 'Pad Thai with King Prawns',
          revenue: 134.50,
          conversions: 19
        },
        {
          dishId: '11',
          dishName: 'Hyderabadi Chicken Biryani',
          revenue: 128.25,
          conversions: 18
        }
      ]
    };

    setAnalytics(mockAnalytics);
  }, [timeRange]);

  if (!analytics) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const totalRevenue = analytics.referralRevenue.total + analytics.adRevenue.total;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Revenue Analytics</h2>
          <p className="text-gray-600">Track referral commissions and ad performance</p>
        </div>
        
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value as any)}
          className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
        </select>
      </div>

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8" />
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold mb-1">₹{totalRevenue.toFixed(2)}</div>
          <div className="text-green-100 text-sm">Total Revenue</div>
        </div>

        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Award className="w-8 h-8" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Referrals</span>
          </div>
          <div className="text-2xl font-bold mb-1">₹{analytics.referralRevenue.total.toFixed(2)}</div>
          <div className="text-blue-100 text-sm">{analytics.referralRevenue.conversions} conversions</div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <Eye className="w-8 h-8" />
            <span className="text-xs bg-white/20 px-2 py-1 rounded-full">Ads</span>
          </div>
          <div className="text-2xl font-bold mb-1">₹{analytics.adRevenue.total.toFixed(2)}</div>
          <div className="text-purple-100 text-sm">{analytics.adRevenue.impressions.toLocaleString()} impressions</div>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between mb-4">
            <MousePointer className="w-8 h-8" />
            <BarChart3 className="w-5 h-5" />
          </div>
          <div className="text-2xl font-bold mb-1">{analytics.referralRevenue.clickThroughRate}%</div>
          <div className="text-orange-100 text-sm">Click-through Rate</div>
        </div>
      </div>

      {/* Platform Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Referral Revenue by Platform</h3>
          <div className="space-y-4">
            {Object.entries(analytics.referralRevenue.byPlatform).map(([platform, revenue]) => {
              const percentage = (revenue / analytics.referralRevenue.total) * 100;
              return (
                <div key={platform} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      platform === 'swiggy' ? 'bg-orange-500' :
                      platform === 'zomato' ? 'bg-red-500' : 'bg-green-500'
                    }`}></div>
                    <span className="font-medium text-gray-900 capitalize">{platform}</span>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">₹{revenue.toFixed(2)}</div>
                    <div className="text-sm text-gray-500">{percentage.toFixed(1)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Dishes</h3>
          <div className="space-y-4">
            {analytics.topPerformingDishes.map((dish, index) => (
              <div key={dish.dishId} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 truncate max-w-48">
                      {dish.dishName}
                    </div>
                    <div className="text-sm text-gray-500">{dish.conversions} orders</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-green-600">₹{dish.revenue.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Ad Performance */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ad Performance Metrics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {analytics.adRevenue.impressions.toLocaleString()}
            </div>
            <div className="text-gray-600">Total Impressions</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {analytics.adRevenue.clicks}
            </div>
            <div className="text-gray-600">Total Clicks</div>
          </div>
          
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {analytics.adRevenue.ctr}%
            </div>
            <div className="text-gray-600">Click-through Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
};