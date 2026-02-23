import { useState, useRef, useEffect } from "react";
import { Search, Plus, Minus, Trash2, X, CheckCircle, ScanLine } from "lucide-react";
import BarcodeScanner from "@/components/BarcodeScanner";

interface BillItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  money: number;
}

const productCatalog = [
  { id: "1", name: "Aashirvaad Atta", price: 320, unit: "kg", barcode: "8901234567891" },
  { id: "3", name: "Fortune Oil", price: 165, unit: "liter", barcode: "8901234567892" },
  { id: "7", name: "Milk Packet", price: 28, unit: "pcs", barcode: "8901234567895" },
  { id: "6", name: "Rice Basmati", price: 85, unit: "kg", barcode: "8901234567896" },
  { id: "4", name: "Sugar", price: 45, unit: "kg", barcode: "8901234567893" },
  { id: "5", name: "Tata Tea", price: 120, unit: "pcs", barcode: "8901234567894" },
  { id: "1s", name: "Tata Salt", price: 22, unit: "kg", barcode: "8901234567890" },
].sort((a, b) => a.name.localeCompare(b.name));

const Billing = () => {
  const [items, setItems] = useState<BillItem[]>([]);
  const [search, setSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [paymentMode, setPaymentMode] = useState<string>("");
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [udhariName, setUdhariName] = useState("");
  const [udhariPhone, setUdhariPhone] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const total = items.reduce((sum, item) => sum + item.money, 0);

  // Close suggestions on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Auto-suggest: exact match first, then related
  const getSuggestions = () => {
    if (!search.trim()) return productCatalog;
    const q = search.toLowerCase();
    const exact = productCatalog.filter(p =>
      p.name.toLowerCase().includes(q) || p.barcode.includes(search)
    );
    if (exact.length > 0) return exact;
    // Related: match any character sequence
    const related = productCatalog.filter(p => {
      const name = p.name.toLowerCase();
      let qi = 0;
      for (let i = 0; i < name.length && qi < q.length; i++) {
        if (name[i] === q[qi]) qi++;
      }
      return qi >= Math.min(2, q.length);
    });
    return related;
  };

  const suggestions = getSuggestions();

  const addItem = (product: typeof productCatalog[0]) => {
    const existing = items.find(i => i.id === product.id);
    if (existing) {
      setItems(items.map(i =>
        i.id === product.id
          ? { ...i, quantity: i.quantity + 1, money: (i.quantity + 1) * i.price }
          : i
      ));
    } else {
      setItems([...items, { ...product, quantity: 1, money: product.price }]);
    }
    setShowSuggestions(false);
    setSearch("");
  };

  const handleBarcodeScan = (barcode: string) => {
    const product = productCatalog.find(p => p.barcode === barcode);
    if (product) {
      addItem(product);
    } else {
      setSearch(barcode);
      setShowSuggestions(true);
    }
    setShowScanner(false);
  };

  const updateQuantity = (id: string, newQty: number) => {
    if (newQty <= 0) return;
    setItems(items.map(i =>
      i.id === id ? { ...i, quantity: newQty, money: Math.round(newQty * i.price * 100) / 100 } : i
    ));
  };

  const updateMoney = (id: string, newMoney: number) => {
    if (newMoney < 0) return;
    setItems(items.map(i =>
      i.id === id ? { ...i, money: newMoney, quantity: Math.round((newMoney / i.price) * 1000) / 1000 } : i
    ));
  };

  const removeItem = (id: string) => setItems(items.filter(i => i.id !== id));

  const handlePay = () => {
    if (!paymentMode) return;
    if (paymentMode === "udhari" && (!udhariName || !udhariPhone)) return;
    setShowPayment(false);
    setShowSuccess(true);
  };

  const handleDone = () => {
    setShowSuccess(false);
    setItems([]);
    setPaymentMode("");
    setUdhariName("");
    setUdhariPhone("");
  };

  return (
    <div className="px-4 space-y-4">
      <h1 className="font-display text-xl font-bold text-foreground">Create Bill</h1>

      {/* Search + Scanner */}
      <div className="relative" ref={searchRef}>
        <div className="glass-card flex items-center gap-2 px-3 py-2.5">
          <Search size={16} className="text-muted-foreground" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setShowSuggestions(true); }}
            onFocus={() => setShowSuggestions(true)}
            placeholder="Search product name or barcode..."
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground w-full outline-none"
          />
          <button
            onClick={() => setShowScanner(true)}
            className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0"
          >
            <ScanLine size={14} className="text-primary-foreground" />
          </button>
        </div>

        {/* Auto-suggest dropdown */}
        {showSuggestions && (
          <div className="absolute top-full left-0 right-0 mt-1 glass-card p-2 z-30 max-h-60 overflow-y-auto">
            {suggestions.length > 0 ? (
              suggestions.map(p => (
                <button
                  key={p.id}
                  onClick={() => addItem(p)}
                  className="w-full text-left p-2.5 rounded-lg hover:bg-secondary/50 transition-colors flex justify-between items-center"
                >
                  <span className="text-sm text-foreground">{p.name}</span>
                  <span className="text-xs text-muted-foreground">₹{p.price}/{p.unit}</span>
                </button>
              ))
            ) : (
              <p className="text-xs text-muted-foreground p-3 text-center">No matching products found</p>
            )}
          </div>
        )}
      </div>

      {/* Bill Items */}
      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <p className="text-3xl mb-2">🧾</p>
            <p className="text-sm text-muted-foreground">Search or scan to add items</p>
          </div>
        ) : (
          items.map(item => (
            <div key={item.id} className="glass-card p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">₹{item.price}/{item.unit}</p>
                </div>
                <button onClick={() => removeItem(item.id)} className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center">
                  <Trash2 size={14} className="text-destructive" />
                </button>
              </div>
              <div className="flex items-center gap-3">
                {/* Quantity control */}
                <div className="flex items-center gap-1.5 flex-1">
                  <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center">
                    <Minus size={14} className="text-foreground" />
                  </button>
                  <div className="flex-1">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={e => updateQuantity(item.id, parseFloat(e.target.value) || 0)}
                      className="w-full text-center text-sm font-bold text-foreground bg-secondary/50 rounded-lg py-1.5 outline-none focus:ring-1 focus:ring-primary"
                      step="any"
                      min="0"
                    />
                    <p className="text-[10px] text-muted-foreground text-center mt-0.5">Qty ({item.unit})</p>
                  </div>
                  <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
                    <Plus size={14} className="text-primary-foreground" />
                  </button>
                </div>

                {/* Money control */}
                <div className="flex-1">
                  <div className="relative">
                    <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">₹</span>
                    <input
                      type="number"
                      value={item.money}
                      onChange={e => updateMoney(item.id, parseFloat(e.target.value) || 0)}
                      className="w-full text-center text-sm font-bold text-foreground bg-secondary/50 rounded-lg py-1.5 pl-5 outline-none focus:ring-1 focus:ring-primary"
                      step="any"
                      min="0"
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center mt-0.5">Amount</p>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Total + Pay */}
      {items.length > 0 && (
        <div className="glass-card p-4 glow-primary">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-2xl font-display font-bold gradient-text">₹{Math.round(total * 100) / 100}</span>
          </div>
          <button
            onClick={() => setShowPayment(true)}
            className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm"
          >
            Proceed to Pay
          </button>
        </div>
      )}

      {/* Payment Modal */}
      {showPayment && (
        <div className="modal-overlay" onClick={() => setShowPayment(false)}>
          <div className="glass-card w-[92%] max-w-md p-5 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-foreground">Payment — ₹{Math.round(total * 100) / 100}</h3>
              <button onClick={() => setShowPayment(false)} className="text-muted-foreground"><X size={20} /></button>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {["cash", "upi", "mixed", "udhari"].map(mode => (
                <button
                  key={mode}
                  onClick={() => setPaymentMode(mode)}
                  className={`py-3 rounded-xl text-sm font-semibold capitalize transition-all ${
                    paymentMode === mode
                      ? "gradient-primary text-primary-foreground glow-primary"
                      : "glass-card text-foreground"
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
            {paymentMode === "udhari" && (
              <div className="space-y-3 mb-4">
                <input
                  value={udhariName}
                  onChange={e => setUdhariName(e.target.value)}
                  placeholder="Customer Name"
                  className="w-full glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none rounded-lg placeholder:text-muted-foreground"
                />
                <input
                  value={udhariPhone}
                  onChange={e => setUdhariPhone(e.target.value)}
                  placeholder="Phone Number"
                  className="w-full glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none rounded-lg placeholder:text-muted-foreground"
                />
              </div>
            )}
            <button
              onClick={handlePay}
              className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm"
            >
              Confirm Payment
            </button>
          </div>
        </div>
      )}

      {/* Success Animation */}
      {showSuccess && (
        <div className="success-screen animate-scale-in">
          <div className="w-24 h-24 rounded-full bg-success/20 flex items-center justify-center mb-6 pulse-glow">
            <CheckCircle size={56} className="text-success" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">Payment Received!</h2>
          <p className="text-3xl font-bold gradient-text mb-8">₹{Math.round(total * 100) / 100}</p>
          <button
            onClick={handleDone}
            className="gradient-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold"
          >
            OK Done ✓
          </button>
        </div>
      )}

      {/* Barcode Scanner */}
      <BarcodeScanner
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleBarcodeScan}
      />
    </div>
  );
};

export default Billing;
