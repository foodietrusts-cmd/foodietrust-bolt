import React, { useState } from "react";
import { db } from "../lib/firebase";
import { doc, updateDoc, arrayUnion, serverTimestamp } from "firebase/firestore";

interface ReviewModalProps {
  restaurantId: string;
  user: { uid: string };
  onClose: () => void;
  refreshRestaurant: () => Promise<void>;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  restaurantId,
  user,
  onClose,
  refreshRestaurant,
}) => {
  const [reviewText, setReviewText] = useState("");
  const [rating, setRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewText.trim() || !rating) {
      setError("Please provide both text and rating.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const restaurantRef = doc(db, "restaurants", restaurantId);

      const reviewData = {
        text: reviewText.trim(),
        rating,
        userId: user.uid,
        createdAt: serverTimestamp(),
      };

      await updateDoc(restaurantRef, {
        reviews: arrayUnion(reviewData),
      });

      await refreshRestaurant(); // ✅ refresh details
      onClose(); // ✅ close modal
    } catch (err: any) {
      console.error("Review submission failed:", err);
      setError("Failed to submit review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal">
      <form onSubmit={handleSubmit}>
        {error && <p className="text-red-500">{error}</p>}
        <textarea
          className="w-full border p-2"
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          placeholder="Write your review..."
        />
        <input
          type="number"
          min={1}
          max={5}
          value={rating ?? ""}
          onChange={(e) => setRating(Number(e.target.value))}
          className="border p-2 mt-2"
          placeholder="Rating (1-5)"
        />
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 mt-4 rounded"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Submitting..." : "Submit Review"}
        </button>
      </form>
    </div>
  );
};
