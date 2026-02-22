import { useState } from "react";
import { Search, Plus, Minus, Trash2, X, CheckCircle } from "lucide-react";

interface BillItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
}

const productCatalog = [
  { id: "1", name: "Tata Salt", price: 22, unit: "kg" },
  { id: "2", name: "Aashirvaad Atta", price: 320, unit: "kg" },
  { id: "3", name: "Fortune Oil", price: 165, unit: "liter" },
  { id: "4", name: "Sugar", price: 45, unit: "kg" },
  { id: "5", name: "Tata Tea", price: 120, unit: "pcs" },
  { id: "6", name: "Rice Basmati", price: 85, unit: "kg" },
  { id: "7", name: "Milk Packet", price: 28, unit: "pcs" },
];

const Billing = () => {
  const [items, setItems] = useState<BillItem[]>([]);
  const [search, setSearch] = useState("");
  const [showProducts, setShowProducts] = useState(false);
  const [paymentMode, setPaymentMode] = useState<string>("");
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [udhariName, setUdhariName] = useState("");
  const [udhariPhone, setUdhariPhone] = useState("");

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addItem = (product: typeof productCatalog[0]) => {
    const existing = items.find(i => i.id === product.id);
    if (existing) {
      setItems(items.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems([...items, { ...product, quantity: 1 }]);
    }
    setShowProducts(false);
    setSearch("");
  };

  const updateQty = (id: string, delta: number) => {
    setItems(items.map(i => {
      if (i.id !== id) return i;
      const newQty = i.quantity + delta;
      return newQty > 0 ? { ...i, quantity: newQty } : i;
    }));
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

  const filteredProducts = productCatalog.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="px-4 space-y-4">
      <h1 className="font-display text-xl font-bold text-foreground">Create Bill</h1>

      {/* Add Items */}
      <div className="relative">
        <div className="glass-card flex items-center gap-2 px-3 py-2.5">
          <Search size={16} className="text-muted-foreground" />
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setShowProducts(true); }}
            onFocus={() => setShowProducts(true)}
            placeholder="Search product to add..."
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground w-full outline-none"
          />
        </div>
        {showProducts && search && (
          <div className="absolute top-full left-0 right-0 mt-1 glass-card p-2 z-30 max-h-48 overflow-y-auto">
            {filteredProducts.map(p => (
              <button
                key={p.id}
                onClick={() => addItem(p)}
                className="w-full text-left p-2.5 rounded-lg hover:bg-secondary/50 transition-colors flex justify-between"
              >
                <span className="text-sm text-foreground">{p.name}</span>
                <span className="text-xs text-muted-foreground">₹{p.price}/{p.unit}</span>
              </button>
            ))}
            {filteredProducts.length === 0 && (
              <p className="text-xs text-muted-foreground p-2 text-center">No products found</p>
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
            <div key={item.id} className="glass-card p-3 flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">₹{item.price}/{item.unit}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateQty(item.id, -1)} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center">
                  <Minus size={14} className="text-foreground" />
                </button>
                <span className="text-sm font-bold text-foreground w-6 text-center">{item.quantity}</span>
                <button onClick={() => updateQty(item.id, 1)} className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center">
                  <Plus size={14} className="text-primary-foreground" />
                </button>
                <button onClick={() => removeItem(item.id)} className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center ml-1">
                  <Trash2 size={14} className="text-destructive" />
                </button>
              </div>
              <p className="text-sm font-bold text-foreground ml-3 w-16 text-right">₹{item.price * item.quantity}</p>
            </div>
          ))
        )}
      </div>

      {/* Total + Pay */}
      {items.length > 0 && (
        <div className="glass-card p-4 glow-primary">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Total</span>
            <span className="text-2xl font-display font-bold gradient-text">₹{total}</span>
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
              <h3 className="font-display font-bold text-lg text-foreground">Payment — ₹{total}</h3>
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
          <p className="text-3xl font-bold gradient-text mb-8">₹{total}</p>
          <button
            onClick={handleDone}
            className="gradient-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold"
          >
            OK Done ✓
          </button>
        </div>
      )}
    </div>
  );
};

export default Billing;
