import { auth, db, storage } from './firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { addDoc, collection, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { ReviewPost } from '../types/types';

const DEFAULT_AVATAR = 'https://placehold.co/64x64/FF5733/FFFFFF?text=U';

export const postReview = async (review: ReviewPost) => {
  // Check authentication first
  if (!auth.currentUser) {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }

  const user = auth.currentUser;
  if (!user) {
    throw new Error('Authentication failed. Please try again.');
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

  // Handle photo upload if provided
  let photoURL: string | null = null;
  if (review.photoFile) {
    const storageRef = ref(storage, `reviews/${user.uid}/${Date.now()}_${review.photoFile.name}`);
    await uploadBytes(storageRef, review.photoFile);
    photoURL = await getDownloadURL(storageRef);
  }

  // Create review document with all required fields
  const reviewDoc = {
    restaurantId: review.restaurantId,
    dishName: review.dishName,
    reviewText: review.reviewText,
    rating: review.rating,
    tags: review.tags || [],
    recommendation: review.extra?.wouldRecommend || false,
    photoURL,
    createdAt: serverTimestamp(),
    userId: user.uid,
    // Additional fields for compatibility and completeness
    userName: user.displayName || 'Anonymous User',
    userEmail: user.email || '',
    userAvatar: user.photoURL || DEFAULT_AVATAR,
    spiceLevel: review.extra?.spiceLevel || 'medium',
    portionSize: review.extra?.portionSize || 'medium'
  };

  // Save to reviews collection as specified in requirements
  await addDoc(collection(db, 'reviews'), reviewDoc);
};
