import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Lang = "bn" | "hi" | "en";

const translations: Record<string, Record<Lang, string>> = {
  // Dashboard
  "dashboard": { bn: "ড্যাশবোর্ড", hi: "डैशबोर्ड", en: "Dashboard" },
  "today_sales": { bn: "আজকের বিক্রি", hi: "आज की बिक्री", en: "Today Sales" },
  "monthly_sales": { bn: "মাসিক বিক্রি", hi: "मासिक बिक्री", en: "Monthly Sales" },
  "total_products": { bn: "মোট পণ্য", hi: "कुल उत्पाद", en: "Total Products" },
  "pending_udhari": { bn: "বকেয়া উধারি", hi: "बकाया उधारी", en: "Pending Udhari" },
  "quick_actions": { bn: "দ্রুত কাজ", hi: "त्वरित कार्य", en: "Quick Actions" },
  "recent_transactions": { bn: "সাম্প্রতিক লেনদেন", hi: "हालिया लेनदेन", en: "Recent Transactions" },
  "low_stock_alert": { bn: "⚠️ কম স্টক সতর্কতা", hi: "⚠️ कम स्टॉक चेतावनी", en: "⚠️ Low Stock Alert" },
  "low_stock_details": { bn: "📦 কম স্টক বিবরণ", hi: "📦 कम स्टॉक विवरण", en: "📦 Low Stock Details" },
  "items_need_restock": { bn: "আইটেম রিস্টকের প্রয়োজন — বিস্তারিত দেখুন", hi: "आइटम रीस्टॉक की जरूरत — विवरण देखें", en: "items need restock — Tap for details" },
  "view_all": { bn: "সব দেখুন", hi: "सब देखें", en: "View All" },
  "out_of_stock": { bn: "স্টক নেই", hi: "स्टॉक ख़त्म", en: "Out of Stock" },
  "left": { bn: "বাকি", hi: "बाकी", en: "left" },
  "download_pdf": { bn: "পিডিএফ রিপোর্ট ডাউনলোড", hi: "पीडीएफ रिपोर्ट डाउनलोड", en: "Download PDF Report" },
  "no_transactions": { bn: "কোনো লেনদেন নেই", hi: "कोई लेनदेन नहीं", en: "No transactions yet" },
  "create_first_bill": { bn: "শুরু করতে আপনার প্রথম বিল তৈরি করুন!", hi: "शुरू करने के लिए पहला बिल बनाएं!", en: "Create your first bill to get started!" },
  "bills_today": { bn: "আজকের বিল", hi: "आज के बिल", en: "Bills Today" },
  "products": { bn: "পণ্য", hi: "उत्पाद", en: "Products" },
  "low_stock": { bn: "কম স্টক", hi: "कम स्टॉक", en: "Low Stock" },
  
  // Quick Actions
  "new_bill": { bn: "নতুন বিল", hi: "नया बिल", en: "New Bill" },
  "add_stock": { bn: "স্টক যোগ", hi: "स्टॉक जोड़ें", en: "Add Stock" },
  "udhari": { bn: "উধারি", hi: "उधारी", en: "Udhari" },

  // Stock
  "stock_management": { bn: "স্টক ম্যানেজমেন্ট", hi: "स्टॉक प्रबंधन", en: "Stock Management" },
  "add_product": { bn: "পণ্য যোগ করুন", hi: "उत्पाद जोड़ें", en: "Add Product" },
  "search_product": { bn: "নাম বা বারকোড দিয়ে খুঁজুন...", hi: "नाम या बारकोड से खोजें...", en: "Search by name or barcode..." },
  "no_products": { bn: "কোনো পণ্য নেই। আপনার প্রথম পণ্য যোগ করুন!", hi: "कोई उत्पाद नहीं। पहला उत्पाद जोड़ें!", en: "No products yet. Add your first product!" },
  "product_name": { bn: "পণ্যের নাম", hi: "उत्पाद का नाम", en: "Product Name" },
  "cost_price": { bn: "ক্রয়মূল্য (₹)", hi: "लागत मूल्य (₹)", en: "Cost Price (₹)" },
  "sell_price": { bn: "বিক্রয়মূল্য (₹)", hi: "बिक्री मूल्य (₹)", en: "Sell Price (₹)" },
  "stock_quantity": { bn: "স্টক পরিমাণ", hi: "स्टॉक मात्रा", en: "Stock Quantity" },
  "expiry_date": { bn: "মেয়াদ শেষের তারিখ", hi: "समाप्ति तिथि", en: "Expiry Date" },
  "barcode": { bn: "বারকোড", hi: "बारकोड", en: "Barcode" },
  "unit": { bn: "একক", hi: "इकाई", en: "Unit" },
  "save_changes": { bn: "পরিবর্তন সংরক্ষণ", hi: "परिवर्तन सहेजें", en: "Save Changes" },
  "delete": { bn: "মুছুন", hi: "हटाएं", en: "Delete" },
  "edit": { bn: "সম্পাদনা", hi: "संपादित करें", en: "Edit" },
  "product_added": { bn: "পণ্য সফলভাবে যোগ হয়েছে!", hi: "उत्पाद सफलतापूर्वक जोड़ा गया!", en: "Product added successfully!" },
  "product_updated": { bn: "পণ্য আপডেট হয়েছে!", hi: "उत्पाद अपडेट हुआ!", en: "Product updated!" },
  "product_deleted": { bn: "পণ্য মুছে ফেলা হয়েছে!", hi: "उत्पाद हटाया गया!", en: "Product deleted!" },
  "stock_alerts": { bn: "স্টক সতর্কতা", hi: "स्टॉक चेतावनी", en: "Stock Alerts" },

  // Billing
  "create_bill": { bn: "বিল তৈরি", hi: "बिल बनाएं", en: "Create Bill" },
  "search_product_barcode": { bn: "পণ্য বা বারকোড খুঁজুন...", hi: "उत्पाद या बारकोड खोजें...", en: "Search product name or barcode..." },
  "bill_history": { bn: "বিল ইতিহাস", hi: "बिल इतिहास", en: "Bill History" },
  "total": { bn: "মোট", hi: "कुल", en: "Total" },
  "pay_now": { bn: "এখনই পে করুন", hi: "अभी भुगतान करें", en: "Pay Now" },
  "paid": { bn: "পরিশোধিত", hi: "भुगतान किया", en: "Paid" },
  "pending": { bn: "বকেয়া", hi: "लंबित", en: "Pending" },
  "cash": { bn: "নগদ", hi: "नकद", en: "Cash" },
  "confirm_payment": { bn: "পেমেন্ট নিশ্চিত", hi: "भुगतान पुष्टि", en: "Confirm Payment" },
  "walk_in_customer": { bn: "সাধারণ গ্রাহক", hi: "सामान्य ग्राहक", en: "Walk-in Customer" },

  // Udhari
  "total_pending_udhari": { bn: "মোট বকেয়া উধারি", hi: "कुल बकाया उधारी", en: "Total Pending Udhari" },
  "add_udhari": { bn: "উধারি যোগ", hi: "उधारी जोड़ें", en: "Add Udhari" },
  "customer_name": { bn: "গ্রাহকের নাম", hi: "ग्राहक का नाम", en: "Customer Name" },
  "phone_number": { bn: "ফোন নম্বর", hi: "फोन नंबर", en: "Phone Number" },
  "receive_payment": { bn: "পেমেন্ট গ্রহণ", hi: "भुगतान प्राप्त करें", en: "Receive Payment" },
  "customers": { bn: "গ্রাহক", hi: "ग्राहक", en: "customers" },
  "cleared": { bn: "পরিশোধিত", hi: "चुकता", en: "cleared" },

  // Settings
  "settings": { bn: "সেটিংস", hi: "सेटिंग्स", en: "Settings" },
  "shop_details": { bn: "দোকানের তথ্য", hi: "दुकान विवरण", en: "Shop Details" },
  "upi_settings": { bn: "ইউপিআই সেটিংস", hi: "यूपीआई सेटिंग्स", en: "UPI Settings" },
  "security": { bn: "নিরাপত্তা", hi: "सुरक्षा", en: "Security" },
  "notifications": { bn: "বিজ্ঞপ্তি", hi: "सूचनाएं", en: "Notifications" },
  "appearance": { bn: "থিম", hi: "थीम", en: "Appearance" },
  "backup_data": { bn: "ব্যাকআপ ও ডাটা", hi: "बैकअप और डेटा", en: "Backup & Data" },
  "advanced": { bn: "উন্নত", hi: "उन्नत", en: "Advanced" },
  "app_lock": { bn: "অ্যাপ লক", hi: "ऐप लॉक", en: "App Lock" },
  "fingerprint": { bn: "ফিঙ্গারপ্রিন্ট / বায়োমেট্রিক", hi: "फिंगरप्रिंट / बायोमेट्रिक", en: "Fingerprint / Biometric" },
  "export_backup": { bn: "ব্যাকআপ এক্সপোর্ট", hi: "बैकअप एक्सपोर्ट", en: "Export Backup" },
  "import_backup": { bn: "ব্যাকআপ ইম্পোর্ট", hi: "बैकअप इम्पोर्ट", en: "Import Backup" },
  "clear_all": { bn: "সব মুছুন", hi: "सब हटाएं", en: "Clear All Data" },
  "save": { bn: "সংরক্ষণ", hi: "सहेजें", en: "Save" },
  "low_stock_threshold": { bn: "কম স্টক থ্রেশোল্ড", hi: "कम स्टॉक सीमा", en: "Low Stock Alert Threshold" },
  "currency": { bn: "মুদ্রা চিহ্ন", hi: "मुद्रा चिन्ह", en: "Currency Symbol" },
  "language": { bn: "ভাষা", hi: "भाषा", en: "Language" },
  "auto_backup": { bn: "অটো ব্যাকআপ", hi: "ऑटो बैकअप", en: "Auto Backup" },
  
  // Header
  "good_morning": { bn: "সুপ্রভাত", hi: "सुप्रभात", en: "Good Morning" },
  "good_afternoon": { bn: "শুভ অপরাহ্ন", hi: "शुभ दोपहर", en: "Good Afternoon" },
  "good_evening": { bn: "শুভ সন্ধ্যা", hi: "शुभ संध्या", en: "Good Evening" },
  "synced": { bn: "সিঙ্ক হয়েছে", hi: "सिंक हो गया", en: "Synced" },
  "offline": { bn: "অফলাইন", hi: "ऑफलाइन", en: "Offline" },
  "login": { bn: "লগইন", hi: "लॉगिन", en: "Login" },
  "no_notifications": { bn: "কোনো বিজ্ঞপ্তি নেই! ✨", hi: "कोई सूचना नहीं! ✨", en: "No notifications! ✨" },

  // Sales PDF
  "download_today_sales": { bn: "আজকের বিক্রি PDF ডাউনলোড", hi: "आज की बिक्री PDF डाउनलोड", en: "Download Today Sales PDF" },
  "download_monthly_sales": { bn: "মাসিক বিক্রি PDF ডাউনলোড", hi: "मासिक बिक्री PDF डाउनलोड", en: "Download Monthly Sales PDF" },
  "sales_report": { bn: "বিক্রি রিপোর্ট", hi: "बिक्री रिपोर्ट", en: "Sales Report" },

  // Fingerprint
  "fingerprint_saved": { bn: "ফিঙ্গারপ্রিন্ট সংরক্ষিত", hi: "फिंगरप्रिंट सहेजा गया", en: "Fingerprint saved" },
  "fingerprint_deleted": { bn: "ফিঙ্গারপ্রিন্ট মুছে ফেলা হয়েছে", hi: "फिंगरप्रिंट हटाया गया", en: "Fingerprint deleted" },
  "max_fingerprints": { bn: "সর্বোচ্চ ৫টি ফিঙ্গারপ্রিন্ট সংরক্ষণ করা যায়", hi: "अधिकतम 5 फिंगरप्रिंट सहेजे जा सकते हैं", en: "Maximum 5 fingerprints can be saved" },
  "add_fingerprint": { bn: "ফিঙ্গারপ্রিন্ট যোগ করুন", hi: "फिंगरप्रिंट जोड़ें", en: "Add Fingerprint" },
  "manage_fingerprints": { bn: "ফিঙ্গারপ্রিন্ট ম্যানেজ", hi: "फिंगरप्रिंट प्रबंधित करें", en: "Manage Fingerprints" },

  // Login Page
  "login_tab": { bn: "লগইন", hi: "लॉगिन", en: "Login" },
  "signup_tab": { bn: "সাইন আপ", hi: "साइन अप", en: "Sign Up" },
  "login_heading": { bn: "লগইন করুন", hi: "लॉगिन करें", en: "Login" },
  "signup_heading": { bn: "নতুন Account", hi: "नया अकाउंट", en: "New Account" },
  "reset_heading": { bn: "Password Reset", hi: "पासवर्ड रीसेट", en: "Password Reset" },
  "login_subtitle": { bn: "Email ও Password দিয়ে login করুন", hi: "ईमेल और पासवर्ड से लॉगिन करें", en: "Login with your email and password" },
  "signup_subtitle": { bn: "নতুন account তৈরি করুন — ফ্রি!", hi: "नया अकाउंट बनाएं — मुफ़्त!", en: "Create a new account — Free!" },
  "reset_subtitle": { bn: "আপনার email দিন, reset link পাঠাবো", hi: "अपना ईमेल दें, रीसेट लिंक भेजेंगे", en: "Enter your email, we'll send a reset link" },
  "your_name": { bn: "আপনার নাম (দোকানদার)", hi: "आपका नाम (दुकानदार)", en: "Your name (Shopkeeper)" },
  "email_address": { bn: "Email address", hi: "ईमेल एड्रेस", en: "Email address" },
  "password_placeholder": { bn: "Password", hi: "पासवर्ड", en: "Password" },
  "password_signup_placeholder": { bn: "Password (কমপক্ষে ৬ অক্ষর)", hi: "पासवर्ड (कम से कम 6 अक्षर)", en: "Password (min 6 characters)" },
  "forgot_password": { bn: "Password ভুলে গেছেন?", hi: "पासवर्ड भूल गए?", en: "Forgot password?" },
  "login_button": { bn: "🔑 Login করুন", hi: "🔑 लॉगिन करें", en: "🔑 Login" },
  "signup_button": { bn: "✨ Account তৈরি করুন", hi: "✨ अकाउंट बनाएं", en: "✨ Create Account" },
  "reset_button": { bn: "📧 Reset Link পাঠান", hi: "📧 रीसेट लिंक भेजें", en: "📧 Send Reset Link" },
  "or_divider": { bn: "অথবা", hi: "या", en: "or" },
  "google_login": { bn: "Google দিয়ে Login", hi: "Google से लॉगिन", en: "Login with Google" },
  "apk_warning": { bn: "⚠️ APK তে Google login কাজ নাও করতে পারে। Email দিয়ে login করুন।", hi: "⚠️ APK में Google लॉगिन काम नहीं कर सकता। ईमेल से लॉगिन करें।", en: "⚠️ Google login may not work in APK. Use email login instead." },
  "use_without_login": { bn: "Login ছাড়া ব্যবহার করুন", hi: "लॉगिन के बिना उपयोग करें", en: "Use without login" },
  "back_to_login": { bn: "Login এ ফিরে যান", hi: "लॉगिन पर वापस जाएं", en: "Back to Login" },
  "your_email": { bn: "আপনার email address", hi: "आपका ईमेल एड्रेस", en: "Your email address" },
  "smart_shop_tagline": { bn: "Your Smart Shop Assistant", hi: "आपका स्मार्ट शॉप असिस्टेंट", en: "Your Smart Shop Assistant" },
  "account_created": { bn: "✅ Account তৈরি হয়েছে! Home page এ যাচ্ছে...", hi: "✅ अकाउंट बन गया! होम पेज पर जा रहे हैं...", en: "✅ Account created! Redirecting to home..." },
  "reset_email_sent": { bn: "✅ Password reset email পাঠানো হয়েছে! Email check করুন।", hi: "✅ पासवर्ड रीसेट ईमेल भेजा गया! ईमेल चेक करें।", en: "✅ Password reset email sent! Check your email." },
  "reset_spam_warning": { bn: "⚠️ Email না পেলে Spam/Junk ফোল্ডার check করুন।", hi: "⚠️ ईमेल न मिले तो Spam/Junk फ़ोल्डर चेक करें।", en: "⚠️ If you don't see the email, check your Spam/Junk folder." },
};

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  lang: "bn",
  setLang: () => {},
  t: (key: string) => key,
});

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    return (localStorage.getItem("smk_language") as Lang) || "bn";
  });

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem("smk_language", l);
  };

  const t = (key: string): string => {
    return translations[key]?.[lang] || translations[key]?.["en"] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
