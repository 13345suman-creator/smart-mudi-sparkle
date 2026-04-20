
User question: Median (medianapp.com) দিয়ে APK বানিয়ে phone এ install করার পর Lovable এ যে updates করছেন সেগুলো APK তে properly reflect হচ্ছে না কেন?

This is a research/explanation question, not an implementation task. But let me check the capacitor config to understand the current setup and give an accurate answer.

Looking at `capacitor.config.ts`:
```
server: {
  url: 'https://650c5b6d-a3b0-4cf6-a221-2ab5f4ec7bf9.lovableproject.com?forceHideBadge=true',
  cleartext: true
}
```

Key insight: Median.co works completely differently from Capacitor. Median wraps a URL into a WebView APK. The user has TWO separate wrapper systems potentially in play.

## কেন আপনার APK তে updates ঠিকমতো আসছে না

### মূল কারণ: Median একটা Snapshot তৈরি করে

Median.co যখন আপনার APK build করে, তখন এটা আপনার Lovable preview URL টাকে একটা WebView এর ভেতরে wrap করে। এর মানে:

1. **APK নিজে কোনো code রাখে না** — এটা শুধু একটা browser যেটা আপনার URL load করে
2. **Updates live আসা উচিত** — যেহেতু URL load হয়, Lovable এ যা change করবেন সেটা refresh করলে দেখা যাওয়ার কথা

### আসল সমস্যা গুলো (probable causes)

**১. Preview URL vs Published URL সমস্যা**
- আপনার `capacitor.config.ts` এ আছে: `lovableproject.com` (preview URL)
- Median সম্ভবত এই preview URL দিয়েই বানানো হয়েছে
- Preview URL এ login লাগে এবং এটা stable নয়
- **সমাধান**: Published URL (`smart-mudi-sparkle.lovable.app`) ব্যবহার করতে হবে

**২. Frontend changes Publish না করা**
- Lovable এ frontend changes (UI, code) **automatic deploy হয় না**
- প্রতিবার Publish button এ click করে "Update" করতে হয়
- নাহলে published URL এ পুরনো version ই থাকবে
- আপনি যদি শুধু Lovable editor এ changes করেন কিন্তু Publish না করেন, APK তে কিছুই আসবে না

**৩. WebView Cache Problem**
- Median এর WebView পুরনো HTML/JS/CSS cache করে রাখে
- Service Worker (PWA) আরো aggressive caching করে
- App restart করলেও cached version load হয়

**৪. PWA Service Worker conflict**
- আপনার `vite.config.ts` এ `VitePWA` enabled with `registerType: "autoUpdate"`
- Service Worker পুরনো assets cache করে রাখে
- Update আসলেও user কে app বন্ধ করে আবার খুলতে হয় (কখনো কখনো ২ বার)

**৫. Median Build পুরনো**
- Median তে যদি একবার build করেন, ওই APK এর ভেতরের configuration (URL, splash, icon) fixed
- Lovable এ code change করলে Median APK rebuild করতে হয় না, কিন্তু URL এর content auto-update হওয়ার কথা

## সঠিক Workflow (যেটা আপনার follow করা উচিত)

```text
Lovable এ change করুন
       ↓
Publish button → Update click করুন (MANDATORY)
       ↓
Published URL এ change verify করুন (browser এ)
       ↓
APK খুলুন → Pull-to-refresh / App restart
       ↓
যদি না আসে → App data clear করুন (Settings → Apps → Clear Cache)
```

## Recommended Solutions (২টা option)

### Option A: Median ঠিক করুন (Quick Fix)
1. Lovable এ **Publish → Update** click করুন প্রতিটা change এর পর
2. Median dashboard এ গিয়ে URL change করুন: `https://smart-mudi-sparkle.lovable.app`
3. APK rebuild করে install করুন
4. Phone এর Settings → Apps → Smart Mudi Khana → **Clear Cache & Storage**

### Option B: Capacitor ব্যবহার করুন (Recommended - Professional)
আপনার project এ already `capacitor.config.ts` configured আছে। Capacitor দিয়ে বানালে:
- Lovable এর সাথে সরাসরি integrated
- Hot reload support (development এ)
- Better native features (camera, notifications, file system)
- Play Store এ publish করার uplate path

আমি Capacitor config টা optimize করে দিতে পারি যাতে published URL ব্যবহার করে এবং properly hot-reload হয়।

## প্রশ্ন

কোনটা করতে চান বলুন:
1. শুধু explanation চেয়েছিলেন — workflow follow করবেন (Median রাখবেন)
2. Capacitor config update করতে চান (published URL দিয়ে)
3. Service Worker cache problem fix করতে চান (PWA disable বা update strategy change)

**কোনো code change এই message এ করিনি — শুধু analysis।** আপনি বললে নিচের যেকোনো টা করতে পারি।
