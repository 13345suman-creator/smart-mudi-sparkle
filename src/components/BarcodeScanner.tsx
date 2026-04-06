import { useState, useEffect, useRef, useCallback } from "react";
import { Camera, X, ScanLine, Wifi } from "lucide-react";

interface BarcodeScannerProps {
  open: boolean;
  onClose: () => void;
  onScan: (barcode: string) => void;
}

const BarcodeScanner = ({ open, onClose, onScan }: BarcodeScannerProps) => {
  const [scannedValue, setScannedValue] = useState("");
  const [cameraError, setCameraError] = useState("");
  const [usbMode, setUsbMode] = useState(() => localStorage.getItem("smk_usb_scanner") === "true");
  const [externalBuffer, setExternalBuffer] = useState("");
  const scannerRef = useRef<any>(null);
  const scannerRunningRef = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const bufferTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hiddenInputRef = useRef<HTMLInputElement>(null);
  const lastKeyTime = useRef(0);
  const keyBuffer = useRef("");

  const safeStopScanner = useCallback(async () => {
    if (scannerRef.current && scannerRunningRef.current) {
      try {
        scannerRunningRef.current = false;
        await scannerRef.current.stop();
      } catch {
        // ignore
      }
    }
    scannerRef.current = null;
  }, []);

  const toggleUsbMode = (val: boolean) => {
    setUsbMode(val);
    localStorage.setItem("smk_usb_scanner", String(val));
    if (val) {
      safeStopScanner();
    }
  };

  // External scanner: rapid keystrokes
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!open || !usbMode) return;

      const now = Date.now();
      const timeDiff = now - lastKeyTime.current;

      if (e.key === "Enter") {
        if (keyBuffer.current.length >= 4) {
          const code = keyBuffer.current;
          setScannedValue(code);
          onScan(code);
          keyBuffer.current = "";
          setExternalBuffer("");
        }
        return;
      }

      if (timeDiff < 80 || keyBuffer.current.length === 0) {
        if (e.key.length === 1) {
          keyBuffer.current += e.key;
          lastKeyTime.current = now;
          setExternalBuffer(keyBuffer.current);

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
    [open, usbMode, onScan]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  // Reset on open
  useEffect(() => {
    if (!open) return;
    setScannedValue("");
    setCameraError("");
    setExternalBuffer("");
    keyBuffer.current = "";
  }, [open]);

  // Camera scanner - start immediately if USB mode is off
  useEffect(() => {
    if (!open || usbMode) return;

    let cancelled = false;

    const startCamera = async () => {
      try {
        await safeStopScanner();

        const { Html5Qrcode } = await import("html5-qrcode");
        const scannerId = "barcode-scanner-region";

        await new Promise((resolve) => setTimeout(resolve, 200));

        if (cancelled) return;
        const el = document.getElementById(scannerId);
        if (!el) return;

        const scanner = new Html5Qrcode(scannerId);
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 120 },
            aspectRatio: 1.0,
          },
          (decodedText: string) => {
            setScannedValue(decodedText);
            onScan(decodedText);
            safeStopScanner();
          },
          () => {}
        );

        if (!cancelled) {
          scannerRunningRef.current = true;
        } else {
          scanner.stop().catch(() => {});
        }
      } catch (err: any) {
        if (!cancelled) {
          setCameraError(err?.message || "Camera access denied");
        }
      }
    };

    startCamera();

    return () => {
      cancelled = true;
      safeStopScanner();
    };
  }, [open, usbMode, onScan, safeStopScanner]);

  // Cleanup on close
  useEffect(() => {
    if (!open) {
      safeStopScanner();
    }
  }, [open, safeStopScanner]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center"
      style={{ background: "hsl(var(--background) / 0.9)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <div
        className="glass-card w-[92%] max-w-md p-5 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with USB/BT toggle */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <ScanLine size={16} className="text-primary-foreground" />
            </div>
            <h3 className="font-display font-bold text-lg text-foreground">Scanner</h3>
          </div>
          <div className="flex items-center gap-3">
            {/* USB/BT Toggle */}
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] text-muted-foreground font-medium">USB/BT</span>
              <button
                onClick={() => toggleUsbMode(!usbMode)}
                className={`w-10 h-5 rounded-full transition-all duration-300 relative ${usbMode ? 'gradient-primary' : 'bg-muted'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-card shadow-md transition-transform duration-300 ${usbMode ? 'left-5' : 'left-0.5'}`} />
              </button>
            </div>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* USB/BT Mode */}
        {usbMode && (
          <div className="flex flex-col items-center py-8 gap-4">
            <div className="w-16 h-16 rounded-full bg-[hsl(var(--success))]/20 flex items-center justify-center">
              <Wifi size={28} className="text-[hsl(var(--success))]" />
            </div>
            <p className="text-sm font-semibold text-foreground">External Scanner Ready</p>
            <p className="text-xs text-muted-foreground text-center">
              Scan any barcode with your USB/Bluetooth scanner
            </p>
            {externalBuffer && (
              <div className="glass-card px-4 py-2 rounded-xl">
                <p className="text-sm font-mono text-primary animate-pulse">{externalBuffer}</p>
              </div>
            )}
            {scannedValue && (
              <div className="glass-card px-4 py-3 rounded-xl border border-[hsl(var(--success))]/30 w-full text-center">
                <p className="text-xs text-muted-foreground mb-1">Scanned</p>
                <p className="text-lg font-bold font-mono text-[hsl(var(--success))]">{scannedValue}</p>
              </div>
            )}
          </div>
        )}

        {/* Camera Mode */}
        {!usbMode && (
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
                    // Force re-mount camera
                    setUsbMode(true);
                    setTimeout(() => setUsbMode(false), 100);
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
                  className="w-full rounded-xl overflow-hidden bg-secondary/30 min-h-[250px]"
                />
                {!scannedValue && (
                  <p className="text-xs text-muted-foreground animate-pulse">
                    Point camera at barcode...
                  </p>
                )}
              </>
            )}

            {scannedValue && (
              <div className="glass-card px-4 py-3 rounded-xl border border-[hsl(var(--success))]/30 w-full text-center">
                <p className="text-xs text-muted-foreground mb-1">Scanned</p>
                <p className="text-lg font-bold font-mono text-[hsl(var(--success))]">{scannedValue}</p>
              </div>
            )}
          </div>
        )}

        {/* Manual entry */}
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
              className="gradient-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50"
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
