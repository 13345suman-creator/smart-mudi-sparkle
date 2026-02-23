import { useState, useEffect, useRef, useCallback } from "react";
import { Camera, X, Wifi, Usb, ScanLine } from "lucide-react";

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

type InputMode = "detecting" | "external" | "camera";

const BarcodeScanner = ({ open, onClose, onScan }: BarcodeScannerProps) => {
  const [mode, setMode] = useState<InputMode>("detecting");
  const [scannedValue, setScannedValue] = useState("");
  const [externalBuffer, setExternalBuffer] = useState("");
  const [cameraError, setCameraError] = useState("");
  const scannerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const bufferTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const lastKeyTime = useRef(0);
  const keyBuffer = useRef("");

  // External scanner detection: listens for rapid keystrokes
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open) return;

      const now = Date.now();
      const timeDiff = now - lastKeyTime.current;

      if (e.key === "Enter") {
        if (keyBuffer.current.length >= 4) {
          // Rapid input ending with Enter = external scanner
          setMode("external");
          const code = keyBuffer.current;
          setScannedValue(code);
          onScan(code);
          keyBuffer.current = "";
        }
        return;
      }

      // If keys come in rapid succession (<80ms apart), it's likely a scanner
      if (timeDiff < 80 || keyBuffer.current.length === 0) {
        if (e.key.length === 1) {
          keyBuffer.current += e.key;
          lastKeyTime.current = now;

          // Switch to external mode if we detect rapid input
          if (keyBuffer.current.length >= 3 && timeDiff < 80) {
            setMode("external");
            setExternalBuffer(keyBuffer.current);
          }

          // Clear buffer after pause
          if (bufferTimeoutRef.current) clearTimeout(bufferTimeoutRef.current);
          bufferTimeoutRef.current = setTimeout(() => {
            keyBuffer.current = "";
            setExternalBuffer("");
          }, 300);
        }
      } else {
        keyBuffer.current = e.key.length === 1 ? e.key : "";
        lastKeyTime.current = now;
      }
    },
    [open, onScan]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Auto-detect: wait 2s for external scanner, then fallback to camera
  useEffect(() => {
    if (!open) return;
    setMode("detecting");
    setScannedValue("");
    setCameraError("");
    keyBuffer.current = "";

    const detectTimeout = setTimeout(() => {
      if (mode === "detecting") {
        setMode("camera");
      }
    }, 2000);

    return () => clearTimeout(detectTimeout);
  }, [open]);

  // Camera scanner using html5-qrcode
  useEffect(() => {
    if (mode !== "camera" || !open) return;

    let html5QrCode: any = null;

    const startCamera = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");
        const scannerId = "barcode-scanner-region";

        // Wait for DOM element
        await new Promise((resolve) => setTimeout(resolve, 100));

        const el = document.getElementById(scannerId);
        if (!el) return;

        html5QrCode = new Html5Qrcode(scannerId);
        scannerRef.current = html5QrCode;

        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 120 },
            aspectRatio: 1.0,
          },
          (decodedText: string) => {
            setScannedValue(decodedText);
            onScan(decodedText);
            // Stop after successful scan
            html5QrCode?.stop().catch(() => {});
          },
          () => {} // ignore errors during scanning
        );
      } catch (err: any) {
        setCameraError(err?.message || "Camera access denied");
      }
    };

    startCamera();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [mode, open, onScan]);

  // Cleanup on close
  useEffect(() => {
    if (!open && scannerRef.current) {
      scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center"
      style={{ background: "hsl(220 20% 5% / 0.85)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="glass-card w-[92%] max-w-md p-5 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <ScanLine size={16} className="text-primary-foreground" />
            </div>
            <h3 className="font-display font-bold text-lg text-foreground">Barcode Scanner</h3>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Mode indicator */}
        <div className="flex gap-2 mb-4">
          {[
            { m: "external" as InputMode, icon: Usb, label: "USB/BT Scanner" },
            { m: "camera" as InputMode, icon: Camera, label: "Camera" },
          ].map(({ m, icon: Icon, label }) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                mode === m
                  ? "gradient-primary text-primary-foreground glow-primary"
                  : "glass-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon size={14} />
              {label}
            </button>
          ))}
        </div>

        {/* Detecting state */}
        {mode === "detecting" && (
          <div className="flex flex-col items-center py-10 gap-4">
            <div className="w-16 h-16 rounded-full border-2 border-primary/30 flex items-center justify-center animate-pulse">
              <Wifi size={28} className="text-primary" />
            </div>
            <p className="text-sm text-muted-foreground text-center">
              Detecting external scanner...<br />
              <span className="text-xs">Scan a barcode or wait for camera</span>
            </p>
            <div className="w-32 h-1 rounded-full bg-secondary overflow-hidden">
              <div className="h-full gradient-primary rounded-full animate-[scan-progress_2s_linear]" />
            </div>
          </div>
        )}

        {/* External scanner mode */}
        {mode === "external" && (
          <div className="flex flex-col items-center py-8 gap-4">
            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
              <Usb size={28} className="text-success" />
            </div>
            <p className="text-sm font-semibold text-foreground">External Scanner Active</p>
            <p className="text-xs text-muted-foreground text-center">
              Scan any barcode — it will be captured automatically
            </p>
            {externalBuffer && (
              <div className="glass-card px-4 py-2 rounded-xl">
                <p className="text-sm font-mono text-primary">{externalBuffer}</p>
              </div>
            )}
            {scannedValue && (
              <div className="glass-card px-4 py-3 rounded-xl border border-success/30 w-full text-center">
                <p className="text-xs text-muted-foreground mb-1">Scanned</p>
                <p className="text-lg font-bold font-mono text-success">{scannedValue}</p>
              </div>
            )}
          </div>
        )}

        {/* Camera mode */}
        {mode === "camera" && (
          <div className="flex flex-col items-center gap-3">
            {cameraError ? (
              <div className="flex flex-col items-center py-8 gap-3">
                <div className="w-14 h-14 rounded-full bg-destructive/20 flex items-center justify-center">
                  <Camera size={24} className="text-destructive" />
                </div>
                <p className="text-sm text-destructive font-semibold">Camera Error</p>
                <p className="text-xs text-muted-foreground text-center">{cameraError}</p>
                <button
                  onClick={() => {
                    setCameraError("");
                    setMode("detecting");
                    setTimeout(() => setMode("camera"), 100);
                  }}
                  className="gradient-primary text-primary-foreground px-4 py-2 rounded-xl text-xs font-semibold mt-2"
                >
                  Retry
                </button>
              </div>
            ) : (
              <>
                <div
                  id="barcode-scanner-region"
                  ref={containerRef}
                  className="w-full rounded-xl overflow-hidden bg-black/50 min-h-[250px]"
                />
                {!scannedValue && (
                  <p className="text-xs text-muted-foreground animate-pulse">
                    Point camera at barcode...
                  </p>
                )}
              </>
            )}

            {scannedValue && (
              <div className="glass-card px-4 py-3 rounded-xl border border-success/30 w-full text-center">
                <p className="text-xs text-muted-foreground mb-1">Scanned</p>
                <p className="text-lg font-bold font-mono text-success">{scannedValue}</p>
              </div>
            )}
          </div>
        )}

        {/* Manual entry fallback */}
        <div className="mt-4 pt-4 border-t border-border/50">
          <p className="text-xs text-muted-foreground mb-2">Or enter manually:</p>
          <div className="flex gap-2">
            <input
              ref={hiddenInputRef}
              type="text"
              placeholder="Enter barcode..."
              value={scannedValue}
              onChange={(e) => setScannedValue(e.target.value)}
              className="flex-1 glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none focus:ring-1 focus:ring-primary rounded-lg font-mono"
            />
            <button
              onClick={() => {
                if (scannedValue.trim()) {
                  onScan(scannedValue.trim());
                }
              }}
              disabled={!scannedValue.trim()}
              className="gradient-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold glow-primary disabled:opacity-50"
            >
              Use
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarcodeScanner;
