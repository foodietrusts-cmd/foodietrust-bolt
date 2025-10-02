const functions = require('firebase-functions');
const axios = require('axios');

async function searchZomato(dish, location) {
  const config = functions.config();
  try {
    const response = await axios.get('https://developers.zomato.com/api/v2.1/search', {
      headers: { 'user-key': config.zomato?.key || '' },
      params: { q: dish, entity_type: 'city', entity_id: location }
    });
    return response.data;
  } catch (error) {
    console.error('Zomato API error:', error);
    return null;
  }
}

async function searchYelp(dish, location) {
  const config = functions.config();
  try {
    const response = await axios.get('https://api.yelp.com/v3/businesses/search', {
      headers: { 'Authorization': `Bearer ${config.yelp?.key || ''}`  },
      params: { term: dish, location: location, categories: 'restaurants' }
    });
    return response.data;
  } catch (error) {
    console.error('Yelp API error:', error);
    return null;
  }
}

async function aggregateDishData(dishName, location) {
  const [zomatoData, yelpData] = await Promise.allSettled([
    searchZomato(dishName, location),
    searchYelp(dishName, location)
  ]);

  const results = [];

  if (zomatoData.status === 'fulfilled' && zomatoData.value) {
    results.push(...formatZomatoResults(zomatoData.value));
  }

  if (yelpData.status === 'fulfilled' && yelpData.value) {
    results.push(...formatYelpResults(yelpData.value));
  }

  return consolidateByDish(results);
}

function formatZomatoResults(data) {
  const results = [];
  if (data.restaurants) {
    data.restaurants.forEach(restaurant => {
      const restaurantData = restaurant.restaurant;
      results.push({
        dishName: restaurantData.name,
        restaurantName: restaurantData.name,
        address: restaurantData.location.address,
        rating: parseFloat(restaurantData.user_rating.aggregate_rating),
        price: restaurantData.price_range,
        reviewCount: parseInt(restaurantData.all_reviews_count),
        sources: { zomato: parseFloat(restaurantData.user_rating.aggregate_rating) }
      });
    });
  }
  return results;
}

function formatYelpResults(data) {
  const results = [];
  if (data.businesses) {
    data.businesses.forEach(business => {
      results.push({
        dishName: business.name,
        restaurantName: business.name,
        address: business.location.address1,
        rating: parseFloat(business.rating),
        price: business.price ? business.price.length : 2,
        reviewCount: business.review_count,
        sources: { yelp: parseFloat(business.rating) }
      });
    });
  }
  return results;
}

function consolidateByDish(results) {
  const dishMap = new Map();

  results.forEach(result => {
    if (!dishMap.has(result.dishName)) {
      dishMap.set(result.dishName, {
        dishName: result.dishName,
        availableAt: [],
        aggregatedRating: 0,
        totalReviews: 0
      });
    }

    const dish = dishMap.get(result.dishName);
    dish.availableAt.push(result);
    dish.totalReviews += result.reviewCount;
  });

  // Calculate aggregated ratings
  dishMap.forEach(dish => {
    const totalRating = dish.availableAt.reduce((sum, restaurant) => sum + restaurant.rating, 0);
    dish.aggregatedRating = dish.availableAt.length > 0 ? totalRating / dish.availableAt.length : 0;
  });

  return Array.from(dishMap.values());
}

module.exports = { aggregateDishData };
