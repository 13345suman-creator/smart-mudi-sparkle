import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Search, Plus, Minus, Trash2, X, CheckCircle, ScanLine, Eye, Download, Share2, ChevronDown, ChevronUp, Printer, Hash, ShoppingCart, CreditCard, Banknote, Smartphone, Users } from "lucide-react";
import { speakBillPayment, speakNewUdhari } from "@/lib/notifications";
import BarcodeScanner from "@/components/BarcodeScanner";
import { useStore, type BillItem, type CompletedBill } from "@/lib/store";

const quantityPresets = [
  { label: "50g", value: 0.05 },
  { label: "100g", value: 0.1 },
  { label: "200g", value: 0.2 },
  { label: "250g", value: 0.25 },
  { label: "500g", value: 0.5 },
  { label: "750g", value: 0.75 },
  { label: "1kg", value: 1 },
  { label: "2kg", value: 2 },
];

const generateBillNo = () => {
  const now = new Date();
  return `BILL-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
};

const formatDate = (d: string | Date) => {
  const date = typeof d === 'string' ? new Date(d) : d;
  const fmt = localStorage.getItem("smk_date_format") || "dd/mm/yyyy";
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const time = date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  
  if (fmt === "mm/dd/yyyy") return `${month}/${day}/${year} ${time}`;
  if (fmt === "yyyy-mm-dd") return `${year}-${month}-${day} ${time}`;
  return `${day}/${month}/${year} ${time}`;
};

const generateBillSlipHTML = (bill: CompletedBill, shopName: string, shopAddress: string, shopGST: string) => {
  const itemsRows = bill.items.map(item =>
    `<tr>
      <td style="padding:4px 2px;border-bottom:1px dashed #ccc;font-size:11px;">${item.name}</td>
      <td style="padding:4px 2px;border-bottom:1px dashed #ccc;font-size:11px;text-align:center;">${item.quantity} ${item.unit}</td>
      <td style="padding:4px 2px;border-bottom:1px dashed #ccc;font-size:11px;text-align:center;">₹${item.price}</td>
      <td style="padding:4px 2px;border-bottom:1px dashed #ccc;font-size:11px;text-align:right;font-weight:600;">₹${Math.round(item.money * 100) / 100}</td>
    </tr>`
  ).join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Bill - ${bill.billNo}</title>
<style>
@media print {
  @page { margin: 0; size: 80mm auto; }
  body { margin: 0; padding: 4mm; }
  .no-print { display: none !important; }
}
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Courier New',monospace;background:#fff;padding:8px;max-width:80mm;margin:0 auto}
.bill{background:#fff;padding:8px}
.header{text-align:center;border-bottom:2px double #000;padding-bottom:8px;margin-bottom:8px}
.shop-name{font-size:16px;font-weight:900;letter-spacing:1px;text-transform:uppercase}
.shop-addr{font-size:9px;color:#555;margin-top:2px}
.bill-info{font-size:9px;color:#555;margin-top:2px}
.divider{border:none;border-top:1px dashed #999;margin:6px 0}
table{width:100%;border-collapse:collapse}
th{padding:3px 2px;font-size:9px;text-transform:uppercase;border-bottom:1px solid #000;font-weight:700}
.total-section{border-top:2px double #000;padding-top:6px;margin-top:6px}
.total-row{font-size:16px;font-weight:900}
.payment-info{text-align:center;margin-top:6px;padding:4px;border:1px dashed #999;font-size:10px;font-weight:700;text-transform:uppercase}
.footer{text-align:center;font-size:8px;color:#888;margin-top:10px;padding-top:8px;border-top:1px dashed #999}
.btn-row{text-align:center;margin-top:16px}
.btn-row button{padding:8px 20px;margin:0 4px;font-size:12px;cursor:pointer;border:1px solid #333;background:#f5f5f5;border-radius:4px}
</style></head><body>
<div class="bill">
  <div class="header">
    <div class="shop-name">${shopName}</div>
    ${shopAddress ? `<div class="shop-addr">${shopAddress}</div>` : ''}
    ${shopGST ? `<div class="shop-addr">GST: ${shopGST}</div>` : ''}
    <hr class="divider">
    <div class="bill-info">${bill.billNo}</div>
    <div class="bill-info">${formatDate(bill.date)}</div>
    ${bill.customerName ? `<div class="bill-info">Customer: ${bill.customerName} | ${bill.customerPhone || ''}</div>` : ''}
  </div>
  <table>
    <thead><tr>
      <th style="text-align:left">Item</th>
      <th style="text-align:center">Qty</th>
      <th style="text-align:center">Rate</th>
      <th style="text-align:right">Amt</th>
    </tr></thead>
    <tbody>${itemsRows}</tbody>
  </table>
  <div class="total-section">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:10px">${bill.items.length} item(s)</span>
      <span class="total-row">₹${Math.round(bill.total * 100) / 100}</span>
    </div>
  </div>
  <div class="payment-info">${bill.paymentMode}${bill.upiApp ? ` (${bill.upiApp})` : ''} ${bill.paymentConfirmed ? '✓ PAID' : '⏳ PENDING'}</div>
  <div class="footer">
    <p>Thank you for shopping with us!</p>
    <p>Visit Again 🙏</p>
  </div>
</div>
<div class="btn-row no-print">
  <button onclick="window.print()">🖨️ Print</button>
  <button onclick="window.close()">✕ Close</button>
</div>
</body></html>`;
};

const Billing = () => {
  const { bills, addBill, confirmBillPayment, deleteBill, addUdhari, settings, products: storeProducts } = useStore();

  const productCatalog = useMemo(() =>
    storeProducts.map(p => ({
      id: p.id,
      name: p.name,
      price: p.sellPrice,
      unit: p.unit,
      barcode: p.barcode,
    })).sort((a, b) => a.name.localeCompare(b.name)),
    [storeProducts]
  );
  const [items, setItems] = useState<BillItem[]>([]);
  const [search, setSearch] = useState("");
  const [billSearch, setBillSearch] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [paymentMode, setPaymentMode] = useState<string>("");
  const [selectedUpi, setSelectedUpi] = useState("");
  const [showPayment, setShowPayment] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [udhariName, setUdhariName] = useState("");
  const [udhariPhone, setUdhariPhone] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const [viewingBill, setViewingBill] = useState<CompletedBill | null>(null);
  const [showHistory, setShowHistory] = useState(true);
  const [lastBill, setLastBill] = useState<CompletedBill | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [deleteBillConfirm, setDeleteBillConfirm] = useState<string | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const billLongPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const billLongPressTriggered = useRef(false);

  const total = items.reduce((sum, item) => sum + item.money, 0);
  const configuredUpis = settings.upiIds.filter(u => u.trim());

  // Sort bills newest first
  const sortedBills = useMemo(() => [...bills].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()), [bills]);

  // External barcode scanner auto-detection
  const externalScanBuffer = useRef("");
  const externalScanTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastKeyTime = useRef(0);

  const handleGlobalBarcode = useCallback((e: KeyboardEvent) => {
    if (showScanner || showPayment || showSuccess || viewingBill) return;
    const target = e.target as HTMLElement;
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

    const now = Date.now();
    const timeDiff = now - lastKeyTime.current;

    if (e.key === "Enter" && externalScanBuffer.current.length >= 4) {
      const barcode = externalScanBuffer.current;
      externalScanBuffer.current = "";
      const product = productCatalog.find(p => p.barcode === barcode);
      if (product) addItem(product);
      return;
    }

    if (e.key.length === 1 && (timeDiff < 80 || externalScanBuffer.current.length === 0)) {
      externalScanBuffer.current += e.key;
      lastKeyTime.current = now;
      if (externalScanTimeout.current) clearTimeout(externalScanTimeout.current);
      externalScanTimeout.current = setTimeout(() => { externalScanBuffer.current = ""; }, 300);
    } else if (e.key.length === 1) {
      externalScanBuffer.current = e.key;
      lastKeyTime.current = now;
    }
  }, [showScanner, showPayment, showSuccess, viewingBill]);

  useEffect(() => {
    window.addEventListener("keydown", handleGlobalBarcode);
    return () => window.removeEventListener("keydown", handleGlobalBarcode);
  }, [handleGlobalBarcode]);

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
    setItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i =>
          i.id === product.id
            ? { ...i, quantity: i.quantity + 1, money: (i.quantity + 1) * i.price }
            : i
        );
      }
      return [...prev, { ...product, quantity: 1, money: product.price }];
    });
    setShowSuggestions(false);
    setSearch("");
  };

  const handleBarcodeScan = (barcode: string) => {
    const product = productCatalog.find(p => p.barcode === barcode);
    if (product) addItem(product);
    else { setSearch(barcode); setShowSuggestions(true); }
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

  const applyPreset = (id: string, presetValue: number) => {
    setItems(items.map(i =>
      i.id === id ? { ...i, quantity: presetValue, money: Math.round(presetValue * i.price * 100) / 100 } : i
    ));
  };

  const handlePay = () => {
    if (!paymentMode) return;
    if (paymentMode === "udhari" && (!udhariName || !udhariPhone)) return;
    if (paymentMode === "upi" && configuredUpis.length > 0 && !selectedUpi) return;

    const newBill: CompletedBill = {
      id: Date.now().toString(),
      items: [...items],
      total: Math.round(total * 100) / 100,
      paymentMode,
      upiApp: paymentMode === "upi" ? selectedUpi : undefined,
      customerName: paymentMode === "udhari" ? udhariName : customerName || undefined,
      customerPhone: paymentMode === "udhari" ? udhariPhone : undefined,
      date: new Date().toISOString(),
      billNo: generateBillNo(),
      paymentConfirmed: paymentMode === "cash",
    };

    addBill(newBill);
    setLastBill(newBill);

    if (paymentMode !== "udhari") {
      speakBillPayment(newBill.total, paymentMode);
    }

    if (paymentMode === "udhari") {
      addUdhari({
        id: `udhari-${Date.now()}`,
        name: udhariName,
        phone: udhariPhone,
        amount: newBill.total,
        totalBilled: newBill.total,
        date: new Date().toISOString().split("T")[0],
        billNo: newBill.billNo,
        payments: [],
      });
      speakNewUdhari(udhariName, newBill.total);
    }

    setShowPayment(false);
    setShowSuccess(true);
  };

  const handleDone = () => {
    if (lastBill && !lastBill.paymentConfirmed) {
      confirmBillPayment(lastBill.id);
    }
    setShowSuccess(false);
    setItems([]);
    setPaymentMode("");
    setSelectedUpi("");
    setUdhariName("");
    setUdhariPhone("");
    setCustomerName("");
    setLastBill(null);
  };

  const downloadBillPDF = (bill: CompletedBill) => {
    const html = generateBillSlipHTML(bill, settings.shopName, settings.shopAddress, settings.shopGST);
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 500);
    }
  };

  const printBill = (bill: CompletedBill) => {
    const html = generateBillSlipHTML(bill, settings.shopName, settings.shopAddress, settings.shopGST);
    const printFrame = document.createElement('iframe');
    printFrame.style.display = 'none';
    document.body.appendChild(printFrame);
    const doc = printFrame.contentDocument;
    if (doc) {
      doc.write(html);
      doc.close();
      setTimeout(() => {
        printFrame.contentWindow?.print();
        setTimeout(() => document.body.removeChild(printFrame), 1000);
      }, 300);
    }
  };

  const shareBill = async (bill: CompletedBill) => {
    const lang = localStorage.getItem("smk_language") || "en";
    const thankYou = lang === "bn" ? "ধন্যবাদ!" : lang === "hi" ? "धन्यवाद!" : "Thank you!";
    const text = `🧾 ${bill.billNo}\n📅 ${formatDate(bill.date)}\n🏪 ${settings.shopName}\n\n${bill.items.map(i => `${i.name} × ${i.quantity} ${i.unit} = ₹${Math.round(i.money * 100) / 100}`).join('\n')}\n\n💰 Total: ₹${bill.total}\n💳 Payment: ${bill.paymentMode.toUpperCase()}${bill.upiApp ? ` (${bill.upiApp})` : ''}\n\n${thankYou} 🙏`;
    
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: bill.billNo, text });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      const { toast } = await import("sonner");
      const msg = lang === "bn" ? "ক্লিপবোর্ডে কপি হয়েছে! WhatsApp এ পেস্ট করুন" : lang === "hi" ? "क्लिपबोर्ड पर कॉपी हो गया! WhatsApp पर पेस्ट करें" : "Copied! Paste in WhatsApp or any app";
      toast.success(msg);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      const { toast } = await import("sonner");
      toast.success("Copied to clipboard!");
    }
  };

  const filteredBills = billSearch.trim()
    ? sortedBills.filter(b => b.billNo.toLowerCase().includes(billSearch.toLowerCase()))
    : sortedBills;

  const paymentModes = [
    { id: "cash", label: "Cash", icon: Banknote, color: "text-[hsl(var(--success))]" },
    { id: "upi", label: "UPI", icon: Smartphone, color: "text-primary" },
    { id: "mixed", label: "Mixed", icon: CreditCard, color: "text-accent" },
    { id: "udhari", label: "Udhari", icon: Users, color: "text-[hsl(var(--warning))]" },
  ];

  return (
    <div className="px-4 space-y-4 pb-4">
      {/* Header with item count */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-foreground">Create Bill</h1>
        {items.length > 0 && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10">
            <ShoppingCart size={14} className="text-primary" />
            <span className="text-xs font-bold text-primary">{items.length}</span>
          </div>
        )}
      </div>

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
          <button onClick={() => setShowScanner(true)} className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
            <ScanLine size={14} className="text-primary-foreground" />
          </button>
        </div>

        {showSuggestions && (
          <div className="absolute top-full left-0 right-0 mt-1 glass-card p-2 z-30 max-h-60 overflow-y-auto">
            {suggestions.length > 0 ? suggestions.map(p => (
              <button key={p.id} onClick={() => addItem(p)} className="w-full text-left p-2.5 rounded-lg hover:bg-secondary/50 transition-colors flex justify-between items-center">
                <span className="text-sm text-foreground">{p.name}</span>
                <span className="text-xs text-muted-foreground">₹{p.price}/{p.unit}</span>
              </button>
            )) : (
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
        ) : items.map((item, idx) => (
          <div key={item.id} className="glass-card p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <span className="w-5 h-5 rounded-md bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0">{idx + 1}</span>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                  <p className="text-[10px] text-muted-foreground">₹{item.price}/{item.unit}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-primary">₹{Math.round(item.money * 100) / 100}</span>
                <button onClick={() => removeItem(item.id)} className="w-6 h-6 rounded-md bg-destructive/10 flex items-center justify-center">
                  <X size={12} className="text-destructive" />
                </button>
              </div>
            </div>

            {/* Compact quantity row */}
            <div className="flex items-center gap-2">
              <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="w-7 h-7 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                <Minus size={12} className="text-foreground" />
              </button>
              <input type="number" value={item.quantity} onChange={e => updateQuantity(item.id, parseFloat(e.target.value) || 0)} className="w-16 text-center text-sm font-bold text-foreground bg-secondary/50 rounded-lg py-1.5 outline-none focus:ring-1 focus:ring-primary" step="any" min="0" />
              <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="w-7 h-7 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
                <Plus size={12} className="text-primary-foreground" />
              </button>
              <span className="text-[10px] text-muted-foreground flex-shrink-0">{item.unit}</span>
              <div className="flex-1">
                <div className="relative">
                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">₹</span>
                  <input type="number" value={item.money} onChange={e => updateMoney(item.id, parseFloat(e.target.value) || 0)} className="w-full text-center text-sm font-bold text-foreground bg-secondary/50 rounded-lg py-1.5 pl-4 outline-none focus:ring-1 focus:ring-primary" step="any" min="0" />
                </div>
              </div>
            </div>

            {/* Quick Quantity - compact scrollable */}
            <div className="flex gap-1 overflow-x-auto pb-0.5 scrollbar-hide">
              {(item.unit === "kg" || item.unit === "gram") ? (
                <>
                  {quantityPresets.map(p => (
                    <button key={p.label} onClick={() => applyPreset(item.id, p.value)}
                      className={`px-2 py-0.5 rounded-md text-[9px] font-semibold whitespace-nowrap transition-all ${
                        Math.abs(item.quantity - p.value) < 0.001 ? "gradient-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground"
                      }`}>{p.label}</button>
                  ))}
                  {[1, 2, 3, 5, 10].map(q => (
                    <button key={q} onClick={() => updateQuantity(item.id, q)}
                      className={`px-2 py-0.5 rounded-md text-[9px] font-semibold transition-all ${
                        Math.abs(item.quantity - q) < 0.001 ? "gradient-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground"
                      }`}>{q}</button>
                  ))}
                </>
              ) : (item.unit === "liter" || item.unit === "ml") ? (
                <>
                  {[{ label: "100ml", value: 0.1 }, { label: "250ml", value: 0.25 }, { label: "500ml", value: 0.5 }, { label: "750ml", value: 0.75 }].map(p => (
                    <button key={p.label} onClick={() => applyPreset(item.id, p.value)}
                      className={`px-2 py-0.5 rounded-md text-[9px] font-semibold whitespace-nowrap transition-all ${
                        Math.abs(item.quantity - p.value) < 0.001 ? "gradient-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground"
                      }`}>{p.label}</button>
                  ))}
                  {[1, 2, 3, 5, 10].map(q => (
                    <button key={q} onClick={() => updateQuantity(item.id, q)}
                      className={`px-2 py-0.5 rounded-md text-[9px] font-semibold transition-all ${
                        Math.abs(item.quantity - q) < 0.001 ? "gradient-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground"
                      }`}>{q}</button>
                  ))}
                </>
              ) : (
                <>
                  {[0.25, 0.5, 0.75, 1, 2, 3, 5, 10].map(q => (
                    <button key={q} onClick={() => updateQuantity(item.id, q)}
                      className={`px-2 py-0.5 rounded-md text-[9px] font-semibold transition-all ${
                        Math.abs(item.quantity - q) < 0.001 ? "gradient-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground"
                      }`}>{q}</button>
                  ))}
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Sticky Total + Pay Bar */}
      {items.length > 0 && (
        <div className="glass-card p-3 glow-primary">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-muted-foreground">{items.length} items</p>
              <p className="text-xl font-display font-bold gradient-text">₹{Math.round(total * 100) / 100}</p>
            </div>
            <button onClick={() => setShowPayment(true)} className="gradient-primary text-primary-foreground px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2">
              <CreditCard size={16} /> Pay Now
            </button>
          </div>
        </div>
      )}

      {/* Bill History */}
      {sortedBills.length > 0 && (
        <div className="space-y-2">
          <button onClick={() => setShowHistory(!showHistory)} className="flex items-center justify-between w-full">
            <h2 className="font-display text-lg font-bold text-foreground">Recent Bills</h2>
            {showHistory ? <ChevronUp size={18} className="text-muted-foreground" /> : <ChevronDown size={18} className="text-muted-foreground" />}
          </button>

          {showHistory && (
            <>
              <div className="glass-card flex items-center gap-2 px-3 py-2">
                <Hash size={14} className="text-muted-foreground" />
                <input
                  value={billSearch}
                  onChange={e => setBillSearch(e.target.value)}
                  placeholder="Search by Bill ID..."
                  className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground w-full outline-none"
                />
                {billSearch && <button onClick={() => setBillSearch("")}><X size={14} className="text-muted-foreground" /></button>}
              </div>

              {filteredBills.map(bill => {
                const billFmt = localStorage.getItem("smk_bill_format") || "detailed";
                return (
                <div key={bill.id} className="glass-card p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs text-muted-foreground truncate">{bill.billNo}</p>
                        <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${bill.paymentConfirmed ? 'bg-[hsl(var(--success))]' : 'bg-[hsl(var(--warning))] animate-pulse'}`} />
                      </div>
                      <p className="text-sm font-semibold text-foreground">₹{bill.total}</p>
                      {billFmt === "detailed" && (
                        <p className="text-[10px] text-muted-foreground">
                          {formatDate(bill.date)} • {bill.paymentMode.toUpperCase()}
                          {bill.upiApp ? ` (${bill.upiApp})` : ''}
                          {bill.customerName ? ` • ${bill.customerName}` : ''}
                        </p>
                      )}
                      {billFmt === "compact" && (
                        <p className="text-[10px] text-muted-foreground">{formatDate(bill.date)}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {!bill.paymentConfirmed && (
                        <button onClick={() => confirmBillPayment(bill.id)} className="px-2 py-1 rounded-lg bg-[hsl(var(--success))]/10 text-[hsl(var(--success))] text-[10px] font-semibold" title="Mark Paid">
                          Done ✓
                        </button>
                      )}
                      <button onClick={() => setViewingBill(bill)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center" title="View">
                        <Eye size={14} className="text-foreground" />
                      </button>
                      {billFmt === "detailed" && (
                        <button onClick={() => downloadBillPDF(bill)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center" title="Download PDF">
                          <Download size={14} className="text-foreground" />
                        </button>
                      )}
                      <button onClick={() => shareBill(bill)} className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center" title="Share">
                        <Share2 size={14} className="text-primary-foreground" />
                      </button>
                    </div>
                  </div>
                </div>
                );
              })}
              {filteredBills.length === 0 && billSearch && (
                <p className="text-xs text-muted-foreground text-center py-4">No bills found for "{billSearch}"</p>
              )}
            </>
          )}
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

            <div className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="text-center border-b border-dashed border-muted pb-3">
                <h4 className="font-display text-base font-bold text-foreground tracking-wide uppercase">{settings.shopName}</h4>
                {settings.shopAddress && <p className="text-[9px] text-muted-foreground">{settings.shopAddress}</p>}
                {settings.shopGST && <p className="text-[9px] text-muted-foreground">GST: {settings.shopGST}</p>}
                <p className="text-[10px] text-muted-foreground mt-1">{viewingBill.billNo}</p>
                <p className="text-[10px] text-muted-foreground">{formatDate(viewingBill.date)}</p>
                {viewingBill.customerName && (
                  <p className="text-[10px] text-muted-foreground mt-1">Customer: {viewingBill.customerName} | {viewingBill.customerPhone}</p>
                )}
              </div>

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

              <div className="text-center space-y-1">
                <span className="inline-block px-3 py-1 rounded-full text-[10px] font-semibold uppercase bg-primary/10 text-primary">
                  {viewingBill.paymentMode}{viewingBill.upiApp ? ` (${viewingBill.upiApp})` : ''}
                </span>
                <div>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold ${viewingBill.paymentConfirmed ? 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]' : 'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]'}`}>
                    {viewingBill.paymentConfirmed ? '✓ PAID' : '⏳ PENDING'}
                  </span>
                </div>
              </div>

              <div className="text-center border-t border-dashed border-muted pt-3">
                <p className="text-[10px] text-muted-foreground">Thank you for shopping with us!</p>
                <p className="text-[10px] text-muted-foreground">Visit Again 🙏</p>
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={() => printBill(viewingBill)} className="flex-1 flex items-center justify-center gap-2 bg-secondary text-foreground py-2.5 rounded-xl text-sm font-semibold">
                <Printer size={14} /> Print
              </button>
              <button onClick={() => downloadBillPDF(viewingBill)} className="flex-1 flex items-center justify-center gap-2 bg-secondary text-foreground py-2.5 rounded-xl text-sm font-semibold">
                <Download size={14} /> PDF
              </button>
              <button onClick={() => shareBill(viewingBill)} className="flex-1 flex items-center justify-center gap-2 gradient-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold">
                <Share2 size={14} /> Share
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal - Professional */}
      {showPayment && (
        <div className="modal-overlay" onClick={() => setShowPayment(false)}>
          <div className="glass-card w-[92%] max-w-md p-5 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-lg text-foreground">Checkout</h3>
              <button onClick={() => setShowPayment(false)} className="text-muted-foreground"><X size={20} /></button>
            </div>

            {/* Order Summary */}
            <div className="glass-card p-3 rounded-xl mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">{items.length} items</span>
                <span className="text-lg font-display font-bold gradient-text">₹{Math.round(total * 100) / 100}</span>
              </div>
              <div className="max-h-24 overflow-y-auto space-y-0.5">
                {items.map(i => (
                  <div key={i.id} className="flex justify-between text-[10px] text-muted-foreground">
                    <span className="truncate flex-1">{i.name} × {i.quantity}</span>
                    <span className="ml-2 font-medium">₹{Math.round(i.money * 100) / 100}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Customer name (optional) */}
            {paymentMode !== "udhari" && (
              <div className="mb-3">
                <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Customer name (optional)"
                  className="w-full glass-card px-3 py-2 text-sm text-foreground bg-transparent outline-none rounded-lg placeholder:text-muted-foreground" />
              </div>
            )}

            {/* Payment Methods */}
            <p className="text-xs text-muted-foreground mb-2">Payment Method</p>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {paymentModes.map(mode => {
                const Icon = mode.icon;
                return (
                  <button
                    key={mode.id}
                    onClick={() => { setPaymentMode(mode.id); setSelectedUpi(""); }}
                    className={`py-3 rounded-xl text-center transition-all flex flex-col items-center gap-1 ${
                      paymentMode === mode.id ? "gradient-primary text-primary-foreground glow-primary" : "glass-card text-foreground"
                    }`}
                  >
                    <Icon size={18} className={paymentMode === mode.id ? "text-primary-foreground" : mode.color} />
                    <span className="text-[10px] font-semibold">{mode.label}</span>
                  </button>
                );
              })}
            </div>

            {/* UPI App Selection */}
            {paymentMode === "upi" && configuredUpis.length > 0 && (
              <div className="space-y-2 mb-4">
                <p className="text-xs text-muted-foreground">Select UPI ID:</p>
                <div className="space-y-1.5">
                  {configuredUpis.map((upi, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedUpi(upi)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${
                        selectedUpi === upi ? "gradient-primary text-primary-foreground glow-primary" : "glass-card text-foreground"
                      }`}
                    >
                      {upi}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {paymentMode === "upi" && configuredUpis.length === 0 && (
              <p className="text-xs text-[hsl(var(--warning))] mb-4 text-center">⚠️ No UPI IDs configured. Go to Settings → UPI Settings to add.</p>
            )}

            {paymentMode === "udhari" && (
              <div className="space-y-3 mb-4">
                <input value={udhariName} onChange={e => setUdhariName(e.target.value)} placeholder="Customer Name *" className="w-full glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none rounded-lg placeholder:text-muted-foreground" />
                <input value={udhariPhone} onChange={e => setUdhariPhone(e.target.value)} placeholder="Phone Number *" className="w-full glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none rounded-lg placeholder:text-muted-foreground" />
              </div>
            )}
            <button onClick={handlePay} disabled={!paymentMode || (paymentMode === "udhari" && (!udhariName || !udhariPhone)) || (paymentMode === "upi" && configuredUpis.length > 0 && !selectedUpi)}
              className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm disabled:opacity-40 flex items-center justify-center gap-2">
              <CheckCircle size={16} /> Confirm Payment
            </button>
          </div>
        </div>
      )}

      {/* Success Animation */}
      {showSuccess && (
        <div className="success-screen animate-scale-in">
          <div className="w-24 h-24 rounded-full bg-[hsl(var(--success))]/20 flex items-center justify-center mb-6 pulse-glow">
            <CheckCircle size={56} className="text-[hsl(var(--success))]" />
          </div>
          <h2 className="font-display text-2xl font-bold text-foreground mb-2">
            {paymentMode === "udhari" ? "Udhari Recorded!" : "Payment Received!"}
          </h2>
          <p className="text-3xl font-bold gradient-text mb-2">₹{Math.round(total * 100) / 100}</p>
          {lastBill?.upiApp && <p className="text-sm text-muted-foreground mb-4">via {lastBill.upiApp}</p>}
          <div className="flex gap-3 mb-4">
            {!lastBill?.paymentConfirmed && paymentMode !== "udhari" && (
              <button
                onClick={() => { if (lastBill) confirmBillPayment(lastBill.id); setLastBill(lastBill ? { ...lastBill, paymentConfirmed: true } : null); }}
                className="px-6 py-2.5 rounded-xl font-semibold text-sm bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]"
              >
                Mark as Paid ✓
              </button>
            )}
          </div>
          <button onClick={handleDone} className="gradient-primary text-primary-foreground px-8 py-3 rounded-xl font-semibold">
            OK Done ✓
          </button>
        </div>
      )}

      <BarcodeScanner open={showScanner} onClose={() => setShowScanner(false)} onScan={handleBarcodeScan} />
    </div>
  );
};

export default Billing;
