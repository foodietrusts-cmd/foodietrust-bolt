import { auth, db, storage } from './firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Assume this type comes from your project's types folder
interface ReviewPost {
  restaurantId: string;
  reviewText: string;
  photoFile: File | null;
}

export const postReview = async ({ restaurantId, reviewText, photoFile }: ReviewPost) => {
  if (!auth.currentUser) {
    // If the user is not logged in, prompt them to sign in
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  }

  const user = auth.currentUser;
  if (!user) {
    throw new Error('Authentication failed. Please try again.');
  }

  let photoURL = null;
  if (photoFile) {
    const storageRef = ref(storage, `reviews/${user.uid}/${photoFile.name}`);
    await uploadBytes(storageRef, photoFile);
    photoURL = await getDownloadURL(storageRef);
  }

  await addDoc(collection(db, `restaurants/${restaurantId}/reviews`), {
    userId: user.uid,
    userName: user.displayName || 'Anonymous',
    userPhoto: user.photoURL || null,
    reviewText: reviewText,
    photoURL: photoURL,
    createdAt: serverTimestamp(),
  });
};
