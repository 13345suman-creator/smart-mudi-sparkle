// Notification helper - checks localStorage settings before firing

function isEnabled(key: string): boolean {
  return localStorage.getItem(key) !== "false";
}

function isSoundEnabled(): boolean {
  return localStorage.getItem("smk_sound") !== "false";
}

function playSound() {
  if (!isSoundEnabled()) return;
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 800;
    gain.gain.value = 0.1;
    osc.start();
    osc.stop(ctx.currentTime + 0.15);
  } catch {}
}

function sendBrowserNotif(title: string, body: string) {
  if ("Notification" in window && Notification.permission === "granted") {
    try { new Notification(title, { body, icon: "/favicon.ico" }); } catch {}
  }
}

// Get speech language code based on selected app language
function getSpeechLang(): string {
  const lang = localStorage.getItem("smk_language") || "en";
  switch (lang) {
    case "bn": return "bn-BD";
    case "hi": return "hi-IN";
    default: return "en-IN";
  }
}

// Speak a message using Web Speech API in the selected language
function speak(message: string) {
  if (!isSoundEnabled()) return;
  try {
    const synth = window.speechSynthesis;
    // Cancel any ongoing speech
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = getSpeechLang();
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 0.9;
    synth.speak(utterance);
  } catch {}
}

// Get currency name in selected language
function getCurrencyWord(): string {
  const lang = localStorage.getItem("smk_language") || "en";
  const symbol = localStorage.getItem("smk_currency") || "₹";
  if (symbol === "₹") {
    if (lang === "bn") return "টাকা";
    if (lang === "hi") return "रुपये";
    return "rupees";
  }
  if (symbol === "$") return "dollars";
  if (symbol === "€") return "euros";
  if (symbol === "£") return "pounds";
  return "";
}

export function notifyBill(billNo: string, total: number, currency: string) {
  if (!isEnabled("smk_notif_bill")) return;
  playSound();
  sendBrowserNotif("🧾 New Bill Created", `Bill #${billNo} — ${currency}${total.toFixed(0)}`);
}

export function notifyLowStock(productName: string, stock: number) {
  if (!isEnabled("smk_notif_lowstock")) return;
  playSound();
  sendBrowserNotif("⚠️ Low Stock Alert", `${productName} — only ${stock} left`);
}

export function notifyUdhari(customerName: string, amount: number, currency: string) {
  if (!isEnabled("smk_notif_udhari")) return;
  playSound();
  sendBrowserNotif("📋 New Udhari", `${customerName} — ${currency}${amount.toFixed(0)}`);
}

// Voice notification for bill payment completion
export function speakBillPayment(total: number, paymentMode: string) {
  const lang = localStorage.getItem("smk_language") || "en";
  const cur = getCurrencyWord();
  const amount = Math.round(total);
  
  let message = "";
  if (lang === "bn") {
    const mode = paymentMode === "upi" ? "UPI" : paymentMode === "cash" ? "নগদ" : paymentMode === "mixed" ? "মিক্সড" : paymentMode;
    message = `${amount} ${cur} পেমেন্ট সম্পূর্ণ হয়েছে ${mode} থেকে`;
  } else if (lang === "hi") {
    const mode = paymentMode === "upi" ? "UPI" : paymentMode === "cash" ? "नकद" : paymentMode === "mixed" ? "मिक्स्ड" : paymentMode;
    message = `${amount} ${cur} का भुगतान ${mode} से पूरा हुआ`;
  } else {
    message = `${amount} ${cur} payment completed via ${paymentMode}`;
  }
  speak(message);
}

// Voice notification for udhari payment received
export function speakUdhariPayment(amount: number, remaining: number, method: string) {
  const lang = localStorage.getItem("smk_language") || "en";
  const cur = getCurrencyWord();
  const amt = Math.round(amount);
  const rem = Math.round(remaining);
  
  let message = "";
  if (lang === "bn") {
    const m = method === "upi" ? "UPI" : method === "cash" ? "নগদ" : method;
    if (rem <= 0) {
      message = `${amt} ${cur} জমা হয়েছে ${m} থেকে। সম্পূর্ণ উধারি পরিশোধ হয়ে গেছে।`;
    } else {
      message = `${amt} ${cur} জমা হয়েছে ${m} থেকে। আর ${rem} ${cur} বাকি আছে।`;
    }
  } else if (lang === "hi") {
    const m = method === "upi" ? "UPI" : method === "cash" ? "नकद" : method;
    if (rem <= 0) {
      message = `${amt} ${cur} जमा हुआ ${m} से। पूरी उधारी चुकता हो गई।`;
    } else {
      message = `${amt} ${cur} जमा हुआ ${m} से। अभी ${rem} ${cur} बाकी है।`;
    }
  } else {
    if (rem <= 0) {
      message = `${amt} ${cur} received via ${method}. Udhari fully cleared.`;
    } else {
      message = `${amt} ${cur} received via ${method}. ${rem} ${cur} remaining.`;
    }
  }
  speak(message);
}

// Voice notification for new udhari
export function speakNewUdhari(customerName: string, amount: number) {
  const lang = localStorage.getItem("smk_language") || "en";
  const cur = getCurrencyWord();
  const amt = Math.round(amount);
  
  let message = "";
  if (lang === "bn") {
    message = `${customerName} এর ${amt} ${cur} উধারি যোগ হয়েছে।`;
  } else if (lang === "hi") {
    message = `${customerName} की ${amt} ${cur} उधारी जोड़ी गई।`;
  } else {
    message = `${amt} ${cur} udhari added for ${customerName}.`;
  }
  speak(message);
}
