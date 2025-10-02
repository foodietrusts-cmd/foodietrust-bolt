import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Star, TrendingUp, Clock, Users, Camera, Shield, Heart, ChefHat, Utensils, User, LogOut } from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TabNavigation } from './components/TabNavigation';
import { SearchHeader } from './components/SearchHeader';
import { DishCard } from './components/DishCard';
import { TrendingSection } from './components/TrendingSection';
import { FilterPanel } from './components/FilterPanel';
import { PersonalizedRecommendations } from './components/PersonalizedRecommendations';
import { AuthModal } from './components/AuthModal';
import { AIChat } from './components/AIChat';
import { ReviewModal } from './components/ReviewModal';
import { UserProfile } from './components/UserProfile';
import { UserReviewsTab } from './components/UserReviewsTab';
import { RestaurantPromotionsTab } from './components/RestaurantPromotionsTab';
import { AdBanner } from './components/AdBanner';
import { RevenueAnalytics } from './components/RevenueAnalytics';
import { EngagementPrompts, CommunityStats } from './components/EngagementPrompts';
import { AISearch } from './components/AISearch';
import { mockDishes } from './data/mockData';
import type { Dish, FilterOptions, ReviewPost, UserReviewSubmission } from './types/types';

function AppContent() {
  const [dishes, setDishes] = useState<Dish[]>(mockDishes);
  const [activeTab, setActiveTab] = useState<'reviews' | 'promotions' | 'analytics' | 'aisearch'>('aisearch');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<FilterOptions>({
    cuisine: [],
    category: [],
    priceRange: [0, 1000],
    rating: 0,
    dietary: []
  });
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [selectedDishForReview, setSelectedDishForReview] = useState<Dish | null>(null);
  const [authPromptMessage, setAuthPromptMessage] = useState('');
  
  const { user, logout } = useAuth();

  const filteredDishes = dishes.filter(dish => {
    const matchesSearch = dish.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         dish.restaurant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         dish.cuisine.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCuisine = selectedFilters.cuisine.length === 0 || 
                          selectedFilters.cuisine.includes(dish.cuisine);
    
    const matchesCategory = selectedFilters.category.length === 0 || 
                           selectedFilters.category.includes(dish.category);
    
    const matchesPrice = dish.price >= selectedFilters.priceRange[0] && 
                        dish.price <= selectedFilters.priceRange[1];
    
    const matchesRating = dish.averageRating >= selectedFilters.rating;

    return matchesSearch && matchesCuisine && matchesCategory && matchesPrice && matchesRating;
  });

  const toggleFavorite = (dishId: string) => {
    setFavorites(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(dishId)) {
        newFavorites.delete(dishId);
      } else {
        newFavorites.add(dishId);
      }
      return newFavorites;
    });
  };

  const handleDishRecommend = (dish: Dish) => {
    // Scroll to dish or highlight it
    const dishElement = document.getElementById(`dish-${dish.id}`);
    if (dishElement) {
      dishElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      dishElement.classList.add('ring-2', 'ring-orange-500');
      setTimeout(() => {
        dishElement.classList.remove('ring-2', 'ring-orange-500');
      }, 3000);
    }
  };

  const handleWriteReview = (dish: Dish) => {
    if (!user) {
      setAuthPromptMessage('Login to share your authentic review and help others discover amazing dishes like this one!');
      setShowAuthModal(true);
      return;
    }
    setSelectedDishForReview(dish);
    setShowReviewModal(true);
  };

  const handleSubmitReview = async (reviewData: ReviewPost): Promise<boolean> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update dish with new review (mock implementation)
      setDishes(prevDishes =>
        prevDishes.map(dish => {
          if (dish.id === reviewData.dishId) {
            const newReview = {
              id: Date.now().toString(),
              userId: user!.id,
              userName: user!.name,
              rating: reviewData.rating,
              comment: reviewData.comment,
              trustScore: user!.trustScore,
              date: new Date().toISOString(),
              helpful: 0,
              verified: user!.isVerified,
              userTrustScore: user!.trustScore,
              likes: 0,
              isHelpful: false,
              tags: [],
              dishType: dish.category,
              visualAppeal: 5,
              wouldRecommend: true
            };

            const updatedReviews = [...dish.reviews, newReview];
            const newAverageRating = updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length;

            return {
              ...dish,
              reviews: updatedReviews,
              reviewCount: updatedReviews.length,
              averageRating: Math.round(newAverageRating * 10) / 10
            };
          }
          return dish;
        })
      );
      
      return true;
    } catch (error) {
      console.error('Failed to submit review:', error);
      return false;
    }
  };

  const handleSubmitUserReview = async (reviewData: UserReviewSubmission): Promise<boolean> => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, this would create a new dish entry or find existing one
      // For now, we'll just simulate success
      console.log('User review submitted:', reviewData);
      
      return true;
    } catch (error) {
      console.error('Failed to submit user review:', error);
      return false;
    }
  };

  const handleReferralClick = (platform: string, dishId: string) => {
    // Track referral click for analytics
    console.log(`Referral click: ${platform} for dish ${dishId}`);
    
    // In real app, this would:
    // 1. Track the click in analytics
    // 2. Update conversion metrics
    // 3. Calculate commission
  };

  const handleAdClick = (adId: string) => {
    // Track ad click for analytics
    console.log(`Ad click: ${adId}`);
    
    // In real app, this would:
    // 1. Track the click in ad analytics
    // 2. Update CTR metrics
    // 3. Calculate ad revenue
  };

  const handleAdClose = (adId: string) => {
    // Track ad close for analytics
    console.log(`Ad closed: ${adId}`);
  };

  const handleEngagementPrompt = (action: 'login' | 'review' | 'photo' | 'explore') => {
    switch (action) {
      case 'login':
        setAuthPromptMessage('Join our community of food lovers and start sharing your dining experiences!');
        setShowAuthModal(true);
        break;
      case 'review':
        // Find a popular dish to review
        const popularDish = dishes.find(d => d.tags.includes('Trending'));
        if (popularDish) {
          setSelectedDishForReview(popularDish);
          setShowReviewModal(true);
        }
        break;
      case 'photo':
        setAuthPromptMessage('Add photos to your reviews - they get 3x more engagement and help others discover great dishes!');
        setShowAuthModal(true);
        break;
      case 'explore':
        setActiveTab('aisearch');
        break;
    }
  };

  const trendingDishes = dishes.filter(dish => dish.tags.includes('Trending')).slice(0, 6);
  const recommendedDishes = user 
    ? dishes.filter(dish => 
        user.preferences.cuisines.length === 0 || 
        user.preferences.cuisines.includes(dish.cuisine)
      ).slice(0, 4)
    : dishes.filter(dish => dish.tags.includes('Highly Recommended')).slice(0, 4);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-red-50">
      {/* Header */}
      <header className="bg-white shadow-lg border-b border-orange-100">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <ChefHat className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  FoodieTrust
                </h1>
                <p className="text-sm text-gray-600">Discover the best dishes, trusted by millions</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Shield className="w-4 h-4 text-green-500" />
                <span>Verified Reviews</span>
              </div>
              
              {user ? (
                <div className="flex items-center space-x-3">
                  <span className="text-sm text-gray-700">Welcome, {user.name}</span>
                  <button
                    onClick={() => setShowUserProfile(true)}
                    className="w-10 h-10 bg-gradient-to-r from-amber-400 to-orange-500 rounded-full flex items-center justify-center hover:shadow-lg transition-all"
                  >
                    <User className="w-5 h-5 text-white" />
                  </button>
                  <button
                    onClick={logout}
                    className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                  >
                    <LogOut className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Top Ad Banner */}
      {activeTab === 'aisearch' && (
        <div className="max-w-7xl mx-auto px-4 pt-6">
          <AdBanner 
            placement="top" 
            onAdClick={handleAdClick}
            onAdClose={handleAdClose}
          />
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Tab Content */}
        {activeTab === 'aisearch' && (
          <AISearch />
        )}
      </div>

      {/* AI Chat */}
      <AIChat dishes={dishes} onDishRecommend={handleDishRecommend} />
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => {
          setShowAuthModal(false);
          setAuthPromptMessage('');
        }}
        promptMessage={authPromptMessage}
      />
      
      <ReviewModal
        isOpen={showReviewModal}
        onClose={() => {
          setShowReviewModal(false);
          setSelectedDishForReview(null);
        }}
        dish={selectedDishForReview}
        onSubmitReview={handleSubmitReview}
      />
      
      <UserProfile
        isOpen={showUserProfile}
        onClose={() => setShowUserProfile(false)}
      />

      {/* Engagement Prompts */}
      <EngagementPrompts onPromptAction={handleEngagementPrompt} />

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <ChefHat className="w-6 h-6 text-orange-500" />
              <span className="text-lg font-semibold text-gray-900">FoodieTrust</span>
            </div>
            <p className="text-gray-600 mb-4">
              The world's most trusted food discovery platform with verified reviews and authentic recommendations
            </p>
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
              <span className="flex items-center"><Shield className="w-4 h-4 mr-1" /> Verified Reviews</span>
              <span className="flex items-center"><Star className="w-4 h-4 mr-1" /> AI-Powered Ratings</span>
              <span className="flex items-center"><TrendingUp className="w-4 h-4 mr-1" /> Real-time Trends</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;