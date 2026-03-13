import { useState, useEffect, useRef } from "react";
import { Store, Shield, Bell, Palette, Database, ChevronRight, X, Save, Download, Upload, Trash2, CheckCircle, Lock, BellRing, AlertTriangle, Languages, IndianRupee, Clock, HardDrive, Zap, Eye, EyeOff, Volume2, VolumeX, RefreshCw } from "lucide-react";
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
  { id: "arctic-frost", name: "Arctic Frost", nameHi: "আর্কটিক ফ্রস্ট", colors: ["#38bdf8", "#6366f1", "#0f172a"], gradient: "linear-gradient(135deg, #38bdf8, #6366f1)" },
  { id: "cherry-blossom", name: "Cherry Blossom", nameHi: "চেরি ব্লসম", colors: ["#f472b6", "#c084fc", "#1a0a14"], gradient: "linear-gradient(135deg, #f472b6, #c084fc)" },
  { id: "obsidian-gold", name: "Obsidian Gold", nameHi: "অবসিডিয়ান গোল্ড", colors: ["#eab308", "#ea580c", "#171209"], gradient: "linear-gradient(135deg, #eab308, #ea580c)" },
  { id: "aurora-green", name: "Aurora Green", nameHi: "অরোরা গ্রীন", colors: ["#34d399", "#22d3ee", "#0a1612"], gradient: "linear-gradient(135deg, #34d399, #22d3ee)" },
  { id: "velvet-purple", name: "Velvet Purple", nameHi: "ভেলভেট পার্পল", colors: ["#a78bfa", "#3b82f6", "#0d0a1a"], gradient: "linear-gradient(135deg, #a78bfa, #3b82f6)" },
  { id: "molten-lava", name: "Molten Lava", nameHi: "মোল্টেন লাভা", colors: ["#ef4444", "#f97316", "#1a0a08"], gradient: "linear-gradient(135deg, #ef4444, #f97316)" },
  { id: "peach-dream", name: "Peach Dream 🍑", nameHi: "পীচ ড্রিম", colors: ["#f97066", "#f472b6", "#fde8e0"], gradient: "linear-gradient(135deg, #f97066, #f472b6)" },
  { id: "sky-breeze", name: "Sky Breeze 🌤️", nameHi: "স্কাই ব্রিজ", colors: ["#38bdf8", "#2dd4bf", "#e0f2fe"], gradient: "linear-gradient(135deg, #38bdf8, #2dd4bf)" },
  { id: "mint-fresh", name: "Mint Fresh 🌿", nameHi: "মিন্ট ফ্রেশ", colors: ["#34d399", "#84cc16", "#e6f7ef"], gradient: "linear-gradient(135deg, #34d399, #84cc16)" },
];

const Settings = () => {
  const { settings, updateSettings, bills, products, udhariEntries } = useStore();
  const { user } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [shopName, setShopName] = useState(settings.shopName);
  const [shopAddress, setShopAddress] = useState(settings.shopAddress);
  const [shopGST, setShopGST] = useState(settings.shopGST);
  

  // Appearance
  const [currentTheme, setCurrentTheme] = useState(() => {
    const saved = localStorage.getItem("smk_theme");
    if (saved && !THEMES.find(t => t.id === saved)) {
      localStorage.setItem("smk_theme", "arctic-frost");
      return "arctic-frost";
    }
    return saved || "arctic-frost";
  });

  // Notifications
  const [billNotif, setBillNotif] = useState(() => localStorage.getItem("smk_notif_bill") !== "false");
  const [lowStockNotif, setLowStockNotif] = useState(() => localStorage.getItem("smk_notif_lowstock") !== "false");
  const [udhariNotif, setUdhariNotif] = useState(() => localStorage.getItem("smk_notif_udhari") !== "false");
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem("smk_sound") !== "false");

  // Security - PIN only
  const [appLock, setAppLock] = useState(() => localStorage.getItem("smk_applock") === "true");
  const [lockPin, setLockPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [autoLockMin, setAutoLockMin] = useState(() => parseInt(localStorage.getItem("smk_autolock_min") || "5"));

  // Advanced
  const [lowStockThreshold, setLowStockThreshold] = useState(() => parseInt(localStorage.getItem("smk_lowstock_threshold") || "10"));
  const [currency, setCurrency] = useState(() => localStorage.getItem("smk_currency") || "₹");
  const [autoBackup, setAutoBackup] = useState(() => localStorage.getItem("smk_autobackup") === "true");
  const [dateFormat, setDateFormat] = useState(() => localStorage.getItem("smk_date_format") || "dd/mm/yyyy");
  const [billFormat, setBillFormat] = useState(() => localStorage.getItem("smk_bill_format") || "detailed");
  const [autoClearOldBills, setAutoClearOldBills] = useState(() => localStorage.getItem("smk_auto_clear_bills") === "true");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setShopName(settings.shopName);
    setShopAddress(settings.shopAddress);
    setShopGST(settings.shopGST);
    
  }, [settings]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", currentTheme);
  }, []);

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
    toast.success(t("toast_saved"));
  };


  const applyTheme = (themeId: string) => {
    setCurrentTheme(themeId);
    localStorage.setItem("smk_theme", themeId);
    document.documentElement.setAttribute("data-theme", themeId);
    toast.success(`Theme: ${THEMES.find(t => t.id === themeId)?.name}`);
  };

  const toggleNotifSetting = (key: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    localStorage.setItem(key, String(value));
    if (value && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    toast.success(value ? t("toast_enabled") : t("toast_disabled"));
  };

  const saveSecurity = () => {
    if (appLock && lockPin.length !== 4 && !localStorage.getItem("smk_lockpin")) {
      toast.error(t("toast_set_pin"));
      return;
    }
    localStorage.setItem("smk_applock", String(appLock));
    localStorage.setItem("smk_autolock_min", String(autoLockMin));
    if (appLock && lockPin.length === 4) {
      localStorage.setItem("smk_lockpin", lockPin);
      // Save email for forgot PIN recovery
      if (user?.email) {
        localStorage.setItem("smk_lock_email", user.email);
      }
    }
    if (!appLock) {
      localStorage.removeItem("smk_lockpin");
      localStorage.removeItem("smk_lock_email");
    }
    setActiveModal(null);
    toast.success(t("toast_security_saved"));
  };

  const saveAdvanced = () => {
    localStorage.setItem("smk_lowstock_threshold", String(lowStockThreshold));
    localStorage.setItem("smk_currency", currency);
    localStorage.setItem("smk_autobackup", String(autoBackup));
    localStorage.setItem("smk_date_format", dateFormat);
    localStorage.setItem("smk_bill_format", billFormat);
    localStorage.setItem("smk_auto_clear_bills", String(autoClearOldBills));
    localStorage.setItem("smk_clear_after_days", "45");
    setActiveModal(null);
    toast.success(t("toast_saved"));
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
    toast.success(t("toast_backup_exported"));
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
        toast.success(t("toast_backup_restored"));
        setTimeout(() => window.location.reload(), 1500);
      } catch {
        toast.error(t("toast_invalid_backup"));
      }
    };
    reader.readAsText(file);
  };

  const restoreAutoBackup = () => {
    const backupStr = localStorage.getItem("smk_autobackup_data");
    if (!backupStr) {
      toast.error(t("toast_no_auto_backup"));
      return;
    }
    try {
      const data = JSON.parse(backupStr);
      if (data.bills) localStorage.setItem("smk_bills", data.bills);
      if (data.udhari) localStorage.setItem("smk_udhari", data.udhari);
      if (data.paidoff) localStorage.setItem("smk_paidoff", data.paidoff);
      if (data.settings) localStorage.setItem("smk_settings", data.settings);
      if (data.products) localStorage.setItem("smk_products", data.products);
      toast.success(t("toast_auto_backup_restored"));
      setTimeout(() => window.location.reload(), 1500);
    } catch {
      toast.error(t("toast_auto_backup_corrupted"));
    }
  };

  const clearAllData = () => {
    if (confirm("Are you sure? This will delete ALL your data permanently!")) {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith("smk_")) localStorage.removeItem(key);
      });
      toast.success(t("toast_all_cleared"));
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
    
    { icon: Shield, label: t("security"), desc: appLock ? "PIN Lock Active" : "Configure", action: () => setActiveModal("security") },
    { icon: Bell, label: t("notifications"), desc: "Alerts & sound", action: () => setActiveModal("notifications") },
    { icon: Palette, label: t("appearance"), desc: THEMES.find(t => t.id === currentTheme)?.name || "Theme", action: () => setActiveModal("appearance") },
    { icon: Database, label: t("backup_data"), desc: `${getStorageUsage()} KB`, action: () => setActiveModal("backup") },
    { icon: Zap, label: t("advanced"), desc: `${currency} · ${lang.toUpperCase()}`, action: () => setActiveModal("advanced") },
  ];

  const renderModal = () => {
    if (!activeModal) return null;

    const titles: Record<string, string> = {
      shop: t("shop_details"),
      
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


          {/* Security - PIN Only */}
          {activeModal === "security" && (
            <div className="space-y-4">
              {/* App Lock Toggle */}
              <div className="glass-card p-4 rounded-xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                      <Lock size={18} className="text-primary-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t("app_lock")}</p>
                      <p className="text-[10px] text-muted-foreground">PIN দিয়ে app lock করুন</p>
                    </div>
                  </div>
                  <ToggleSwitch value={appLock} onChange={setAppLock} />
                </div>
              </div>

              {appLock && (
                <>
                  {/* PIN Input */}
                  <div className="glass-card p-4 rounded-xl space-y-3">
                    <label className="text-xs font-medium text-foreground flex items-center gap-2">
                      <Shield size={12} className="text-primary" /> Set 4-Digit PIN
                    </label>
                    <div className="relative">
                      <input
                        type={showPin ? "text" : "password"}
                        maxLength={4}
                        value={lockPin}
                        onChange={e => setLockPin(e.target.value.replace(/\D/g, ""))}
                        className="w-full glass-card px-4 py-3 text-lg text-foreground bg-transparent outline-none rounded-xl text-center tracking-[1.2em] font-mono focus:ring-2 focus:ring-primary/50 pr-12"
                        placeholder="• • • •"
                      />
                      <button onClick={() => setShowPin(!showPin)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                        {showPin ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {lockPin.length > 0 && lockPin.length < 4 && (
                      <p className="text-[10px] text-warning">PIN must be 4 digits</p>
                    )}
                    {lockPin.length === 4 && (
                      <p className="text-[10px] text-[hsl(var(--success))] flex items-center gap-1">
                        <CheckCircle size={10} /> PIN ready to save
                      </p>
                    )}
                  </div>

                  {/* Auto Lock Timer */}
                  <div className="glass-card p-4 rounded-xl space-y-3">
                    <label className="text-xs font-medium text-foreground flex items-center gap-2">
                      <Clock size={12} className="text-primary" /> Auto-Lock Timer
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {[1, 5, 15, 30].map(m => (
                        <button
                          key={m}
                          onClick={() => setAutoLockMin(m)}
                          className={`py-2.5 rounded-xl text-xs font-semibold transition-all ${
                            autoLockMin === m
                              ? 'gradient-primary text-primary-foreground glow-primary'
                              : 'glass-card text-muted-foreground hover:text-foreground'
                          }`}
                        >
                          {m} min
                        </button>
                      ))}
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      App will auto-lock after {autoLockMin} minute{autoLockMin > 1 ? 's' : ''} of inactivity
                    </p>
                  </div>

                  {/* Info card */}
                  <div className="rounded-xl p-3 border border-primary/15 bg-primary/5">
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      💡 App open করলে PIN দিতে হবে। PIN ভুলে গেলে <span className="text-primary font-medium">Forgot?</span> button এ ক্লিক করে email verification দিয়ে reset করতে পারবেন।
                    </p>
                  </div>
                </>
              )}

              <button onClick={saveSecurity} className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                <Save size={14} /> {t("save")} {t("security")}
              </button>
            </div>
          )}

          {/* Notifications */}
          {activeModal === "notifications" && (
            <div className="space-y-3">
              {[
                { label: "Bill Notifications", desc: "Alert on new bill", value: billNotif, set: setBillNotif, key: "smk_notif_bill", icon: BellRing },
                { label: "Low Stock Alerts", desc: "Notify when stock is low", value: lowStockNotif, set: setLowStockNotif, key: "smk_notif_lowstock", icon: AlertTriangle },
                { label: "Udhari Reminders", desc: "Payment due reminders", value: udhariNotif, set: setUdhariNotif, key: "smk_notif_udhari", icon: Bell },
                { label: "Sound Effects", desc: "Play sounds on actions", value: soundEnabled, set: setSoundEnabled, key: "smk_sound", icon: soundEnabled ? Volume2 : VolumeX },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between glass-card p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <item.icon size={18} className="text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <ToggleSwitch value={item.value} onChange={(v) => toggleNotifSetting(item.key, v, item.set)} />
                </div>
              ))}
              <p className="text-[10px] text-muted-foreground text-center pt-1">Changes save automatically</p>
            </div>
          )}

          {/* Appearance */}
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

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t("date_format")}</label>
                <div className="flex items-center gap-2">
                  {[
                    { id: "dd/mm/yyyy", label: "DD/MM/YYYY" },
                    { id: "mm/dd/yyyy", label: "MM/DD/YYYY" },
                    { id: "yyyy-mm-dd", label: "YYYY-MM-DD" },
                  ].map(f => (
                    <button key={f.id} onClick={() => { setDateFormat(f.id); localStorage.setItem("smk_date_format", f.id); }} className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-all ${dateFormat === f.id ? 'gradient-primary text-primary-foreground' : 'glass-card text-muted-foreground hover:text-foreground'}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">{t("bill_format")}</label>
                <div className="flex items-center gap-2">
                  {[
                    { id: "compact", label: t("compact") },
                    { id: "detailed", label: t("detailed") },
                  ].map(f => (
                    <button key={f.id} onClick={() => { setBillFormat(f.id); localStorage.setItem("smk_bill_format", f.id); }} className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-all ${billFormat === f.id ? 'gradient-primary text-primary-foreground' : 'glass-card text-muted-foreground hover:text-foreground'}`}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between glass-card p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <RefreshCw size={18} className="text-primary" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{t("auto_backup")}</p>
                    <p className="text-[10px] text-muted-foreground">{t("auto_backup_desc")}</p>
                  </div>
                </div>
                <ToggleSwitch value={autoBackup} onChange={setAutoBackup} />
              </div>

              <div className="flex items-center justify-between glass-card p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <Trash2 size={18} className="text-warning" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{t("auto_clear_bills")}</p>
                    <p className="text-[10px] text-muted-foreground">{t("auto_clear_bills_desc")}</p>
                  </div>
                </div>
                <ToggleSwitch value={autoClearOldBills} onChange={(v) => { setAutoClearOldBills(v); localStorage.setItem("smk_auto_clear_bills", String(v)); }} />
              </div>

              {autoClearOldBills && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">{t("clear_after_days")}</label>
                  <div className="flex items-center gap-2">
                    {[30, 60, 90, 180].map(d => (
                      <button key={d} onClick={() => { setClearAfterDays(d); localStorage.setItem("smk_clear_after_days", String(d)); }} className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-all ${clearAfterDays === d ? 'gradient-primary text-primary-foreground' : 'glass-card text-muted-foreground hover:text-foreground'}`}>
                        {d} {t("days")}
                      </button>
                    ))}
                  </div>
                </div>
              )}

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
