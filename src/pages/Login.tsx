import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { LogIn, Store, Sparkles } from "lucide-react";

const Login = () => {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-primary/8 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-accent/8 blur-[100px]" />

      <div className="relative z-10 flex flex-col items-center gap-8 max-w-sm w-full">
        {/* Logo */}
        <div className="flex flex-col items-center gap-4">
          <div className="w-20 h-20 rounded-2xl gradient-primary flex items-center justify-center glow-primary float-animation">
            <Store size={36} className="text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="font-display text-3xl font-bold gradient-text tracking-tight">
              Smart Mudi Khana
            </h1>
            <p className="text-sm text-muted-foreground mt-2 flex items-center justify-center gap-1">
              <Sparkles size={14} className="text-primary" />
              Your Smart Shop Assistant
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="glass-card p-6 w-full space-y-6">
          <div className="text-center">
            <h2 className="font-display font-bold text-lg text-foreground">Welcome</h2>
            <p className="text-xs text-muted-foreground mt-1">Sign in to manage your shop</p>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 glow-primary disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                  <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
                  <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
                </svg>
                Sign in with Google
              </>
            )}
          </button>

          {error && (
            <p className="text-xs text-destructive text-center">{error}</p>
          )}
        </div>

        <p className="text-[10px] text-muted-foreground text-center">
          Your data is securely synced across all devices
        </p>
      </div>
    </div>
  );
};

export default Login;
