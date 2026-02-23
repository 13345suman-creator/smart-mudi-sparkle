import { useState, useRef, useEffect } from "react";
import { Search, Plus, Minus, Trash2, X, CheckCircle, ScanLine, Eye, Download, Share2, ChevronDown, ChevronUp } from "lucide-react";
import BarcodeScanner from "@/components/BarcodeScanner";

interface BillItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  money: number;
}

interface CompletedBill {
  id: string;
  items: BillItem[];
  total: number;
  paymentMode: string;
  customerName?: string;
  customerPhone?: string;
  date: Date;
  billNo: string;
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

const generateBillNo = () => {
  const now = new Date();
  return `BILL-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
};

const formatDate = (d: Date) => {
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

const generateBillSlipHTML = (bill: CompletedBill, shopName = "Smart Mudi Store") => {
  const itemsRows = bill.items.map(item =>
    `<tr>
      <td style="padding:6px 4px;border-bottom:1px dashed #ddd;font-size:12px;">${item.name}</td>
      <td style="padding:6px 4px;border-bottom:1px dashed #ddd;font-size:12px;text-align:center;">${item.quantity} ${item.unit}</td>
      <td style="padding:6px 4px;border-bottom:1px dashed #ddd;font-size:12px;text-align:center;">₹${item.price}</td>
      <td style="padding:6px 4px;border-bottom:1px dashed #ddd;font-size:12px;text-align:right;font-weight:600;">₹${Math.round(item.money * 100) / 100}</td>
    </tr>`
  ).join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bill - ${bill.billNo}</title>
<style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Segoe UI',Arial,sans-serif;background:#f5f5f5;padding:16px}
.bill{max-width:360px;margin:0 auto;background:#fff;border-radius:8px;padding:24px 20px;box-shadow:0 2px 12px rgba(0,0,0,0.08)}
.header{text-align:center;border-bottom:2px solid #222;padding-bottom:12px;margin-bottom:12px}
.shop-name{font-size:20px;font-weight:800;letter-spacing:1px;color:#111}
.bill-info{font-size:11px;color:#666;margin-top:4px}
.divider{border:none;border-top:1px dashed #ccc;margin:10px 0}
table{width:100%;border-collapse:collapse}
th{padding:6px 4px;font-size:11px;text-transform:uppercase;color:#888;font-weight:600;border-bottom:2px solid #333}
.total-row{font-size:18px;font-weight:800;color:#111}
.payment-badge{display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600;text-transform:uppercase;background:#e8f5e9;color:#2e7d32}
.footer{text-align:center;font-size:10px;color:#999;margin-top:16px;padding-top:12px;border-top:1px dashed #ccc}
</style></head><body>
<div class="bill">
  <div class="header">
    <div class="shop-name">${shopName}</div>
    <div class="bill-info">${bill.billNo}</div>
    <div class="bill-info">${formatDate(bill.date)}</div>
    ${bill.customerName ? `<div class="bill-info">Customer: ${bill.customerName} | ${bill.customerPhone || ''}</div>` : ''}
  </div>
  <table>
    <thead><tr>
      <th style="text-align:left">Item</th>
      <th style="text-align:center">Qty</th>
      <th style="text-align:center">Rate</th>
      <th style="text-align:right">Amount</th>
    </tr></thead>
    <tbody>${itemsRows}</tbody>
  </table>
  <hr class="divider">
  <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0">
    <span style="font-size:13px;color:#666">Total (${bill.items.length} items)</span>
    <span class="total-row">₹${Math.round(bill.total * 100) / 100}</span>
  </div>
  <div style="text-align:center;margin-top:6px">
    <span class="payment-badge">${bill.paymentMode}</span>
  </div>
  <div class="footer">
    <p>Thank you for shopping with us!</p>
    <p style="margin-top:4px">Visit Again 🙏</p>
  </div>
</div></body></html>`;
};

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
  const [completedBills, setCompletedBills] = useState<CompletedBill[]>([]);
  const [viewingBill, setViewingBill] = useState<CompletedBill | null>(null);
  const [showHistory, setShowHistory] = useState(true);
  const searchRef = useRef<HTMLDivElement>(null);

  const total = items.reduce((sum, item) => sum + item.money, 0);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const getSuggestions = () => {
    if (!search.trim()) return productCatalog;
    const q = search.toLowerCase();
    const exact = productCatalog.filter(p =>
      p.name.toLowerCase().includes(q) || p.barcode.includes(search)
    );
    if (exact.length > 0) return exact;
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
    if (newQty < 0) return;
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

    const newBill: CompletedBill = {
      id: Date.now().toString(),
      items: [...items],
      total: Math.round(total * 100) / 100,
      paymentMode,
      customerName: paymentMode === "udhari" ? udhariName : undefined,
      customerPhone: paymentMode === "udhari" ? udhariPhone : undefined,
      date: new Date(),
      billNo: generateBillNo(),
    };

    setCompletedBills(prev => [newBill, ...prev]);
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

  const downloadBill = (bill: CompletedBill) => {
    const html = generateBillSlipHTML(bill);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${bill.billNo}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const shareBill = async (bill: CompletedBill) => {
    const text = `🧾 ${bill.billNo}\n📅 ${formatDate(bill.date)}\n\n${bill.items.map(i => `${i.name} × ${i.quantity} ${i.unit} = ₹${Math.round(i.money * 100) / 100}`).join('\n')}\n\n💰 Total: ₹${bill.total}\n💳 Payment: ${bill.paymentMode.toUpperCase()}\n\nThank you! 🙏`;

    if (navigator.share) {
      try {
        await navigator.share({ title: bill.billNo, text });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(text);
      alert("Bill copied to clipboard!");
    }
  };

  return (
    <div className="px-4 space-y-4 pb-4">
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

      {/* Completed Bills History */}
      {completedBills.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center justify-between w-full"
          >
            <h2 className="font-display text-lg font-bold text-foreground">Recent Bills</h2>
            {showHistory ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
          </button>

          {showHistory && completedBills.map(bill => (
            <div key={bill.id} className="glass-card p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{bill.billNo}</p>
                  <p className="text-sm font-semibold text-foreground">₹{bill.total}</p>
                  <p className="text-[10px] text-muted-foreground">{formatDate(bill.date)} • {bill.paymentMode.toUpperCase()}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setViewingBill(bill)}
                    className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center"
                    title="View"
                  >
                    <Eye size={14} className="text-foreground" />
                  </button>
                  <button
                    onClick={() => downloadBill(bill)}
                    className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center"
                    title="Download"
                  >
                    <Download size={14} className="text-foreground" />
                  </button>
                  <button
                    onClick={() => shareBill(bill)}
                    className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center"
                    title="Share"
                  >
                    <Share2 size={14} className="text-primary-foreground" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Bill Modal */}
      {viewingBill && (
        <div className="modal-overlay" onClick={() => setViewingBill(null)}>
          <div className="glass-card w-[92%] max-w-md p-5 animate-slide-up max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-foreground">Bill Details</h3>
              <button onClick={() => setViewingBill(null)} className="text-muted-foreground"><X size={20} /></button>
            </div>

            {/* Professional Bill Slip */}
            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="text-center border-b border-dashed border-muted pb-3">
                <h4 className="font-display text-base font-bold text-foreground tracking-wide">Smart Mudi Store</h4>
                <p className="text-[10px] text-muted-foreground mt-1">{viewingBill.billNo}</p>
                <p className="text-[10px] text-muted-foreground">{formatDate(viewingBill.date)}</p>
                {viewingBill.customerName && (
                  <p className="text-[10px] text-muted-foreground mt-1">Customer: {viewingBill.customerName} | {viewingBill.customerPhone}</p>
                )}
              </div>

              {/* Item Table */}
              <div className="space-y-1">
                <div className="grid grid-cols-12 text-[10px] text-muted-foreground uppercase font-semibold pb-1 border-b border-muted">
                  <span className="col-span-5">Item</span>
                  <span className="col-span-2 text-center">Qty</span>
                  <span className="col-span-2 text-center">Rate</span>
                  <span className="col-span-3 text-right">Amount</span>
                </div>
                {viewingBill.items.map(item => (
                  <div key={item.id} className="grid grid-cols-12 text-xs py-1.5 border-b border-dashed border-muted/50">
                    <span className="col-span-5 text-foreground">{item.name}</span>
                    <span className="col-span-2 text-center text-muted-foreground">{item.quantity} {item.unit}</span>
                    <span className="col-span-2 text-center text-muted-foreground">₹{item.price}</span>
                    <span className="col-span-3 text-right font-semibold text-foreground">₹{Math.round(item.money * 100) / 100}</span>
                  </div>
                ))}
              </div>

              <div className="border-t border-muted pt-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{viewingBill.items.length} items</span>
                <span className="text-lg font-display font-bold gradient-text">₹{viewingBill.total}</span>
              </div>

              <div className="text-center">
                <span className="inline-block px-3 py-1 rounded-full text-[10px] font-semibold uppercase bg-primary/10 text-primary">
                  {viewingBill.paymentMode}
                </span>
              </div>

              <div className="text-center border-t border-dashed border-muted pt-3">
                <p className="text-[10px] text-muted-foreground">Thank you for shopping with us!</p>
                <p className="text-[10px] text-muted-foreground">Visit Again 🙏</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => downloadBill(viewingBill)}
                className="flex-1 flex items-center justify-center gap-2 bg-secondary text-foreground py-2.5 rounded-xl text-sm font-semibold"
              >
                <Download size={14} /> Download
              </button>
              <button
                onClick={() => shareBill(viewingBill)}
                className="flex-1 flex items-center justify-center gap-2 gradient-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold"
              >
                <Share2 size={14} /> Share
              </button>
            </div>
          </div>
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
