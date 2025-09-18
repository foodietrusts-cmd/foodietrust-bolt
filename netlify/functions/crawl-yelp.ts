import fetch from 'node-fetch';
import { Handler } from '@netlify/functions';
import { db, FieldValue } from './_shared/admin.js';

const YELP_API_KEY = process.env.YELP_API_KEY as string;
const YELP_BASE = 'https://api.yelp.com/v3';

async function yelp(endpoint: string, params: Record<string, string>) {
  const url = new URL(YELP_BASE + endpoint);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${YELP_API_KEY}` },
  });
  if (!res.ok) throw new Error(`Yelp error ${res.status}: ${await res.text()}`);
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
    if (!YELP_API_KEY) throw new Error('Missing YELP_API_KEY');

    // Search popular restaurants in Chennai
    const search = await yelp('/businesses/search', { location: 'Chennai, IN', term: 'restaurants', limit: '20', sort_by: 'rating' });

    for (const biz of search.businesses || []) {
      // Fetch reviews
      const reviews = await yelp(`/businesses/${biz.id}/reviews`, {} as any);
      for (const rev of reviews.reviews || []) {
        const dishMentions = extractDishMentions(rev.text || '');
        for (const dishName of dishMentions) {
          // Upsert dish
          const dishes = await db.collection('dishes').where('name','==', dishName).where('restaurantName','==', biz.name).where('location','==','Chennai').limit(1).get();
          let dishRef;
          if (dishes.empty) {
            dishRef = await db.collection('dishes').add({
              name: dishName,
              restaurantName: biz.name,
              location: 'Chennai',
              cuisine: (biz.categories?.[0]?.title) || '',
              rating: 0,
              reviewCount: 0,
              photoURL: biz.image_url || null,
              createdAt: FieldValue.serverTimestamp(),
              updatedAt: FieldValue.serverTimestamp(),
              tags: (biz.categories || []).map((c:any)=>c.title)
            });
          } else {
            dishRef = dishes.docs[0].ref;
            await dishRef.update({ updatedAt: FieldValue.serverTimestamp() });
          }

          // Write crawled review under dish
          await dishRef.collection('reviews').add({
            userId: `yelp:${rev.user?.id || 'unknown'}`,
            userName: rev.user?.name || 'Yelp User',
            rating: rev.rating || 0,
            comment: rev.text || '',
            source: 'yelp',
            createdAt: FieldValue.serverTimestamp(),
          });

          // Also store raw crawl
          await db.collection('crawled').doc('yelp').collection('items').add({
            businessId: biz.id,
            businessName: biz.name,
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

