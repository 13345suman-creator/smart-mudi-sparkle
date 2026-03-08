import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { 
  User, signInWithPopup, signInWithRedirect, getRedirectResult, signOut, onAuthStateChanged,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail, updateProfile
} from "firebase/auth";
import { auth, provider } from "./firebase";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signupWithEmail: (email: string, password: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const isCapacitor = () => !!(window as any).Capacitor;
const isPWAStandalone = () => window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
const isMobileBrowser = () => /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

const getLoginMethod = (): 'popup' | 'redirect' => {
  if (isCapacitor()) return 'popup';
  if (isPWAStandalone() || isMobileBrowser()) return 'redirect';
  return 'popup';
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getRedirectResult(auth).then((result) => {
      if (result?.user) {
        toast.success(`Welcome, ${result.user.displayName || result.user.email}!`);
      }
    }).catch((err) => {
      console.error("Redirect result error:", err);
      if (err.code === "auth/unauthorized-domain") {
        toast.error("This domain is not authorized in Firebase.");
      }
    });

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const loginWithGoogle = async () => {
    provider.setCustomParameters({ prompt: 'select_account' });
    const method = getLoginMethod();

    if (method === 'redirect') {
      try {
        toast.info("Google login এ redirect হচ্ছে...");
        await signInWithRedirect(auth, provider);
      } catch (err: any) {
        if (err.code === "auth/unauthorized-domain") {
          toast.error(`Domain "${window.location.hostname}" Firebase এ authorized নয়।`, { duration: 10000 });
        } else {
          toast.error(err.message || "Login failed");
        }
        throw err;
      }
    } else {
      try {
        const result = await signInWithPopup(auth, provider);
        toast.success(`Welcome, ${result.user.displayName || result.user.email}!`);
      } catch (popupError: any) {
        if (popupError.code === "auth/popup-blocked" || 
            popupError.code === "auth/popup-closed-by-user" ||
            popupError.code === "auth/cancelled-popup-request") {
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

  const loginWithEmail = async (email: string, password: string) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      toast.success(`Welcome back, ${result.user.displayName || result.user.email}!`);
    } catch (err: any) {
      if (err.code === "auth/user-not-found" || err.code === "auth/invalid-credential") {
        toast.error("Email বা Password ভুল হয়েছে");
      } else if (err.code === "auth/too-many-requests") {
        toast.error("অনেকবার চেষ্টা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।");
      } else {
        toast.error(err.message || "Login failed");
      }
      throw err;
    }
  };

  const signupWithEmail = async (email: string, password: string, name: string) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      if (name) {
        await updateProfile(result.user, { displayName: name });
      }
      toast.success(`Account তৈরি হয়েছে! Welcome, ${name || email}!`);
    } catch (err: any) {
      if (err.code === "auth/email-already-in-use") {
        toast.error("এই email দিয়ে আগে account তৈরি হয়েছে। Login করুন।");
      } else if (err.code === "auth/weak-password") {
        toast.error("Password কমপক্ষে ৬ অক্ষরের হতে হবে");
      } else {
        toast.error(err.message || "Signup failed");
      }
      throw err;
    }
  };

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email পাঠানো হয়েছে। Email check করুন।");
    } catch (err: any) {
      if (err.code === "auth/user-not-found") {
        toast.error("এই email দিয়ে কোনো account নেই");
      } else {
        toast.error(err.message || "Reset failed");
      }
      throw err;
    }
  };

  const logout = async () => {
    await signOut(auth);
    toast.success("Logged out successfully");
  };

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, loginWithEmail, signupWithEmail, resetPassword, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
};
