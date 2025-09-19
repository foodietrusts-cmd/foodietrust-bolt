import { auth, db, storage } from './firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { addDoc, collection, serverTimestamp, doc, getDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import type { ReviewPost } from '../types/types';

const DEFAULT_AVATAR = 'https://placehold.co/64x64/FF5733/FFFFFF?text=U';

export const postReview = async (review: ReviewPost) => {
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

  let photoURL: string | null = null;
  const firstImage = (review.images && review.images[0]) || undefined;
  if (firstImage) {
    const storageRef = ref(storage, `reviews/${user.uid}/${firstImage.name}`);
    await uploadBytes(storageRef, firstImage);
    photoURL = await getDownloadURL(storageRef);
  }

  const reviewDoc = {
    userId: user.uid,
    userName: user.displayName || 'Anonymous User',
    userEmail: user.email || '',
    userAvatar: user.photoURL || DEFAULT_AVATAR,
    dishName: review.dishName || '',
    restaurantName: review.restaurantName || '',
    rating: review.rating || 0,
    comment: review.comment,
    photoURL,
    createdAt: serverTimestamp()
  };

  // Save in top-level reviews for feed
  await addDoc(collection(db, 'reviews'), reviewDoc);

  // Also attach to a dish subcollection if dishId provided
  if (review.dishId) {
    await addDoc(collection(db, `dishes/${review.dishId}/reviews`), reviewDoc);
  }
};
