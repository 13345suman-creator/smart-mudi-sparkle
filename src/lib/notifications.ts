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
