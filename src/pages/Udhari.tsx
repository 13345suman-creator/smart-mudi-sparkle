import { useState } from "react";
import { Search, Plus, X, Phone, Eye, IndianRupee, ArrowDownCircle, UserCheck, Trash2, Download, Share2, Clock, AlertTriangle, Users, TrendingDown, FileText } from "lucide-react";
import { useStore, type CompletedBill, type PaidOffCustomer, type UdhariEntry } from "@/lib/store";
import { useLanguage } from "@/lib/language";
import { toast } from "sonner";
import { speakUdhariPayment } from "@/lib/notifications";

const Udhari = () => {
  const { udhariEntries, paidOffCustomers, addUdhari, payUdhari, deleteUdhari, deletePaidOff, bills } = useStore();
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showPartial, setShowPartial] = useState<typeof udhariEntries[0] | null>(null);
  const [partialAmount, setPartialAmount] = useState("");
  const [payMethod, setPayMethod] = useState("cash");
  const [newEntry, setNewEntry] = useState({ name: "", phone: "", amount: "" });
  const [showHistory, setShowHistory] = useState<typeof udhariEntries[0] | null>(null);
  const [viewBill, setViewBill] = useState<CompletedBill | null>(null);
  const [showPaidOff, setShowPaidOff] = useState<PaidOffCustomer | null>(null);
  const [showPaidOffList, setShowPaidOffList] = useState(false);
  const [showMergePrompt, setShowMergePrompt] = useState(false);
  const [pendingNewEntry, setPendingNewEntry] = useState<{ name: string; phone: string; amount: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "udhari" | "paidoff"; id: string; name: string } | null>(null);

  const getCustomerBills = (name: string, phone: string) => {
    return bills.filter(b =>
      (b.customerName && b.customerName.toLowerCase() === name.toLowerCase()) ||
      (b.customerPhone && b.customerPhone === phone) ||
      b.paymentMode === "udhari"
    ).filter(b =>
      b.customerName?.toLowerCase() === name.toLowerCase() || b.customerPhone === phone
    );
  };

  const filtered = udhariEntries.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) || e.phone.includes(search)
  );

  const totalPending = udhariEntries.reduce((s, e) => s + e.amount, 0);

  const handleAdd = () => {
    // Mandatory: name, phone, amount
    if (!newEntry.name.trim()) {
      toast.error("Customer name is required");
      return;
    }
    if (!newEntry.phone.trim() || newEntry.phone.trim().length < 7) {
      toast.error("Valid phone number is required");
      return;
    }
    if (!newEntry.amount || isNaN(Number(newEntry.amount)) || Number(newEntry.amount) === 0) {
      toast.error("Enter a valid amount");
      return;
    }
    const phone = newEntry.phone.trim();
    const name = newEntry.name.trim();

    // Duplicate check in active udhari (same name+phone or just phone)
    const dupActive = udhariEntries.find(
      e => e.phone === phone || (e.name.toLowerCase() === name.toLowerCase() && e.phone === phone)
    );
    if (dupActive) {
      // Auto-merge into existing entry (advance allowed - amount can be negative for deposit)
      doAddUdhari({ name, phone, amount: newEntry.amount });
      toast.success(`Merged with existing entry for ${dupActive.name}`);
      return;
    }

    const existsInPaidOff = paidOffCustomers.find(
      p => p.phone === phone || p.name.toLowerCase() === name.toLowerCase()
    );
    if (existsInPaidOff) {
      setPendingNewEntry({ name, phone, amount: newEntry.amount });
      setShowMergePrompt(true);
      return;
    }
    doAddUdhari({ name, phone, amount: newEntry.amount });
  };

  const doAddUdhari = (entry: { name: string; phone: string; amount: string }) => {
    addUdhari({
      id: Date.now().toString(),
      name: entry.name,
      phone: entry.phone,
      amount: Number(entry.amount),
      totalBilled: Number(entry.amount),
      date: new Date().toISOString().split("T")[0],
      payments: [],
    });
    setNewEntry({ name: "", phone: "", amount: "" });
    setShowAdd(false);
    setShowMergePrompt(false);
    setPendingNewEntry(null);
  };

  const handleMerge = () => {
    if (!pendingNewEntry) return;
    const existing = paidOffCustomers.find(
      p => p.phone === pendingNewEntry.phone && p.name.toLowerCase() === pendingNewEntry.name.toLowerCase()
    );
    if (existing) deletePaidOff(existing.id);
    doAddUdhari(pendingNewEntry);
  };

  const handleNewSeparate = () => {
    if (!pendingNewEntry) return;
    doAddUdhari(pendingNewEntry);
  };

  const handlePartialPay = () => {
    if (!showPartial || !partialAmount) return;
    const paidAmount = Number(partialAmount);
    const remainingAfter = showPartial.amount - paidAmount;
    payUdhari(showPartial.id, paidAmount, payMethod);
    // Voice notification
    speakUdhariPayment(paidAmount, remainingAfter, payMethod);
    setShowPartial(null);
    setPartialAmount("");
    setPayMethod("cash");
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === "udhari") {
      deleteUdhari(deleteConfirm.id);
    } else {
      deletePaidOff(deleteConfirm.id);
      setShowPaidOff(null);
    }
    toast.success(`${deleteConfirm.name} ${t("toast_delete_success")}`);
    setDeleteConfirm(null);
  };

  // Generate professional PDF for udhari customer
  const generateUdhariPDF = (entry: UdhariEntry | PaidOffCustomer, isCleared: boolean) => {
    const totalBilled = 'totalBilled' in entry ? entry.totalBilled : ('amount' in entry ? (entry as any).totalBilled || (entry as any).amount : 0);
    const totalPaid = isCleared ? (entry as PaidOffCustomer).totalPaid : ((entry as UdhariEntry).totalBilled - (entry as UdhariEntry).amount);
    const remaining = isCleared ? 0 : (entry as UdhariEntry).amount;
    const payments = entry.payments || [];
    const shopName = localStorage.getItem("smk_shopname") || "Shop";
    
    const paymentRows = payments.map(p => 
      `<tr>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:11px;">${p.date}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:11px;">${p.time || '-'}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:11px;text-align:right;font-weight:600;color:#16a34a;">₹${p.amount.toLocaleString()}</td>
        <td style="padding:6px 8px;border-bottom:1px solid #eee;font-size:11px;text-transform:capitalize;">${p.method}</td>
      </tr>`
    ).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Udhari - ${entry.name}</title>
<style>
@media print { @page { margin: 10mm; } .no-print { display:none!important; } }
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8f9fa;padding:20px}
.container{max-width:400px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08)}
.header{background:linear-gradient(135deg,#1e293b,#334155);color:#fff;padding:24px;text-align:center}
.header h1{font-size:14px;font-weight:800;letter-spacing:2px;text-transform:uppercase;opacity:0.7;margin-bottom:4px}
.header h2{font-size:20px;font-weight:700;margin-bottom:2px}
.header p{font-size:11px;opacity:0.7}
.status{display:inline-block;padding:4px 12px;border-radius:20px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-top:8px}
.status-pending{background:#fbbf24;color:#92400e}
.status-cleared{background:#4ade80;color:#14532d}
.summary{padding:20px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
.stat{text-align:center;padding:12px;background:#f1f5f9;border-radius:10px}
.stat-label{font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#64748b;font-weight:600}
.stat-value{font-size:16px;font-weight:800;margin-top:2px}
.stat-billed .stat-value{color:#1e293b}
.stat-paid .stat-value{color:#16a34a}
.stat-remaining .stat-value{color:#dc2626}
.section{padding:16px 20px}
.section-title{font-size:10px;text-transform:uppercase;letter-spacing:1.5px;color:#94a3b8;font-weight:700;margin-bottom:10px;display:flex;align-items:center;gap:6px}
table{width:100%;border-collapse:collapse}
th{padding:6px 8px;font-size:9px;text-transform:uppercase;letter-spacing:1px;color:#94a3b8;border-bottom:2px solid #e2e8f0;text-align:left;font-weight:700}
th:nth-child(3){text-align:right}
.footer{text-align:center;padding:16px;border-top:1px solid #e2e8f0;font-size:10px;color:#94a3b8}
.btn-row{text-align:center;padding:16px}
.btn-row button{padding:8px 24px;margin:0 4px;font-size:12px;cursor:pointer;border:1px solid #ccc;background:#f5f5f5;border-radius:8px}
</style></head><body>
<div class="container">
  <div class="header">
    <h1>${shopName}</h1>
    <h2>${entry.name}</h2>
    <p>📱 ${entry.phone}</p>
    <span class="status ${isCleared ? 'status-cleared' : 'status-pending'}">${isCleared ? '✅ Fully Cleared' : '⏳ Pending'}</span>
  </div>
  <div class="summary">
    <div class="stat stat-billed"><div class="stat-label">Total Billed</div><div class="stat-value">₹${totalBilled.toLocaleString()}</div></div>
    <div class="stat stat-paid"><div class="stat-label">Total Paid</div><div class="stat-value">₹${totalPaid.toLocaleString()}</div></div>
    <div class="stat stat-remaining"><div class="stat-label">Remaining</div><div class="stat-value">₹${remaining.toLocaleString()}</div></div>
  </div>
  ${payments.length > 0 ? `
  <div class="section">
    <div class="section-title">💳 Payment History</div>
    <table>
      <thead><tr><th>Date</th><th>Time</th><th style="text-align:right">Amount</th><th>Method</th></tr></thead>
      <tbody>${paymentRows}</tbody>
    </table>
  </div>` : ''}
  <div class="footer">
    <p>Generated on ${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} • ${shopName}</p>
  </div>
</div>
<div class="btn-row no-print">
  <button onclick="window.print()">🖨️ Print / Save PDF</button>
  <button onclick="window.close()">✕ Close</button>
</div>
</body></html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      setTimeout(() => win.print(), 500);
    }
  };

  // Share udhari customer details
  const shareUdhariEntry = async (entry: UdhariEntry | PaidOffCustomer, isCleared: boolean) => {
    const totalBilled = 'totalBilled' in entry ? entry.totalBilled : 0;
    const totalPaid = isCleared ? (entry as PaidOffCustomer).totalPaid : (totalBilled - (entry as UdhariEntry).amount);
    const remaining = isCleared ? 0 : (entry as UdhariEntry).amount;
    const payments = entry.payments || [];
    
    const text = `📋 Udhari ${isCleared ? '✅ Cleared' : '⏳ Pending'}\n\n👤 ${entry.name}\n📱 ${entry.phone}\n\n💰 Total Billed: ₹${totalBilled.toLocaleString()}\n✅ Total Paid: ₹${totalPaid.toLocaleString()}\n${!isCleared ? `⏳ Remaining: ₹${remaining.toLocaleString()}\n` : ''}\n${payments.length > 0 ? `💳 Payments:\n${payments.map(p => `  ₹${p.amount} via ${p.method} on ${p.date}`).join('\n')}` : ''}`;
    
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: `Udhari - ${entry.name}`, text });
        return;
      } catch (err: any) {
        if (err?.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      const lang = localStorage.getItem("smk_language") || "en";
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
      toast.success(t("toast_copied"));
    }
  };

  const handleDownloadPaidOff = (customer: PaidOffCustomer) => {
    generateUdhariPDF(customer, true);
  };

  const handleSharePaidOff = async (customer: PaidOffCustomer) => {
    await shareUdhariEntry(customer, true);
  };

  return (
    <div className="px-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-foreground">Udhari</h1>
        <div className="flex items-center gap-2">
          {paidOffCustomers.length > 0 && (
            <button
              onClick={() => setShowPaidOffList(true)}
              className="glass-card px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 text-success border border-success/20 hover:bg-success/5 transition-colors"
            >
              <UserCheck size={14} /> Paid ({paidOffCustomers.length})
            </button>
          )}
          <button onClick={() => setShowAdd(true)} className="gradient-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5">
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      {/* Professional Pending Card */}
      <div className="glass-card overflow-hidden">
        <div className="p-4 gradient-card-purple relative">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Total Pending Udhari</p>
              <p className="text-3xl font-display font-black text-foreground tracking-tight">₹{totalPending.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center">
              <TrendingDown size={20} className="text-warning" />
            </div>
          </div>
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
            <div className="flex items-center gap-1.5">
              <Users size={12} className="text-muted-foreground" />
              <span className="text-xs text-muted-foreground"><span className="font-bold text-foreground">{udhariEntries.length}</span> customers</span>
            </div>
            {paidOffCustomers.length > 0 && (
              <div className="flex items-center gap-1.5">
                <UserCheck size={12} className="text-success" />
                <span className="text-xs text-muted-foreground"><span className="font-bold text-success">{paidOffCustomers.length}</span> cleared</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="glass-card flex items-center gap-2 px-3 py-2.5">
        <Search size={16} className="text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or phone..." className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground w-full outline-none" />
      </div>

      {/* Entries */}
      <div className="space-y-2">
        {filtered.map(entry => {
          const customerBills = getCustomerBills(entry.name, entry.phone);
          return (
            <div key={entry.id} className="glass-card-hover p-3">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="text-sm font-medium text-foreground">{entry.name}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Phone size={10} /> {entry.phone} · {entry.date}
                    {entry.billNo && <span className="ml-1 text-primary">({entry.billNo})</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <p className="font-display font-bold text-warning">₹{entry.amount.toLocaleString()}</p>
                  {(customerBills.length > 0 || (entry.payments || []).length > 0) && (
                    <button
                      onClick={() => setShowHistory(entry)}
                      className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      title="View History"
                    >
                      <Eye size={14} />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setShowPartial(entry); setPartialAmount(""); }} className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-success/10 text-success">
                  Receive Payment
                </button>
                <button onClick={() => generateUdhariPDF(entry, false)} className="py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary" title="Download PDF">
                  <FileText size={14} />
                </button>
                <button onClick={() => shareUdhariEntry(entry, false)} className="py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-accent text-accent-foreground" title="Share">
                  <Share2 size={14} />
                </button>
                <button onClick={() => setDeleteConfirm({ type: "udhari", id: entry.id, name: entry.name })} className="py-1.5 px-2.5 rounded-lg text-xs font-semibold bg-destructive/10 text-destructive">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="glass-card p-8 text-center">
            <p className="text-sm text-muted-foreground">No udhari entries found</p>
          </div>
        )}
      </div>

      {/* Add Udhari Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="glass-card w-[92%] max-w-md p-5 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-foreground">Add Udhari</h3>
              <button onClick={() => setShowAdd(false)} className="text-muted-foreground"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input value={newEntry.name} onChange={e => setNewEntry({ ...newEntry, name: e.target.value })} placeholder="Customer Name *" required className="w-full glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none rounded-lg placeholder:text-muted-foreground" />
              <input value={newEntry.phone} onChange={e => setNewEntry({ ...newEntry, phone: e.target.value })} placeholder="Phone Number * (required)" type="tel" required className="w-full glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none rounded-lg placeholder:text-muted-foreground" />
              <input value={newEntry.amount} onChange={e => setNewEntry({ ...newEntry, amount: e.target.value })} placeholder="Amount (₹) — use negative for advance deposit" type="number" className="w-full glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none rounded-lg placeholder:text-muted-foreground" />
              <p className="text-[10px] text-muted-foreground px-1">💡 Tip: Enter negative amount (e.g. -500) to record an advance deposit. Same name+phone will auto-merge.</p>
              <button onClick={handleAdd} className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm">Add Udhari</button>
            </div>
          </div>
        </div>
      )}

      {/* Merge Prompt Modal */}
      {showMergePrompt && pendingNewEntry && (
        <div className="modal-overlay" onClick={() => { setShowMergePrompt(false); setPendingNewEntry(null); }}>
          <div className="glass-card w-[92%] max-w-md p-5 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-foreground">Customer Found</h3>
              <button onClick={() => { setShowMergePrompt(false); setPendingNewEntry(null); }} className="text-muted-foreground"><X size={20} /></button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              <span className="font-semibold text-foreground">{pendingNewEntry.name}</span> has a cleared udhari record. What would you like to do?
            </p>
            <div className="space-y-2">
              <button onClick={handleMerge} className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm">
                Merge with Previous Record
              </button>
              <button onClick={handleNewSeparate} className="w-full py-3 rounded-xl font-semibold text-sm bg-muted/50 text-foreground border border-border">
                Create New Udhari
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receive Payment Modal */}
      {showPartial && (
        <div className="modal-overlay" onClick={() => setShowPartial(null)}>
          <div className="glass-card w-[92%] max-w-md p-5 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-foreground">Receive from {showPartial.name}</h3>
              <button onClick={() => setShowPartial(null)} className="text-muted-foreground"><X size={20} /></button>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Pending: <span className="text-warning font-bold">₹{showPartial.amount}</span></p>
            <input value={partialAmount} onChange={e => setPartialAmount(e.target.value)} placeholder="Amount received (₹)" type="number" className="w-full glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none rounded-lg placeholder:text-muted-foreground mb-3" />
            <div className="mb-3">
              <p className="text-xs text-muted-foreground mb-1.5">Payment Method</p>
              <div className="flex gap-2">
                {["cash", "upi", "other"].map(m => (
                  <button key={m} onClick={() => setPayMethod(m)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-colors ${payMethod === m ? 'gradient-primary text-primary-foreground' : 'bg-muted/50 text-muted-foreground'}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={handlePartialPay} className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm">Confirm Payment</button>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (() => {
        const customerBills = getCustomerBills(showHistory.name, showHistory.phone);
        const totalBilled = showHistory.totalBilled || showHistory.amount;
        const totalPaidByCustomer = (showHistory.payments || []).reduce((s, p) => s + p.amount, 0);
        const remaining = showHistory.amount;

        return (
          <div className="modal-overlay" onClick={() => setShowHistory(null)}>
            <div className="glass-card w-[92%] max-w-md p-5 animate-slide-up max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-display font-bold text-lg text-foreground">{showHistory.name}</h3>
                  <p className="text-xs text-muted-foreground">{showHistory.phone}</p>
                </div>
                <button onClick={() => setShowHistory(null)} className="text-muted-foreground"><X size={20} /></button>
              </div>

              {/* Summary Card */}
              <div className="glass-card p-3 mb-4 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Total Billed</span>
                  <span className="font-bold text-foreground">₹{totalBilled.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Total Paid</span>
                  <span className="font-bold text-success">₹{totalPaidByCustomer.toLocaleString()}</span>
                </div>
                <div className="border-t border-border pt-1.5 flex justify-between text-sm">
                  <span className="font-semibold text-muted-foreground">Remaining</span>
                  <span className="font-display font-bold text-warning">₹{remaining.toLocaleString()}</span>
                </div>
              </div>

              {/* Payment History */}
              {(showHistory.payments || []).length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1"><ArrowDownCircle size={12} /> Payment History</p>
                  <div className="space-y-1.5">
                    {(showHistory.payments || []).map(p => (
                      <div key={p.id} className="glass-card p-2.5 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-success">+ ₹{p.amount.toLocaleString()} received</p>
                          <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                            {p.date} {p.time && <><Clock size={8} /> {p.time}</>} · <span className="capitalize">{p.method}</span>
                          </p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success font-medium capitalize">{p.method}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Bill History */}
              {customerBills.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1"><IndianRupee size={12} /> Bill History</p>
                  <div className="space-y-1.5">
                    {customerBills.map(bill => (
                      <div key={bill.id} className="glass-card p-2.5 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold text-primary">{bill.billNo}</p>
                          <p className="text-[10px] text-muted-foreground">{bill.date}</p>
                          <p className="text-sm font-bold text-foreground">₹{bill.total.toLocaleString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                            bill.paymentMode === "udhari" 
                              ? 'bg-warning/10 text-warning' 
                              : bill.paymentConfirmed 
                                ? 'bg-success/10 text-success' 
                                : 'bg-warning/10 text-warning'
                          }`}>
                            {bill.paymentMode === "udhari" ? 'Udhari' : bill.paymentConfirmed ? 'Paid' : 'Pending'}
                          </span>
                          <button onClick={() => setViewBill(bill)} className="p-1.5 rounded-lg bg-primary/10 text-primary">
                            <Eye size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {customerBills.length === 0 && (showHistory.payments || []).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No history found</p>
              )}
            </div>
          </div>
        );
      })()}

      {/* Bill Detail Modal */}
      {viewBill && (
        <div className="modal-overlay" onClick={() => setViewBill(null)}>
          <div className="glass-card w-[92%] max-w-md p-5 animate-slide-up max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-bold text-lg text-foreground">Bill #{viewBill.billNo}</h3>
                <p className="text-xs text-muted-foreground">{viewBill.date}</p>
              </div>
              <button onClick={() => setViewBill(null)} className="text-muted-foreground"><X size={20} /></button>
            </div>
            <div className="space-y-1 mb-3">
              <div className="flex justify-between text-xs text-muted-foreground font-semibold border-b border-border pb-1">
                <span className="flex-1">Item</span>
                <span className="w-12 text-center">Qty</span>
                <span className="w-16 text-right">Rate</span>
                <span className="w-16 text-right">Amount</span>
              </div>
              {viewBill.items.map(item => (
                <div key={item.id} className="flex justify-between text-xs text-foreground py-1">
                  <span className="flex-1 truncate">{item.name}</span>
                  <span className="w-12 text-center">{item.quantity}{item.unit}</span>
                  <span className="w-16 text-right">₹{item.price}</span>
                  <span className="w-16 text-right font-semibold">₹{item.money}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-border pt-2 flex justify-between items-center">
              <div>
                <p className="text-xs text-muted-foreground">Payment: <span className="text-foreground font-medium">{viewBill.paymentMode === "udhari" ? "Udhari" : viewBill.paymentMode}{viewBill.upiApp ? ` (${viewBill.upiApp})` : ''}</span></p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  viewBill.paymentMode === "udhari" 
                    ? 'bg-warning/10 text-warning' 
                    : viewBill.paymentConfirmed 
                      ? 'bg-success/10 text-success' 
                      : 'bg-warning/10 text-warning'
                }`}>
                  {viewBill.paymentMode === "udhari" ? 'Udhari' : viewBill.paymentConfirmed ? 'Payment Done' : 'Payment Pending'}
                </span>
              </div>
              <p className="font-display font-bold text-lg text-foreground">₹{viewBill.total.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}

      {/* Paid Off List Modal */}
      {showPaidOffList && (
        <div className="modal-overlay" onClick={() => setShowPaidOffList(false)}>
          <div className="glass-card w-[92%] max-w-md p-5 animate-slide-up max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <UserCheck size={18} className="text-success" />
                <h3 className="font-display font-bold text-lg text-foreground">Fully Paid Customers</h3>
              </div>
              <button onClick={() => setShowPaidOffList(false)} className="text-muted-foreground"><X size={20} /></button>
            </div>
            <div className="space-y-2">
              {paidOffCustomers.map(c => (
                <button
                  key={c.id}
                  onClick={() => { setShowPaidOffList(false); setShowPaidOff(c); }}
                  className="w-full glass-card-hover p-3 text-left flex items-center justify-between border border-success/10"
                >
                  <div>
                    <p className="text-sm font-semibold text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone size={10} /> {c.phone}</p>
                    <p className="text-[10px] text-muted-foreground">Cleared: {c.clearedDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-success">₹{c.totalPaid.toLocaleString()}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success font-medium">Cleared ✅</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Paid Off Customer Detail Modal */}
      {showPaidOff && (
        <div className="modal-overlay" onClick={() => setShowPaidOff(null)}>
          <div className="glass-card w-[92%] max-w-md p-5 animate-slide-up max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-bold text-lg text-foreground">{showPaidOff.name}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone size={10} /> {showPaidOff.phone}</p>
              </div>
              <button onClick={() => setShowPaidOff(null)} className="text-muted-foreground"><X size={20} /></button>
            </div>

            {/* Summary */}
            <div className="glass-card p-3 mb-4 space-y-1.5 border border-success/20">
              <div className="flex items-center gap-1.5 mb-1">
                <UserCheck size={14} className="text-success" />
                <span className="text-xs font-bold text-success">Fully Cleared</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total Billed</span>
                <span className="font-bold text-foreground">₹{showPaidOff.totalBilled.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Total Paid</span>
                <span className="font-bold text-success">₹{showPaidOff.totalPaid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Cleared On</span>
                <span className="font-medium text-foreground">{showPaidOff.clearedDate}</span>
              </div>
            </div>

            {/* Payment History */}
            {(showPaidOff.payments || []).length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1"><ArrowDownCircle size={12} /> Payment History</p>
                <div className="space-y-1.5">
                  {(showPaidOff.payments || []).map(p => (
                    <div key={p.id} className="glass-card p-2.5 flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-success">+ ₹{p.amount.toLocaleString()} received</p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          {p.date} {p.time && <><Clock size={8} /> {p.time}</>} · <span className="capitalize">{p.method}</span>
                        </p>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/10 text-success font-medium capitalize">{p.method}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button onClick={() => handleDownloadPaidOff(showPaidOff)} className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-primary/10 text-primary flex items-center justify-center gap-1.5">
                <Download size={14} /> Download
              </button>
              <button onClick={() => handleSharePaidOff(showPaidOff)} className="flex-1 py-2.5 rounded-xl text-xs font-semibold bg-accent text-accent-foreground flex items-center justify-center gap-1.5">
                <Share2 size={14} /> Share
              </button>
              <button onClick={() => setDeleteConfirm({ type: "paidoff", id: showPaidOff.id, name: showPaidOff.name })} className="py-2.5 px-4 rounded-xl text-xs font-semibold bg-destructive/10 text-destructive flex items-center justify-center gap-1.5">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" style={{ zIndex: 200 }} onClick={() => setDeleteConfirm(null)}>
          <div className="glass-card w-[85%] max-w-sm p-5 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle size={28} className="text-destructive" />
              </div>
              <h3 className="font-display font-bold text-lg text-foreground">Delete Confirmation</h3>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete <span className="font-bold text-foreground">{deleteConfirm.name}</span>'s record? This action cannot be undone.
              </p>
              <div className="flex gap-2 w-full mt-2">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-muted/50 text-foreground border border-border">
                  Cancel
                </button>
                <button onClick={handleConfirmDelete} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-destructive text-destructive-foreground">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Udhari;
