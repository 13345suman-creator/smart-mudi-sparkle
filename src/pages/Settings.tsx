import { Store, Shield, Bell, Palette, Database, ChevronRight } from "lucide-react";

const settingsItems = [
  { icon: Store, label: "Shop Details", desc: "Name, address, GST" },
  { icon: Shield, label: "Security", desc: "App lock, OTP, fingerprint" },
  { icon: Bell, label: "Notifications", desc: "Alerts & reminders" },
  { icon: Palette, label: "Appearance", desc: "Theme & layout" },
  { icon: Database, label: "Backup & Sync", desc: "Cloud sync settings" },
];

const Settings = () => {
  return (
    <div className="px-4 space-y-4">
      <h1 className="font-display text-xl font-bold text-foreground">Settings</h1>

      <div className="space-y-2">
        {settingsItems.map((item) => {
          const Icon = item.icon;
          return (
            <button key={item.label} className="glass-card-hover p-4 flex items-center justify-between w-full text-left">
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
    </div>
  );
};

export default Settings;
