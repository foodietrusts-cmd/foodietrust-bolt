# 🗺️ Google Maps API Setup

## Why This is Needed

Your AI is currently detecting location but can't give specific restaurant recommendations because it doesn't have access to real restaurant data. By adding Google Maps Places API, the AI will:

✅ Find actual nearby restaurants  
✅ Show real addresses  
✅ Display ratings and reviews  
✅ Tell you if they're open now  
✅ Give specific recommendations  

---

## 🔑 Get Google Maps API Key (FREE)

### Step 1: Go to Google Cloud Console

1. Visit: https://console.cloud.google.com/
2. Sign in with your Google account

### Step 2: Create/Select Project

1. Click the project dropdown at the top
2. Click "New Project"
3. Name it: "FoodieTrust Maps"
4. Click "Create"

### Step 3: Enable Places API

1. Go to: https://console.cloud.google.com/apis/library/places-backend.googleapis.com
2. Click "Enable"
3. Wait for it to activate (~30 seconds)

### Step 4: Create API Key

1. Go to: https://console.cloud.google.com/apis/credentials
2. Click "Create Credentials" → "API Key"
3. Copy the API key (starts with `AIza...`)

### Step 5: Restrict the API Key (Important for Security)

1. Click on the API key you just created
2. Under "API restrictions":
   - Select "Restrict key"
   - Check "Places API"
3. Under "Application restrictions":
   - Select "HTTP referrers"
   - Add: `https://foodietrusts.com/*`
   - Add: `https://*.cloudfunctions.net/*`
4. Click "Save"

---

## 💰 Pricing (Don't Worry - It's FREE!)

**Free Tier:**
- $200 credit per month
- ~28,000 Places API requests FREE per month
- Your usage: ~1,000-5,000 requests/month
- **Cost: $0** (well within free tier)

**After Free Tier:**
- $17 per 1,000 requests
- But you won't reach this with normal usage

---

## ⚙️ Configure in Firebase

Once you have your API key, run:

```powershell
firebase functions:config:set googlemaps.key="YOUR_GOOGLE_MAPS_API_KEY"
```

Then redeploy:

```powershell
firebase deploy --only functions
```

---

## 🧪 Test It

After deployment:

1. Go to: https://foodietrusts.com
2. Click: AI Search tab
3. Allow location when prompted
4. Type: "Best biryani near me"
5. Click: Ask AI

**You should now see:**
- ✅ Actual restaurant names
- ✅ Real addresses
- ✅ Ratings (e.g., 4.5/5)
- ✅ Number of reviews
- ✅ Open/Closed status
- ✅ Specific recommendations

---

## 📊 Example Response (Before vs After)

### Before (Without Maps API):
```
I don't have access to your location. Try searching on Google Maps...
```

### After (With Maps API):
```
Based on your location, here are the top biryani restaurants near you:

1. **Paradise Biryani**
   - Address: 123 Main St, San Jose, CA
   - Rating: 4.5/5 (1,234 reviews)
   - Status: Open now
   - Why: Highly rated for authentic Hyderabadi biryani

2. **Biryani House**
   - Address: 456 Oak Ave, San Jose, CA
   - Rating: 4.3/5 (856 reviews)
   - Status: Open now
   - Why: Great variety and generous portions

3. **Spice Kitchen**
   - Address: 789 Elm St, San Jose, CA
   - Rating: 4.4/5 (623 reviews)
   - Status: Closed
   - Why: Known for flavorful chicken biryani
```

---

## 🔒 Security Best Practices

✅ **API Key Restrictions:**
- Restrict to Places API only
- Add HTTP referrer restrictions
- Never commit key to Git

✅ **Monitoring:**
- Check usage in Google Cloud Console
- Set up billing alerts
- Monitor for unusual activity

---

## 🚀 Quick Setup Commands

```powershell
# 1. Get your Google Maps API key from:
# https://console.cloud.google.com/apis/credentials

# 2. Configure in Firebase
firebase functions:config:set googlemaps.key="AIza..."

# 3. Verify configuration
firebase functions:config:get

# 4. Deploy
firebase deploy --only functions

# 5. Test on your site
# https://foodietrusts.com → AI Search
```

---

## ✅ Checklist

- [ ] Created Google Cloud project
- [ ] Enabled Places API
- [ ] Created API key
- [ ] Restricted API key (security)
- [ ] Configured in Firebase
- [ ] Deployed function
- [ ] Tested on website
- [ ] Verified real restaurants appear

---

## 🆘 Troubleshooting

**"API key not found"**
- Make sure you ran: `firebase functions:config:set googlemaps.key="..."`
- Redeploy after setting the key

**"Places API not enabled"**
- Go to: https://console.cloud.google.com/apis/library/places-backend.googleapis.com
- Click "Enable"

**"Still getting generic responses"**
- Check Firebase logs: `firebase functions:log`
- Make sure location is being detected
- Verify API key is configured correctly

---

## 💡 Pro Tip

The Google Maps integration works even if you don't have the API key - it just won't show real restaurants. But once you add the key, the AI will give MUCH better, specific recommendations with real addresses and ratings!

---

**Ready to add real restaurant data to your AI? Get your API key now!** 🗺️✨
