import React, { useState, useEffect } from 'react';
import { Camera, Star, Users, TrendingUp, Award, MessageSquare, Heart, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface EngagementPromptsProps {
  onPromptAction: (action: 'login' | 'review' | 'photo' | 'explore') => void;
}

export const EngagementPrompts: React.FC<EngagementPromptsProps> = ({ onPromptAction }) => {
  const [currentPrompt, setCurrentPrompt] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Show engagement prompts based on user behavior
    const showEngagementPrompt = () => {
      if (!user) {
        // Prompt non-users to login
        const loginPrompts = [
          "Join thousands of food lovers sharing authentic reviews!",
          "Login to save your favorite dishes and get personalized recommendations",
          "Share your food experiences and help others discover amazing dishes"
        ];
        setCurrentPrompt(loginPrompts[Math.floor(Math.random() * loginPrompts.length)]);
        setShowPrompt(true);
        return;
      }

      // Prompt logged-in users based on their activity
      if (user.reviewCount === 0) {
        setCurrentPrompt("Share your first review and help the community discover great dishes!");
        setShowPrompt(true);
      } else if (user.photosUploaded < 3) {
        setCurrentPrompt("Add photos to your reviews - they get 3x more engagement!");
        setShowPrompt(true);
      } else if (user.helpfulVotes < 10) {
        setCurrentPrompt("Help others by voting on helpful reviews in the community");
        setShowPrompt(true);
      }
    };

    // Show prompts periodically
    const timer = setTimeout(showEngagementPrompt, 5000);
    return () => clearTimeout(timer);
  }, [user]);

  if (!showPrompt || !currentPrompt) return null;

  const getPromptAction = () => {
    if (!user) return 'login';
    if (user.reviewCount === 0) return 'review';
    if (user.photosUploaded < 3) return 'photo';
    return 'explore';
  };

  const getPromptIcon = () => {
    const action = getPromptAction();
    switch (action) {
      case 'login': return <Users className="w-6 h-6" />;
      case 'review': return <Star className="w-6 h-6" />;
      case 'photo': return <Camera className="w-6 h-6" />;
      default: return <TrendingUp className="w-6 h-6" />;
    }
  };

  const getPromptColor = () => {
    const action = getPromptAction();
    switch (action) {
      case 'login': return 'from-blue-500 to-purple-500';
      case 'review': return 'from-orange-500 to-red-500';
      case 'photo': return 'from-green-500 to-teal-500';
      default: return 'from-purple-500 to-pink-500';
    }
  };

  return (
    <div className="fixed bottom-20 right-6 max-w-sm z-40">
      <div className={`bg-gradient-to-r ${getPromptColor()} text-white p-4 rounded-2xl shadow-lg animate-bounce`}>
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-1">
            {getPromptIcon()}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">{currentPrompt}</p>
            <div className="flex items-center space-x-2 mt-3">
              <button
                onClick={() => {
                  onPromptAction(getPromptAction());
                  setShowPrompt(false);
                }}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-medium transition-colors"
              >
                {getPromptAction() === 'login' ? 'Join Now' : 
                 getPromptAction() === 'review' ? 'Write Review' :
                 getPromptAction() === 'photo' ? 'Add Photos' : 'Explore'}
              </button>
              <button
                onClick={() => setShowPrompt(false)}
                className="text-white/70 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const CommunityStats: React.FC = () => {
  const [stats, setStats] = useState({
    totalReviews: 15420,
    photosShared: 8934,
    activeUsers: 2341,
    dishesDiscovered: 5678
  });

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-8">
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-2">Our Growing Community</h3>
        <p className="text-gray-600">Join thousands of food lovers sharing authentic experiences</p>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full mx-auto mb-2">
            <MessageSquare className="w-6 h-6 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.totalReviews.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Reviews Shared</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-full mx-auto mb-2">
            <Camera className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.photosShared.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Photos Uploaded</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.activeUsers.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Active Users</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full mx-auto mb-2">
            <Award className="w-6 h-6 text-purple-600" />
          </div>
          <div className="text-2xl font-bold text-gray-900">{stats.dishesDiscovered.toLocaleString()}</div>
          <div className="text-sm text-gray-600">Dishes Discovered</div>
        </div>
      </div>
    </div>
  );
};