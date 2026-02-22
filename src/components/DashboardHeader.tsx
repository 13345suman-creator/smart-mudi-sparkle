import { Bell, User } from "lucide-react";
import { useState, useEffect } from "react";

const DashboardHeader = () => {
  const [shopName] = useState("Smart Mudi Khana");
  const [greeting, setGreeting] = useState("");
  const [currentDate, setCurrentDate] = useState("");

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    if (hour < 12) setGreeting("Good Morning");
    else if (hour < 17) setGreeting("Good Afternoon");
    else setGreeting("Good Evening");

    setCurrentDate(now.toLocaleDateString("en-IN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }));
  }, []);

  return (
    <header className="relative overflow-hidden px-4 pt-6 pb-8">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-primary/10 blur-[100px]" />
      <div className="absolute top-10 right-1/4 w-48 h-48 rounded-full bg-accent/10 blur-[80px]" />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center glow-primary">
            <span className="text-primary-foreground font-bold text-sm">SM</span>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{greeting} 👋</p>
            <p className="text-sm font-medium text-foreground">Owner</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="glass-card w-9 h-9 flex items-center justify-center rounded-xl relative">
            <Bell size={18} className="text-muted-foreground" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-[10px] flex items-center justify-center text-foreground font-bold">3</span>
          </button>
          <button className="glass-card w-9 h-9 flex items-center justify-center rounded-xl">
            <User size={18} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* Shop Name - 3D Glass Style */}
      <div className="relative z-10 text-center float-animation">
        <div className="glass-card inline-block px-8 py-4 glow-primary">
          <h1 className="font-display text-2xl font-bold gradient-text tracking-tight">
            {shopName}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">{currentDate}</p>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
