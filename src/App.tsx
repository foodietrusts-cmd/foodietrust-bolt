import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, User, signInAnonymously, signInWithCustomToken, signOut } from "firebase/auth";
import { getFirestore, collection, onSnapshot, addDoc, serverTimestamp, setLogLevel, Timestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

// Define the Dish and Review types for clarity
interface Dish {
  id: string;
  name: string;
  photoURL: string;
}

interface Review {
  id: string;
  userId: string;
  userName: string;
  userPhoto: string | null;
  reviewText: string;
  photoURL: string | null;
  createdAt: Timestamp | null;
}

const App = () => {
  const [dishes, setDishes] = useState<any[]>([]);
  const [selectedDish, setSelectedDish] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isMapScriptLoaded, setIsMapScriptLoaded] = useState(false);
  const mapRef = useRef<HTMLDivElement | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const restaurantId = "sample-restaurant-123";
  const restaurantLocation = { lat: 34.052235, lng: -118.243683 };
  const googleMapsApiKey = "YOUR_GOOGLE_MAPS_API_KEY_HERE";

  // Initialize Firebase
  const firebaseConfig = typeof (window as any).__firebase_config !== 'undefined' ? JSON.parse((window as any).__firebase_config) : {};
  const app = initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const storage = getStorage(app);

  // Enable Firestore debug logging
  useEffect(() => {
    setLogLevel('debug');
  }, []);
  
  // Auth State Listener and Initial Sign-in
  useEffect(() => {
    const initialAuthToken = typeof (window as any).__initial_auth_token !== 'undefined' ? (window as any).__initial_auth_token : null;
    let isInitialSignInAttempted = false; // Flag to prevent multiple sign-ins

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      console.log("Auth state changed. Current user:", currentUser?.uid);
      setUser(currentUser);
      
      // This logic only runs once on initial app load if no user is authenticated
      if (!currentUser && !isInitialSignInAttempted) {
        isInitialSignInAttempted = true;
        try {
          if (initialAuthToken) {
            await signInWithCustomToken(auth, initialAuthToken);
          } else {
            await signInAnonymously(auth);
          }
        } catch (e) {
          console.error("Initial authentication failed:", e);
        }
      }
      
      // Mark auth as ready only after the first state change
      if (currentUser) {
        setIsAuthReady(true);
      } else if (isInitialSignInAttempted) {
        setIsAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, [auth]);

  // Data Listeners dependent on authentication readiness
  useEffect(() => {
    if (!isAuthReady) {
      console.log("Waiting for authentication to be ready before fetching data.");
      return;
    }

    // Dishes Data Listener
    const dishesRef = collection(db, `artifacts/${(window as any).__app_id}/public/data/dishes`);
    const unsubscribeDishes = onSnapshot(dishesRef, (snapshot) => {
      console.log("Dishes data received.");
      const fetchedDishes: any[] = [];
      snapshot.forEach((doc) => {
        fetchedDishes.push({ id: doc.id, ...doc.data() });
      });
      setDishes(fetchedDishes);
      if (fetchedDishes.length > 0) {
        setSelectedDish(fetchedDishes[0]);
      }
    }, (error) => {
      console.error("Error fetching dishes:", error);
    });
    
    // Reviews Data Listener
    const reviewsRef = collection(db, `artifacts/${(window as any).__app_id}/public/data/restaurants/${restaurantId}/reviews`);
    const unsubscribeReviews = onSnapshot(reviewsRef, (snapshot) => {
      console.log("Reviews data received.");
      const fetchedReviews: any[] = [];
      snapshot.forEach((doc) => {
        fetchedReviews.push({ id: doc.id, ...doc.data() });
      });
      setReviews(fetchedReviews);
    }, (error) => {
      console.error("Error fetching reviews:", error);
    });

    return () => {
      unsubscribeDishes();
      unsubscribeReviews();
    };
  }, [isAuthReady, db, restaurantId]); // Depend on authentication readiness and db

  // Google Maps Script Loader
  useEffect(() => {
    if (googleMapsApiKey && googleMapsApiKey !== "YOUR_GOOGLE_MAPS_API_KEY_HERE" && typeof (window as any).google === "undefined") {
      try {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}&libraries=maps`;
        script.async = true;
        script.onload = () => {
          console.log("Google Maps script loaded successfully.");
          setIsMapScriptLoaded(true);
        };
        document.head.appendChild(script);

        return () => {
          document.head.removeChild(script);
        };
      } catch (error) {
        console.error("Failed to load Google Maps script:", error);
      }
    } else {
      console.warn("Please replace 'YOUR_GOOGLE_MAPS_API_KEY_HERE' with a valid API key to enable the map.");
    }
  }, [googleMapsApiKey]);

  // Renders the Google Map
  useEffect(() => {
    if (isMapScriptLoaded && mapRef.current && (window as any).google && (window as any).google.maps) {
      console.log("Rendering Google Map.");
      const map = new (window as any).google.maps.Map(mapRef.current, {
        center: restaurantLocation,
        zoom: 15,
        mapId: "DEMO_MAP_ID",
      });

      new (window as any).google.maps.Marker({
        position: restaurantLocation,
        map: map,
      });
    }
  }, [isMapScriptLoaded, selectedDish, restaurantLocation]);
  
  const handleLogin = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      setUser(result.user); // Explicitly update the state after successful login
      setError(null);
    } catch (e) {
      setError('Failed to log in. Please try again.');
      console.error(e);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setError(null);
    } catch (e) {
      setError('Failed to log out. Please try again.');
      console.error(e);
    }
  };

  const handlePostReview = async () => {
    if (!user || (user as any).isAnonymous) {
      setError('You must be logged in to post a review.');
      return;
    }
    if (!reviewText.trim()) {
      setError('Review text cannot be empty.');
      return;
    }
    setIsLoading(true);
    setError(null);

    try {
      let photoURL: string | null = null;
      if (photoFile) {
        const storageRef = ref(storage, `artifacts/${(window as any).__app_id}/public/data/reviews/${(user as any).uid}/${photoFile.name}`);
        await uploadBytes(storageRef, photoFile);
        photoURL = await getDownloadURL(storageRef);
      }
      
      const reviewData = {
        userId: (user as any).uid,
        userName: (user as any).displayName || 'Anonymous User',
        userPhoto: (user as any).photoURL || null,
        reviewText: reviewText,
        photoURL: photoURL,
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, `artifacts/${(window as any).__app_id}/public/data/restaurants/${restaurantId}/reviews`), reviewData);

      setReviewText('');
      setPhotoFile(null);
      setIsModalOpen(false);
    } catch (e) {
      setError('Failed to post review. Please try again.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const getDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${restaurantLocation.lat},${restaurantLocation.lng}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">FoodieTrusts</h1>
        {user && !(user as any).isAnonymous && (
          <div className="flex items-center space-x-2">
            <span className="text-gray-700 font-medium">Welcome, {(user as any).displayName}</span>
            <button onClick={() => setIsProfileModalOpen(true)}>
              <img
                src={(user as any).photoURL || `https://placehold.co/40x40/FF5733/white?text=${(user as any).displayName?.charAt(0) || 'U'}`}
                alt="Profile"
                className="w-10 h-10 rounded-full cursor-pointer"
              />
            </button>
            <button
              onClick={handleLogout}
              className="bg-gray-200 text-gray-700 text-sm px-3 py-1 rounded-full hover:bg-gray-300 transition-colors duration-200"
            >
              Log Out
            </button>
          </div>
        )}
      </header>

      <main className="container mx-auto p-4 max-w-4xl">
        {!isAuthReady ? (
          <div className="flex justify-center items-center h-screen">
            <p className="text-gray-500 text-lg">Initializing app...</p>
          </div>
        ) : (
          selectedDish ? (
            <>
              <div className="bg-white rounded-xl shadow-lg p-6 my-6">
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2">{(selectedDish as any).name}</h2>
                {(selectedDish as any).photoURL && (
                  <img src={(selectedDish as any).photoURL} alt={(selectedDish as any).name} className="w-full rounded-md object-cover my-4" />
                )}
                <p className="text-gray-600">Delicious food and a great atmosphere.</p>
              </div>

              <section className="bg-white rounded-xl shadow-lg p-6 my-6">
                <h3 className="text-lg font-semibold mb-4">User Reviews</h3>
                <button
                  onClick={() => setIsModalOpen(true)}
                  className="bg-purple-500 text-white px-4 py-2 rounded-full hover:bg-purple-600 transition-colors duration-200 mb-4"
                >
                  Post Your Review
                </button>
                {isModalOpen && (
                  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
                      <h2 className="text-xl font-bold mb-4">Post a Review</h2>
                      {!user || (user as any).isAnonymous ? (
                        <div className="text-center">
                          <p className="mb-4">Please log in to post a review.</p>
                          <button
                            onClick={handleLogin}
                            className="bg-blue-500 text-white px-4 py-2 rounded-full hover:bg-blue-600 transition-colors duration-200"
                          >
                            Sign in with Google
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p className="mb-2">Logged in as: {(user as any).displayName || 'Anonymous User'}</p>
                          <textarea
                            className="w-full p-2 border rounded-md mb-4"
                            rows={4}
                            placeholder="Write your review here..."
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                          ></textarea>
                          <div className="mb-4">
                            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="photo-upload">
                              Optional Photo:
                            </label>
                            <input
                              type="file"
                              id="photo-upload"
                              onChange={(e) => setPhotoFile(e.target.files?.[0] || null)}
                            />
                          </div>
                          {error && <p className="text-red-500 mb-4">{error}</p>}
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={() => setIsModalOpen(false)}
                              className="bg-gray-300 text-gray-800 px-4 py-2 rounded-full hover:bg-gray-400 transition-colors duration-200"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handlePostReview}
                              disabled={isLoading}
                              className="bg-green-500 text-white px-4 py-2 rounded-full hover:bg-green-600 transition-colors duration-200 disabled:opacity-50"
                            >
                              {isLoading ? 'Posting...' : 'Post Review'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review: any) => (
                      <div key={review.id} className="bg-gray-100 p-4 rounded-lg shadow-sm">
                        <div className="flex items-center space-x-3 mb-2">
                          {review.userPhoto && (
                            <img src={review.userPhoto} alt={review.userName || 'User'} className="w-8 h-8 rounded-full" />
                          )}
                          <span className="font-medium">{review.userName || 'Anonymous'}</span>
                        </div>
                        <p className="text-gray-800">{review.reviewText}</p>
                        {review.photoURL && (
                          <img src={review.photoURL} alt="Review Photo" className="mt-4 rounded-md object-cover max-h-64 w-full" />
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No reviews yet. Be the first to leave one!</p>
                )}
              </section>

              <section className="bg-white rounded-xl shadow-lg p-6 my-6">
                <div className="flex justify-center space-x-4">
                  <a href="https://www.swiggy.com" target="_blank" rel="noopener noreferrer">
                    <button className="bg-orange-500 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-orange-600 transition-colors duration-200">
                      Order on Swiggy
                    </button>
                  </a>
                  <a href="https://www.zomato.com" target="_blank" rel="noopener noreferrer">
                    <button className="bg-red-500 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-red-600 transition-colors duration-200">
                      Order on Zomato
                    </button>
                  </a>
                  <a href="https://www.ubereats.com" target="_blank" rel="noopener noreferrer">
                    <button className="bg-green-500 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-green-600 transition-colors duration-200">
                      Order on UberEats
                    </button>
                  </a>
                </div>
              </section>

              <section className="bg-white rounded-xl shadow-lg p-6 my-6">
                <div className="flex flex-col items-center">
                  <h3 className="text-xl font-bold mb-4">Location</h3>
                  <div className="w-full">
                    <div ref={mapRef} style={{ width: '100%', height: '400px', borderRadius: '10px' }} className="flex items-center justify-center bg-gray-200 rounded-lg">
                      {!isMapScriptLoaded ? <p>Loading Map...</p> : null}
                    </div>
                  </div>
                  <a href={getDirectionsUrl} target="_blank" rel="noopener noreferrer">
                    <button className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-full font-bold shadow-lg hover:bg-blue-600 transition-colors duration-200">
                      Get Directions
                    </button>
                  </a>
                </div>
              </section>
            </>
          ) : (
            <div className="flex justify-center items-center h-screen">
              <p className="text-gray-500 text-lg">Loading dishes...</p>
            </div>
          )
        )}
      </main>

      {isProfileModalOpen && user && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full relative">
            <button
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="flex flex-col items-center space-y-4">
              <img
                src={(user as any).photoURL || `https://placehold.co/100x100/FF5733/white?text=${(user as any).displayName?.charAt(0) || 'U'}`}
                alt="Profile"
                className="w-24 h-24 rounded-full border-4 border-white shadow-lg"
              />
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900">{(user as any).displayName || 'Anonymous User'}</h3>
                <p className="text-sm text-gray-500">User ID: {(user as any).uid}</p>
              </div>
            </div>
            <div className="mt-6 border-t pt-4">
              <h4 className="text-lg font-semibold mb-2">My Reviews</h4>
              {reviews.filter((r: any) => r.userId === (user as any).uid).length > 0 ? (
                <ul className="space-y-2 max-h-40 overflow-y-auto">
                  {reviews.filter((r: any) => r.userId === (user as any).uid).map((review: any) => (
                    <li key={review.id} className="bg-gray-100 p-3 rounded-md shadow-sm">
                      <p className="text-gray-700 text-sm">"{review.reviewText}"</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500 text-sm">You haven't posted any reviews yet.</p>
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="text-center p-4 text-gray-500">
        &copy; {new Date().getFullYear()} FoodieTrusts
      </footer>
    </div>
  );
};

export default App;