import React, { useState } from 'react';
import { Heart, MessageSquare, Share2, ThumbsUp, Flag, User, Award, Camera } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { Review } from '../types/types';

interface SocialFeaturesProps {
  review: Review;
  onLike: (reviewId: string) => void;
  onHelpful: (reviewId: string) => void;
  onShare: (reviewId: string) => void;
  onReport: (reviewId: string) => void;
}

export const SocialFeatures: React.FC<SocialFeaturesProps> = ({
  review,
  onLike,
  onHelpful,
  onShare,
  onReport
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isHelpful, setIsHelpful] = useState(false);
  const { user } = useAuth();

  const handleLike = () => {
    if (!user) return;
    setIsLiked(!isLiked);
    onLike(review.id);
  };

  const handleHelpful = () => {
    if (!user) return;
    setIsHelpful(!isHelpful);
    onHelpful(review.id);
  };

  return (
    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
      <div className="flex items-center space-x-4">
        <button
          onClick={handleLike}
          className={`flex items-center space-x-1 transition-colors ${
            isLiked ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
          }`}
        >
          <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} />
          <span className="text-sm">{review.likes + (isLiked ? 1 : 0)}</span>
        </button>

        <button
          onClick={handleHelpful}
          className={`flex items-center space-x-1 transition-colors ${
            isHelpful ? 'text-green-500' : 'text-gray-500 hover:text-green-500'
          }`}
        >
          <ThumbsUp className={`w-4 h-4 ${isHelpful ? 'fill-current' : ''}`} />
          <span className="text-sm">{review.helpful + (isHelpful ? 1 : 0)} helpful</span>
        </button>

        <button
          onClick={() => onShare(review.id)}
          className="flex items-center space-x-1 text-gray-500 hover:text-blue-500 transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span className="text-sm">Share</span>
        </button>
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => onReport(review.id)}
          className="text-gray-400 hover:text-red-500 transition-colors"
        >
          <Flag className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

export const UserBadge: React.FC<{ 
  user: { name: string; trustScore: number; reviewCount: number; verified: boolean; photosUploaded: number } 
}> = ({ user }) => {
  const getBadgeLevel = (trustScore: number, reviewCount: number) => {
    if (trustScore >= 90 && reviewCount >= 50) return { level: 'Expert', color: 'text-purple-600', bg: 'bg-purple-100' };
    if (trustScore >= 80 && reviewCount >= 25) return { level: 'Trusted', color: 'text-green-600', bg: 'bg-green-100' };
    if (trustScore >= 70 && reviewCount >= 10) return { level: 'Reliable', color: 'text-blue-600', bg: 'bg-blue-100' };
    if (reviewCount >= 5) return { level: 'Active', color: 'text-orange-600', bg: 'bg-orange-100' };
    return { level: 'New', color: 'text-gray-600', bg: 'bg-gray-100' };
  };

  const badge = getBadgeLevel(user.trustScore, user.reviewCount);

  return (
    <div className="flex items-center space-x-2">
      <div className="w-8 h-8 bg-gradient-to-r from-orange-400 to-red-400 rounded-full flex items-center justify-center">
        <User className="w-4 h-4 text-white" />
      </div>
      <div>
        <div className="flex items-center space-x-2">
          <span className="font-medium text-gray-900">{user.name}</span>
          {user.verified && (
            <Award className="w-4 h-4 text-green-500" />
          )}
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.color}`}>
            {badge.level}
          </div>
        </div>
        <div className="flex items-center space-x-3 text-xs text-gray-500">
          <span>{user.reviewCount} reviews</span>
          <span>{user.photosUploaded} photos</span>
          <span>Trust: {user.trustScore}</span>
        </div>
      </div>
    </div>
  );
};

export const PhotoGallery: React.FC<{ images: string[]; dishName: string }> = ({ images, dishName }) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  if (!images || images.length === 0) return null;

  return (
    <>
      <div className="mb-4">
        <div className="flex space-x-2 overflow-x-auto">
          {images.map((image, index) => (
            <img
              key={index}
              src={image}
              alt={`${dishName} photo ${index + 1}`}
              className="w-24 h-24 object-cover rounded-lg flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => setSelectedImage(image)}
            />
          ))}
        </div>
      </div>

      {selectedImage && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <img
            src={selectedImage}
            alt={dishName}
            className="max-w-full max-h-full object-contain rounded-lg"
          />
        </div>
      )}
    </>
  );
};