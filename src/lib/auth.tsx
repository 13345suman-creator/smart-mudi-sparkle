import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, provider } from "./firebase";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Detect mobile environment (PWA, Capacitor, or mobile browser)
const isMobileOrPWA = () => {
  const isCapacitor = !!(window as any).Capacitor;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
  const isMobile = /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  return isCapacitor || isStandalone || isMobile;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for redirect result first (for mobile/Capacitor)
    getRedirectResult(auth).then((result) => {
      if (result?.user) {
        console.log("Redirect login success:", result.user.email);
        toast.success(`Welcome, ${result.user.displayName || result.user.email}!`);
      }
    }).catch((err) => {
      console.error("Redirect result error:", err);
      if (err.code === "auth/unauthorized-domain") {
        toast.error("This domain is not authorized in Firebase. Add it to Firebase Console → Authentication → Settings → Authorized domains.");
      }
    });

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (u) console.log("User logged in:", u.email);
      else console.log("No user");
    });
    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    try {
      provider.setCustomParameters({ prompt: 'select_account' });
      
      // Always use popup - works in both browser and Capacitor WebView
      // signInWithRedirect does NOT work in Capacitor/WebView environments
      try {
        const result = await signInWithPopup(auth, provider);
        console.log("Logged in:", result.user);
        toast.success(`Welcome, ${result.user.displayName}!`);
      } catch (popupError: any) {
        if (popupError.code === "auth/popup-blocked") {
          // Only use redirect as absolute last resort (won't work in APK)
          if (!isCapacitorApp()) {
            toast.info("Popup blocked. Redirecting...");
            await signInWithRedirect(auth, provider);
          } else {
            toast.error("Please allow popups for Google login to work.");
          }
        } else if (popupError.code === "auth/unauthorized-domain") {
          toast.error("Domain not authorized! Add this domain to Firebase Console → Authentication → Authorized domains.", { duration: 8000 });
          throw popupError;
        } else if (popupError.code !== "auth/popup-closed-by-user" && 
                   popupError.code !== "auth/cancelled-popup-request") {
          throw popupError;
        }
      }
    } catch (error: any) {
      console.error("Login error:", error);
      if (error.code === "auth/unauthorized-domain") {
        toast.error("Domain not authorized in Firebase. Please add this domain to Firebase Console.", { duration: 8000 });
      } else if (error.code !== "auth/popup-closed-by-user") {
        toast.error(error.message || "Login failed");
      }
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
    toast.success("Logged out successfully");
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
