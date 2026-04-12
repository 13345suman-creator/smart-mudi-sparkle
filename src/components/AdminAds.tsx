import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, X, Upload, Eye, EyeOff, Clock, CheckCircle, Crop, Save, Timer, Calendar, Type, Image as ImageIcon } from "lucide-react";
import { db, storage } from "@/lib/firebase";
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { toast } from "sonner";

interface Ad {
  id: string;
  imageUrl: string;
  message: string;
  published: boolean;
  scheduledTime: string;
  createdAt: string;
  expiresAt?: string;
}

const AdminAds = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [message, setMessage] = useState("");
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [scheduledTime, setScheduledTime] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previewAd, setPreviewAd] = useState<Ad | null>(null);
  const [confirmPublish, setConfirmPublish] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Crop state
  const [showCrop, setShowCrop] = useState(false);
  const [cropImg, setCropImg] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, w: 100, h: 100 });

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "ads"), (snap) => {
      setAds(snap.docs.map(d => ({ id: d.id, ...d.data() } as Ad)).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    }, (err) => console.warn("Ads listener:", err.message));
    return () => unsub();
  }, []);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error("Max file size: 5MB"); return; }
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const url = ev.target?.result as string;
      setImagePreview(url);
      setCropImg(url);
    };
    reader.readAsDataURL(file);
  };

  const openCrop = () => {
    if (!imagePreview) return;
    setCropImg(imagePreview);
    setCropArea({ x: 10, y: 10, w: 80, h: 80 });
    setShowCrop(true);
  };

  const applyCrop = () => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const sx = (cropArea.x / 100) * img.naturalWidth;
    const sy = (cropArea.y / 100) * img.naturalHeight;
    const sw = (cropArea.w / 100) * img.naturalWidth;
    const sh = (cropArea.h / 100) * img.naturalHeight;
    canvas.width = sw;
    canvas.height = sh;
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      setImagePreview(url);
      setImageFile(new File([blob], "cropped-ad.jpg", { type: "image/jpeg" }));
      setShowCrop(false);
    }, "image/jpeg", 0.9);
  };

  const handleCreate = async () => {
    if (!message && !imageFile) { toast.error("Add an image or message"); return; }
    setUploading(true);
    try {
      let imageUrl = "";
      if (imageFile) {
        const fileName = `ads/${Date.now()}-${imageFile.name}`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, imageFile);
        imageUrl = await getDownloadURL(storageRef);
      }
      const adId = `ad-${Date.now()}`;
      const ad: Ad = {
        id: adId,
        imageUrl,
        message,
        published: false,
        scheduledTime: scheduledTime || "",
        expiresAt: expiresAt || "",
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "ads", adId), ad);
      toast.success("Ad created! Preview and publish it.");
      setMessage(""); setImagePreview(""); setImageFile(null);
      setScheduledTime(""); setExpiresAt(""); setShowCreate(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to create ad");
    } finally { setUploading(false); }
  };

  const togglePublish = async (id: string, publish: boolean) => {
    if (publish && !confirmPublish) { setConfirmPublish(id); return; }
    try {
      await updateDoc(doc(db, "ads", id), { published: publish });
      toast.success(publish ? "Ad published! Now visible to all users." : "Ad unpublished.");
      setConfirmPublish(null);
    } catch (err: any) { toast.error(err.message || "Failed to update"); }
  };

  const deleteAd = async (id: string) => {
    if (!confirm("Delete this ad permanently?")) return;
    try {
      await deleteDoc(doc(db, "ads", id));
      toast.success("Ad deleted");
    } catch (err: any) { toast.error(err.message || "Failed to delete"); }
  };

  const getTimeRemaining = (ad: Ad) => {
    if (!ad.expiresAt) return null;
    const now = new Date();
    const exp = new Date(ad.expiresAt);
    const diff = exp.getTime() - now.getTime();
    if (diff <= 0) return "Expired";
    const hrs = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    if (hrs > 24) return `${Math.floor(hrs / 24)}d left`;
    if (hrs > 0) return `${hrs}h ${mins}m left`;
    return `${mins}m left`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <span className="text-sm">📢</span>
          </div>
          <div>
            <h3 className="font-display font-bold text-base text-foreground">Ad Manager</h3>
            <p className="text-[10px] text-muted-foreground">{ads.length} total · {ads.filter(a => a.published).length} live</p>
          </div>
        </div>
        <button onClick={() => setShowCreate(true)} className="gradient-primary text-primary-foreground px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg">
          <Plus size={14} /> New Ad
        </button>
      </div>

      {/* Ad List */}
      <div className="space-y-2.5">
        {ads.map(ad => {
          const timeLeft = getTimeRemaining(ad);
          return (
            <div key={ad.id} className="glass-card p-3.5 rounded-xl">
              <div className="flex gap-3">
                {ad.imageUrl ? (
                  <img src={ad.imageUrl} alt="" className="w-20 h-20 rounded-lg object-cover flex-shrink-0 border border-border/50" />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-secondary/50 flex items-center justify-center flex-shrink-0 border border-border/50">
                    <Type size={20} className="text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground line-clamp-2 font-medium">{ad.message || "(Image only)"}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                      ad.published ? "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))]" : "bg-muted text-muted-foreground"
                    }`}>
                      {ad.published ? "● LIVE" : "DRAFT"}
                    </span>
                    {ad.scheduledTime && (
                      <span className="text-[9px] text-muted-foreground flex items-center gap-0.5 bg-secondary/50 px-1.5 py-0.5 rounded-full">
                        <Calendar size={8} /> {new Date(ad.scheduledTime).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                      </span>
                    )}
                    {timeLeft && (
                      <span className={`text-[9px] font-semibold flex items-center gap-0.5 px-1.5 py-0.5 rounded-full ${
                        timeLeft === "Expired" ? "bg-destructive/15 text-destructive" : "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))]"
                      }`}>
                        <Timer size={8} /> {timeLeft}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <button onClick={() => setPreviewAd(ad)} className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors">
                    <Eye size={13} />
                  </button>
                  <button onClick={() => togglePublish(ad.id, !ad.published)} className={`p-2 rounded-lg transition-colors ${ad.published ? "bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))] hover:bg-[hsl(var(--warning))]/20" : "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/20"}`}>
                    {ad.published ? <EyeOff size={13} /> : <CheckCircle size={13} />}
                  </button>
                  <button onClick={() => deleteAd(ad.id)} className="p-2 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {ads.length === 0 && (
          <div className="glass-card p-8 text-center">
            <div className="text-4xl mb-3">📢</div>
            <p className="text-sm font-semibold text-foreground mb-1">No Ads Yet</p>
            <p className="text-xs text-muted-foreground">Create your first ad to show on all users' dashboards</p>
          </div>
        )}
      </div>

      {/* Confirm Publish Modal */}
      {confirmPublish && (
        <div className="modal-overlay" onClick={() => setConfirmPublish(null)}>
          <div className="glass-card w-[88%] max-w-sm p-5 animate-slide-up text-center" onClick={e => e.stopPropagation()}>
            <CheckCircle size={40} className="text-[hsl(var(--success))] mx-auto mb-3" />
            <h3 className="font-display font-bold text-lg text-foreground mb-2">Publish Ad?</h3>
            <p className="text-xs text-muted-foreground mb-4">This ad will be visible to all users on their dashboard.</p>
            <div className="flex gap-2">
              <button onClick={() => setConfirmPublish(null)} className="flex-1 glass-card py-2.5 rounded-xl text-sm font-semibold text-foreground">Cancel</button>
              <button onClick={() => togglePublish(confirmPublish, true)} className="flex-1 gradient-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold">Publish ✓</button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewAd && (
        <div className="modal-overlay" onClick={() => setPreviewAd(null)}>
          <div className="glass-card w-[88%] max-w-sm p-4 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-sm text-foreground">Ad Preview</h3>
              <button onClick={() => setPreviewAd(null)} className="text-muted-foreground"><X size={18} /></button>
            </div>
            <div className="rounded-xl overflow-hidden border border-primary/20">
              {previewAd.imageUrl && <img src={previewAd.imageUrl} alt="" className="w-full h-40 object-cover" />}
              {previewAd.message && <p className="px-4 py-3 text-sm text-foreground">{previewAd.message}</p>}
            </div>
            <p className="text-[10px] text-muted-foreground text-center mt-2">This is exactly how users will see it</p>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="glass-card w-[92%] max-w-md p-5 animate-slide-up max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                  <Plus size={16} className="text-primary-foreground" />
                </div>
                <h3 className="font-display font-bold text-lg text-foreground">Create Ad</h3>
              </div>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              {/* Image Upload */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-2 block flex items-center gap-1.5">
                  <ImageIcon size={12} className="text-primary" /> Photo / GIF
                </label>
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="" className="w-full h-40 object-cover rounded-xl border border-border/50" />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button onClick={openCrop} className="p-2 rounded-lg bg-background/80 text-foreground backdrop-blur shadow-sm">
                        <Crop size={14} />
                      </button>
                      <button onClick={() => { setImagePreview(""); setImageFile(null); }} className="p-2 rounded-lg bg-background/80 text-foreground backdrop-blur shadow-sm">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-32 rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-2 hover:border-primary/50 transition-colors"
                  >
                    <Upload size={24} className="text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Upload photo/GIF (max 5MB)</p>
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*,.gif" className="hidden" onChange={handleImageSelect} />
              </div>

              {/* Message */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block flex items-center gap-1.5">
                  <Type size={12} className="text-primary" /> Message
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Write your ad message..."
                  className="w-full glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none rounded-xl placeholder:text-muted-foreground resize-none h-20 focus:ring-1 focus:ring-primary"
                  maxLength={200}
                />
                <p className="text-[10px] text-muted-foreground text-right">{message.length}/200</p>
              </div>

              {/* Schedule */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block flex items-center gap-1.5">
                  <Calendar size={12} className="text-primary" /> Schedule (optional)
                </label>
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={e => setScheduledTime(e.target.value)}
                  className="w-full glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none rounded-xl focus:ring-1 focus:ring-primary"
                />
              </div>

              {/* Timer / Expiry */}
              <div>
                <label className="text-xs font-semibold text-foreground mb-1 block flex items-center gap-1.5">
                  <Timer size={12} className="text-[hsl(var(--warning))]" /> Auto-expire (optional)
                </label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={e => setExpiresAt(e.target.value)}
                  className="w-full glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none rounded-xl focus:ring-1 focus:ring-primary"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Ad will auto-hide after this time</p>
              </div>

              {/* Create Button */}
              <button
                onClick={handleCreate}
                disabled={uploading || (!message && !imageFile)}
                className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2 shadow-lg"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Save size={14} /> Create Ad (Draft)
                  </>
                )}
              </button>

              <p className="text-[10px] text-muted-foreground text-center">
                Ad will be saved as draft. Preview and publish separately.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Crop Modal */}
      {showCrop && (
        <div className="modal-overlay" onClick={() => setShowCrop(false)}>
          <div className="glass-card w-[92%] max-w-md p-5 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-sm text-foreground">Crop Image</h3>
              <button onClick={() => setShowCrop(false)} className="text-muted-foreground"><X size={18} /></button>
            </div>
            <div className="relative">
              <img ref={imgRef} src={cropImg} alt="" className="w-full rounded-lg" crossOrigin="anonymous" />
              <div
                className="absolute border-2 border-primary/80 bg-primary/10"
                style={{
                  left: `${cropArea.x}%`, top: `${cropArea.y}%`,
                  width: `${cropArea.w}%`, height: `${cropArea.h}%`,
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div>
                <label className="text-[10px] text-muted-foreground">Width %</label>
                <input type="range" min="20" max="100" value={cropArea.w} onChange={e => setCropArea(p => ({ ...p, w: +e.target.value }))} className="w-full accent-primary" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Height %</label>
                <input type="range" min="20" max="100" value={cropArea.h} onChange={e => setCropArea(p => ({ ...p, h: +e.target.value }))} className="w-full accent-primary" />
              </div>
            </div>
            <canvas ref={canvasRef} className="hidden" />
            <button onClick={applyCrop} className="w-full mt-3 gradient-primary text-primary-foreground py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
              <Crop size={14} /> Apply Crop
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAds;
