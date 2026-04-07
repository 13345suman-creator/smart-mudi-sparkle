import { useState, useEffect, useCallback } from "react";
import { db } from "@/lib/firebase";
import { collection, onSnapshot, query, where, orderBy } from "firebase/firestore";
import { X } from "lucide-react";

interface Ad {
  id: string;
  imageUrl: string;
  message: string;
  published: boolean;
  scheduledTime?: string;
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
              return now >= scheduled;
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

  // Auto-slide
  useEffect(() => {
    if (ads.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % ads.length);
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
      <div className="relative rounded-xl overflow-hidden glass-card border border-primary/20 shadow-lg">
        <button
          onClick={() => dismiss(current.id)}
          className="absolute top-2 right-2 z-10 w-6 h-6 rounded-full bg-black/40 backdrop-blur flex items-center justify-center text-white hover:bg-black/60 transition-colors"
        >
          <X size={12} />
        </button>

        {current.imageUrl && (
          <img
            src={current.imageUrl}
            alt="Ad"
            className="w-full h-32 object-cover"
          />
        )}

        {current.message && (
          <div className={`px-4 py-2.5 ${current.imageUrl ? '' : 'py-4'}`}>
            <p className="text-sm font-medium text-foreground leading-snug">{current.message}</p>
          </div>
        )}

        {/* Dots */}
        {visibleAds.length > 1 && (
          <div className="flex justify-center gap-1.5 pb-2">
            {visibleAds.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i === currentIndex % visibleAds.length
                    ? "bg-primary w-4"
                    : "bg-muted-foreground/30"
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
