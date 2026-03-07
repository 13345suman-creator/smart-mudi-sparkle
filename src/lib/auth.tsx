import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, provider } from "./firebase";

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
      }
    }).catch((err) => {
      console.error("Redirect result error:", err);
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
      if (isNativeApp()) {
        // Use redirect for native apps / webviews where popups don't work
        await signInWithRedirect(auth, provider);
      } else {
        try {
          const result = await signInWithPopup(auth, provider);
          console.log("Logged in:", result.user);
        } catch (popupError: any) {
          // If popup blocked, fall back to redirect
          if (popupError.code === "auth/popup-blocked" || 
              popupError.code === "auth/popup-closed-by-user" ||
              popupError.code === "auth/cancelled-popup-request") {
            await signInWithRedirect(auth, provider);
          } else {
            throw popupError;
          }
        }
      }
    } catch (error: any) {
      console.error(error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut(auth);
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
