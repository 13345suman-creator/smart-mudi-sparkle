import { TrendingUp, ArrowRight } from "lucide-react";
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
  const { bills, udhariEntries } = useStore();

  const todaySales = bills
    .filter(b => new Date(b.date).toDateString() === new Date().toDateString())
    .reduce((s, b) => s + b.total, 0);

  const totalPendingUdhari = udhariEntries.reduce((s, e) => s + e.amount, 0);

  const recentBills = bills.slice(0, 5);

  return (
    <div className="space-y-6 pb-4">
      <AnalyticsCards todaySales={todaySales} pendingUdhari={totalPendingUdhari} udhariCustomers={udhariEntries.length} />

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
