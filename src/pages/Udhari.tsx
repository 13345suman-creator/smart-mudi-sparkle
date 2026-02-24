import { useState } from "react";
import { Search, Plus, X, Phone } from "lucide-react";
import { useStore } from "@/lib/store";

const Udhari = () => {
  const { udhariEntries, addUdhari, payUdhari, deleteUdhari } = useStore();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showPartial, setShowPartial] = useState<typeof udhariEntries[0] | null>(null);
  const [partialAmount, setPartialAmount] = useState("");
  const [newEntry, setNewEntry] = useState({ name: "", phone: "", amount: "" });

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
        {filtered.map(entry => (
          <div key={entry.id} className="glass-card-hover p-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium text-foreground">{entry.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone size={10} /> {entry.phone} · {entry.date}
                  {entry.billNo && <span className="ml-1 text-primary">({entry.billNo})</span>}
                </p>
              </div>
              <p className="font-display font-bold text-warning">₹{entry.amount.toLocaleString()}</p>
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
        ))}
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
    </div>
  );
};

export default Udhari;
