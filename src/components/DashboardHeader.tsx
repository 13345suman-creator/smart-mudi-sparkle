import { Bell, LogOut, LogIn, Cloud, CloudOff } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { useStore } from "@/lib/store";

const DashboardHeader = () => {
  const { user, loginWithGoogle, logout } = useAuth();
  const { settings } = useStore();
  const [greeting, setGreeting] = useState("");
  const [currentDate, setCurrentDate] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

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

  return (
    <header className="relative overflow-hidden px-4 pt-6 pb-8">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full bg-primary/10 blur-[100px]" />
      <div className="absolute top-10 right-1/4 w-48 h-48 rounded-full bg-accent/10 blur-[80px]" />

      {/* Top bar */}
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
          {/* Sync status indicator */}
          {user ? (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-success/10 border border-success/20">
              <Cloud size={12} className="text-success" />
              <span className="text-[10px] text-success font-medium">Synced</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-warning/10 border border-warning/20">
              <CloudOff size={12} className="text-warning" />
              <span className="text-[10px] text-warning font-medium">Offline</span>
            </div>
          )}

          <button className="glass-card w-9 h-9 flex items-center justify-center rounded-xl relative">
            <Bell size={18} className="text-muted-foreground" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-[10px] flex items-center justify-center text-foreground font-bold">3</span>
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
              <span className="text-xs font-semibold">{loginLoading ? "..." : "Login"}</span>
            </button>
          )}
        </div>
      </div>

      {/* Shop Name - 3D Glass Style */}
      <div className="relative z-10 text-center float-animation">
        <div className="glass-card inline-block px-8 py-4 glow-primary">
          <h1 className="font-display text-2xl font-bold gradient-text tracking-tight">
            {settings.shopName}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">{currentDate}</p>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
