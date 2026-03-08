import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { Store, Sparkles, Mail, Lock, User, ArrowLeft, CheckCircle, Eye, EyeOff } from "lucide-react";

type AuthMode = "login" | "signup" | "reset";

const Login = () => {
  const { user, loginWithGoogle, loginWithEmail, signupWithEmail, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [mode, setMode] = useState<AuthMode>("login");
  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // Auto redirect to home when logged in
  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError("");
    setSuccess("");
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
    setSuccess("");
    try {
      if (mode === "login") {
        await loginWithEmail(email, password);
      } else if (mode === "signup") {
        await signupWithEmail(email, password, name);
        setSuccess("✅ Account তৈরি হয়েছে! Home page এ যাচ্ছে...");
      } else if (mode === "reset") {
        await resetPassword(email);
        setSuccess("✅ Password reset email পাঠানো হয়েছে! Email check করুন।");
        setTimeout(() => setMode("login"), 2000);
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError("");
    setSuccess("");
    setShowPassword(false);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="login-orb login-orb-1" />
      <div className="login-orb login-orb-2" />
      <div className="login-orb login-orb-3" />
      <div className="login-orb login-orb-4" />
      <div className="login-orb login-orb-5" />
      {/* Grid overlay */}
      <div className="absolute inset-0 login-grid-bg opacity-[0.03]" />
      {/* Shimmer line */}
      <div className="absolute top-0 left-0 right-0 h-px login-shimmer-line" />

      <div className="relative z-10 flex flex-col items-center gap-5 max-w-sm w-full">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
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

        {/* Auth Card */}
        <div className="glass-card p-5 w-full space-y-4">
          {/* Mode Tabs */}
          <div className="flex rounded-xl bg-muted/30 p-1 gap-1">
            <button
              onClick={() => switchMode("login")}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                mode === "login" 
                  ? "gradient-primary text-primary-foreground shadow-md" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => switchMode("signup")}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                mode === "signup" 
                  ? "gradient-primary text-primary-foreground shadow-md" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Header text */}
          <div className="text-center">
            <h2 className="font-display font-bold text-lg text-foreground">
              {mode === "login" ? "Login করুন" : mode === "signup" ? "নতুন Account" : "Password Reset"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {mode === "login" 
                ? "Email ও Password দিয়ে login করুন" 
                : mode === "signup" 
                  ? "নতুন account তৈরি করুন — ফ্রি!" 
                  : "আপনার email দিন, reset link পাঠাবো"}
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-success/10 border border-success/20">
              <CheckCircle size={16} className="text-success shrink-0" />
              <p className="text-xs text-success font-medium">{success}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20">
              <p className="text-xs text-destructive font-medium">{error}</p>
            </div>
          )}

          {mode !== "reset" ? (
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              {mode === "signup" && (
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="আপনার নাম (দোকানদার)"
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
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder={mode === "signup" ? "Password (কমপক্ষে ৬ অক্ষর)" : "Password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full pl-10 pr-12 py-3 rounded-xl bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {mode === "login" && (
                <button 
                  type="button"
                  onClick={() => switchMode("reset")} 
                  className="text-xs text-primary hover:underline w-full text-right"
                >
                  Password ভুলে গেছেন?
                </button>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 glow-primary disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : mode === "login" ? (
                  "🔑 Login করুন"
                ) : (
                  "✨ Account তৈরি করুন"
                )}
              </button>
            </form>
          ) : (
            /* Reset Password Form */
            <form onSubmit={handleEmailSubmit} className="space-y-3">
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="email"
                  placeholder="আপনার email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/50 border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full gradient-primary text-primary-foreground py-3.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 glow-primary disabled:opacity-50 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                ) : (
                  "📧 Reset Link পাঠান"
                )}
              </button>

              <button 
                type="button"
                onClick={() => switchMode("login")} 
                className="text-xs text-primary hover:underline flex items-center justify-center gap-1 mx-auto"
              >
                <ArrowLeft size={12} /> Login এ ফিরে যান
              </button>
            </form>
          )}

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

          <p className="text-[10px] text-muted-foreground text-center">
            ⚠️ APK তে Google login কাজ নাও করতে পারে। Email দিয়ে login করুন।
          </p>
        </div>

        {/* Back to app link */}
        <button 
          onClick={() => navigate("/")} 
          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
        >
          <ArrowLeft size={12} /> Login ছাড়া ব্যবহার করুন
        </button>
      </div>
    </div>
  );
};

export default Login;