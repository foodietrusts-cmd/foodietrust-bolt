import React, { useState, useEffect } from 'react';
import { Star, Camera, Search, Filter, TrendingUp, Heart, MessageSquare, MapPin, Clock, Award } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { UserReviewSubmission, Review } from '../types/types';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getApp } from 'firebase/app';
import '../lib/firebase';

const db = getFirestore(getApp());

interface UserReviewsTabProps {
  onSubmitReview: (review: UserReviewSubmission) => Promise<boolean>;
}

export const UserReviewsTab: React.FC<UserReviewsTabProps> = ({ onSubmitReview }) => {
  const [activeView, setActiveView] = useState<'browse' | 'write'>('browse');
  const [reviews, setReviews] = useState<Review[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRating, setFilterRating] = useState(0);
  const [sortBy, setSortBy] = useState<'recent' | 'helpful' | 'rating'>('recent');
  const { user } = useAuth();

  // Mock reviews data
  useEffect(() => {
    const mockReviews: Review[] = [
      {
        id: '1',
        userId: 'user1',
        userName: 'Priya Sharma',
        rating: 5,
        comment: 'Absolutely amazing butter chicken! The gravy was rich and creamy, chicken was tender. Perfect balance of spices. Must try!',
        enhancedComment: 'This butter chicken delivers an exceptional dining experience with its perfectly balanced, rich and creamy gravy complemented by incredibly tender chicken. The spice blend is masterfully crafted, making this a must-try dish for anyone seeking authentic Indian flavors.',
        trustScore: 92,
        date: '2024-01-15T10:30:00Z',
        images: ['https://images.pexels.com/photos/2474661/pexels-photo-2474661.jpeg?auto=compress&cs=tinysrgb&w=400'],
        helpful: 23,
        verified: true,
        userTrustScore: 89
      },
      {
        id: '2',
        userId: 'user2',
        userName: 'Rahul Kumar',
        rating: 4,
        comment: 'Good pizza but crust was a bit thick for my taste. Toppings were fresh though.',
        enhancedComment: 'This pizza offers fresh, quality toppings that shine through in every bite. While the crust leans toward the thicker side, which may not suit all preferences, the overall quality and freshness of ingredients make it a solid choice for pizza lovers.',
        trustScore: 85,
        date: '2024-01-14T18:45:00Z',
        helpful: 12,
        verified: false,
        userTrustScore: 76
      },
      {
        id: '3',
        userId: 'user3',
        userName: 'Sneha Patel',
        rating: 5,
        comment: 'Best pad thai in the city! Perfect balance of sweet, sour and spicy. Prawns were huge and fresh.',
        enhancedComment: 'This pad thai stands out as the city\'s finest, achieving the perfect harmony of sweet, sour, and spicy flavors that define authentic Thai cuisine. The generous, fresh prawns elevate the dish to exceptional heights, making it an absolute must-try for Thai food enthusiasts.',
        trustScore: 96,
        date: '2024-01-13T20:15:00Z',
        images: ['https://images.pexels.com/photos/1199957/pexels-photo-1199957.jpeg?auto=compress&cs=tinysrgb&w=400'],
        helpful: 34,
        verified: true,
        userTrustScore: 94
      }
    ];
    setReviews(mockReviews);
  }, []);

  const filteredReviews = reviews.filter(review => {
    const matchesSearch = review.comment.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         review.userName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRating = filterRating === 0 || review.rating >= filterRating;
    return matchesSearch && matchesRating;
  });

  const sortedReviews = [...filteredReviews].sort((a, b) => {
    switch (sortBy) {
      case 'helpful':
        return b.helpful - a.helpful;
      case 'rating':
        return b.rating - a.rating;
      case 'recent':
      default:
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    }
  });

  if (activeView === 'write') {
    return <WriteReviewForm onSubmitReview={onSubmitReview} onBack={() => setActiveView('browse')} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Community Reviews</h2>
          <p className="text-gray-600">Discover authentic experiences from food lovers</p>
        </div>
        <button
          onClick={() => setActiveView('write')}
          className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all duration-200"
        >
          Write Review
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search reviews, dishes, or restaurants..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          
          <div className="flex gap-3">
            <select
              value={filterRating}
              onChange={(e) => setFilterRating(Number(e.target.value))}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value={0}>All Ratings</option>
              <option value={5}>5 Stars</option>
              <option value={4}>4+ Stars</option>
              <option value={3}>3+ Stars</option>
            </select>
            
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="recent">Most Recent</option>
              <option value="helpful">Most Helpful</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {sortedReviews.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>

      {sortedReviews.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No reviews found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
};

const ReviewCard: React.FC<{ review: Review }> = ({ review }) => {
  const [showEnhanced, setShowEnhanced] = useState(true);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center">
          <span className="text-white font-semibold text-lg">
            {review.userName.charAt(0)}
          </span>
        </div>
        
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-3">
              <h4 className="font-semibold text-gray-900">{review.userName}</h4>
              {review.verified && (
                <div className="flex items-center space-x-1 text-green-600">
                  <Award className="w-4 h-4" />
                  <span className="text-xs font-medium">Verified</span>
                </div>
              )}
              <div className="flex items-center space-x-1 text-gray-500 text-sm">
                <Clock className="w-3 h-3" />
                <span>{new Date(review.date).toLocaleDateString()}</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`w-4 h-4 ${
                      star <= review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <div className="text-sm text-gray-600">Trust: {review.trustScore}</div>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <button
                onClick={() => setShowEnhanced(!showEnhanced)}
                className="text-sm text-orange-600 hover:text-orange-700 font-medium"
              >
                {showEnhanced ? 'Show Original' : 'Show Enhanced'}
              </button>
              {showEnhanced && (
                <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                  AI Enhanced
                </span>
              )}
            </div>
            
            <p className="text-gray-700 leading-relaxed">
              {showEnhanced && review.enhancedComment ? review.enhancedComment : review.comment}
            </p>
          </div>

          {review.images && review.images.length > 0 && (
            <div className="mb-4">
              <div className="flex space-x-2 overflow-x-auto">
                {review.images.map((image, index) => (
                  <img
                    key={index}
                    src={image}
                    alt={`Review image ${index + 1}`}
                    className="w-24 h-24 object-cover rounded-lg flex-shrink-0"
                  />
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <button className="flex items-center space-x-2 text-gray-600 hover:text-orange-600 transition-colors">
              <Heart className="w-4 h-4" />
              <span className="text-sm">{review.helpful} helpful</span>
            </button>
            
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <span>Trust Score: {review.trustScore}/100</span>
              <span>User Score: {review.userTrustScore}/100</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const WriteReviewForm: React.FC<{
  onSubmitReview: (review: UserReviewSubmission) => Promise<boolean>;
  onBack: () => void;
}> = ({ onSubmitReview, onBack }) => {
  const [formData, setFormData] = useState<UserReviewSubmission>({
    dishName: '',
    restaurantName: '',
    rating: 0,
    comment: '',
    location: '',
    images: []
  });
  const [images, setImages] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { user } = useAuth();

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length + images.length > 5) {
      setError('Maximum 5 images allowed');
      return;
    }
    setImages(prev => [...prev, ...files]);
    setError('');
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Please log in to submit a review');
      return;
    }
    if (formData.rating === 0) {
      setError('Please select a rating');
      return;
    }
    if (formData.comment.trim().length < 10) {
      setError('Please write at least 10 characters in your review');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const reviewData: UserReviewSubmission = {
        ...formData,
        images: images.length > 0 ? images : undefined
      };

      // Create review object for Firestore
      const reviewForFirestore = {
        dishName: formData.dishName,
        restaurantName: formData.restaurantName,
        rating: formData.rating,
        comment: formData.comment,
        location: formData.location,
        timestamp: serverTimestamp()
      };

      let firebaseSaved = false;
      try {
        await addDoc(collection(db, 'reviews'), reviewForFirestore);
        firebaseSaved = true;
      } catch (firebaseError) {
        // Keep UI flow intact; log Firebase error without interrupting existing submit behavior
        console.error('❌ Error saving review:', firebaseError);
      }

      const success = await onSubmitReview(reviewData);
      if (success) {
        if (firebaseSaved) {
          console.log('✅ Review submitted and saved to Firebase!', reviewForFirestore);
        }
        // Reset form after successful submission
        setFormData({ dishName: '', restaurantName: '', rating: 0, comment: '', location: '', images: [] });
        setImages([]);
        onBack();
      } else {
        setError('Failed to submit review. Please try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <button
          onClick={onBack}
          className="text-orange-600 hover:text-orange-700 font-medium mb-4"
        >
          ← Back to Reviews
        </button>
        <h2 className="text-2xl font-bold text-gray-900">Write a Review</h2>
        <p className="text-gray-600">Share your authentic food experience</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dish Name *
            </label>
            <input
              type="text"
              required
              value={formData.dishName}
              onChange={(e) => setFormData({ ...formData, dishName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="e.g., Butter Chicken"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Restaurant Name *
            </label>
            <input
              type="text"
              required
              value={formData.restaurantName}
              onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="e.g., Spice Junction"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Your Rating *
          </label>
          <div className="flex items-center space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setFormData({ ...formData, rating: star })}
                className={`w-10 h-10 flex items-center justify-center rounded-full transition-all ${
                  star <= formData.rating 
                    ? 'text-yellow-400 bg-yellow-50' 
                    : 'text-gray-300 hover:text-yellow-300 hover:bg-gray-50'
                }`}
              >
                <Star className={`w-6 h-6 ${star <= formData.rating ? 'fill-current' : ''}`} />
              </button>
            ))}
            <span className="ml-3 text-sm text-gray-600">
              {formData.rating === 0 ? 'Select rating' : 
               formData.rating === 1 ? 'Poor' :
               formData.rating === 2 ? 'Fair' :
               formData.rating === 3 ? 'Good' :
               formData.rating === 4 ? 'Very Good' : 'Excellent'}
            </span>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Your Review *
          </label>
          <textarea
            value={formData.comment}
            onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
            rows={4}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            placeholder="Share your experience... What did you love? How was the taste, presentation, and value?"
          />
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-gray-500">Minimum 10 characters</p>
            <p className="text-xs text-gray-500">{formData.comment.length}/500</p>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location (Optional)
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Restaurant location"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add Photos (Optional)
          </label>
          <div className="border-2 border-dashed border-gray-200 rounded-xl p-4">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="flex flex-col items-center justify-center cursor-pointer"
            >
              <Camera className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">Click to add photos</p>
              <p className="text-xs text-gray-500">Max 5 images, up to 10MB each</p>
            </label>
          </div>

          {images.length > 0 && (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {images.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-20 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-xl">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting || formData.rating === 0 || formData.comment.trim().length < 10}
          className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Submitting Review...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );
};