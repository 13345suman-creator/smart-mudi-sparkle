import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import BottomNav from "./BottomNav";
import DashboardHeader from "./DashboardHeader";
import StorageLimitDialog from "./StorageLimitDialog";
import { useStore } from "@/lib/store";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const location = useLocation();
  const isDashboard = location.pathname === "/";
  const { storageMB, showStorageLimitDialog, setShowStorageLimitDialog } = useStore();

  return (
    <div className="min-h-screen bg-background pb-24">
      {isDashboard && <DashboardHeader />}
      <main className={isDashboard ? "" : "pt-4"}>
        {children}
      </main>
      <BottomNav />
      <StorageLimitDialog 
        open={showStorageLimitDialog} 
        onOpenChange={setShowStorageLimitDialog}
        usageMB={storageMB}
      />
    </div>
  );
};

export default Layout;
