import { db } from './firebase';
import { collection, doc, getDoc, getDocs, query, where, addDoc, setDoc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';

export interface EnsureDishParams {
  name: string;
  restaurantName?: string;
  location?: string;
  cuisine?: string;
  photoURL?: string;
}

export interface DishDoc {
  name: string;
  restaurantName?: string;
  location?: string;
  cuisine?: string;
  rating?: number;
  reviewCount?: number;
  photoURL?: string;
  createdAt: any;
  updatedAt: any;
  tags?: string[];
}

export interface ReviewForDish {
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  photos?: string[];
  trustScore?: number;
}

export async function ensureDishAndGetId(params: EnsureDishParams): Promise<string> {
  const dishesRef = collection(db, 'dishes');
  // Simple uniqueness by name+restaurant+location
  const q = query(
    dishesRef,
    where('name', '==', params.name),
    where('restaurantName', '==', params.restaurantName || ''),
    where('location', '==', params.location || '')
  );
  const snap = await getDocs(q);
  if (!snap.empty) {
    return snap.docs[0].id;
  }
  const dish: DishDoc = {
    name: params.name,
    restaurantName: params.restaurantName || '',
    location: params.location || '',
    cuisine: params.cuisine || '',
    rating: 0,
    reviewCount: 0,
    photoURL: params.photoURL,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    tags: []
  };
  const newDoc = await addDoc(dishesRef, dish);
  return newDoc.id;
}

export async function addReviewUnderDish(dishId: string, review: ReviewForDish): Promise<void> {
  const reviewsRef = collection(db, `dishes/${dishId}/reviews`);
  await addDoc(reviewsRef, {
    ...review,
    createdAt: serverTimestamp()
  });
  // Update aggregates conservatively (requires additional read to compute avg) - here we increment count only
  const dishRef = doc(db, 'dishes', dishId);
  await updateDoc(dishRef, {
    reviewCount: increment(1),
    updatedAt: serverTimestamp()
  }).catch(async () => {
    // If missing, set baseline
    await setDoc(dishRef, { reviewCount: 1, updatedAt: serverTimestamp() }, { merge: true });
  });
}

