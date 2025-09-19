import { db, isFirebaseConfigured } from './firebase';
import { collection, getDocs, query, orderBy, where, limit, addDoc } from 'firebase/firestore';
import type { Dish, Review } from '../types/types';

export const searchDishesInFirebase = async (searchQuery: string, location?: string): Promise<Dish[]> => {
  try {
    if (!isFirebaseConfigured || !db) {
      // Return mock search results for development
      const mockDishes: Dish[] = [
        {
          id: 'firebase-dish-1',
          name: 'Chettinad Chicken',
          description: 'Spicy and aromatic chicken curry from Tamil Nadu with roasted spices',
          image: 'https://placehold.co/400x300/FF5733/FFFFFF?text=Chettinad+Chicken',
          price: 280,
          cuisine: 'South Indian',
          category: 'Main Course',
          restaurant: {
            id: 'rest-1',
            name: 'Anjappar Chettinad',
            location: 'Chennai'
          },
          averageRating: 4.5,
          reviewCount: 45,
          tags: ['Spicy', 'Authentic', 'Traditional'],
          trustScore: 88,
          photoCount: 12,
          reviews: [],
          credibilityScore: 85,
          trendingScore: 75,
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'firebase-dish-2',
          name: 'Filter Coffee',
          description: 'Traditional South Indian filter coffee with perfect blend of coffee and chicory',
          image: 'https://placehold.co/400x300/8B4513/FFFFFF?text=Filter+Coffee',
          price: 45,
          cuisine: 'South Indian',
          category: 'Beverages',
          restaurant: {
            id: 'rest-2',
            name: 'Murugan Idli Shop',
            location: 'Chennai'
          },
          averageRating: 4.8,
          reviewCount: 123,
          tags: ['Authentic', 'Traditional', 'Aromatic'],
          trustScore: 92,
          photoCount: 8,
          reviews: [],
          credibilityScore: 90,
          trendingScore: 95,
          lastUpdated: new Date().toISOString()
        }
      ];
      
      // Filter mock dishes based on search query
      if (searchQuery.trim()) {
        const searchLower = searchQuery.toLowerCase();
        return mockDishes.filter(dish => 
          dish.name.toLowerCase().includes(searchLower) ||
          dish.description.toLowerCase().includes(searchLower) ||
          dish.cuisine.toLowerCase().includes(searchLower) ||
          dish.restaurant.name.toLowerCase().includes(searchLower) ||
          dish.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }
      
      return mockDishes;
    }
    const dishesRef = collection(db, 'dishes');
    let q = query(dishesRef, orderBy('name'), limit(50));

    // If we have a location filter, add it
    if (location) {
      q = query(dishesRef, where('restaurant.location', '==', location), orderBy('name'), limit(50));
    }

    const snapshot = await getDocs(q);
    const allDishes: Dish[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || '',
        description: data.description || '',
        image: data.image || 'https://placehold.co/400x300/FF5733/FFFFFF?text=Food',
        price: Number(data.price) || 0,
        cuisine: data.cuisine || 'Unknown',
        category: data.category || 'Unknown',
        restaurant: {
          id: data.restaurant?.id || '',
          name: data.restaurant?.name || 'Unknown Restaurant',
          location: data.restaurant?.location || 'Unknown Location'
        },
        averageRating: Number(data.averageRating) || 0,
        reviewCount: Number(data.reviewCount) || 0,
        tags: Array.isArray(data.tags) ? data.tags : [],
        trustScore: Number(data.trustScore) || 80,
        photoCount: Number(data.photoCount) || 0,
        reviews: [], // Will be populated separately if needed
        credibilityScore: Number(data.credibilityScore) || 80,
        trendingScore: Number(data.trendingScore) || 50,
        lastUpdated: data.lastUpdated || new Date().toISOString()
      };
    });

    // Filter dishes based on search query
    if (searchQuery.trim()) {
      const searchLower = searchQuery.toLowerCase();
      return allDishes.filter(dish => 
        dish.name.toLowerCase().includes(searchLower) ||
        dish.description.toLowerCase().includes(searchLower) ||
        dish.cuisine.toLowerCase().includes(searchLower) ||
        dish.restaurant.name.toLowerCase().includes(searchLower) ||
        dish.restaurant.location.toLowerCase().includes(searchLower) ||
        dish.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    return allDishes;
  } catch (error) {
    console.error('Error searching dishes in Firebase:', error);
    return [];
  }
};

export const getDishReviews = async (dishId: string): Promise<Review[]> => {
  try {
    const reviewsRef = collection(db, `dishes/${dishId}/reviews`);
    const q = query(reviewsRef, orderBy('timestamp', 'desc'));
    const snapshot = await getDocs(q);
    
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      const ts = data.timestamp?.toDate ? data.timestamp.toDate() : new Date();
      return {
        id: doc.id,
        userId: data.userId || '',
        userName: data.userName || 'Anonymous',
        userEmail: data.userEmail || '',
        userAvatar: data.userAvatar || '',
        dishName: data.dishName || '',
        restaurantName: data.restaurantName || '',
        rating: Number(data.rating) || 0,
        comment: data.comment || '',
        enhancedComment: data.enhancedComment,
        trustScore: Number(data.trustScore) || 80,
        date: ts.toISOString(),
        images: Array.isArray(data.images) ? data.images : [],
        helpful: Number(data.helpful) || 0,
        verified: Boolean(data.verified),
        userTrustScore: Number(data.userTrustScore) || 80,
        likes: Number(data.likes) || 0,
        isHelpful: Boolean(data.isHelpful) || false,
        tags: Array.isArray(data.tags) ? data.tags : [],
        dishType: data.dishType || 'unknown',
        spiceLevel: data.spiceLevel,
        portionSize: data.portionSize,
        textureNotes: data.textureNotes,
        aromaNotes: data.aromaNotes,
        visualAppeal: Number(data.visualAppeal) || 0,
        wouldRecommend: Boolean(data.wouldRecommend) || false,
      };
    });
  } catch (error) {
    console.error('Error fetching dish reviews:', error);
    return [];
  }
};

export const createDishFromReview = async (reviewData: any): Promise<string> => {
  try {
    // Check if dish already exists
    const dishesRef = collection(db, 'dishes');
    const q = query(
      dishesRef, 
      where('name', '==', reviewData.dishName),
      where('restaurant.name', '==', reviewData.restaurantName)
    );
    const existingDishes = await getDocs(q);
    
    if (!existingDishes.empty) {
      return existingDishes.docs[0].id;
    }

    // Create new dish entry
    const newDish = {
      name: reviewData.dishName,
      description: `Delicious ${reviewData.dishName} from ${reviewData.restaurantName}`,
      image: 'https://placehold.co/400x300/FF5733/FFFFFF?text=Food',
      price: 0, // Will be updated later
      cuisine: 'Indian', // Default for Chennai
      category: 'Main Course', // Default
      restaurant: {
        id: `restaurant_${Date.now()}`,
        name: reviewData.restaurantName,
        location: reviewData.location || 'Chennai'
      },
      averageRating: reviewData.rating,
      reviewCount: 1,
      tags: reviewData.tags || [],
      trustScore: 80,
      photoCount: reviewData.images ? reviewData.images.length : 0,
      credibilityScore: 80,
      trendingScore: 50,
      lastUpdated: new Date().toISOString()
    };

    const docRef = await addDoc(collection(db, 'dishes'), newDish);
    return docRef.id;
  } catch (error) {
    console.error('Error creating dish from review:', error);
    throw error;
  }
};