import React, { useState, useEffect } from 'react';
import { User, Star, MapPin, Calendar, Shield, Edit3, Camera, Award, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { auth, db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

interface UserProfileProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(user || {} as any);

  if (!isOpen) return null;
  if (!user) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>
              <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100">×</button>
            </div>
            <div className="flex items-center space-x-4 mb-8">
              <div className="w-20 h-20 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center">
                <User className="w-10 h-10 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-900">Food Lover</h3>
              </div>
            </div>
            <p className="text-gray-600">Please sign in to view your profile.</p>
          </div>
        </div>
      </div>
    );
  }

  // Ensure we show the real name from Firebase Auth or Firestore users/{uid}
  useEffect(() => {
    let isMounted = true;
    const resolveUserName = async () => {
      try {
        const authName = auth.currentUser?.displayName;
        let firestoreName: string | undefined;
        if (user.id) {
          const snap = await getDoc(doc(db, 'users', user.id));
          if (snap.exists()) {
            const data = snap.data() as any;
            firestoreName = data?.name;
          }
        }
        const resolved = firestoreName || authName || user.name;
        if (resolved && resolved !== user.name) {
          await updateProfile({ name: resolved });
          if (isMounted) setEditData((prev: any) => ({ ...prev, name: resolved }));
        }
      } catch {}
    };
    resolveUserName();
    return () => { isMounted = false; };
  }, [user.id]);

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

  const trustLevel = getTrustLevel(user?.trustScore || 0);

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
                {user?.avatar ? (
                  <img src={user.avatar} alt={user?.name || 'Food Lover'} className="w-full h-full rounded-full object-cover" />
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
                <h3 className="text-2xl font-bold text-gray-900">{user?.name || 'Food Lover'}</h3>
              )}
              <div className="flex items-center space-x-4 mt-2">
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full ${trustLevel.bg}`}>
                  <Shield className={`w-4 h-4 ${trustLevel.color}`} />
                  <span className={`text-sm font-medium ${trustLevel.color}`}>
                    {trustLevel.level} • {user?.trustScore ?? 0}
                  </span>
                </div>
                {user?.isVerified && (
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
              <div className="text-2xl font-bold text-gray-900">{user?.reviewCount ?? 0}</div>
              <div className="text-sm text-gray-600">Reviews</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-2xl font-bold text-gray-900">{user?.favoriteDishes?.length ?? 0}</div>
              <div className="text-sm text-gray-600">Favorites</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="text-2xl font-bold text-gray-900">{user?.favoriteRestaurants?.length ?? 0}</div>
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
                    <span className="text-gray-700">{user?.location || '-'}</span>
                  )}
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-700">Joined {user?.joinDate || '-'}</span>
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
                      {(user?.preferences?.cuisines || []).map(cuisine => (
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
                      {user?.preferences?.spiceLevel || 'medium'}
                    </span>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Budget Range</label>
                  <span className="text-gray-700">₹{user?.preferences?.budgetRange?.[0] ?? 0} - ₹{user?.preferences?.budgetRange?.[1] ?? 0}</span>
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