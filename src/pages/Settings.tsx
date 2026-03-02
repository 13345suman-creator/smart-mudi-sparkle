import { useState, useEffect } from "react";
import { Store, Shield, Bell, Palette, Database, ChevronRight, X, Save, Smartphone, Moon, Sun, Download, Upload, Trash2, CheckCircle, Lock, Fingerprint, BellRing, AlertTriangle } from "lucide-react";
import { useStore } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

const Settings = () => {
  const { settings, updateSettings } = useStore();
  const { user } = useAuth();
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [shopName, setShopName] = useState(settings.shopName);
  const [shopAddress, setShopAddress] = useState(settings.shopAddress);
  const [shopGST, setShopGST] = useState(settings.shopGST);
  const [upiIds, setUpiIds] = useState<string[]>([...settings.upiIds]);

  // Appearance
  const [theme, setTheme] = useState(() => localStorage.getItem("smk_theme") || "dark");

  // Notifications
  const [billNotif, setBillNotif] = useState(() => localStorage.getItem("smk_notif_bill") !== "false");
  const [lowStockNotif, setLowStockNotif] = useState(() => localStorage.getItem("smk_notif_lowstock") !== "false");
  const [udhariNotif, setUdhariNotif] = useState(() => localStorage.getItem("smk_notif_udhari") !== "false");

  // Security
  const [appLock, setAppLock] = useState(() => localStorage.getItem("smk_applock") === "true");
  const [lockPin, setLockPin] = useState("");

  useEffect(() => {
    setShopName(settings.shopName);
    setShopAddress(settings.shopAddress);
    setShopGST(settings.shopGST);
    setUpiIds([...settings.upiIds]);
  }, [settings]);

  const saveShopDetails = () => {
    updateSettings({ shopName, shopAddress, shopGST });
    setActiveModal(null);
    toast.success("Shop details saved!");
  };

  const saveUpiIds = () => {
    updateSettings({ upiIds });
    setActiveModal(null);
    toast.success("UPI IDs saved!");
  };

  const saveTheme = (t: string) => {
    setTheme(t);
    localStorage.setItem("smk_theme", t);
    document.documentElement.classList.toggle("dark", t === "dark");
    document.documentElement.classList.toggle("light", t === "light");
    toast.success(`Theme changed to ${t}`);
  };

  const saveNotifications = () => {
    localStorage.setItem("smk_notif_bill", String(billNotif));
    localStorage.setItem("smk_notif_lowstock", String(lowStockNotif));
    localStorage.setItem("smk_notif_udhari", String(udhariNotif));
    setActiveModal(null);
    toast.success("Notification settings saved!");
  };

  const saveSecurity = () => {
    localStorage.setItem("smk_applock", String(appLock));
    if (appLock && lockPin.length === 4) {
      localStorage.setItem("smk_lockpin", lockPin);
    }
    setActiveModal(null);
    toast.success("Security settings saved!");
  };

  const exportData = () => {
    const data = {
      bills: localStorage.getItem("smk_bills"),
      udhari: localStorage.getItem("smk_udhari"),
      paidoff: localStorage.getItem("smk_paidoff"),
      settings: localStorage.getItem("smk_settings"),
      products: localStorage.getItem("smk_products"),
      exportDate: new Date().toISOString(),
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

  const clearAllData = () => {
    if (confirm("Are you sure? This will delete ALL your data permanently!")) {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith("smk_")) localStorage.removeItem(key);
      });
      toast.success("All data cleared! Refreshing...");
      setTimeout(() => window.location.reload(), 1500);
    }
  };

  const settingsItems = [
    { icon: Store, label: "Shop Details", desc: "Name, address, GST", action: () => setActiveModal("shop") },
    { icon: Smartphone, label: "UPI Settings", desc: `${settings.upiIds.filter(u => u).length} UPI IDs configured`, action: () => setActiveModal("upi") },
    { icon: Shield, label: "Security", desc: appLock ? "App lock enabled" : "App lock disabled", action: () => setActiveModal("security") },
    { icon: Bell, label: "Notifications", desc: "Alerts & reminders", action: () => setActiveModal("notifications") },
    { icon: Palette, label: "Appearance", desc: `${theme === "dark" ? "Dark" : "Light"} theme`, action: () => setActiveModal("appearance") },
    { icon: Database, label: "Backup & Data", desc: user ? "Cloud synced" : "Local storage", action: () => setActiveModal("backup") },
  ];

  const renderModal = () => {
    if (!activeModal) return null;

    return (
      <div className="modal-overlay" onClick={() => setActiveModal(null)}>
        <div className="glass-card w-[92%] max-w-md p-5 animate-slide-up max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg text-foreground">
              {activeModal === "shop" && "Shop Details"}
              {activeModal === "upi" && "UPI Settings"}
              {activeModal === "security" && "Security"}
              {activeModal === "notifications" && "Notifications"}
              {activeModal === "appearance" && "Appearance"}
              {activeModal === "backup" && "Backup & Data"}
            </h3>
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
                <Save size={14} /> Save Details
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
                <Save size={14} /> Save UPI IDs
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
                    <p className="text-sm font-medium text-foreground">App Lock</p>
                    <p className="text-[10px] text-muted-foreground">Require PIN to open app</p>
                  </div>
                </div>
                <button onClick={() => setAppLock(!appLock)} className={`w-12 h-6 rounded-full transition-all ${appLock ? 'bg-primary' : 'bg-muted'}`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${appLock ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
              </div>
              {appLock && (
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Set 4-digit PIN</label>
                  <input type="password" maxLength={4} value={lockPin} onChange={e => setLockPin(e.target.value.replace(/\D/g, ""))} className="w-full glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none rounded-lg text-center tracking-[1em] font-mono" placeholder="• • • •" />
                </div>
              )}
              <div className="flex items-center justify-between glass-card p-4 rounded-xl opacity-50">
                <div className="flex items-center gap-3">
                  <Fingerprint size={18} className="text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">Fingerprint</p>
                    <p className="text-[10px] text-muted-foreground">Coming soon</p>
                  </div>
                </div>
              </div>
              <button onClick={saveSecurity} className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                <Save size={14} /> Save Security
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
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between glass-card p-4 rounded-xl">
                  <div className="flex items-center gap-3">
                    <item.icon size={18} className="text-primary" />
                    <div>
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-[10px] text-muted-foreground">{item.desc}</p>
                    </div>
                  </div>
                  <button onClick={() => item.set(!item.value)} className={`w-12 h-6 rounded-full transition-all ${item.value ? 'bg-primary' : 'bg-muted'}`}>
                    <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${item.value ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </button>
                </div>
              ))}
              <button onClick={saveNotifications} className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                <Save size={14} /> Save Notifications
              </button>
            </div>
          )}

          {/* Appearance */}
          {activeModal === "appearance" && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">Choose your preferred theme</p>
              <div className="grid grid-cols-2 gap-3">
                <button onClick={() => saveTheme("dark")} className={`glass-card p-4 rounded-xl flex flex-col items-center gap-3 transition-all ${theme === "dark" ? "ring-2 ring-primary" : ""}`}>
                  <Moon size={24} className="text-primary" />
                  <span className="text-sm font-semibold text-foreground">Dark</span>
                  {theme === "dark" && <CheckCircle size={14} className="text-primary" />}
                </button>
                <button onClick={() => saveTheme("light")} className={`glass-card p-4 rounded-xl flex flex-col items-center gap-3 transition-all ${theme === "light" ? "ring-2 ring-primary" : ""}`}>
                  <Sun size={24} className="text-warning" />
                  <span className="text-sm font-semibold text-foreground">Light</span>
                  {theme === "light" && <CheckCircle size={14} className="text-primary" />}
                </button>
              </div>
            </div>
          )}

          {/* Backup & Data */}
          {activeModal === "backup" && (
            <div className="space-y-3">
              <div className="glass-card p-4 rounded-xl">
                <div className="flex items-center gap-2 mb-1">
                  <div className={`w-2 h-2 rounded-full ${user ? 'bg-success' : 'bg-warning'}`} />
                  <p className="text-sm font-medium text-foreground">{user ? "Cloud Synced" : "Local Only"}</p>
                </div>
                <p className="text-[10px] text-muted-foreground">{user ? `Syncing to cloud as ${user.email}` : "Login to enable cloud sync"}</p>
              </div>

              <button onClick={exportData} className="w-full glass-card p-4 rounded-xl flex items-center gap-3 hover:bg-secondary/50 transition-colors text-left">
                <Download size={18} className="text-primary" />
                <div>
                  <p className="text-sm font-medium text-foreground">Export Backup</p>
                  <p className="text-[10px] text-muted-foreground">Download all data as JSON file</p>
                </div>
              </button>

              <label className="w-full glass-card p-4 rounded-xl flex items-center gap-3 hover:bg-secondary/50 transition-colors cursor-pointer">
                <Upload size={18} className="text-success" />
                <div>
                  <p className="text-sm font-medium text-foreground">Import Backup</p>
                  <p className="text-[10px] text-muted-foreground">Restore from JSON backup file</p>
                </div>
                <input type="file" accept=".json" className="hidden" onChange={importData} />
              </label>

              <button onClick={clearAllData} className="w-full glass-card p-4 rounded-xl flex items-center gap-3 hover:bg-destructive/10 transition-colors text-left">
                <Trash2 size={18} className="text-destructive" />
                <div>
                  <p className="text-sm font-medium text-destructive">Clear All Data</p>
                  <p className="text-[10px] text-muted-foreground">Permanently delete everything</p>
                </div>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="px-4 space-y-4">
      <h1 className="font-display text-xl font-bold text-foreground">Settings</h1>

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
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon size={18} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-muted-foreground" />
            </button>
          );
        })}
      </div>

      <div className="glass-card p-4 text-center mt-6">
        <p className="text-xs text-muted-foreground">Smart Mudi Khana v1.0</p>
        <p className="text-xs text-muted-foreground mt-1">Made with ❤️ for Indian Shopkeepers</p>
      </div>

      {renderModal()}
    </div>
  );
};

export default Settings;
