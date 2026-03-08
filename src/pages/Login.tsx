import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { LogIn, Store, Sparkles, Mail, Lock, User, ArrowLeft } from "lucide-react";

type AuthMode = "login" | "signup" | "reset";

const Login = () => {
  const { loginWithGoogle, loginWithEmail, signupWithEmail, resetPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [mode, setMode] = useState<AuthMode>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");
    try {
      await loginWithGoogle();
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (mode === "login") {
        await loginWithEmail(email, password);
      } else if (mode === "signup") {
        await signupWithEmail(email, password, name);
      } else if (mode === "reset") {
        await resetPassword(email);
        setMode("login");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-primary/8 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-accent/8 blur-[100px]" />

      <div className="relative z-10 flex flex-col items-center gap-6 max-w-sm w-full">
        {/* Logo */}
        <div className="flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center glow-primary float-animation">
            <Store size={30} className="text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold gradient-text tracking-tight">
              Smart Mudi Khana
            </h1>
            <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1">
              <Sparkles size={12} className="text-primary" />
              Your Smart Shop Assistant
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="glass-card p-5 w-full space-y-4">
          <div className="text-center">
            <h2 className="font-display font-bold text-lg text-foreground">
              {mode === "login" ? "Welcome Back" : mode === "signup" ? "Create Account" : "Reset Password"}
            </h2>
            <p className="text-xs text-muted-foreground mt-1">
              {mode === "login" ? "Sign in to manage your shop" : mode === "signup" ? "Start managing your shop" : "Enter your email to reset"}
            </p>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            {mode === "signup" && (
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="আপনার নাম"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            )}

            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {mode !== "reset" && (
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 glow-primary disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              ) : (
                <>
                  <Mail size={16} />
                  {mode === "login" ? "Email দিয়ে Login" : mode === "signup" ? "Account তৈরি করুন" : "Reset Link পাঠান"}
                </>
              )}
            </button>
          </form>

          {/* Mode switches */}
          <div className="text-center space-y-1">
            {mode === "login" && (
              <>
                <button onClick={() => { setMode("reset"); setError(""); }} className="text-xs text-primary hover:underline">
                  Password ভুলে গেছেন?
                </button>
                <p className="text-xs text-muted-foreground">
                  Account নেই?{" "}
                  <button onClick={() => { setMode("signup"); setError(""); }} className="text-primary hover:underline font-medium">
                    Sign Up করুন
                  </button>
                </p>
              </>
            )}
            {mode === "signup" && (
              <p className="text-xs text-muted-foreground">
                আগে account আছে?{" "}
                <button onClick={() => { setMode("login"); setError(""); }} className="text-primary hover:underline font-medium">
                  Login করুন
                </button>
              </p>
            )}
            {mode === "reset" && (
              <button onClick={() => { setMode("login"); setError(""); }} className="text-xs text-primary hover:underline flex items-center justify-center gap-1 mx-auto">
                <ArrowLeft size={12} /> Login এ ফিরে যান
              </button>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">অথবা</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full bg-muted/50 border border-border text-foreground py-3 rounded-xl font-medium text-sm flex items-center justify-center gap-2.5 disabled:opacity-50 transition-all hover:bg-muted active:scale-[0.98]"
          >
            {googleLoading ? (
              <div className="w-5 h-5 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                  <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
                  <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
                </svg>
                Google দিয়ে Login
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