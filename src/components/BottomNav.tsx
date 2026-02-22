import { useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Package, Receipt, Users, Settings, Plus } from "lucide-react";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Home" },
  { path: "/stock", icon: Package, label: "Stock" },
  { path: "/billing", icon: Receipt, label: "Bill", isCentral: true },
  { path: "/udhari", icon: Users, label: "Udhari" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="bottom-nav">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          if (item.isCentral) {
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="create-bill-btn"
                aria-label="Create Bill"
              >
                <Plus size={26} className="text-primary-foreground" />
              </button>
            );
          }

          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all duration-300 ${
                isActive ? "nav-button-active" : "text-muted-foreground"
              }`}
            >
              <Icon size={20} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
