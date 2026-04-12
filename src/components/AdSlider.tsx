import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { X } from "lucide-react";

interface Ad {
  id: string;
  imageUrl: string;
  message: string;
  published: boolean;
  scheduledTime?: string;
  expiresAt?: string;
  createdAt: string;
}

const AdSlider = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissed, setDismissed] = useState<Set<string>>(() => {
    try {
      const saved = sessionStorage.getItem("smk_dismissed_ads");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  const [animDir, setAnimDir] = useState<"in" | "out">("in");

  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "ads"),
      (snap) => {
        const now = new Date();
        const data = snap.docs
          .map(d => ({ id: d.id, ...d.data() } as Ad))
          .filter(ad => {
            if (!ad.published) return false;
            if (ad.scheduledTime) {
              const scheduled = new Date(ad.scheduledTime);
              if (now < scheduled) return false;
            }
            if (ad.expiresAt) {
              const expires = new Date(ad.expiresAt);
              if (now > expires) return false;
            }
            return true;
          })
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setAds(data);
      },
      (err) => console.warn("Ads listener error:", err.message)
    );
    return () => unsub();
  }, []);

  // Auto-slide with animation
  useEffect(() => {
    if (ads.length <= 1) return;
    const timer = setInterval(() => {
      setAnimDir("out");
      setTimeout(() => {
        setCurrentIndex(prev => (prev + 1) % ads.length);
        setAnimDir("in");
      }, 300);
    }, 5000);
    return () => clearInterval(timer);
  }, [ads.length]);

  const dismiss = useCallback((id: string) => {
    setDismissed(prev => {
      const next = new Set(prev);
      next.add(id);
      sessionStorage.setItem("smk_dismissed_ads", JSON.stringify([...next]));
      return next;
    });
  }, []);

  const visibleAds = ads.filter(ad => !dismissed.has(ad.id));
  if (visibleAds.length === 0) return null;

  const current = visibleAds[currentIndex % visibleAds.length];
  if (!current) return null;

  return (
    <div className="px-4 mb-2">
      <div className={`relative rounded-xl overflow-hidden glass-card border border-primary/20 shadow-lg transition-all duration-300 ${
        animDir === "in" ? "animate-fade-in" : "opacity-0 translate-y-1"
      }`}>
        <button
          onClick={() => dismiss(current.id)}
          className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-foreground/20 backdrop-blur flex items-center justify-center text-background hover:bg-foreground/40 transition-colors"
        >
          <X size={12} />
        </button>

        {current.imageUrl && (
          <img
            src={current.imageUrl}
            alt="Ad"
            className="w-full h-36 object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        )}

        {current.message && (
          <div className={`px-4 py-3 ${current.imageUrl ? '' : 'py-4'}`}>
            <p className="text-sm font-medium text-foreground leading-snug">{current.message}</p>
          </div>
        )}

        {/* Dots */}
        {visibleAds.length > 1 && (
          <div className="flex justify-center gap-1.5 pb-2.5">
            {visibleAds.map((_, i) => (
              <button
                key={i}
                onClick={() => { setAnimDir("out"); setTimeout(() => { setCurrentIndex(i); setAnimDir("in"); }, 200); }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentIndex % visibleAds.length
                    ? "bg-primary w-5"
                    : "bg-muted-foreground/30 w-1.5"
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdSlider;
