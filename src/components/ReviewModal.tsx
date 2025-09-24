import React, { useState } from 'react';
import { X, Star, Camera, Tag, Sparkles, ThumbsUp } from 'lucide-react';
import { postReview } from '../lib/reviewService';
import type { Dish } from '../types/types';

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  dish: Dish | null;
  onSubmitReview: (review: any) => void;
}

export function ReviewModal({ isOpen, onClose, dish, onSubmitReview }: ReviewModalProps) {
  const [dishName, setDishName] = useState('');
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [spiceLevel, setSpiceLevel] = useState<'mild' | 'medium' | 'hot' | 'extra-hot'>('medium');
  const [portionSize, setPortionSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [wouldRecommend, setWouldRecommend] = useState(true);
  const [enhancedComment, setEnhancedComment] = useState('');
  const [showEnhanced, setShowEnhanced] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Don't render if not open
  if (!isOpen) return null;

  const availableTags = [
    'Spicy', 'Sweet', 'Savory', 'Crispy', 'Creamy', 'Fresh',
    'Trending', 'Must-try', 'Healthy', 'Authentic'
  ];

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

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

  const enhanceComment = () => {
    if (comment.trim().length < 10) return;
    const enhanced = `This dish (${dishName}) was a delightful experience. ${comment}. 
    It had ${selectedTags.join(', ').toLowerCase()} qualities with ${spiceLevel} spice 
    and ${portionSize} portion size. ${
      wouldRecommend ? 'Highly recommended!' : 'Might not suit everyone.'
    }`;
    setEnhancedComment(enhanced);
    setShowEnhanced(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    if (comment.trim().length < 20) {
      setError('Review must be at least 20 characters');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const reviewData = {
        dishId: dish?.id,
        dishName: dishName || dish?.name,
        reviewText: showEnhanced ? enhancedComment : comment.trim(),
        rating,
        photoFile: images[0] || null,
        extra: { tags: selectedTags, spiceLevel, portionSize, wouldRecommend }
      };
      
      // Use the callback instead of direct API call
      onSubmitReview(reviewData);
      onClose();
    } catch {
      setError('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Share Your Experience</h2>
          <button onClick={onClose}><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dish name */}
          <input
            type="text"
            placeholder="Dish name"
            value={dishName}
            onChange={(e) => setDishName(e.target.value)}
            required
            className="w-full border px-3 py-2 rounded-lg"
          />

          {/* Rating */}
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map(star => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`p-2 rounded-full ${star <= rating ? 'bg-yellow-200' : 'bg-gray-100'}`}
              >
                <Star className={`w-6 h-6 ${star <= rating ? 'text-yellow-500 fill-current' : 'text-gray-400'}`} />
              </button>
            ))}
          </div>

          {/* Review */}
          <textarea
            placeholder="Write your review (min 20 characters)..."
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="w-full border px-3 py-2 rounded-lg"
          />

          {comment.length >= 20 && (
            <button
              type="button"
              onClick={enhanceComment}
              className="flex items-center text-purple-600 text-sm"
            >
              <Sparkles className="w-4 h-4 mr-1" /> Enhance with AI
            </button>
          )}

          {showEnhanced && (
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-sm">{enhancedComment}</p>
              <button
                type="button"
                onClick={() => setShowEnhanced(false)}
                className="text-xs text-purple-600 mt-2"
              >
                Use Original
              </button>
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {availableTags.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedTags.includes(tag)
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Tag className="w-3 h-3 inline mr-1" /> {tag}
              </button>
            ))}
          </div>

          {/* Extra options */}
          <div className="grid grid-cols-2 gap-4">
            <select value={spiceLevel} onChange={(e) => setSpiceLevel(e.target.value as any)}>
              <option value="mild">Mild</option>
              <option value="medium">Medium</option>
              <option value="hot">Hot</option>
              <option value="extra-hot">Extra Hot</option>
            </select>
            <select value={portionSize} onChange={(e) => setPortionSize(e.target.value as any)}>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>

          {/* Recommend */}
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={wouldRecommend}
              onChange={(e) => setWouldRecommend(e.target.checked)}
            />
            <span>I would recommend this dish</span>
            <ThumbsUp className="w-4 h-4 text-green-500" />
          </label>

          {/* Photos */}
          <input type="file" multiple accept="image/*" onChange={handleImageUpload} />
          {images.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {images.map((file, i) => (
                <div key={i} className="relative">
                  <img src={URL.createObjectURL(file)} alt="preview" className="rounded-lg" />
                  <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {error && <p className="text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-orange-500 text-white py-3 rounded-lg font-bold"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      </div>
    </div>
  );
}
