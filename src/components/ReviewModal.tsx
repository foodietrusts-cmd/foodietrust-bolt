import React, { useState } from 'react';
import { X, Star, Camera, Upload, AlertCircle, Sparkles, Tag, Heart, ThumbsUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { Dish, ReviewPost } from '../types/types';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  dish: Dish | null;
  onSubmitReview: (review: ReviewPost) => Promise<boolean>;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({ 
  isOpen, 
  onClose, 
  dish, 
  onSubmitReview 
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [spiceLevel, setSpiceLevel] = useState<'mild' | 'medium' | 'hot' | 'extra-hot'>('medium');
  const [portionSize, setPortionSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [enhancedComment, setEnhancedComment] = useState('');
  const [showEnhanced, setShowEnhanced] = useState(false);
  const { user } = useAuth();

  if (!isOpen || !dish) return null;

  const availableTags = [
    'Spicy', 'Sweet', 'Savory', 'Crispy', 'Creamy', 'Fresh', 'Aromatic', 
    'Trending', 'Must-try', 'Comfort Food', 'Healthy', 'Indulgent', 
    'Perfect Portion', 'Great Value', 'Instagram-worthy', 'Authentic'
  ];

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

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const enhanceComment = () => {
    if (comment.trim().length < 10) return;
    
    // AI-enhanced comment generation (simulated)
    const enhanced = `This ${dish.name} delivers an exceptional dining experience. ${comment} The dish showcases ${selectedTags.join(', ').toLowerCase()} qualities that make it stand out. With ${spiceLevel} spice level and ${portionSize} portion size, it's ${wouldRecommend ? 'definitely worth trying' : 'not quite what I expected'}. A memorable addition to ${dish.restaurant.name}'s menu.`;
    
    setEnhancedComment(enhanced);
    setShowEnhanced(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError('Please log in to submit a review');
      return;
    }
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    if (comment.trim().length < 20) {
      setError('Please write at least 20 characters in your review for better community value');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const reviewData: ReviewPost = {
        dishId: dish.id,
        rating,
        
        images: images.length > 0 ? images : undefined,
        tags: selectedTags,
        dishName: dish.name,
        restaurantName: dish.restaurant.name
      };

      const success = await onSubmitReview(reviewData);
      if (success) {
        // Reset form
        setRating(0);
        setComment('');
        setImages([]);
        setSelectedTags([]);
        setEnhancedComment('');
        setShowEnhanced(false);
        onClose();
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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Share Your Experience</h2>
              <p className="text-gray-600">Help others discover amazing dishes</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Dish Info */}
          <div className="flex items-center space-x-3 mb-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 rounded-xl border border-orange-200">
            <img src={dish.image} alt={dish.name} className="w-16 h-16 rounded-xl object-cover" />
            <div className="flex-1">
              <h3 className="font-bold text-gray-900 text-lg">{dish.name}</h3>
              <p className="text-gray-600">{dish.restaurant.name}</p>
              <p className="text-sm text-orange-600 font-medium">{dish.cuisine} • ₹{dish.price}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Your Rating *
              </label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`w-12 h-12 flex items-center justify-center rounded-full transition-all ${
                      star <= rating 
                        ? 'text-yellow-400 bg-yellow-50 scale-110' 
                        : 'text-gray-300 hover:text-yellow-300 hover:bg-gray-50'
                    }`}
                  >
                    <Star className={`w-7 h-7 ${star <= rating ? 'fill-current' : ''}`} />
                  </button>
                ))}
                <span className="ml-4 text-lg font-medium text-gray-700">
                  {rating === 0 ? 'Select rating' : 
                   rating === 1 ? 'Poor' :
                   rating === 2 ? 'Fair' :
                   rating === 3 ? 'Good' :
                   rating === 4 ? 'Very Good' : 'Excellent'}
                </span>
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Review * (Minimum 20 characters)
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                placeholder="Describe the taste, texture, aroma, presentation, and overall experience. Be specific and helpful for other food lovers!"
              />
              <div className="flex justify-between items-center mt-2">
                <p className="text-xs text-gray-500">
                  {comment.length < 20 ? `${20 - comment.length} more characters needed` : 'Great! Your review helps the community'}
                </p>
                <p className="text-xs text-gray-500">{comment.length}/500</p>
              </div>
              
              {comment.length >= 20 && (
                <button
                  type="button"
                  onClick={enhanceComment}
                  className="mt-2 flex items-center space-x-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Enhance with AI</span>
                </button>
              )}

              {showEnhanced && (
                <div className="mt-3 p-3 bg-purple-50 border border-purple-200 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-700">AI Enhanced Version:</span>
                    <button
                      type="button"
                      onClick={() => setShowEnhanced(false)}
                      className="text-xs text-purple-600 hover:text-purple-700"
                    >
                      Use Original
                    </button>
                  </div>
                  <p className="text-sm text-gray-700">{enhancedComment}</p>
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Add Tags (Help others find similar dishes)
              </label>
              <div className="flex flex-wrap gap-2">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedTags.includes(tag)
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                    }`}
                  >
                    <Tag className="w-3 h-3 inline mr-1" />
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Additional Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Spice Level
                </label>
                <select
                  value={spiceLevel}
                  onChange={(e) => setSpiceLevel(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="mild">Mild</option>
                  <option value="medium">Medium</option>
                  <option value="hot">Hot</option>
                  <option value="extra-hot">Extra Hot</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Portion Size
                </label>
                <select
                  value={portionSize}
                  onChange={(e) => setPortionSize(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  <option value="small">Small</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
            </div>

            {/* Would Recommend */}
            <div>
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={wouldRecommend}
                  onChange={(e) => setWouldRecommend(e.target.checked)}
                  className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500"
                />
                <div className="flex items-center space-x-2">
                  <ThumbsUp className="w-5 h-5 text-green-500" />
                  <span className="font-medium text-gray-900">I would recommend this dish</span>
                </div>
              </label>
            </div>

            {/* Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Add Photos (Highly Recommended!)
              </label>
              <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center">
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
                  className="cursor-pointer"
                >
                  <Camera className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium mb-1">Click to add photos</p>
                  <p className="text-sm text-gray-500">Photos get 3x more engagement! Max 5 images, up to 10MB each</p>
                </label>
              </div>

              {images.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {images.map((image, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(image)}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Community Impact */}
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
              <div className="flex items-start space-x-3">
                <Heart className="w-5 h-5 text-blue-500 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-blue-900">Help Our Community Grow!</h4>
                  <p className="text-xs text-blue-700 mt-1">
                    Your authentic review with photos helps thousands of food lovers discover amazing dishes. 
                    Detailed reviews with images get featured more often and help restaurants improve their offerings.
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || rating === 0 || comment.trim().length < 20}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 text-white py-4 rounded-xl font-semibold hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {isSubmitting ? 'Sharing Your Experience...' : 'Share Review & Help Community'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
