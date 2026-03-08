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

// Detect if running in Capacitor/native app or restricted environment
const isNativeApp = () => {
  return !!(window as any).Capacitor || 
         /wv|webview/i.test(navigator.userAgent) ||
         (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches);
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
      // Always configure provider
      provider.setCustomParameters({ prompt: 'select_account' });
      
      if (isNativeApp()) {
        // Use redirect for native apps / webviews where popups don't work
        toast.info("Redirecting to Google login...");
        await signInWithRedirect(auth, provider);
      } else {
        try {
          const result = await signInWithPopup(auth, provider);
          console.log("Logged in:", result.user);
          toast.success(`Welcome, ${result.user.displayName}!`);
        } catch (popupError: any) {
          // If popup blocked, fall back to redirect
          if (popupError.code === "auth/popup-blocked" || 
              popupError.code === "auth/popup-closed-by-user" ||
              popupError.code === "auth/cancelled-popup-request") {
            toast.info("Popup blocked. Redirecting...");
            await signInWithRedirect(auth, provider);
          } else if (popupError.code === "auth/unauthorized-domain") {
            toast.error("Domain not authorized! Add this domain to Firebase Console → Authentication → Authorized domains.", { duration: 8000 });
            throw popupError;
          } else {
            throw popupError;
          }
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
