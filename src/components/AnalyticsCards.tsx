import { TrendingUp, Package, IndianRupee, Users, X } from "lucide-react";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const mockChartData = [
  { name: "Mon", value: 2400 },
  { name: "Tue", value: 1398 },
  { name: "Wed", value: 3200 },
  { name: "Thu", value: 2780 },
  { name: "Fri", value: 1890 },
  { name: "Sat", value: 4390 },
  { name: "Sun", value: 3490 },
];

const stats = [
  { label: "Today Sales", value: "₹4,250", icon: IndianRupee, gradient: "gradient-card-blue", change: "+12%" },
  { label: "Monthly Sales", value: "₹1,24,500", icon: TrendingUp, gradient: "gradient-card-green", change: "+8%" },
  { label: "Total Products", value: "156", icon: Package, gradient: "gradient-card-orange", change: "+3" },
  { label: "Pending Udhari", value: "₹8,750", icon: Users, gradient: "gradient-card-purple", change: "5 customers" },
];

const AnalyticsCards = () => {
  const [selectedStat, setSelectedStat] = useState<number | null>(null);

  return (
    <>
      <div className="px-4 grid grid-cols-2 gap-3">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <button
              key={stat.label}
              onClick={() => setSelectedStat(i)}
              className={`glass-card-hover p-4 text-left ${stat.gradient}`}
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-foreground/10 flex items-center justify-center">
                  <Icon size={16} className="text-foreground" />
                </div>
                <span className="text-[10px] text-primary font-semibold">{stat.change}</span>
              </div>
              <p className="text-lg font-bold font-display text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </button>
          );
        })}
      </div>

      {/* Chart Modal */}
      {selectedStat !== null && (
        <div className="modal-overlay animate-scale-in" onClick={() => setSelectedStat(null)}>
          <div className="glass-card w-[90%] max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-foreground">{stats[selectedStat].label}</h3>
              <button onClick={() => setSelectedStat(null)} className="text-muted-foreground">
                <X size={20} />
              </button>
            </div>
            <p className="text-2xl font-bold gradient-text mb-4">{stats[selectedStat].value}</p>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={mockChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 20%)" />
                  <XAxis dataKey="name" stroke="hsl(215 15% 55%)" fontSize={11} />
                  <YAxis stroke="hsl(215 15% 55%)" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(220 20% 12%)",
                      border: "1px solid hsl(220 15% 25%)",
                      borderRadius: "8px",
                      color: "hsl(210 40% 95%)",
                    }}
                  />
                  <Bar dataKey="value" fill="hsl(175 80% 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AnalyticsCards;
