import AnalyticsCards from "../components/AnalyticsCards";
import { ArrowRight, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";

const recentBills = [
  { id: "B001", customer: "Walk-in", amount: 450, time: "2 min ago" },
  { id: "B002", customer: "Ramesh Kumar", amount: 1250, time: "15 min ago" },
  { id: "B003", customer: "Walk-in", amount: 320, time: "1 hr ago" },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 pb-4">
      <AnalyticsCards />

      {/* Quick Actions */}
      <div className="px-4">
        <h2 className="font-display font-semibold text-sm text-muted-foreground mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: "New Bill", action: () => navigate("/billing"), emoji: "🧾" },
            { label: "Add Stock", action: () => navigate("/stock"), emoji: "📦" },
            { label: "Udhari", action: () => navigate("/udhari"), emoji: "📋" },
          ].map((item) => (
            <button
              key={item.label}
              onClick={item.action}
              className="glass-card-hover p-4 flex flex-col items-center gap-2 text-center"
            >
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
          {recentBills.map((bill) => (
            <div key={bill.id} className="glass-card p-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <TrendingUp size={16} className="text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{bill.customer}</p>
                  <p className="text-xs text-muted-foreground">{bill.id} · {bill.time}</p>
                </div>
              </div>
              <p className="font-display font-bold text-foreground">₹{bill.amount}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Index;
