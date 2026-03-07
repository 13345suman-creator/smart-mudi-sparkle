import { useState, useEffect, useCallback } from "react";
import { Lock, Delete, Shield, Mail, ArrowLeft, CheckCircle, KeyRound } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

interface PinLockScreenProps {
  onUnlock: () => void;
}

const PinLockScreen = ({ onUnlock }: PinLockScreenProps) => {
  const { user } = useAuth();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [locked, setLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  const [mode, setMode] = useState<"pin" | "forgot" | "reset">("pin");
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [resetStep, setResetStep] = useState<1 | 2 | 3>(1);

  const savedPin = localStorage.getItem("smk_lockpin") || "";

  // Lock timer countdown
  useEffect(() => {
    if (lockTimer > 0) {
      const interval = setInterval(() => {
        setLockTimer(prev => {
          if (prev <= 1) {
            setLocked(false);
            setAttempts(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [lockTimer]);

  const handlePinInput = useCallback((digit: string) => {
    if (locked || pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError("");

    if (newPin.length === 4) {
      setTimeout(() => {
        if (newPin === savedPin) {
          onUnlock();
        } else {
          setShake(true);
          setError("Wrong PIN");
          const newAttempts = attempts + 1;
          setAttempts(newAttempts);
          setTimeout(() => {
            setShake(false);
            setPin("");
          }, 500);

          if (newAttempts >= 5) {
            setLocked(true);
            setLockTimer(30);
            setError("Too many attempts. Try again in 30s");
          }
        }
      }, 150);
    }
  }, [pin, savedPin, attempts, locked, onUnlock]);

  const handleDelete = () => {
    setPin(prev => prev.slice(0, -1));
    setError("");
  };

  const handleForgotPin = () => {
    if (!user?.email) {
      toast.error("No email found. Please login first.");
      return;
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setMode("forgot");
    setResetStep(1);
    // In a real app, send email. Here we show the OTP for demo
    toast.success(`Verification code sent to ${user.email}`);
    // For demo: show OTP in console
    console.log("Reset OTP:", code);
  };

  const verifyOtp = () => {
    if (otp === generatedOtp) {
      setResetStep(2);
      setOtp("");
    } else {
      toast.error("Invalid verification code");
    }
  };

  const saveNewPin = () => {
    if (newPin.length !== 4) {
      toast.error("PIN must be 4 digits");
      return;
    }
    if (newPin !== confirmPin) {
      toast.error("PINs don't match");
      return;
    }
    localStorage.setItem("smk_lockpin", newPin);
    setResetStep(3);
    setTimeout(() => {
      setMode("pin");
      setPin("");
      setNewPin("");
      setConfirmPin("");
      toast.success("PIN changed successfully!");
    }, 1500);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, "0")}`;

  // Forgot PIN flow
  if (mode === "forgot") {
    return (
      <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center px-6">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full bg-primary/5 blur-[100px]" />
        <div className="absolute bottom-1/3 right-1/4 w-56 h-56 rounded-full bg-accent/5 blur-[80px]" />
        
        <div className="relative z-10 w-full max-w-sm">
          <button onClick={() => { setMode("pin"); setOtp(""); setNewPin(""); setConfirmPin(""); }} className="flex items-center gap-2 text-muted-foreground text-sm mb-8 hover:text-foreground transition-colors">
            <ArrowLeft size={16} /> Back to PIN
          </button>

          {resetStep === 1 && (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center glow-primary">
                  <Mail size={28} className="text-primary-foreground" />
                </div>
                <h2 className="font-display text-xl font-bold text-foreground">Verify Email</h2>
                <p className="text-xs text-muted-foreground text-center">
                  Enter the 6-digit code sent to<br />
                  <span className="text-primary font-medium">{user?.email || "your email"}</span>
                </p>
              </div>

              <div className="glass-card p-5 rounded-2xl space-y-4">
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="w-full text-center text-2xl font-mono tracking-[0.5em] bg-transparent border-b-2 border-primary/30 focus:border-primary outline-none py-3 text-foreground"
                  placeholder="• • • • • •"
                  autoFocus
                />
                <button onClick={verifyOtp} disabled={otp.length !== 6} className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm disabled:opacity-40 glow-primary">
                  Verify Code
                </button>
              </div>

              <p className="text-[10px] text-muted-foreground text-center">
                Demo: Check browser console for the code
              </p>
            </div>
          )}

          {resetStep === 2 && (
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center glow-primary">
                  <KeyRound size={28} className="text-primary-foreground" />
                </div>
                <h2 className="font-display text-xl font-bold text-foreground">Set New PIN</h2>
                <p className="text-xs text-muted-foreground">Create a new 4-digit PIN</p>
              </div>

              <div className="glass-card p-5 rounded-2xl space-y-4">
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">New PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={newPin}
                    onChange={e => setNewPin(e.target.value.replace(/\D/g, ""))}
                    className="w-full text-center text-2xl font-mono tracking-[0.8em] bg-transparent border-b-2 border-primary/30 focus:border-primary outline-none py-3 text-foreground"
                    placeholder="• • • •"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-2 block">Confirm PIN</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={confirmPin}
                    onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ""))}
                    className="w-full text-center text-2xl font-mono tracking-[0.8em] bg-transparent border-b-2 border-primary/30 focus:border-primary outline-none py-3 text-foreground"
                    placeholder="• • • •"
                  />
                </div>
                <button onClick={saveNewPin} disabled={newPin.length !== 4 || confirmPin.length !== 4} className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm disabled:opacity-40 glow-primary">
                  Save New PIN
                </button>
              </div>
            </div>
          )}

          {resetStep === 3 && (
            <div className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-[hsl(var(--success))]/20 flex items-center justify-center">
                <CheckCircle size={40} className="text-[hsl(var(--success))]" />
              </div>
              <h2 className="font-display text-xl font-bold text-foreground">PIN Changed!</h2>
              <p className="text-sm text-muted-foreground">Redirecting...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-background flex flex-col items-center justify-center px-6 select-none">
      {/* Background effects */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full bg-primary/5 blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-accent/5 blur-[100px]" />

      <div className="relative z-10 flex flex-col items-center gap-8 w-full max-w-xs">
        {/* Lock Icon */}
        <div className="flex flex-col items-center gap-4">
          <div className={`w-20 h-20 rounded-3xl gradient-primary flex items-center justify-center glow-primary transition-transform duration-300 ${shake ? "animate-shake" : ""}`}>
            <Shield size={36} className="text-primary-foreground" />
          </div>
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold text-foreground">Smart Mudi Khana</h1>
            <p className="text-xs text-muted-foreground mt-1">Enter your PIN to unlock</p>
          </div>
        </div>

        {/* PIN Dots */}
        <div className={`flex items-center gap-5 ${shake ? "animate-shake" : ""}`}>
          {[0, 1, 2, 3].map(i => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                i < pin.length
                  ? "bg-primary scale-110 shadow-[0_0_12px_hsl(var(--glow-primary))]"
                  : "border-2 border-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        {/* Error / Lock message */}
        {error && (
          <p className="text-xs text-destructive font-medium -mt-4">
            {locked ? `${error} (${formatTime(lockTimer)})` : error}
          </p>
        )}

        {/* Number Pad */}
        <div className="grid grid-cols-3 gap-4 w-full">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
            <button
              key={num}
              onClick={() => handlePinInput(String(num))}
              disabled={locked}
              className="w-full aspect-square rounded-2xl glass-card flex items-center justify-center text-2xl font-semibold text-foreground hover:bg-primary/10 active:scale-90 transition-all duration-150 disabled:opacity-30"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleForgotPin}
            className="w-full aspect-square rounded-2xl flex items-center justify-center text-[10px] font-medium text-primary hover:bg-primary/5 transition-colors"
          >
            Forgot?
          </button>
          <button
            onClick={() => handlePinInput("0")}
            disabled={locked}
            className="w-full aspect-square rounded-2xl glass-card flex items-center justify-center text-2xl font-semibold text-foreground hover:bg-primary/10 active:scale-90 transition-all duration-150 disabled:opacity-30"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            disabled={locked}
            className="w-full aspect-square rounded-2xl flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-destructive/5 transition-colors disabled:opacity-30"
          >
            <Delete size={24} />
          </button>
        </div>

        {/* Attempts indicator */}
        {attempts > 0 && !locked && (
          <p className="text-[10px] text-muted-foreground">{5 - attempts} attempts remaining</p>
        )}
      </div>
    </div>
  );
};

export default PinLockScreen;
