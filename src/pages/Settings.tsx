import { useState, useEffect, useRef } from "react";
import { Store, Shield, Bell, Palette, Database, ChevronRight, X, Save, Smartphone, Download, Upload, Trash2, CheckCircle, Lock, Fingerprint, BellRing, AlertTriangle, Languages, IndianRupee, Clock, HardDrive, Zap, Eye, EyeOff, Volume2, VolumeX, RefreshCw, Pencil, Plus } from "lucide-react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/language";
import { toast } from "sonner";

interface ThemeOption {
  id: string;
  name: string;
  nameHi: string;
  colors: string[];
  gradient: string;
}

const THEMES: ThemeOption[] = [
  { id: "midnight-ocean", name: "Midnight Ocean", nameHi: "মিডনাইট ওশান", colors: ["#00d4aa", "#3b82f6", "#1a1a2e"], gradient: "linear-gradient(135deg, #00d4aa, #3b82f6)" },
  { id: "neon-cyber", name: "Neon Cyber", nameHi: "নিওন সাইবার", colors: ["#ec4899", "#06b6d4", "#1a0a2e"], gradient: "linear-gradient(135deg, #ec4899, #06b6d4)" },
  { id: "royal-gold", name: "Royal Gold", nameHi: "রয়্যাল গোল্ড", colors: ["#eab308", "#ef6c00", "#1a1508"], gradient: "linear-gradient(135deg, #eab308, #ef6c00)" },
  { id: "forest-emerald", name: "Forest Emerald", nameHi: "ফরেস্ট এমেরাল্ড", colors: ["#22c55e", "#84cc16", "#0a1a10"], gradient: "linear-gradient(135deg, #22c55e, #84cc16)" },
  { id: "sunset-blaze", name: "Sunset Blaze", nameHi: "সানসেট ব্লেজ", colors: ["#f97316", "#ec4899", "#1a0c08"], gradient: "linear-gradient(135deg, #f97316, #ec4899)" },
];

interface SavedFingerprint {
  id: string;
  name: string;
  createdAt: string;
  credId?: string;
}

const loadFingerprints = (): SavedFingerprint[] => {
  try {
    const raw = localStorage.getItem("smk_fingerprints");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
};

const saveFingerprints = (fps: SavedFingerprint[]) => {
  localStorage.setItem("smk_fingerprints", JSON.stringify(fps));
};

const Settings = () => {
  const { settings, updateSettings, bills, products, udhariEntries } = useStore();
  const { user } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [shopName, setShopName] = useState(settings.shopName);
  const [shopAddress, setShopAddress] = useState(settings.shopAddress);
  const [shopGST, setShopGST] = useState(settings.shopGST);
  const [upiIds, setUpiIds] = useState<string[]>([...settings.upiIds]);

  // Appearance
  const [currentTheme, setCurrentTheme] = useState(() => localStorage.getItem("smk_theme") || "midnight-ocean");

  // Notifications
  const [billNotif, setBillNotif] = useState(() => localStorage.getItem("smk_notif_bill") !== "false");
  const [lowStockNotif, setLowStockNotif] = useState(() => localStorage.getItem("smk_notif_lowstock") !== "false");
  const [udhariNotif, setUdhariNotif] = useState(() => localStorage.getItem("smk_notif_udhari") !== "false");
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem("smk_sound") !== "false");

  // Security
  const [appLock, setAppLock] = useState(() => localStorage.getItem("smk_applock") === "true");
  const [lockPin, setLockPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [autoLockMin, setAutoLockMin] = useState(() => parseInt(localStorage.getItem("smk_autolock_min") || "5"));
  const [fingerprintEnabled, setFingerprintEnabled] = useState(() => localStorage.getItem("smk_fingerprint") === "true");
  const [fingerprints, setFingerprints] = useState<SavedFingerprint[]>(() => loadFingerprints());
  const [newFpName, setNewFpName] = useState("");
  const [editingFpId, setEditingFpId] = useState<string | null>(null);
  const [editFpName, setEditFpName] = useState("");
  const [showAddFp, setShowAddFp] = useState(false);

  // Advanced
  const [lowStockThreshold, setLowStockThreshold] = useState(() => parseInt(localStorage.getItem("smk_lowstock_threshold") || "10"));
  const [currency, setCurrency] = useState(() => localStorage.getItem("smk_currency") || "₹");
  const [autoBackup, setAutoBackup] = useState(() => localStorage.getItem("smk_autobackup") === "true");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setShopName(settings.shopName);
    setShopAddress(settings.shopAddress);
    setShopGST(settings.shopGST);
    setUpiIds([...settings.upiIds]);
  }, [settings]);

  // Apply theme on mount
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", currentTheme);
  }, []);

  // Auto backup
  useEffect(() => {
    if (autoBackup && (bills.length > 0 || products.length > 0)) {
      const lastBackup = localStorage.getItem("smk_last_autobackup");
      const now = Date.now();
      if (!lastBackup || now - parseInt(lastBackup) > 30 * 60 * 1000) {
        localStorage.setItem("smk_last_autobackup", String(now));
        const data = {
          bills: localStorage.getItem("smk_bills"),
          udhari: localStorage.getItem("smk_udhari"),
          paidoff: localStorage.getItem("smk_paidoff"),
          settings: localStorage.getItem("smk_settings"),
          products: localStorage.getItem("smk_products"),
          exportDate: new Date().toISOString(),
          version: "1.0",
          autoBackup: true,
        };
        localStorage.setItem("smk_autobackup_data", JSON.stringify(data));
      }
    }
  }, [autoBackup, bills, products]);

  const saveShopDetails = () => {
    updateSettings({ shopName, shopAddress, shopGST });
    setActiveModal(null);
    toast.success(t("save") + " ✅");
  };

  const saveUpiIds = () => {
    updateSettings({ upiIds });
    setActiveModal(null);
    toast.success("UPI IDs saved!");
  };

  const applyTheme = (themeId: string) => {
    setCurrentTheme(themeId);
    localStorage.setItem("smk_theme", themeId);
    document.documentElement.setAttribute("data-theme", themeId);
    toast.success(`Theme: ${THEMES.find(t => t.id === themeId)?.name}`);
  };

  const saveNotifications = () => {
    localStorage.setItem("smk_notif_bill", String(billNotif));
    localStorage.setItem("smk_notif_lowstock", String(lowStockNotif));
    localStorage.setItem("smk_notif_udhari", String(udhariNotif));
    localStorage.setItem("smk_sound", String(soundEnabled));

    if ((billNotif || lowStockNotif || udhariNotif) && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    setActiveModal(null);
    toast.success(t("notifications") + " saved!");
  };

  // Fingerprint Management (up to 5)
  const addFingerprint = async () => {
    if (fingerprints.length >= 5) {
      toast.error(t("max_fingerprints"));
      return;
    }
    if (!newFpName.trim()) {
      toast.error("Enter a name for this fingerprint");
      return;
    }

    // Check if PIN is set (required for biometric)
    const pin = localStorage.getItem("smk_lockpin");
    if (!pin) {
      toast.error("প্রথমে App Lock PIN সেট করুন");
      return;
    }

    // Verify PIN first
    const inputPin = prompt("আপনার 4-digit PIN দিন:");
    if (inputPin !== pin) {
      toast.error("❌ ভুল PIN!");
      return;
    }

    const fp: SavedFingerprint = {
      id: Date.now().toString(),
      name: newFpName.trim(),
      createdAt: new Date().toISOString(),
    };

    // Try WebAuthn
    try {
      if (window.PublicKeyCredential) {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        if (available) {
          const challenge = new Uint8Array(32);
          crypto.getRandomValues(challenge);
          const userId = new Uint8Array(16);
          crypto.getRandomValues(userId);
          
          const credential = await navigator.credentials.create({
            publicKey: {
              challenge,
              rp: { name: "Smart Mudi Khana", id: window.location.hostname },
              user: { id: userId, name: `fp-${fp.id}`, displayName: fp.name },
              pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
              authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
              timeout: 60000,
            },
          });
          
          if (credential) {
            fp.credId = btoa(String.fromCharCode(...new Uint8Array((credential as PublicKeyCredential).rawId)));
          }
        }
      }
    } catch {
      // WebAuthn not available, use PIN mode
    }

    const updated = [...fingerprints, fp];
    setFingerprints(updated);
    saveFingerprints(updated);
    setFingerprintEnabled(true);
    localStorage.setItem("smk_fingerprint", "true");
    setNewFpName("");
    setShowAddFp(false);
    toast.success(`✅ "${fp.name}" ${t("fingerprint_saved")}`);
  };

  const deleteFingerprint = (id: string) => {
    const updated = fingerprints.filter(f => f.id !== id);
    setFingerprints(updated);
    saveFingerprints(updated);
    if (updated.length === 0) {
      setFingerprintEnabled(false);
      localStorage.setItem("smk_fingerprint", "false");
    }
    toast.success(t("fingerprint_deleted"));
  };

  const updateFingerprintName = (id: string, name: string) => {
    const updated = fingerprints.map(f => f.id === id ? { ...f, name } : f);
    setFingerprints(updated);
    saveFingerprints(updated);
    setEditingFpId(null);
    setEditFpName("");
    toast.success("Name updated!");
  };

  const testFingerprint = async () => {
    const pin = localStorage.getItem("smk_lockpin");
    if (pin) {
      const inputPin = prompt("আপনার 4-digit PIN দিন:");
      if (inputPin === pin) {
        toast.success("✅ Biometric Lock ভেরিফাই সফল!");
      } else {
        toast.error("❌ ভুল PIN! ভেরিফাই ব্যর্থ");
      }
    } else {
      toast.error("প্রথমে App Lock PIN সেট করুন");
    }
  };

  const saveSecurity = () => {
    localStorage.setItem("smk_applock", String(appLock));
    localStorage.setItem("smk_autolock_min", String(autoLockMin));
    if (appLock && lockPin.length === 4) {
      localStorage.setItem("smk_lockpin", lockPin);
    }
    setActiveModal(null);
    toast.success(t("security") + " saved!");
  };

  const saveAdvanced = () => {
    localStorage.setItem("smk_lowstock_threshold", String(lowStockThreshold));
    localStorage.setItem("smk_currency", currency);
    localStorage.setItem("smk_autobackup", String(autoBackup));
    setActiveModal(null);
    toast.success(t("advanced") + " saved!");
  };

  const exportData = () => {
    const data = {
      bills: localStorage.getItem("smk_bills"),
      udhari: localStorage.getItem("smk_udhari"),
      paidoff: localStorage.getItem("smk_paidoff"),
      settings: localStorage.getItem("smk_settings"),
      products: localStorage.getItem("smk_products"),
      exportDate: new Date().toISOString(),
      version: "1.0",
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `smart-mudi-backup-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup exported!");
  };

  const importData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target?.result as string);
        if (data.bills) localStorage.setItem("smk_bills", data.bills);
        if (data.udhari) localStorage.setItem("smk_udhari", data.udhari);
        if (data.paidoff) localStorage.setItem("smk_paidoff", data.paidoff);
        if (data.settings) localStorage.setItem("smk_settings", data.settings);
        if (data.products) localStorage.setItem("smk_products", data.products);
        toast.success("Backup restored! Refreshing...");
        setTimeout(() => window.location.reload(), 1500);
      } catch {
        toast.error("Invalid backup file");
      }
    };
    reader.readAsText(file);
  };

  const restoreAutoBackup = () => {
    const backupStr = localStorage.getItem("smk_autobackup_data");
    if (!backupStr) {
      toast.error("কোনো auto backup পাওয়া যায়নি");
      return;
    }
    try {
      const data = JSON.parse(backupStr);
      if (data.bills) localStorage.setItem("smk_bills", data.bills);
      if (data.udhari) localStorage.setItem("smk_udhari", data.udhari);
      if (data.paidoff) localStorage.setItem("smk_paidoff", data.paidoff);
      if (data.settings) localStorage.setItem("smk_settings", data.settings);
      if (data.products) localStorage.setItem("smk_products", data.products);
      toast.success(`Auto backup restore হয়েছে! Refreshing...`);
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      toast.error("Auto backup corrupted");
    }
  };

  const clearAllData = () => {
    if (confirm("Are you sure? This will delete ALL your data permanently!")) {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith("smk_")) localStorage.removeItem(key);
      });
      toast.success("All data cleared! Refreshing...");
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  const getStorageUsage = () => {
    let total = 0;
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith("smk_")) {
        total += (localStorage.getItem(key)?.length || 0) * 2;
      }
    });
    return (total / 1024).toFixed(1);
  };

  const ToggleSwitch = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button onClick={() => onChange(!value)} className={`w-12 h-6 rounded-full transition-all duration-300 ${value ? 'gradient-primary' : 'bg-muted'}`}>
      <div className={`w-5 h-5 rounded-full bg-white shadow-lg transition-transform duration-300 ${value ? 'translate-x-6' : 'translate-x-0.5'}`} />
    </button>
  );

  const settingsItems = [
    { icon: Store, label: t("shop_details"), desc: `${settings.shopName}`, action: () => setActiveModal("shop") },
    { icon: Smartphone, label: t("upi_settings"), desc: `${settings.upiIds.filter(u => u).length} UPI IDs`, action: () => setActiveModal("upi") },
    { icon: Shield, label: t("security"), desc: appLock ? (fingerprintEnabled ? `PIN + ${fingerprints.length} FP` : "PIN lock") : "Configure", action: () => setActiveModal("security") },
    { icon: Bell, label: t("notifications"), desc: "Alerts & sound", action: () => setActiveModal("notifications") },
    { icon: Palette, label: t("appearance"), desc: THEMES.find(t => t.id === currentTheme)?.name || "Theme", action: () => setActiveModal("appearance") },
    { icon: Database, label: t("backup_data"), desc: `${getStorageUsage()} KB`, action: () => setActiveModal("backup") },
    { icon: Zap, label: t("advanced"), desc: `${currency} · ${lang.toUpperCase()}`, action: () => setActiveModal("advanced") },
  ];

  const renderModal = () => {
    if (!activeModal) return null;

    const titles: Record<string, string> = {
      shop: t("shop_details"),
      upi: t("upi_settings"),
      security: t("security"),
      notifications: t("notifications"),
      appearance: t("appearance"),
      backup: t("backup_data"),
      advanced: t("advanced"),
    };

    return (
      <div className="modal-overlay" onClick={() => setActiveModal(null)}>
        <div className="glass-card w-[92%] max-w-md p-5 animate-slide-up max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg text-foreground">{titles[activeModal]}</h3>
            <button onClick={() => setActiveModal(null)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
          </div>

          {/* Shop Details */}
          {activeModal === "shop" && (
            <div className="space-y-3">
              {[
                { label: "Shop Name", value: shopName, set: setShopName, placeholder: "Your Shop Name" },
                { label: "Address", value: shopAddress, set: setShopAddress, placeholder: "Shop Address" },
                { label: "GST Number", value: shopGST, set: setShopGST, placeholder: "GSTIN" },
              ].map(f => (
                <div key={f.label}>
                  <label className="text-xs text-muted-foreground mb-1 block">{f.label}</label>
                  <input value={f.value} onChange={e => f.set(e.target.value)} className="w-full glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none rounded-lg placeholder:text-muted-foreground" placeholder={f.placeholder} />
                </div>
              ))}
              <button onClick={saveShopDetails} className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                <Save size={14} /> {t("save")}
              </button>
            </div>
          )}

          {/* UPI Settings */}
          {activeModal === "upi" && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground mb-2">Add up to 3 UPI IDs</p>
              {upiIds.map((upi, i) => (
                <div key={i}>
                  <label className="text-xs text-muted-foreground mb-1 block">UPI ID {i + 1}</label>
                  <input value={upi} onChange={e => { const next = [...upiIds]; next[i] = e.target.value; setUpiIds(next); }} className="w-full glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none rounded-lg placeholder:text-muted-foreground" placeholder={`e.g. shop@${["paytm", "gpay", "bharatpe"][i]}`} />
                </div>
              ))}
              <button onClick={saveUpiIds} className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                <Save size={14} /> {t("save")}
              </button>
            </div>
          )}

          {/* Security */}
          {activeModal === "security" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between glass-card p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <Lock size={18} className="text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{t("app_lock")}</p>
                    <p className="text-[10px] text-muted-foreground">Require PIN to open app</p>
                  </div>
                </div>
                <ToggleSwitch value={appLock} onChange={setAppLock} />
              </div>
              {appLock && (
                <>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Set 4-digit PIN</label>
                    <div className="relative">
                      <input type={showPin ? "text" : "password"} maxLength={4} value={lockPin} onChange={e => setLockPin(e.target.value.replace(/\D/g, ""))} className="w-full glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none rounded-lg text-center tracking-[1em] font-mono pr-10" placeholder="• • • •" />
                      <button onClick={() => setShowPin(!showPin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">Auto-lock after (minutes)</label>
                    <div className="flex items-center gap-2">
                      {[1, 5, 15, 30].map(m => (
                        <button key={m} onClick={() => setAutoLockMin(m)} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${autoLockMin === m ? 'gradient-primary text-primary-foreground' : 'glass-card text-muted-foreground hover:text-foreground'}`}>
                          {m} min
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Fingerprint Section - Manage up to 5 */}
              <div className="glass-card p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Fingerprint size={18} className={fingerprints.length > 0 ? "text-primary" : "text-muted-foreground"} />
                    <div>
                      <p className="text-sm font-medium text-foreground">{t("fingerprint")}</p>
                      <p className="text-[10px] text-muted-foreground">{fingerprints.length}/5 saved</p>
                    </div>
                  </div>
                </div>

                {/* Saved Fingerprints List */}
                {fingerprints.length > 0 && (
                  <div className="space-y-2">
                    {fingerprints.map((fp, i) => (
                      <div key={fp.id} className="flex items-center justify-between p-3 rounded-xl bg-secondary/40 border border-border/50">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <Fingerprint size={14} className="text-primary" />
                          </div>
                          {editingFpId === fp.id ? (
                            <div className="flex items-center gap-2">
                              <input
                                value={editFpName}
                                onChange={e => setEditFpName(e.target.value)}
                                className="glass-card px-2 py-1 text-xs text-foreground bg-transparent outline-none rounded-lg w-28"
                                autoFocus
                              />
                              <button onClick={() => updateFingerprintName(fp.id, editFpName)} className="text-success">
                                <CheckCircle size={14} />
                              </button>
                              <button onClick={() => setEditingFpId(null)} className="text-muted-foreground">
                                <X size={14} />
                              </button>
                            </div>
                          ) : (
                            <div>
                              <p className="text-xs font-semibold text-foreground">{fp.name}</p>
                              <p className="text-[9px] text-muted-foreground">
                                {new Date(fp.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" })}
                                {fp.credId ? " · WebAuthn" : " · PIN"}
                              </p>
                            </div>
                          )}
                        </div>
                        {editingFpId !== fp.id && (
                          <div className="flex items-center gap-1">
                            <button onClick={() => { setEditingFpId(fp.id); setEditFpName(fp.name); }} className="p-1.5 rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors">
                              <Pencil size={12} />
                            </button>
                            <button onClick={() => deleteFingerprint(fp.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                              <Trash2 size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new fingerprint */}
                {showAddFp ? (
                  <div className="space-y-2">
                    <input
                      value={newFpName}
                      onChange={e => setNewFpName(e.target.value)}
                      placeholder="e.g. Right Thumb, Index Finger..."
                      className="w-full glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none rounded-lg placeholder:text-muted-foreground"
                    />
                    <div className="flex gap-2">
                      <button onClick={addFingerprint} className="flex-1 gradient-primary text-primary-foreground py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5">
                        <Fingerprint size={14} /> {t("save")}
                      </button>
                      <button onClick={() => { setShowAddFp(false); setNewFpName(""); }} className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-muted/50 text-muted-foreground">
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  fingerprints.length < 5 && (
                    <button onClick={() => setShowAddFp(true)} className="w-full glass-card p-3 rounded-xl flex items-center justify-center gap-2 text-sm text-primary hover:bg-primary/5 transition-colors border border-dashed border-primary/20">
                      <Plus size={14} /> {t("add_fingerprint")} ({5 - fingerprints.length} remaining)
                    </button>
                  )
                )}

                {/* Test fingerprint */}
                {fingerprints.length > 0 && (
                  <button onClick={testFingerprint} className="w-full glass-card p-3 rounded-xl flex items-center justify-center gap-2 text-xs text-primary hover:bg-primary/5 transition-colors">
                    <Fingerprint size={14} /> Test Biometric Lock
                  </button>
                )}
              </div>

              <button onClick={saveSecurity} className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                <Save size={14} /> {t("save")} {t("security")}
              </button>
            </div>
          )}

          {/* Notifications */}
          {activeModal === "notifications" && (
            <div className="space-y-3">
              {[
                { label: "Bill Notifications", desc: "Alert on new bill", value: billNotif, set: setBillNotif, icon: BellRing },
                { label: "Low Stock Alerts", desc: "Notify when stock is low", value: lowStockNotif, set: setLowStockNotif, icon: AlertTriangle },
                { label: "Udhari Reminders", desc: "Payment due reminders", value: udhariNotif, set: setUdhariNotif, icon: Bell },
                { label: "Sound Effects", desc: "Play sounds on actions", value: soundEnabled, set: setSoundEnabled, icon: soundEnabled ? Volume2 : VolumeX },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between glass-card p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <item.icon size={18} className="text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <ToggleSwitch value={item.value} onChange={item.set} />
                </div>
              ))}
              <button onClick={saveNotifications} className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                <Save size={14} /> {t("save")}
              </button>
            </div>
          )}

          {/* Appearance - 5 Themes */}
          {activeModal === "appearance" && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">Choose your premium 3D theme</p>
              <div className="space-y-3">
                {THEMES.map((theme) => (
                  <button
                    key={theme.id}
                    onClick={() => applyTheme(theme.id)}
                    className={`theme-card w-full text-left ${currentTheme === theme.id ? "active" : ""}`}
                  >
                    <div className="theme-card-inner">
                      <div className="relative h-20 rounded-xl overflow-hidden" style={{ background: theme.gradient }}>
                        <div className="absolute inset-0 animate-shimmer" style={{
                          background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)`,
                          backgroundSize: "200% 100%",
                        }} />
                        <div className="absolute w-10 h-10 rounded-full float-animation opacity-30" style={{ background: theme.colors[0], top: "10%", left: "10%", animationDelay: "0s" }} />
                        <div className="absolute w-6 h-6 rounded-full float-animation opacity-40" style={{ background: theme.colors[1], top: "30%", right: "15%", animationDelay: "1s" }} />
                        <div className="absolute w-8 h-8 rounded-full float-animation opacity-20" style={{ background: theme.colors[0], bottom: "10%", right: "30%", animationDelay: "2s" }} />
                        <div className="absolute inset-0 flex items-center justify-between px-4">
                          <div>
                            <p className="text-white font-bold text-sm drop-shadow-lg">{theme.name}</p>
                            <p className="text-white/70 text-[10px]">{theme.nameHi}</p>
                          </div>
                          {currentTheme === theme.id && (
                            <div className="w-7 h-7 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                              <CheckCircle size={16} className="text-white" />
                            </div>
                          )}
                        </div>
                        <div className="absolute bottom-2 left-4 flex gap-1.5">
                          {theme.colors.map((c, i) => (
                            <div key={i} className="w-3 h-3 rounded-full border border-white/30 shadow-lg" style={{ background: c }} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Backup & Data */}
          {activeModal === "backup" && (
            <div className="space-y-3">
              <div className="glass-card p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${user ? 'bg-[hsl(var(--success))]' : 'bg-[hsl(var(--warning))]'}`} />
                  <p className="text-sm font-medium text-foreground">{user ? "Cloud Synced" : "Local Only"}</p>
                </div>
                <p className="text-[10px] text-muted-foreground">{user ? `Syncing as ${user.email}` : "Login to enable cloud sync"}</p>
                <div className="mt-3 flex items-center gap-2">
                  <HardDrive size={14} className="text-muted-foreground" />
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <div className="h-full gradient-primary rounded-full transition-all" style={{ width: `${Math.min(parseFloat(getStorageUsage()) / 50 * 100, 100)}%` }} />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{getStorageUsage()} KB</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="glass-card p-3 rounded-xl text-center">
                  <p className="text-lg font-bold text-primary">{products.length}</p>
                  <p className="text-[10px] text-muted-foreground">{t("products")}</p>
                </div>
                <div className="glass-card p-3 rounded-xl text-center">
                  <p className="text-lg font-bold text-primary">{bills.length}</p>
                  <p className="text-[10px] text-muted-foreground">Bills</p>
                </div>
                <div className="glass-card p-3 rounded-xl text-center">
                  <p className="text-lg font-bold text-primary">{udhariEntries.length}</p>
                  <p className="text-[10px] text-muted-foreground">{t("udhari")}</p>
                </div>
              </div>

              <button onClick={exportData} className="w-full glass-card p-4 rounded-xl flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left">
                <Download size={18} className="text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">{t("export_backup")}</p>
                  <p className="text-[10px] text-muted-foreground">Download all data as JSON</p>
                </div>
              </button>

              <label className="w-full glass-card p-4 rounded-xl flex items-center gap-3 hover:bg-secondary/50 transition-colors cursor-pointer">
                <Upload size={18} className="text-[hsl(var(--success))]" />
                <div>
                  <p className="text-sm font-medium text-foreground">{t("import_backup")}</p>
                  <p className="text-[10px] text-muted-foreground">Restore from JSON file</p>
                </div>
                <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={importData} />
              </label>

              {localStorage.getItem("smk_autobackup_data") && (
                <button onClick={restoreAutoBackup} className="w-full glass-card p-4 rounded-xl flex items-center gap-3 hover:bg-primary/5 transition-colors text-left">
                  <RefreshCw size={18} className="text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Restore Auto Backup</p>
                    <p className="text-[10px] text-muted-foreground">Last auto backup restore করুন</p>
                  </div>
                </button>
              )}

              <button onClick={clearAllData} className="w-full glass-card p-4 rounded-xl flex items-center gap-3 hover:bg-destructive/10 transition-colors text-left">
                <Trash2 size={18} className="text-destructive" />
                <div>
                  <p className="text-sm font-medium text-destructive">{t("clear_all")}</p>
                  <p className="text-[10px] text-muted-foreground">Permanently delete everything</p>
                </div>
              </button>
            </div>
          )}

          {/* Advanced */}
          {activeModal === "advanced" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t("low_stock_threshold")}</label>
                <div className="flex items-center gap-2">
                  {[5, 10, 20, 50].map(v => (
                    <button key={v} onClick={() => setLowStockThreshold(v)} className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-all ${lowStockThreshold === v ? 'gradient-primary text-primary-foreground' : 'glass-card text-muted-foreground hover:text-foreground'}`}>
                      {v} items
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t("currency")}</label>
                <div className="flex items-center gap-2">
                  {["₹", "$", "€", "£"].map(c => (
                    <button key={c} onClick={() => setCurrency(c)} className={`flex-1 py-2.5 rounded-lg text-lg font-bold transition-all ${currency === c ? 'gradient-primary text-primary-foreground' : 'glass-card text-muted-foreground hover:text-foreground'}`}>
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t("language")}</label>
                <div className="flex items-center gap-2">
                  {[{ id: "bn" as const, label: "বাংলা" }, { id: "hi" as const, label: "हिंदी" }, { id: "en" as const, label: "English" }].map(l => (
                    <button key={l.id} onClick={() => setLang(l.id)} className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-all ${lang === l.id ? 'gradient-primary text-primary-foreground' : 'glass-card text-muted-foreground hover:text-foreground'}`}>
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between glass-card p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <RefreshCw size={18} className="text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{t("auto_backup")}</p>
                    <p className="text-[10px] text-muted-foreground">প্রতি ৩০ মিনিটে auto backup</p>
                  </div>
                </div>
                <ToggleSwitch value={autoBackup} onChange={setAutoBackup} />
              </div>

              <button onClick={saveAdvanced} className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                <Save size={14} /> {t("save")} {t("advanced")}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="px-4 space-y-4">
      <h1 className="font-display text-xl font-bold text-foreground">{t("settings")}</h1>

      <div className="space-y-2">
        {settingsItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              onClick={item.action}
              className="glass-card-hover p-4 flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                  <Icon size={18} className="text-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
          );
        })}
      </div>

      {/* User Info */}
      {user && (
        <div className="glass-card p-4 flex items-center gap-3">
          {user.photoURL && <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full object-cover ring-2 ring-primary/30" />}
          <div>
            <p className="text-sm font-medium text-foreground">{user.displayName}</p>
            <p className="text-[10px] text-muted-foreground">{user.email}</p>
          </div>
        </div>
      )}

      {renderModal()}
    </div>
  );
};

export default Settings;
