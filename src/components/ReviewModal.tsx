import React, { useState } from "react";
import { X } from "lucide-react";
import type { Dish, ReviewPost } from "../types/types";

interface ReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  dish: Dish | null;
  onSubmitReview: (reviewData: ReviewPost) => Promise<boolean>;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
  isOpen,
  onClose,
  dish,
  onSubmitReview,
}) => {
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim() || !rating || !dish) {
      setError("Please provide both text and rating.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const reviewData: ReviewPost = {
        dishId: dish.id,
        rating,
        comment: reviewText.trim(),
        dishName: dish.name,
        restaurantName: dish.restaurant.name,
      };

      const success = await onSubmitReview(reviewData);
      if (success) {
        // Reset form
        setReviewText("");
        setRating(null);
        onClose();
      } else {
        setError("Failed to submit review. Please try again.");
      }
    } catch (err: any) {
      console.error("Review submission failed:", err);
      setError("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !dish) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Write a Review</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-4">
          <div className="mb-4">
            <h3 className="font-medium text-gray-900">{dish.name}</h3>
            <p className="text-sm text-gray-600">{dish.restaurant.name}</p>
          </div>

          <form onSubmit={handleSubmit}>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded">{error}</div>}
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rating *
              </label>
              <div className="flex space-x-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-lg transition-colors ${
                      rating && star <= rating
                        ? "bg-yellow-100 text-yellow-600"
                        : "bg-gray-100 text-gray-400 hover:bg-yellow-50"
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Review *
              </label>
              <textarea
                className="w-full border border-gray-300 rounded-lg p-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                rows={4}
                value={reviewText}
                onChange={(e) => setReviewText(e.target.value)}
                placeholder="Share your experience with this dish..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Review"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export { ReviewModal };
