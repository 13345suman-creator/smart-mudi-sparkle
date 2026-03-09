import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/language";
import { Store, Sparkles, Mail, Lock, User, ArrowLeft, CheckCircle, Eye, EyeOff, AlertTriangle } from "lucide-react";

type AuthMode = "login" | "signup" | "reset";

const Login = () => {
  const { user, loginWithEmail, signupWithEmail, resetPassword } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showSpamWarning, setShowSpamWarning] = useState(false);
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


  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setShowSpamWarning(false);
    try {
      if (mode === "login") {
        await loginWithEmail(email, password);
      } else if (mode === "signup") {
        await signupWithEmail(email, password, name);
        setSuccess(t("account_created"));
      } else if (mode === "reset") {
        await resetPassword(email);
        setSuccess(t("reset_email_sent"));
        setShowSpamWarning(true);
        setTimeout(() => setMode("login"), 3000);
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
    setShowSpamWarning(false);
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
              {t("smart_shop_tagline")}
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
              {t("login_tab")}
            </button>
            <button
              onClick={() => switchMode("signup")}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                mode === "signup" 
                  ? "gradient-primary text-primary-foreground shadow-md" 
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t("signup_tab")}
            </button>
          </div>

          {/* Header text */}
          <div className="text-center">
            <h2 className="font-display font-bold text-lg text-foreground">
              {mode === "login" ? t("login_heading") : mode === "signup" ? t("signup_heading") : t("reset_heading")}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {mode === "login" 
                ? t("login_subtitle") 
                : mode === "signup" 
                  ? t("signup_subtitle") 
                  : t("reset_subtitle")}
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-success/10 border border-success/20">
              <CheckCircle size={16} className="text-success shrink-0" />
              <p className="text-xs text-success font-medium">{success}</p>
            </div>
          )}

          {/* Spam Warning */}
          {showSpamWarning && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-warning/10 border border-warning/20">
              <AlertTriangle size={16} className="text-warning shrink-0" />
              <p className="text-xs text-warning font-medium">{t("reset_spam_warning")}</p>
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
                    placeholder={t("your_name")}
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
                  placeholder={t("email_address")}
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
                  placeholder={mode === "signup" ? t("password_signup_placeholder") : t("password_placeholder")}
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
                  {t("forgot_password")}
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
                  t("login_button")
                ) : (
                  t("signup_button")
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
                  placeholder={t("your_email")}
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
                  t("reset_button")
                )}
              </button>

              <button 
                type="button"
                onClick={() => switchMode("login")} 
                className="text-xs text-primary hover:underline flex items-center justify-center gap-1 mx-auto"
              >
                <ArrowLeft size={12} /> {t("back_to_login")}
              </button>
            </form>
          )}

          <p className="text-[10px] text-muted-foreground text-center mt-2">
            {t("login_secure_note")}
          </p>
        </div>

        {/* Back to app link */}
        <button 
          onClick={() => navigate("/")} 
          className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
        >
          <ArrowLeft size={12} /> {t("use_without_login")}
        </button>
      </div>
    </div>
  );
};

export default Login;
