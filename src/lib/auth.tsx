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

// Detect environment type
const isCapacitor = () => !!(window as any).Capacitor;
const isPWAStandalone = () => window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
const isMobileBrowser = () => /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

// In Capacitor WebView, redirect doesn't work — must use popup
// In PWA/mobile browser, popup gets blocked — must use redirect
const getLoginMethod = (): 'popup' | 'redirect' => {
  if (isCapacitor()) return 'popup'; // WebView can't handle redirects
  if (isPWAStandalone() || isMobileBrowser()) return 'redirect'; // Mobile browsers block popups
  return 'popup'; // Desktop default
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
    provider.setCustomParameters({ prompt: 'select_account' });
    
    const method = getLoginMethod();
    console.log("Login method:", method, "| Capacitor:", isCapacitor(), "| hostname:", window.location.hostname);

    if (useRedirect) {
      // For installed apps (PWA/APK/mobile), use redirect — popups get blocked
      try {
        toast.info("Google login এ redirect হচ্ছে...");
        await signInWithRedirect(auth, provider);
      } catch (err: any) {
        console.error("Redirect error:", err);
        if (err.code === "auth/unauthorized-domain") {
          toast.error(`Domain "${window.location.hostname}" Firebase এ authorized নয়। Firebase Console → Authentication → Authorized domains এ add করুন।`, { duration: 10000 });
        } else {
          toast.error(err.message || "Login failed");
        }
        throw err;
      }
    } else {
      // Desktop browser — use popup
      try {
        console.log("Attempting popup login...");
        const result = await signInWithPopup(auth, provider);
        console.log("Popup login success:", result.user.email);
        toast.success(`Welcome, ${result.user.displayName || result.user.email}!`);
      } catch (popupError: any) {
        console.error("Popup login error:", popupError.code, popupError.message);
        if (popupError.code === "auth/popup-blocked" || 
            popupError.code === "auth/popup-closed-by-user" ||
            popupError.code === "auth/cancelled-popup-request") {
          console.log("Popup failed, trying redirect...");
          toast.info("Redirecting to Google login...");
          await signInWithRedirect(auth, provider);
          return;
        }
        if (popupError.code === "auth/unauthorized-domain") {
          toast.error(`Domain "${window.location.hostname}" Firebase এ authorized নয়।`, { duration: 10000 });
        } else {
          toast.error(popupError.message || "Login failed");
        }
        throw popupError;
      }
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
