
## সমস্যা বিশ্লেষণ

User বলছেন: Lovable preview এ সব ঠিক কাজ করছে, কিন্তু installed APK (Median WebView) এ app বন্ধ করে আবার খুললে bills, udhari, সব data delete হয়ে যাচ্ছে।

## Root Cause

Median WebView APK এর behavior browser এর থেকে আলাদা:

1. **localStorage clearing**: Median এর default setting এ অনেক সময় app close হলে WebView এর storage clear হয়ে যায় (specially যদি "Clear cache on exit" enabled থাকে অথবা WebView storage permission ঠিক না থাকে)

2. **Firebase async race condition (existing bug)**: 
   - App restart হলে `useStore` mount হয়
   - `localStorage` থেকে data load হয় (যদি থাকে)
   - তারপর Firebase listener attach হয়
   - Firebase যদি empty snapshot return করে (user logged out, বা slow network), `mergeById` চলে — কিন্তু যদি localStorage ও empty থাকে (Median cleared করেছে), তাহলে দুই দিকেই empty
   - Result: সব gone

3. **Median WebView এ IndexedDB/localStorage isolation**: Median এর কিছু configuration এ প্রতিবার fresh WebView session তৈরি হয়, যেটা localStorage persist করে না

4. **Service Worker stale state**: PWA cache APK এ corrupt হয়ে গেলে fresh empty state load হয়

## Verification Plan

আগে কিছু files check করব:
- `src/lib/store.tsx` — কীভাবে localStorage থেকে initial load হচ্ছে এবং Firebase merge logic
- Median এ data persistence এর জন্য কী strategy আছে দেখব

## Solution Approach

### Layer 1: Code-level Fixes (Lovable side)

**A. Defensive localStorage strategy in `src/lib/store.tsx`**
- প্রতি save এর পর immediate verify করব localStorage এ লেখা হয়েছে কিনা
- Firebase listener এ guard add করব: যদি Firebase empty return করে কিন্তু localStorage এ আগে data ছিল (last-known state), localStorage এর data কেই source of truth ধরব
- "Last sync timestamp" track করব — আগের session এর data থাকলে কখনো wipe করব না

**B. Backup mirror in IndexedDB**
- localStorage ছাড়াও IndexedDB তে parallel backup রাখব
- Median এর কিছু configuration localStorage clear করে কিন্তু IndexedDB রাখে (অথবা উল্টোটা)
- Both check করে whichever has data সেটা restore করব

**C. Auto-recovery on mount**
- App mount হওয়ার সময় যদি দেখা যায় localStorage empty কিন্তু IndexedDB তে data আছে → restore
- যদি দেখা যায় Firebase তে data আছে কিন্তু local empty → Firebase থেকে pull

### Layer 2: User-side Median Configuration (Instructions)

User কে Median dashboard এ এই settings change করতে হবে:
- **WebView Settings** → "Persistent Storage" = ON
- **WebView Settings** → "Clear cache on exit" = OFF  
- **App Permissions** → Storage permission grant করতে হবে install এর পরে
- **DOM Storage** এবং **Database Storage** = enabled

### Files to Modify

1. **`src/lib/store.tsx`** — IndexedDB mirror, defensive merge, never-wipe guard
2. **`src/lib/persistentStorage.ts`** (NEW) — Wrapper around localStorage + IndexedDB with auto-fallback

## Plan Steps

```text
1. src/lib/persistentStorage.ts (NEW)
   - Dual-write to localStorage + IndexedDB
   - Read: try localStorage first, fallback IndexedDB
   - On mismatch: restore the larger/newer set to both

2. src/lib/store.tsx
   - Replace direct localStorage.getItem/setItem calls 
     with persistentStorage wrapper for: 
     bills, udhari, products, paidUdhari
   - Add "lastDataTimestamp" guard:
     If Firebase snapshot is empty AND local has data 
     AND last save was <30 days ago → DO NOT overwrite local
   - On mount: hydrate from IndexedDB if localStorage is empty

3. Provide Median configuration instructions to user 
   (no code change needed, just docs)
```

## What user must also do

Code fix করার পর APK তে:
1. App uninstall → reinstall (ekbar fresh state দরকার)
2. Median dashboard এ Persistent Storage enable
3. Phone Settings → App permissions → Storage allow

কোনো প্রশ্ন আছে নাকি plan টা approve করব?
