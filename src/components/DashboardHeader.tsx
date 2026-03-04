import { Bell, LogOut, LogIn, Cloud, CloudOff, X, Download, AlertTriangle, ShoppingBag } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";
import { useLanguage } from "@/lib/language";

const DashboardHeader = () => {
  const { user, loginWithGoogle, logout } = useAuth();
  const { settings, products, udhariEntries, bills } = useStore();
  const { t } = useLanguage();
  const [greeting, setGreeting] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [showNotifPanel, setShowNotifPanel] = useState(false);

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    if (hour < 12) setGreeting(t("good_morning"));
    else if (hour < 17) setGreeting(t("good_afternoon"));
    else setGreeting(t("good_evening"));

    setCurrentDate(now.toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }));
  }, [t]);

  const handleLogin = async () => {
    setLoginLoading(true);
    try {
      await loginWithGoogle();
    } catch (e) {
      console.error(e);
    } finally {
      setLoginLoading(false);
    }
  };

  const threshold = parseInt(localStorage.getItem("smk_lowstock_threshold") || "10");
  const currency = localStorage.getItem("smk_currency") || "₹";
  const lowStockProducts = products.filter(p => p.stock <= (p.lowStockAlert || threshold));
  const outOfStockProducts = products.filter(p => p.stock === 0);
  const pendingUdhari = udhariEntries.filter(e => e.amount > 0);
  const unpaidBills = bills.filter(b => !b.paymentConfirmed);

  const notifications: { type: string; title: string; desc: string; color: string }[] = [];
  
  if (outOfStockProducts.length > 0) {
    notifications.push({ type: "danger", title: `${outOfStockProducts.length} ${t("out_of_stock")}`, desc: outOfStockProducts.map(p => p.name).join(", "), color: "destructive" });
  }
  if (lowStockProducts.length > 0) {
    notifications.push({ type: "warning", title: `${lowStockProducts.length} ${t("low_stock")}`, desc: lowStockProducts.map(p => `${p.name} (${p.stock} ${p.unit})`).join(", "), color: "warning" });
  }
  if (pendingUdhari.length > 0) {
    const totalUdhari = pendingUdhari.reduce((s, e) => s + e.amount, 0);
    notifications.push({ type: "info", title: `${pendingUdhari.length} ${t("pending_udhari")}`, desc: `${t("total")}: ${currency}${totalUdhari.toLocaleString()}`, color: "primary" });
  }
  if (unpaidBills.length > 0) {
    notifications.push({ type: "warning", title: `${unpaidBills.length} Unpaid Bills`, desc: `${t("total")}: ${currency}${unpaidBills.reduce((s, b) => s + b.total, 0).toLocaleString()}`, color: "warning" });
  }

  const downloadLowStockPDF = () => {
    const items = lowStockProducts;
    if (items.length === 0) return;
    
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });

    let html = `
      <html><head><title>Low Stock Report</title>
      <style>
        body { font-family: 'Segoe UI', sans-serif; padding: 30px; color: #1a1a2e; }
        h1 { font-size: 22px; margin-bottom: 4px; }
        .meta { color: #666; font-size: 12px; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: #1a1a2e; color: white; padding: 10px 12px; text-align: left; font-size: 12px; }
        td { padding: 8px 12px; border-bottom: 1px solid #e5e5e5; font-size: 12px; }
        tr:nth-child(even) { background: #f9f9f9; }
        .danger { color: #dc2626; font-weight: bold; }
        .warning { color: #f59e0b; font-weight: bold; }
        .footer { margin-top: 30px; text-align: center; color: #999; font-size: 10px; }
        .summary { background: #f0f9ff; border: 1px solid #bae6fd; padding: 12px; border-radius: 8px; margin-bottom: 16px; }
        .summary span { font-weight: bold; color: #0284c7; }
      </style></head><body>
      <h1>📦 Low Stock Report - ${settings.shopName}</h1>
      <p class="meta">${dateStr} at ${timeStr} | ${settings.shopAddress || "N/A"} | GST: ${settings.shopGST || "N/A"}</p>
      <div class="summary">Total Items: <span>${items.length}</span> | Out of Stock: <span>${outOfStockProducts.length}</span> | Low Stock: <span>${items.length - outOfStockProducts.length}</span></div>
      <table>
        <tr><th>#</th><th>Product Name</th><th>Current Stock</th><th>Unit</th><th>Cost Price</th><th>Sell Price</th><th>Status</th></tr>
    `;

    items.forEach((p, i) => {
      const status = p.stock === 0 ? '<span class="danger">OUT OF STOCK</span>' : `<span class="warning">LOW (${p.stock})</span>`;
      html += `<tr><td>${i + 1}</td><td>${p.name}</td><td>${p.stock}</td><td>${p.unit}</td><td>${currency}${p.costPrice}</td><td>${currency}${p.sellPrice}</td><td>${status}</td></tr>`;
    });

    html += `</table><div class="footer">Generated by Smart Mudi Khana | ${dateStr}</div></body></html>`;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => printWindow.print(), 500);
    }
  };

  return (
    <header className="relative overflow-hidden px-4 pt-6 pb-8">
      <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-primary/10 blur-[100px]" />
      <div className="absolute top-10 right-1/4 w-48 h-48 rounded-full bg-accent/10 blur-[80px]" />

      <div className="relative z-10 flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          {user?.photoURL ? (
            <img src={user.photoURL} alt="" className="w-9 h-9 rounded-full object-cover ring-2 ring-primary/30" />
          ) : (
            <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center glow-primary">
              <span className="text-primary-foreground font-bold text-sm">
                {(user?.displayName || "U")[0].toUpperCase()}
              </span>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">{greeting} 👋</p>
            <p className="text-sm font-medium text-foreground">{user?.displayName || "Owner"}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-success/10 border border-success/20">
              <Cloud size={12} className="text-success" />
              <span className="text-[10px] text-success font-medium">{t("synced")}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-warning/10 border border-warning/20">
              <CloudOff size={12} className="text-warning" />
              <span className="text-[10px] text-warning font-medium">{t("offline")}</span>
            </div>
          )}

          <button onClick={() => setShowNotifPanel(true)} className="glass-card w-9 h-9 flex items-center justify-center rounded-xl relative">
            <Bell size={18} className="text-muted-foreground" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-[10px] flex items-center justify-center text-destructive-foreground font-bold animate-pulse">
                {notifications.length}
              </span>
            )}
          </button>

          {user ? (
            <button onClick={logout} className="glass-card w-9 h-9 flex items-center justify-center rounded-xl" title="Logout">
              <LogOut size={18} className="text-muted-foreground" />
            </button>
          ) : (
            <button
              onClick={handleLogin}
              disabled={loginLoading}
              className="glass-card flex items-center gap-1.5 px-3 h-9 rounded-xl text-primary hover:glow-primary transition-all duration-300"
              title="Login to sync data"
            >
              <LogIn size={16} />
              <span className="text-xs font-semibold">{loginLoading ? "..." : t("login")}</span>
            </button>
          )}
        </div>
      </div>

      {/* Shop Name */}
      <div className="relative z-10 text-center float-animation">
        <div className="glass-card inline-block px-8 py-4 glow-primary">
          <h1 className="font-display text-2xl font-bold gradient-text tracking-tight">
            {settings.shopName}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">{currentDate}</p>
        </div>
      </div>

      {/* Notification Panel */}
      {showNotifPanel && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-start justify-center pt-16" onClick={() => setShowNotifPanel(false)}>
          <div className="glass-card w-[92%] max-w-md p-5 animate-slide-up max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
                <Bell size={18} className="text-primary" /> {t("notifications")}
              </h3>
              <button onClick={() => setShowNotifPanel(false)} className="text-muted-foreground hover:text-foreground"><X size={20} /></button>
            </div>

            {notifications.length === 0 ? (
              <div className="text-center py-8">
                <Bell size={32} className="text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">{t("no_notifications")}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.map((n, i) => (
                  <div key={i} className={`glass-card p-4 rounded-xl border border-${n.color}/20`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-lg bg-${n.color}/10 flex items-center justify-center shrink-0`}>
                        <AlertTriangle size={14} className={`text-${n.color}`} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{n.title}</p>
                        <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{n.desc}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Low Stock PDF Download */}
            {lowStockProducts.length > 0 && (
              <button onClick={downloadLowStockPDF} className="w-full mt-4 gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                <Download size={14} /> {t("download_pdf")}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default DashboardHeader;
