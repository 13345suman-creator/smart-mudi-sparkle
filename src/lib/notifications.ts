// Notification helper - checks localStorage settings before firing

function isEnabled(key: string): boolean {
  return localStorage.getItem(key) !== "false";
}

function isSoundEnabled(): boolean {
  return localStorage.getItem("smk_sound") !== "false";
}

function unlockAudioContext(ctx: AudioContext) {
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
}

function playSound() {
  if (!isSoundEnabled()) return;
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    unlockAudioContext(ctx);
    const now = ctx.currentTime;

    // First tone - pleasant chime
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.value = 880;
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.2);

    // Second tone - higher, confirming
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.value = 1320;
    gain2.gain.setValueAtTime(0, now + 0.12);
    gain2.gain.linearRampToValueAtTime(0.18, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.4);
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

// Get a matching voice for the language (Web Speech API needs voice loading)
function getVoiceForLang(targetLang: string): SpeechSynthesisVoice | null {
  try {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;
    let v = voices.find(v => v.lang === targetLang);
    if (v) return v;
    const prefix = targetLang.split("-")[0];
    v = voices.find(v => v.lang.toLowerCase().startsWith(prefix.toLowerCase()));
    return v || null;
  } catch { return null; }
}

// Speak a message using Web Speech API in the selected language
function speak(message: string) {
  if (!isSoundEnabled()) return;
  try {
    const synth = window.speechSynthesis;
    if (!synth) return;
    const targetLang = getSpeechLang();

    const doSpeak = () => {
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = targetLang;
      const voice = getVoiceForLang(targetLang);
      if (voice) utterance.voice = voice;
      utterance.rate = 0.95;
      utterance.pitch = 1;
      utterance.volume = 1;
      const fallbackBeep = () => playSound();
      utterance.onerror = fallbackBeep;
      synth.speak(utterance);

      if (synth.paused) {
        synth.resume();
      }

      setTimeout(() => {
        if (!synth.speaking) {
          fallbackBeep();
        }
      }, 900);
    };

    if (synth.getVoices().length === 0) {
      const handler = () => {
        synth.removeEventListener("voiceschanged", handler);
        doSpeak();
      };
      synth.addEventListener("voiceschanged", handler);
      setTimeout(doSpeak, 350);
    } else {
      doSpeak();
    }
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
    const mode = paymentMode === "upi" ? "ইউ পি আই" : paymentMode === "cash" ? "নগদ" : paymentMode === "mixed" ? "নগদ ও ইউ পি আই" : paymentMode;
    message = `পেমেন্ট সফল। ${amount} ${cur}, ${mode} এর মাধ্যমে গ্রহণ করা হয়েছে। ধন্যবাদ।`;
  } else if (lang === "hi") {
    const mode = paymentMode === "upi" ? "यू पी आई" : paymentMode === "cash" ? "नकद" : paymentMode === "mixed" ? "नकद और यू पी आई" : paymentMode;
    message = `भुगतान सफल। ${amount} ${cur}, ${mode} के माध्यम से प्राप्त हुआ। धन्यवाद।`;
  } else {
    const mode = paymentMode === "upi" ? "U P I" : paymentMode === "cash" ? "cash" : paymentMode === "mixed" ? "cash and U P I" : paymentMode;
    message = `Payment successful. ${amount} ${cur} received via ${mode}. Thank you.`;
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
    const m = method === "upi" ? "ইউ পি আই" : method === "cash" ? "নগদ" : method;
    if (rem <= 0) {
      message = `উধারি পরিশোধ সম্পূর্ণ। ${amt} ${cur} ${m} এর মাধ্যমে জমা হয়েছে। সম্পূর্ণ বাকি পরিশোধ হয়ে গেছে। ধন্যবাদ।`;
    } else {
      message = `${amt} ${cur} ${m} এর মাধ্যমে জমা হয়েছে। বাকি আছে ${rem} ${cur}।`;
    }
  } else if (lang === "hi") {
    const m = method === "upi" ? "यू पी आई" : method === "cash" ? "नकद" : method;
    if (rem <= 0) {
      message = `उधारी चुकता। ${amt} ${cur} ${m} से प्राप्त हुआ। पूरी उधारी चुकता हो गई। धन्यवाद।`;
    } else {
      message = `${amt} ${cur} ${m} से प्राप्त हुआ। अभी ${rem} ${cur} बाकी है।`;
    }
  } else {
    const m = method === "upi" ? "U P I" : method === "cash" ? "cash" : method;
    if (rem <= 0) {
      message = `Udhari cleared. ${amt} ${cur} received via ${m}. Full balance has been settled. Thank you.`;
    } else {
      message = `${amt} ${cur} received via ${m}. Remaining balance is ${rem} ${cur}.`;
    }
  }
  speak(message);
}

// Test voice in selected language (used in Settings)
export function speakVoiceTest() {
  const lang = localStorage.getItem("smk_language") || "en";
  let message = "";
  if (lang === "bn") {
    message = "নমস্কার! এটি একটি ভয়েস টেস্ট। স্মার্ট মুদি খানা আপনাকে স্বাগত জানাচ্ছে। ভাষা সঠিকভাবে নির্বাচিত হয়েছে।";
  } else if (lang === "hi") {
    message = "नमस्ते! यह एक वॉयस टेस्ट है। स्मार्ट मुदी खाना आपका स्वागत करता है। भाषा सही ढंग से चयनित है।";
  } else {
    message = "Hello! This is a voice test. Smart Mudi Khana welcomes you. The language is correctly selected.";
  }
  // Force-enable for the test even if sound disabled? Keep respecting setting.
  speak(message);
}

// Voice notification for new udhari
export function speakNewUdhari(customerName: string, amount: number) {
  const lang = localStorage.getItem("smk_language") || "en";
  const cur = getCurrencyWord();
  const amt = Math.round(amount);
  
  let message = "";
  if (lang === "bn") {
    message = `নতুন উধারি। ${customerName} এর জন্য ${amt} ${cur} উধারি যোগ করা হয়েছে।`;
  } else if (lang === "hi") {
    message = `नई उधारी। ${customerName} के लिए ${amt} ${cur} उधारी जोड़ी गई।`;
  } else {
    message = `New udhari. ${amt} ${cur} credit added for ${customerName}.`;
  }
  speak(message);
}
