import { auth, db, storage } from './firebase';
import { addDoc, collection, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const DEFAULT_AVATAR = 'https://placehold.co/64x64/FF5733/FFFFFF?text=U';

interface ReviewSubmission {
  restaurantId: string;
  dishName: string;
  reviewText: string;
  rating: number;
  photoFile?: File | null;
  extra?: {
    tags: string[];
    spiceLevel: 'mild' | 'medium' | 'hot' | 'extra-hot';
    portionSize: 'small' | 'medium' | 'large';
    wouldRecommend: boolean;
  };
}

export const postReview = async (review: ReviewSubmission): Promise<void> => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in to submit a review. Please sign in and try again.');
  }

  // Ensure users/{uid} doc exists for profile
  const uref = doc(db, 'users', user.uid);
  const usnap = await getDoc(uref);
  if (!usnap.exists()) {
    await setDoc(uref, {
      name: user.displayName || 'Anonymous User',
      email: user.email || '',
      photoURL: user.photoURL || DEFAULT_AVATAR,
      createdAt: serverTimestamp(),
      preferences: { cuisines: [], spiceLevel: '', budgetRange: '' }
    });
  }

  let photoURL: string | null = null;
  if (review.photoFile) {
    try {
      const timestamp = Date.now();
      const fileName = `${timestamp}_${review.photoFile.name}`;
      const storageRef = ref(storage, `reviews/${user.uid}/${fileName}`);
      await uploadBytes(storageRef, review.photoFile);
      photoURL = await getDownloadURL(storageRef);
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      // Continue without image rather than failing the whole submission
      photoURL = null;
    }
  }

  const reviewDoc = {
    userId: user.uid,
    userName: user.displayName || 'Anonymous User',
    userEmail: user.email || '',
    userAvatar: user.photoURL || DEFAULT_AVATAR,
    restaurantId: review.restaurantId,
    dishName: review.dishName.trim(),
    reviewText: review.reviewText.trim(),
    rating: review.rating,
    photoURL,
    tags: review.extra?.tags || [],
    spiceLevel: review.extra?.spiceLevel || 'medium',
    portionSize: review.extra?.portionSize || 'medium',
    wouldRecommend: review.extra?.wouldRecommend ?? true,
    createdAt: serverTimestamp()
  };

  try {
    // Save in the "reviews" collection as requested
    await addDoc(collection(db, 'reviews'), reviewDoc);
  } catch (error) {
    console.error('❌ Error saving review to Firestore:', error);
    // Re-throw with more specific error message
    if (error instanceof Error) {
      throw new Error(`Failed to save review: ${error.message}`);
    }
    throw new Error('Failed to save review. Please check your internet connection and try again.');
  }
};
