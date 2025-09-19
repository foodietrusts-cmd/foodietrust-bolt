import { auth, db, storage } from './firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface ReviewPost {
  restaurantId: string;
  dishName: string;        // ✅ added
  reviewText: string;
  rating: number;          // ✅ added
  photoFile: File | null;
}

export const postReview = async ({ restaurantId, dishName, reviewText, rating, photoFile }: ReviewPost) => {
  if (!auth.currentUser) {
    // If the user is not logged in, sign in with Google
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }

  const user = auth.currentUser;
  if (!user) {
    throw new Error('Authentication failed. Please try again.');
  }

  // ✅ Upload photo if provided
  let photoURL = null;
  if (photoFile) {
    const storageRef = ref(storage, `reviews/${user.uid}/${photoFile.name}`);
    await uploadBytes(storageRef, photoFile);
    photoURL = await getDownloadURL(storageRef);
  }

  // ✅ Full review data
  const reviewData = {
    userId: user.uid,
    userName: user.displayName || 'Food Lover',
    userEmail: user.email || 'unknown@example.com',
    userPhoto: user.photoURL || null,
    restaurantId,
    dishName,
    reviewText,
    rating,
    photoURL,
    createdAt: serverTimestamp(),
  };

  // ✅ Save inside restaurant subcollection
  await addDoc(collection(db, `restaurants/${restaurantId}/reviews`), reviewData);

  // ✅ Also save in global "reviews" collection
  await addDoc(collection(db, 'reviews'), reviewData);

  console.log('✅ Review posted successfully with full user details');
};
