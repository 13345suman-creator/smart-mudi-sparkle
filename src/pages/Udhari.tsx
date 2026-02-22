import { useState } from "react";
import { Search, Plus, X, Phone, IndianRupee } from "lucide-react";

interface UdhariEntry {
  id: string;
  name: string;
  phone: string;
  amount: number;
  date: string;
}

const initialUdhari: UdhariEntry[] = [
  { id: "1", name: "Ramesh Kumar", phone: "9876543210", amount: 2500, date: "2026-02-20" },
  { id: "2", name: "Suresh Yadav", phone: "9876543211", amount: 1800, date: "2026-02-18" },
  { id: "3", name: "Priya Sharma", phone: "9876543212", amount: 4450, date: "2026-02-15" },
];

const Udhari = () => {
  const [entries, setEntries] = useState<UdhariEntry[]>(initialUdhari);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [showPartial, setShowPartial] = useState<UdhariEntry | null>(null);
  const [partialAmount, setPartialAmount] = useState("");
  const [newEntry, setNewEntry] = useState({ name: "", phone: "", amount: "" });

  const filtered = entries.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.phone.includes(search)
  );

  const totalPending = entries.reduce((s, e) => s + e.amount, 0);

  const handleAdd = () => {
    if (!newEntry.name || !newEntry.amount) return;
    setEntries([{
      id: Date.now().toString(),
      name: newEntry.name,
      phone: newEntry.phone,
      amount: Number(newEntry.amount),
      date: new Date().toISOString().split("T")[0],
    }, ...entries]);
    setNewEntry({ name: "", phone: "", amount: "" });
    setShowAdd(false);
  };

  const handlePartialPay = () => {
    if (!showPartial || !partialAmount) return;
    const amt = Number(partialAmount);
    setEntries(entries.map(e => {
      if (e.id !== showPartial.id) return e;
      const newAmt = e.amount - amt;
      return newAmt > 0 ? { ...e, amount: newAmt } : e;
    }).filter(e => e.amount > 0));
    setShowPartial(null);
    setPartialAmount("");
  };

  const handleDelete = (id: string) => setEntries(entries.filter(e => e.id !== id));

  return (
    <div className="px-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-foreground">Udhari</h1>
        <button onClick={() => setShowAdd(true)} className="gradient-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5">
          <Plus size={16} /> Add
        </button>
      </div>

      {/* Total */}
      <div className="glass-card p-4 glow-accent gradient-card-purple">
        <p className="text-xs text-muted-foreground">Total Pending</p>
        <p className="text-2xl font-display font-bold text-foreground">₹{totalPending.toLocaleString()}</p>
        <p className="text-xs text-muted-foreground mt-1">{entries.length} customers</p>
      </div>

      {/* Search */}
      <div className="glass-card flex items-center gap-2 px-3 py-2.5">
        <Search size={16} className="text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or phone..."
          className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground w-full outline-none"
        />
      </div>

      {/* Entries */}
      <div className="space-y-2">
        {filtered.map(entry => (
          <div key={entry.id} className="glass-card-hover p-3">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-sm font-medium text-foreground">{entry.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <Phone size={10} /> {entry.phone} · {entry.date}
                </p>
              </div>
              <p className="font-display font-bold text-warning">₹{entry.amount.toLocaleString()}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setShowPartial(entry); setPartialAmount(""); }}
                className="flex-1 py-1.5 rounded-lg text-xs font-semibold bg-success/10 text-success"
              >
                Receive Payment
              </button>
              <button
                onClick={() => handleDelete(entry.id)}
                className="py-1.5 px-3 rounded-lg text-xs font-semibold bg-destructive/10 text-destructive"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
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

      {/* Partial Payment Modal */}
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
