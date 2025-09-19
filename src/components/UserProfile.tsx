import React, { useState, useEffect } from 'react';
import { User, Star, MapPin, Calendar, Shield, Edit3, Camera, Award, TrendingUp, MessageSquare, Clock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getFirestore, collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import { isFirebaseConfigured } from '../lib/firebase';
import type { Review } from '../types/types';

const db = isFirebaseConfigured ? getFirestore(getApp()) : null;

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(user || {} as any);
  const [userReviews, setUserReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  // Fetch user reviews when component opens
  useEffect(() => {
    const fetchUserReviews = async () => {
      if (!user || !isOpen) return;
      
      setIsLoadingReviews(true);
      try {
        if (!isFirebaseConfigured || !db) {
          // Mock reviews for development
          const mockReviews: Review[] = [
            {
              id: 'mock-review-1',
              userId: user.id,
              userName: user.name,
              userEmail: user.email,
              userAvatar: user.avatar,
              dishName: 'Chicken Biryani',
              restaurantName: 'Paradise Restaurant',
              rating: 5,
              comment: 'Absolutely delicious! The spices were perfectly balanced and the chicken was tender.',
              trustScore: 85,
              date: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
              images: [],
              helpful: 12,
              verified: true,
              userTrustScore: 85,
              likes: 8,
              isHelpful: false,
              tags: ['Spicy', 'Authentic', 'Must-try'],
              dishType: 'Biryani',
              spiceLevel: 'medium',
              portionSize: 'large',
              visualAppeal: 4,
              wouldRecommend: true,
            },
            {
              id: 'mock-review-2',
              userId: user.id,
              userName: user.name,
              userEmail: user.email,
              userAvatar: user.avatar,
              dishName: 'Masala Dosa',
              restaurantName: 'Saravana Bhavan',
              rating: 4,
              comment: 'Great crispy dosa with flavorful potato filling. The coconut chutney was excellent.',
              trustScore: 80,
              date: new Date(Date.now() - 2 * 86400000).toISOString(), // 2 days ago
              images: [],
              helpful: 7,
              verified: true,
              userTrustScore: 85,
              likes: 5,
              isHelpful: false,
              tags: ['Crispy', 'Traditional', 'South Indian'],
              dishType: 'Dosa',
              spiceLevel: 'mild',
              portionSize: 'medium',
              visualAppeal: 4,
              wouldRecommend: true,
            }
          ];
          setUserReviews(mockReviews);
          setIsLoadingReviews(false);
          return;
        }
        
        const reviewsRef = collection(db, 'reviews');
        const q = query(
          reviewsRef, 
          where('userId', '==', user.id),
          orderBy('timestamp', 'desc')
        );
        const snapshot = await getDocs(q);
        const reviews: Review[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          const ts = data.timestamp?.toDate ? data.timestamp.toDate() : new Date();
          return {
            id: doc.id,
            userId: data.userId || user.id,
            userName: data.userName || user.name,
            userEmail: data.userEmail || user.email,
            userAvatar: data.userAvatar || user.avatar,
            dishName: data.dishName || '',
            restaurantName: data.restaurantName || '',
            rating: Number(data.rating) || 0,
            comment: data.comment || '',
            enhancedComment: data.enhancedComment,
            trustScore: Number(data.trustScore) || 80,
            date: ts.toISOString(),
            images: Array.isArray(data.images) ? data.images : [],
            helpful: Number(data.helpful) || 0,
            verified: Boolean(data.verified),
            userTrustScore: Number(data.userTrustScore) || 80,
            likes: Number(data.likes) || 0,
            isHelpful: Boolean(data.isHelpful) || false,
            tags: Array.isArray(data.tags) ? data.tags : [],
            dishType: data.dishType || 'unknown',
            spiceLevel: data.spiceLevel,
            portionSize: data.portionSize,
            textureNotes: data.textureNotes,
            aromaNotes: data.aromaNotes,
            visualAppeal: Number(data.visualAppeal) || 0,
            wouldRecommend: Boolean(data.wouldRecommend) || false,
          };
        });
        setUserReviews(reviews);
      } catch (error) {
        console.error('Error fetching user reviews:', error);
      } finally {
        setIsLoadingReviews(false);
      }
    };

    fetchUserReviews();
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const handleSave = async () => {
    const success = await updateProfile(editData);
    if (success) {
      setIsEditing(false);
    }
  };

  const getTrustLevel = (score: number) => {
    if (score >= 90) return { level: 'Expert', color: 'text-purple-600', bg: 'bg-purple-100' };
    if (score >= 75) return { level: 'Trusted', color: 'text-green-600', bg: 'bg-green-100' };
    if (score >= 60) return { level: 'Reliable', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (score >= 40) return { level: 'Growing', color: 'text-yellow-600', bg: 'bg-yellow-100' };
    return { level: 'New', color: 'text-gray-600', bg: 'bg-gray-100' };
  };

  const trustLevel = getTrustLevel(user.trustScore);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center space-x-2 px-4 py-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span>{isEditing ? 'Cancel' : 'Edit'}</span>
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                ×
              </button>
            </div>
          </div>

          {/* Profile Header */}
          <div className="flex items-center space-x-4 mb-8">
            <div className="relative">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-white" />
                )}
              </div>
              {isEditing && (
                <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange-500 text-white rounded-full flex items-center justify-center">
                  <Camera className="w-3 h-3" />
                </button>
              )}
            </div>
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                  className="text-2xl font-bold text-gray-900 bg-transparent border-b border-gray-300 focus:border-orange-500 outline-none"
                />
              ) : (
                <h3 className="text-2xl font-bold text-gray-900">{user.name}</h3>
              )}
              <div className="flex items-center space-x-4 mt-2">
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${trustLevel.bg}`}>
                  <Shield className={`w-4 h-4 ${trustLevel.color}`} />
                  <span className={`text-sm font-medium ${trustLevel.color}`}>
                    {trustLevel.level} • {user.trustScore}
                  </span>
                </div>
                {user.isVerified && (
                  <div className="flex items-center space-x-1 text-green-600">
                    <Award className="w-4 h-4" />
                    <span className="text-sm font-medium">Verified</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-2xl font-bold text-gray-900">{userReviews.length}</div>
              <div className="text-sm text-gray-600">Reviews</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-2xl font-bold text-gray-900">{user.favoriteDishes.length}</div>
              <div className="text-sm text-gray-600">Favorites</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-2xl font-bold text-gray-900">{user.favoriteRestaurants.length}</div>
              <div className="text-sm text-gray-600">Restaurants</div>
            </div>
          </div>

          {/* Basic Info */}
          <div className="space-y-6">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h4>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <MapPin className="w-5 h-5 text-gray-400" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.location}
                      onChange={(e) => setEditData({ ...editData, location: e.target.value })}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    />
                  ) : (
                    <span className="text-gray-700">{user.location}</span>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">Joined {user.joinDate}</span>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Food Preferences</h4>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Favorite Cuisines</label>
                  {isEditing ? (
                    <div className="flex flex-wrap gap-2">
                      {['Indian', 'Chinese', 'Italian', 'Mexican', 'Thai', 'Mediterranean', 'Japanese', 'Korean'].map(cuisine => (
                        <button
                          key={cuisine}
                          type="button"
                          onClick={() => {
                            const newCuisines = editData.preferences.cuisines.includes(cuisine)
                              ? editData.preferences.cuisines.filter((c: string) => c !== cuisine)
                              : [...editData.preferences.cuisines, cuisine];
                            setEditData({
                              ...editData,
                              preferences: { ...editData.preferences, cuisines: newCuisines }
                            });
                          }}
                          className={`px-3 py-1 rounded-full text-sm transition-all ${
                            editData.preferences.cuisines.includes(cuisine)
                              ? 'bg-orange-500 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-orange-50'
                          }`}
                        >
                          {cuisine}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {user.preferences.cuisines.map(cuisine => (
                        <span key={cuisine} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                          {cuisine}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Spice Level</label>
                  {isEditing ? (
                    <select
                      value={editData.preferences.spiceLevel}
                      onChange={(e) => setEditData({
                        ...editData,
                        preferences: { ...editData.preferences, spiceLevel: e.target.value }
                      })}
                      className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                    >
                      <option value="mild">Mild</option>
                      <option value="medium">Medium</option>
                      <option value="hot">Hot</option>
                      <option value="extra-hot">Extra Hot</option>
                    </select>
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm capitalize">
                      {user.preferences.spiceLevel}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Budget Range</label>
                  <span className="text-gray-700">₹{user.preferences.budgetRange[0]} - ₹{user.preferences.budgetRange[1]}</span>
                </div>
              </div>
            </div>

            {/* Trust Score Details */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Trust Score Breakdown</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Review Quality</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full">
                      <div className="h-full bg-green-500 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                    <span className="text-sm font-medium">85%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Authenticity</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: '92%' }}></div>
                    </div>
                    <span className="text-sm font-medium">92%</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Helpfulness</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 h-2 bg-gray-200 rounded-full">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                    <span className="text-sm font-medium">78%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* User Reviews Section */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-4">My Reviews ({userReviews.length})</h4>
              {isLoadingReviews ? (
                <div className="text-center py-4">
                  <div className="text-gray-500">Loading reviews...</div>
                </div>
              ) : userReviews.length > 0 ? (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {userReviews.map((review) => (
                    <div key={review.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h5 className="font-medium text-gray-900">{review.dishName || 'Unknown Dish'}</h5>
                          <p className="text-sm text-gray-600">{review.restaurantName ? `at ${review.restaurantName}` : ''}</p>
                          <p className="text-xs text-gray-500">
                            <Clock className="w-3 h-3 inline mr-1" />
                            {new Date(review.date).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-gray-700 text-sm mb-2">{review.comment}</p>
                      {review.tags && review.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {review.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-3 text-xs text-gray-500">
                        <span>Trust Score: {review.trustScore}/100</span>
                        <span>{review.helpful} helpful votes</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No reviews yet</p>
                  <p className="text-sm text-gray-400">Start sharing your food experiences!</p>
                </div>
              )}
            </div>

            {isEditing && (
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};