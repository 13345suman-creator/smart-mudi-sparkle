import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, X, Upload, Eye, EyeOff, Clock, CheckCircle, Image, Crop, Save } from "lucide-react";
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
}

const AdminAds = () => {
  const [ads, setAds] = useState<Ad[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [message, setMessage] = useState("");
  const [imagePreview, setImagePreview] = useState<string>("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [scheduledTime, setScheduledTime] = useState("");
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
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Max file size: 5MB");
      return;
    }
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
    if (!message && !imageFile) {
      toast.error("Add an image or message");
      return;
    }

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
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, "ads", adId), ad);
      toast.success("Ad created! Preview and publish it.");

      setMessage("");
      setImagePreview("");
      setImageFile(null);
      setScheduledTime("");
      setShowCreate(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to create ad");
    } finally {
      setUploading(false);
    }
  };

  const togglePublish = async (id: string, publish: boolean) => {
    if (publish && !confirmPublish) {
      setConfirmPublish(id);
      return;
    }
    try {
      await updateDoc(doc(db, "ads", id), { published: publish });
      toast.success(publish ? "Ad published! Now visible to all users." : "Ad unpublished.");
      setConfirmPublish(null);
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    }
  };

  const deleteAd = async (id: string) => {
    if (!confirm("Delete this ad permanently?")) return;
    try {
      await deleteDoc(doc(db, "ads", id));
      toast.success("Ad deleted");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-display font-bold text-base text-foreground">📢 Ad Manager</h3>
        <button onClick={() => setShowCreate(true)} className="gradient-primary text-primary-foreground px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5">
          <Plus size={14} /> Create Ad
        </button>
      </div>

      <div className="space-y-2">
        {ads.map(ad => (
          <div key={ad.id} className="glass-card p-3 rounded-xl">
            <div className="flex gap-3">
              {ad.imageUrl && (
                <img src={ad.imageUrl} alt="" className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground truncate">{ad.message || "(Image only)"}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    ad.published ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]" : "bg-muted text-muted-foreground"
                  }`}>
                    {ad.published ? "LIVE" : "DRAFT"}
                  </span>
                  {ad.scheduledTime && (
                    <span className="text-[9px] text-muted-foreground flex items-center gap-1">
                      <Clock size={8} /> {new Date(ad.scheduledTime).toLocaleString("en-IN", { dateStyle: "short", timeStyle: "short" })}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => setPreviewAd(ad)} className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Eye size={12} />
                </button>
                <button onClick={() => togglePublish(ad.id, !ad.published)} className={`p-1.5 rounded-lg ${ad.published ? "bg-warning/10 text-warning" : "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]"}`}>
                  {ad.published ? <EyeOff size={12} /> : <CheckCircle size={12} />}
                </button>
                <button onClick={() => deleteAd(ad.id)} className="p-1.5 rounded-lg bg-destructive/10 text-destructive">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {ads.length === 0 && (
          <div className="glass-card p-6 text-center">
            <p className="text-sm text-muted-foreground">No ads created yet</p>
          </div>
        )}
      </div>

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
            <p className="text-[10px] text-muted-foreground text-center mt-2">This is exactly how users will see it on dashboard</p>
          </div>
        </div>
      )}

      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="glass-card w-[92%] max-w-md p-5 animate-slide-up max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-foreground">Create New Ad</h3>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-2 block">Photo / GIF</label>
                {imagePreview ? (
                  <div className="relative">
                    <img src={imagePreview} alt="" className="w-full h-40 object-cover rounded-xl" />
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button onClick={openCrop} className="p-1.5 rounded-lg bg-black/50 text-white backdrop-blur">
                        <Crop size={14} />
                      </button>
                      <button onClick={() => { setImagePreview(""); setImageFile(null); }} className="p-1.5 rounded-lg bg-black/50 text-white backdrop-blur">
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
                    <p className="text-xs text-muted-foreground">Click to upload photo/GIF (max 5MB)</p>
                  </button>
                )}
                <input ref={fileInputRef} type="file" accept="image/*,.gif" className="hidden" onChange={handleImageSelect} />
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Message</label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Ad message text..."
                  className="w-full glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none rounded-xl placeholder:text-muted-foreground resize-none h-20"
                  maxLength={200}
                />
                <p className="text-[10px] text-muted-foreground text-right">{message.length}/200</p>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1.5">
                  <Clock size={12} /> Schedule Time (optional)
                </label>
                <input
                  type="datetime-local"
                  value={scheduledTime}
                  onChange={e => setScheduledTime(e.target.value)}
                  className="w-full glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none rounded-xl"
                />
              </div>

              <button
                onClick={handleCreate}
                disabled={uploading || (!message && !imageFile)}
                className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm disabled:opacity-40 flex items-center justify-center gap-2"
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
                className="absolute border-2 border-white/80 bg-white/10"
                style={{
                  left: `${cropArea.x}%`, top: `${cropArea.y}%`,
                  width: `${cropArea.w}%`, height: `${cropArea.h}%`,
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div>
                <label className="text-[10px] text-muted-foreground">Width %</label>
                <input type="range" min="20" max="100" value={cropArea.w} onChange={e => setCropArea(p => ({ ...p, w: +e.target.value }))} className="w-full" />
              </div>
              <div>
                <label className="text-[10px] text-muted-foreground">Height %</label>
                <input type="range" min="20" max="100" value={cropArea.h} onChange={e => setCropArea(p => ({ ...p, h: +e.target.value }))} className="w-full" />
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
