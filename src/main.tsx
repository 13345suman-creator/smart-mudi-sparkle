import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Auto-refresh service worker when new version is available (fixes APK/WebView stale cache)
if ("serviceWorker" in navigator) {
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    // New SW took control → reload to get fresh assets
    window.location.reload();
  });

  // Periodically check for updates (every 60s) — critical for Median/WebView APK
  setInterval(() => {
    navigator.serviceWorker.getRegistrations().then((regs) => {
      regs.forEach((reg) => reg.update().catch(() => {}));
    });
  }, 60_000);
}

createRoot(document.getElementById("root")!).render(<App />);
