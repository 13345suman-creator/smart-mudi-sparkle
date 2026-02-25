import { useState } from "react";
import { Search, Plus, X, Phone, Eye } from "lucide-react";
import { useStore, type CompletedBill } from "@/lib/store";

const Udhari = () => {
  const { udhariEntries, addUdhari, payUdhari, deleteUdhari, bills } = useStore();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showPartial, setShowPartial] = useState<typeof udhariEntries[0] | null>(null);
  const [partialAmount, setPartialAmount] = useState("");
  const [newEntry, setNewEntry] = useState({ name: "", phone: "", amount: "" });
  const [showHistory, setShowHistory] = useState<typeof udhariEntries[0] | null>(null);
  const [viewBill, setViewBill] = useState<CompletedBill | null>(null);

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
    if (!newEntry.name || !newEntry.amount) return;
    addUdhari({
      id: Date.now().toString(),
      name: newEntry.name,
      phone: newEntry.phone,
      amount: Number(newEntry.amount),
      date: new Date().toISOString().split("T")[0],
    });
    setNewEntry({ name: "", phone: "", amount: "" });
    setShowAdd(false);
  };

  const handlePartialPay = () => {
    if (!showPartial || !partialAmount) return;
    payUdhari(showPartial.id, Number(partialAmount));
    setShowPartial(null);
    setPartialAmount("");
  };

  return (
    <div className="px-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-foreground">Udhari</h1>
        <button onClick={() => setShowAdd(true)} className="gradient-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5">
          <Plus size={16} /> Add
        </button>
      </div>

      <div className="glass-card p-4 glow-accent gradient-card-purple">
        <p className="text-xs text-muted-foreground">Total Pending</p>
        <p className="text-2xl font-display font-bold text-foreground">₹{totalPending.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground mt-1">{udhariEntries.length} customers</p>
      </div>

      <div className="glass-card flex items-center gap-2 px-3 py-2.5">
        <Search size={16} className="text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or phone..." className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground w-full outline-none" />
      </div>

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
                  {customerBills.length > 0 && (
                    <button
                      onClick={() => setShowHistory(entry)}
                      className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      title="View History"
                    >
                      <Eye size={16} />
                    </button>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setShowPartial(entry); setPartialAmount(""); }} className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-success/10 text-success">
                  Receive Payment
                </button>
                <button onClick={() => deleteUdhari(entry.id)} className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-destructive/10 text-destructive">
                  Delete
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

      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="glass-card w-[92%] max-w-md p-5 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-foreground">Add Udhari</h3>
              <button onClick={() => setShowAdd(false)} className="text-muted-foreground"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              <input value={newEntry.name} onChange={e => setNewEntry({ ...newEntry, name: e.target.value })} placeholder="Customer Name" className="w-full glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none rounded-lg placeholder:text-muted-foreground" />
              <input value={newEntry.phone} onChange={e => setNewEntry({ ...newEntry, phone: e.target.value })} placeholder="Phone Number" className="w-full glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none rounded-lg placeholder:text-muted-foreground" />
              <input value={newEntry.amount} onChange={e => setNewEntry({ ...newEntry, amount: e.target.value })} placeholder="Amount (₹)" type="number" className="w-full glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none rounded-lg placeholder:text-muted-foreground" />
              <button onClick={handleAdd} className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm">Add Udhari</button>
            </div>
          </div>
        </div>
      )}

      {showPartial && (
        <div className="modal-overlay" onClick={() => setShowPartial(null)}>
          <div className="glass-card w-[92%] max-w-md p-5 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-foreground">Receive from {showPartial.name}</h3>
              <button onClick={() => setShowPartial(null)} className="text-muted-foreground"><X size={20} /></button>
            </div>
            <p className="text-sm text-muted-foreground mb-3">Pending: <span className="text-warning font-bold">₹{showPartial.amount}</span></p>
            <input value={partialAmount} onChange={e => setPartialAmount(e.target.value)} placeholder="Amount received (₹)" type="number" className="w-full glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none rounded-lg placeholder:text-muted-foreground mb-3" />
            <button onClick={handlePartialPay} className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm">Confirm Payment</button>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="modal-overlay" onClick={() => setShowHistory(null)}>
          <div className="glass-card w-[92%] max-w-md p-5 animate-slide-up max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-display font-bold text-lg text-foreground">{showHistory.name}</h3>
                <p className="text-xs text-muted-foreground">{showHistory.phone} · Bill History</p>
              </div>
              <button onClick={() => setShowHistory(null)} className="text-muted-foreground"><X size={20} /></button>
            </div>
            <div className="space-y-2">
              {getCustomerBills(showHistory.name, showHistory.phone).map(bill => (
                <div key={bill.id} className="glass-card p-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-primary">{bill.billNo}</p>
                    <p className="text-xs text-muted-foreground">{bill.date}</p>
                    <p className="text-sm font-bold text-foreground">₹{bill.total.toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${bill.paymentConfirmed ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                      {bill.paymentConfirmed ? 'Paid' : 'Pending'}
                    </span>
                    <button onClick={() => setViewBill(bill)} className="p-1.5 rounded-lg bg-primary/10 text-primary">
                      <Eye size={14} />
                    </button>
                  </div>
                </div>
              ))}
              {getCustomerBills(showHistory.name, showHistory.phone).length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">No bill history found</p>
              )}
            </div>
          </div>
        </div>
      )}

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
                <p className="text-xs text-muted-foreground">Payment: <span className="text-foreground font-medium">{viewBill.paymentMode}{viewBill.upiApp ? ` (${viewBill.upiApp})` : ''}</span></p>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${viewBill.paymentConfirmed ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>
                  {viewBill.paymentConfirmed ? 'Payment Done' : 'Payment Pending'}
                </span>
              </div>
              <p className="font-display font-bold text-lg text-foreground">₹{viewBill.total.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Udhari;
