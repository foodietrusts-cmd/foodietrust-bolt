# 🔧 Fix Review Display - Simple Manual Instructions

## Problem
Reviews are saving dishName and restaurantName to Firebase, but they're not displaying in the review cards.

## Solution (2 Simple Edits)

### ✅ Step 1: Already Done!
The Review type in `src/types/types.ts` now has:
```typescript
dishName?: string;
restaurantName?: string;
```

### 📝 Step 2: Update UserReviewsTab.tsx

**File:** `src/components/UserReviewsTab.tsx`

**Edit 1: Load the fields from Firebase (around line 36)**

Find this code:
```typescript
userName: data.userName || 'Foodie',
rating: Number(data.rating) || 0,
```

Change to:
```typescript
userName: data.userName || 'Foodie',
dishName: data.dishName,
restaurantName: data.restaurantName,
rating: Number(data.rating) || 0,
```

**Edit 2: Display the fields in ReviewCard (around line 205)**

Find this code:
```typescript
          </div>

          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
```

Change to:
```typescript
          </div>

          {(review.dishName || review.restaurantName) && (
            <div className="mb-3 flex items-center gap-2 text-sm bg-orange-50 px-3 py-2 rounded-lg border border-orange-100">
              {review.dishName && <span className="font-semibold text-orange-700">{review.dishName}</span>}
              {review.dishName && review.restaurantName && <span className="text-gray-400">•</span>}
              {review.restaurantName && <span className="text-gray-700">{review.restaurantName}</span>}
            </div>
          )}

          <div className="mb-4">
            <div className="flex items-center space-x-2 mb-2">
```

## That's It!

After these 2 edits:
1. Save the file
2. Run: `npm run build`
3. Run: `git add . && git commit -m "Fix review display" && git push`

Your reviews will now show:
```
Foodie                    10/1/2025    ⭐⭐⭐⭐⭐
Butter Chicken • Spice Junction
```

## Current Status

✅ Types updated (dishName, restaurantName added to Review interface)
⏳ Component needs 2 simple edits above
✅ Data is already saving to Firebase correctly

---

**The fix is simple - just 2 small code additions!**
