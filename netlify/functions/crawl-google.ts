import fetch from 'node-fetch';
import { Handler } from '@netlify/functions';
import { db, FieldValue } from './_shared/admin.js';

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY as string;

async function placesNearby(params: Record<string,string>) {
  const url = new URL('https://maps.googleapis.com/maps/api/place/nearbysearch/json');
  Object.entries(params).forEach(([k,v])=>url.searchParams.set(k,v));
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Google Places error ${res.status}`);
  return res.json();
}

async function placeDetails(place_id: string) {
  const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
  url.searchParams.set('place_id', place_id);
  url.searchParams.set('key', GOOGLE_PLACES_API_KEY);
  url.searchParams.set('fields','name,place_id,photos,reviews,types');
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Google Details error ${res.status}`);
  return res.json();
}

function extractDishMentions(text: string): string[] {
  if (!text) return [];
  const candidates = ['biryani','dosa','idli','parotta','chicken','mutton','prawn','fish','paneer','samosa','sambar','rasam','pongal','halwa'];
  const lower = text.toLowerCase();
  return candidates.filter(c => lower.includes(c));
}

export const handler: Handler = async () => {
  try {
    if (!GOOGLE_PLACES_API_KEY) throw new Error('Missing GOOGLE_PLACES_API_KEY');

    // Approx Chennai center
    const nearby = await placesNearby({
      key: GOOGLE_PLACES_API_KEY,
      location: '13.0827,80.2707',
      radius: '10000',
      type: 'restaurant'
    });

    for (const r of nearby.results || []) {
      const details = await placeDetails(r.place_id);
      const result = details.result;
      const reviews = result?.reviews || [];
      for (const rev of reviews) {
        const dishMentions = extractDishMentions(rev.text || rev.content || '');
        for (const dishName of dishMentions) {
          const dishes = await db.collection('dishes').where('name','==', dishName).where('restaurantName','==', result.name).where('location','==','Chennai').limit(1).get();
          let dishRef;
          if (dishes.empty) {
            dishRef = await db.collection('dishes').add({
              name: dishName,
              restaurantName: result.name,
              location: 'Chennai',
              cuisine: (result.types?.[0]) || '',
              rating: 0,
              reviewCount: 0,
              photoURL: null,
              createdAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
              tags: result.types || []
            });
          } else {
            dishRef = dishes.docs[0].ref;
            await dishRef.update({ updatedAt: FieldValue.serverTimestamp() });
          }

          await dishRef.collection('reviews').add({
            userId: `google:${rev.author_url || 'unknown'}`,
            userName: rev.author_name || 'Google User',
            rating: rev.rating || 0,
            comment: rev.text || rev.content || '',
            source: 'google',
            createdAt: FieldValue.serverTimestamp(),
          });

          await db.collection('crawled').doc('google').collection('items').add({
            placeId: result.place_id,
            placeName: result.name,
            dishName,
            review: rev,
            createdAt: FieldValue.serverTimestamp(),
          });
        }
      }
    }

    return { statusCode: 200, body: JSON.stringify({ ok: true }) };
  } catch (e: any) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};

