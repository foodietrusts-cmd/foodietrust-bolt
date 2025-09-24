export interface Dish {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  cuisine: string;
  category: string;
  restaurant: {
    id: string;
    name: string;
    location: string;
  };
  averageRating: number;
  reviewCount: number;
  tags: string[];
  trustScore: number;
  photoCount: number;
  reviews: Review[];
  credibilityScore: number;
  trendingScore: number;
  lastUpdated: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  enhancedComment?: string;
  trustScore: number;
  date: string;
  images?: string[];
  helpful: number;
  verified: boolean;
  userTrustScore: number;
  likes: number;
  isHelpful: boolean;
  tags: string[];
  dishType: string;
  spiceLevel?: 'mild' | 'medium' | 'hot' | 'extra-hot';
  portionSize?: 'small' | 'medium' | 'large';
  textureNotes?: string;
  aromaNotes?: string;
  visualAppeal: number;
  wouldRecommend: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  preferences: UserPreferences;
  trustScore: number;
  reviewCount: number;
  joinDate: string;
  location: string;
  favoriteRestaurants: string[];
  favoriteDishes: string[];
  reviewHistory: string[];
  isVerified: boolean;
  loginMethod: 'email' | 'google' | 'meta' | 'apple';
  lastActive: string;
  engagementScore: number;
  helpfulVotes: number;
  photosUploaded: number;
  followersCount: number;
  followingCount: number;
}

export interface UserPreferences {
  cuisines: string[];
  dietaryRestrictions: string[];
  spiceLevel: 'mild' | 'medium' | 'hot' | 'extra-hot';
  budgetRange: [number, number];
  mealTimes: string[];
  allergies: string[];
  preferredLanguage: 'en' | 'hi' | 'ta' | 'te';
}

export interface FilterOptions {
  cuisine: string[];
  category: string[];
  priceRange: [number, number];
  rating: number;
  dietary: string[];
  spiceLevel?: string;
  location?: string;
}

export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: string;
  suggestions?: string[];
  dishRecommendations?: Dish[];
}

export interface Restaurant {
  id: string;
  name: string;
  location: string;
  rating: number;
  reviewCount: number;
  trustScore: number;
  verified: boolean;
}

export interface ReviewPost {
  restaurantId: string;
  restaurantName: string;
  dishName: string;
  reviewText: string;
  rating: number;
  tags?: string[];
  recommendation: boolean;
  photoFile?: File | null;
  extra?: {
    tags: string[];
    spiceLevel: 'mild' | 'medium' | 'hot' | 'extra-hot';
    portionSize: 'small' | 'medium' | 'large';
    wouldRecommend: boolean;
  };
}

export interface UserReviewSubmission {
  dishName: string;
  restaurantName: string;
  rating: number;
  comment: string;
  images?: File[];
  location?: string;
  tags?: string[];
}

export interface RestaurantPromotion {
  id: string;
  restaurantId: string;
  restaurantName: string;
  dishName: string;
  description: string;
  sellingPoints: string[];
  images: string[];
  specialOffer?: string;
  price: number;
  cuisine: string;
  category: string;
  isActive: boolean;
  createdAt: string;
  expiresAt?: string;
  targetAudience?: string[];
  promotionScore: number;
}

export interface ReferralLink {
  platform: 'swiggy' | 'zomato' | 'ubereats';
  url: string;
  isAvailable: boolean;
  estimatedDeliveryTime?: string;
  platformLogo: string;
  platformName: string;
}

export interface AdPlacement {
  id: string;
  type: 'banner' | 'sidebar' | 'inline' | 'interstitial';
  position: 'top' | 'middle' | 'bottom' | 'between-cards';
  content: {
    title: string;
    description: string;
    image: string;
    ctaText: string;
    targetUrl: string;
  };
  isActive: boolean;
  impressions: number;
  clicks: number;
  revenue: number;
  targetAudience?: string[];
}

export interface RevenueAnalytics {
  referralRevenue: {
    total: number;
    byPlatform: Record<string, number>;
    conversions: number;
    clickThroughRate: number;
  };
  adRevenue: {
    total: number;
    impressions: number;
    clicks: number;
    ctr: number;
  };
  topPerformingDishes: Array<{
    dishId: string;
    dishName: string;
    revenue: number;
    conversions: number;
  }>;
}

export interface EngagementMetrics {
  dailyActiveUsers: number;
  reviewsPosted: number;
  photosUploaded: number;
  userInteractions: number;
  averageSessionTime: number;
  retentionRate: number;
}

export interface SocialLoginProvider {
  provider: 'google' | 'meta' | 'apple';
  name: string;
  icon: string;
  color: string;
}

export interface ReviewEngagement {
  reviewId: string;
  likes: number;
  helpfulVotes: number;
  comments: number;
  shares: number;
}

export interface CommunityChallenge {
  id: string;
  title: string;
  description: string;
  type: 'photo' | 'review' | 'discovery';
  reward: string;
  participantCount: number;
  endDate: string;
  isActive: boolean;
}