import { TrendingUp, ArrowRight, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/lib/store";
import AnalyticsCards from "../components/AnalyticsCards";

const formatDate = (d: string | Date) => {
  const date = typeof d === 'string' ? new Date(d) : d;
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  if (diff < 60000) return "Just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} hr ago`;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
};

// Low stock products (shared with Stock page structure)
interface DashboardProduct {
  name: string;
  stock: number;
  unit: string;
  lowStockAlert: number;
}

const Index = () => {
  const navigate = useNavigate();
  const { bills, udhariEntries } = useStore();

  const todaySales = bills
    .filter(b => new Date(b.date).toDateString() === new Date().toDateString())
    .reduce((s, b) => s + b.total, 0);

  const totalPendingUdhari = udhariEntries.reduce((s, e) => s + e.amount, 0);

  const recentBills = bills.slice(0, 5);

  // Read stock from localStorage for dashboard alerts
  let lowStockProducts: DashboardProduct[] = [];
  try {
    const stored = localStorage.getItem("app_stock");
    if (!stored) {
      // Use initial products as fallback
      const defaultProducts = [
        { name: "Tata Salt", stock: 45, unit: "kg", lowStockAlert: 10 },
        { name: "Aashirvaad Atta", stock: 12, unit: "kg", lowStockAlert: 5 },
        { name: "Fortune Oil", stock: 3, unit: "liter", lowStockAlert: 5 },
        { name: "Sugar", stock: 28, unit: "kg", lowStockAlert: 10 },
        { name: "Tata Tea", stock: 0, unit: "pcs", lowStockAlert: 5 },
      ];
      lowStockProducts = defaultProducts.filter(p => p.stock <= (p.lowStockAlert || 5));
    } else {
      const allProducts = JSON.parse(stored) as DashboardProduct[];
      lowStockProducts = allProducts.filter(p => p.stock <= (p.lowStockAlert || 5));
    }
  } catch {}

  return (
    <div className="space-y-6 pb-4">
      <AnalyticsCards todaySales={todaySales} pendingUdhari={totalPendingUdhari} udhariCustomers={udhariEntries.length} />

      {/* Low Stock Alerts on Dashboard */}
      {lowStockProducts.length > 0 && (
        <div className="px-4">
          <div className="glass-card p-4 border border-warning/20">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center">
                  <AlertTriangle size={16} className="text-warning" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Low Stock Alert</h3>
                  <p className="text-[10px] text-muted-foreground">{lowStockProducts.length} items need attention</p>
                </div>
              </div>
              <button onClick={() => navigate("/stock")} className="text-primary text-xs flex items-center gap-1">
                View All <ArrowRight size={12} />
              </button>
            </div>
            <div className="space-y-2">
              {lowStockProducts.slice(0, 4).map((p, i) => (
                <div key={i} className="flex items-center justify-between py-2 px-3 rounded-lg bg-secondary/30">
                  <p className="text-xs font-medium text-foreground">{p.name}</p>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    p.stock === 0 ? 'bg-destructive/10 text-destructive' : 'bg-warning/10 text-warning'
                  }`}>
                    {p.stock === 0 ? 'Out of Stock' : `${p.stock} ${p.unit} left`}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="px-4">
        <h2 className="font-display font-semibold text-sm text-muted-foreground mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "New Bill", action: () => navigate("/billing"), emoji: "🧾" },
            { label: "Add Stock", action: () => navigate("/stock"), emoji: "📦" },
            { label: "Udhari", action: () => navigate("/udhari"), emoji: "📋" },
          ].map((item) => (
            <button key={item.label} onClick={item.action} className="glass-card-hover p-4 flex flex-col items-center gap-2 text-center">
              <span className="text-2xl">{item.emoji}</span>
              <span className="text-xs font-medium text-foreground">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Bills */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display font-semibold text-sm text-muted-foreground">Recent Bills</h2>
          <button onClick={() => navigate("/billing")} className="text-primary text-xs flex items-center gap-1">
            View All <ArrowRight size={12} />
          </button>
        </div>
        <div className="space-y-2">
          {recentBills.length > 0 ? recentBills.map((bill) => (
            <div key={bill.id} className="glass-card p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{bill.customerName || "Walk-in"}</p>
                  <p className="text-xs text-muted-foreground">{bill.billNo.slice(-8)} · {formatDate(bill.date)}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-display font-bold text-foreground">₹{bill.total}</p>
                <span className={`inline-block w-1.5 h-1.5 rounded-full ${bill.paymentConfirmed ? 'bg-success' : 'bg-warning'}`} />
              </div>
            </div>
          )) : (
            <div className="glass-card p-6 text-center">
              <p className="text-sm text-muted-foreground">No bills yet. Create your first bill!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
