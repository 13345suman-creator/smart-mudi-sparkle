import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";
import DashboardHeader from "./DashboardHeader";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const isDashboard = location.pathname === "/";

  return (
    <div className="min-h-screen bg-background pb-24">
      {isDashboard && <DashboardHeader />}
      <main className={isDashboard ? "" : "pt-4"}>
        {children}
      </main>
      <BottomNav />
    </div>
  );
};

export default Layout;
