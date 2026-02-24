import { useState } from "react";
import { Store, Shield, Bell, Palette, Database, ChevronRight, X, Save, Smartphone } from "lucide-react";
import { useStore } from "@/lib/store";

const Settings = () => {
  const { settings, updateSettings } = useStore();
  const [showShopDetails, setShowShopDetails] = useState(false);
  const [showUpiSettings, setShowUpiSettings] = useState(false);
  const [shopName, setShopName] = useState(settings.shopName);
  const [shopAddress, setShopAddress] = useState(settings.shopAddress);
  const [shopGST, setShopGST] = useState(settings.shopGST);
  const [upiIds, setUpiIds] = useState<string[]>([...settings.upiIds]);

  const saveShopDetails = () => {
    updateSettings({ shopName, shopAddress, shopGST });
    setShowShopDetails(false);
  };

  const saveUpiIds = () => {
    updateSettings({ upiIds });
    setShowUpiSettings(false);
  };

  const settingsItems = [
    { icon: Store, label: "Shop Details", desc: "Name, address, GST", action: () => setShowShopDetails(true) },
    { icon: Smartphone, label: "UPI Settings", desc: `${settings.upiIds.filter(u => u).length} UPI IDs configured`, action: () => setShowUpiSettings(true) },
    { icon: Shield, label: "Security", desc: "App lock, OTP, fingerprint" },
    { icon: Bell, label: "Notifications", desc: "Alerts & reminders" },
    { icon: Palette, label: "Appearance", desc: "Theme & layout" },
    { icon: Database, label: "Backup & Sync", desc: "Cloud sync settings" },
  ];

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

      {/* Shop Details Modal */}
      {showShopDetails && (
        <div className="modal-overlay" onClick={() => setShowShopDetails(false)}>
          <div className="glass-card w-[92%] max-w-md p-5 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-foreground">Shop Details</h3>
              <button onClick={() => setShowShopDetails(false)} className="text-muted-foreground"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Shop Name</label>
                <input value={shopName} onChange={e => setShopName(e.target.value)} className="w-full glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none rounded-lg placeholder:text-muted-foreground" placeholder="Your Shop Name" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Address</label>
                <input value={shopAddress} onChange={e => setShopAddress(e.target.value)} className="w-full glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none rounded-lg placeholder:text-muted-foreground" placeholder="Shop Address" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">GST Number</label>
                <input value={shopGST} onChange={e => setShopGST(e.target.value)} className="w-full glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none rounded-lg placeholder:text-muted-foreground" placeholder="GSTIN" />
              </div>
              <button onClick={saveShopDetails} className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                <Save size={14} /> Save Details
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPI Settings Modal */}
      {showUpiSettings && (
        <div className="modal-overlay" onClick={() => setShowUpiSettings(false)}>
          <div className="glass-card w-[92%] max-w-md p-5 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-foreground">UPI IDs</h3>
              <button onClick={() => setShowUpiSettings(false)} className="text-muted-foreground"><X size={20} /></button>
            </div>
            <p className="text-xs text-muted-foreground mb-4">Add up to 3 UPI IDs (PhonePe, Google Pay, Bharat Pay, etc.)</p>
            <div className="space-y-3">
              {upiIds.map((upi, i) => (
                <div key={i}>
                  <label className="text-xs text-muted-foreground mb-1 block">UPI ID {i + 1}</label>
                  <input
                    value={upi}
                    onChange={e => {
                      const next = [...upiIds];
                      next[i] = e.target.value;
                      setUpiIds(next);
                    }}
                    className="w-full glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none rounded-lg placeholder:text-muted-foreground"
                    placeholder={`e.g. shop@${["paytm", "gpay", "bharatpe"][i]}`}
                  />
                </div>
              ))}
              <button onClick={saveUpiIds} className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                <Save size={14} /> Save UPI IDs
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
