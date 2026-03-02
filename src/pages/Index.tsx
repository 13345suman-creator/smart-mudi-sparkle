import { TrendingUp, ArrowRight, AlertTriangle, Zap, ShoppingBag, Clock, Sparkles, BarChart3, Activity } from "lucide-react";
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

const Index = () => {
  const navigate = useNavigate();
  const { bills, udhariEntries, products } = useStore();

  const todaySales = bills
    .filter(b => new Date(b.date).toDateString() === new Date().toDateString())
    .reduce((s, b) => s + b.total, 0);

  const totalPendingUdhari = udhariEntries.reduce((s, e) => s + e.amount, 0);
  const recentBills = bills.slice(0, 5);
  const lowStockProducts = products.filter(p => p.stock <= (p.lowStockAlert || 5));
  const totalProducts = products.length;
  const todayBillCount = bills.filter(b => new Date(b.date).toDateString() === new Date().toDateString()).length;

  return (
    <div className="space-y-6 pb-4">
      {/* Live Status Bar */}
      <div className="px-4">
        <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-success/10 border border-success/20 shrink-0">
            <Activity size={12} className="text-success" />
            <span className="text-[10px] font-semibold text-success">{todayBillCount} Bills Today</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 shrink-0">
            <ShoppingBag size={12} className="text-primary" />
            <span className="text-[10px] font-semibold text-primary">{totalProducts} Products</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-warning/10 border border-warning/20 shrink-0">
            <AlertTriangle size={12} className="text-warning" />
            <span className="text-[10px] font-semibold text-warning">{lowStockProducts.length} Low Stock</span>
          </div>
        </div>
      </div>

      <AnalyticsCards todaySales={todaySales} pendingUdhari={totalPendingUdhari} udhariCustomers={udhariEntries.length} />

      {/* Low Stock Alerts */}
      {lowStockProducts.length > 0 && (
        <div className="px-4">
          <div className="glass-card p-4 border border-warning/20 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-warning/5 blur-[60px]" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-warning/10 flex items-center justify-center border border-warning/20">
                    <AlertTriangle size={16} className="text-warning" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground font-display">Low Stock Alert</h3>
                    <p className="text-[10px] text-muted-foreground">{lowStockProducts.length} items need restock</p>
                  </div>
                </div>
                <button onClick={() => navigate("/stock")} className="text-primary text-xs flex items-center gap-1 font-semibold hover:underline">
                  View All <ArrowRight size={12} />
                </button>
              </div>
              <div className="space-y-2">
                {lowStockProducts.slice(0, 4).map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-secondary/40 border border-border/50 animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
                    <div className="flex items-center gap-2">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt="" className="w-7 h-7 rounded-lg object-cover" />
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                          <ShoppingBag size={12} className="text-muted-foreground" />
                        </div>
                      )}
                      <p className="text-xs font-medium text-foreground">{p.name}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                      p.stock === 0 ? 'bg-destructive/15 text-destructive border border-destructive/20' : 'bg-warning/15 text-warning border border-warning/20'
                    }`}>
                      {p.stock === 0 ? 'Out of Stock' : `${p.stock} ${p.unit} left`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="px-4">
        <div className="flex items-center gap-2 mb-3">
          <Zap size={14} className="text-primary" />
          <h2 className="font-display font-semibold text-sm text-foreground">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "New Bill", action: () => navigate("/billing"), emoji: "🧾", gradient: "gradient-card-blue" },
            { label: "Add Stock", action: () => navigate("/stock"), emoji: "📦", gradient: "gradient-card-green" },
            { label: "Udhari", action: () => navigate("/udhari"), emoji: "📋", gradient: "gradient-card-purple" },
          ].map((item, i) => (
            <button
              key={item.label}
              onClick={item.action}
              className={`glass-card-hover p-4 flex flex-col items-center gap-2.5 text-center ${item.gradient} animate-slide-up`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="text-3xl">{item.emoji}</div>
              <span className="text-xs font-semibold text-foreground">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Bills */}
      <div className="px-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <BarChart3 size={14} className="text-primary" />
            <h2 className="font-display font-semibold text-sm text-foreground">Recent Transactions</h2>
          </div>
          <button onClick={() => navigate("/billing")} className="text-primary text-xs flex items-center gap-1 font-semibold hover:underline">
            View All <ArrowRight size={12} />
          </button>
        </div>
        <div className="space-y-2">
          {recentBills.length > 0 ? recentBills.map((bill, i) => (
            <div key={bill.id} className="glass-card p-3.5 flex items-center justify-between animate-slide-up" style={{ animationDelay: `${i * 60}ms` }}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bill.paymentConfirmed ? 'bg-success/10 border border-success/20' : 'bg-warning/10 border border-warning/20'}`}>
                  <TrendingUp size={16} className={bill.paymentConfirmed ? 'text-success' : 'text-warning'} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{bill.customerName || "Walk-in Customer"}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Clock size={10} className="text-muted-foreground" />
                    <p className="text-[10px] text-muted-foreground">{bill.billNo.slice(-8)} · {formatDate(bill.date)}</p>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-display font-bold text-foreground text-base">₹{bill.total.toLocaleString()}</p>
                <span className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                  bill.paymentConfirmed
                    ? 'bg-success/10 text-success border border-success/20'
                    : 'bg-warning/10 text-warning border border-warning/20'
                }`}>
                  {bill.paymentConfirmed ? "Paid" : "Pending"}
                </span>
              </div>
            </div>
          )) : (
            <div className="glass-card p-8 text-center">
              <Sparkles size={32} className="text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-sm font-medium text-muted-foreground">No transactions yet</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Create your first bill to get started!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
