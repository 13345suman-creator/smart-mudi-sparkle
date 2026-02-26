import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface BillItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  unit: string;
  money: number;
}

export interface CompletedBill {
  id: string;
  items: BillItem[];
  total: number;
  paymentMode: string;
  upiApp?: string;
  customerName?: string;
  customerPhone?: string;
  date: string;
  billNo: string;
  paymentConfirmed: boolean;
}

export interface PaymentRecord {
  id: string;
  udhariId: string;
  amount: number;
  date: string;
  time: string;
  method: string; // "cash" | "upi" | "other"
  note?: string;
}

export interface UdhariEntry {
  id: string;
  name: string;
  phone: string;
  amount: number;
  totalBilled: number;
  date: string;
  billNo?: string;
  payments: PaymentRecord[];
}

export interface ShopSettings {
  shopName: string;
  shopAddress: string;
  shopGST: string;
  upiIds: string[];
}

export interface PaidOffCustomer {
  id: string;
  name: string;
  phone: string;
  totalBilled: number;
  totalPaid: number;
  clearedDate: string;
  payments: PaymentRecord[];
  billNos: string[];
}

interface StoreContextType {
  bills: CompletedBill[];
  addBill: (bill: CompletedBill) => void;
  confirmBillPayment: (billId: string) => void;
  udhariEntries: UdhariEntry[];
  paidOffCustomers: PaidOffCustomer[];
  addUdhari: (entry: UdhariEntry) => void;
  payUdhari: (id: string, amount: number, method?: string, note?: string) => void;
  deleteUdhari: (id: string) => void;
  deletePaidOff: (id: string) => void;
  settings: ShopSettings;
  updateSettings: (s: Partial<ShopSettings>) => void;
}

const defaultSettings: ShopSettings = {
  shopName: "Smart Mudi Store",
  shopAddress: "",
  shopGST: "",
  upiIds: ["", "", ""],
};

const StoreContext = createContext<StoreContextType | null>(null);

const loadJSON = <T,>(key: string, fallback: T): T => {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [bills, setBills] = useState<CompletedBill[]>(() => loadJSON("app_bills", []));
  const [udhariEntries, setUdhariEntries] = useState<UdhariEntry[]>(() =>
    loadJSON("app_udhari", [
      { id: "1", name: "Ramesh Kumar", phone: "9876543210", amount: 2500, totalBilled: 2500, date: "2026-02-20", payments: [] },
      { id: "2", name: "Suresh Yadav", phone: "9876543211", amount: 1800, totalBilled: 1800, date: "2026-02-18", payments: [] },
      { id: "3", name: "Priya Sharma", phone: "9876543212", amount: 4450, totalBilled: 4450, date: "2026-02-15", payments: [] },
    ])
  );
  const [paidOffCustomers, setPaidOffCustomers] = useState<PaidOffCustomer[]>(() => loadJSON("app_paidoff", []));
  const [settings, setSettings] = useState<ShopSettings>(() => loadJSON("app_settings", defaultSettings));

  useEffect(() => { localStorage.setItem("app_bills", JSON.stringify(bills)); }, [bills]);
  useEffect(() => { localStorage.setItem("app_udhari", JSON.stringify(udhariEntries)); }, [udhariEntries]);
  useEffect(() => { localStorage.setItem("app_paidoff", JSON.stringify(paidOffCustomers)); }, [paidOffCustomers]);
  useEffect(() => { localStorage.setItem("app_settings", JSON.stringify(settings)); }, [settings]);

  const addBill = (bill: CompletedBill) => setBills(prev => [bill, ...prev]);
  
  const confirmBillPayment = (billId: string) => {
    setBills(prev => prev.map(b => b.id === billId ? { ...b, paymentConfirmed: true } : b));
  };

  const addUdhari = (entry: UdhariEntry) => {
    const entryWithDefaults = { ...entry, totalBilled: entry.totalBilled || entry.amount, payments: entry.payments || [] };
    setUdhariEntries(prev => {
      const existing = prev.find(e => e.phone === entryWithDefaults.phone && e.name === entryWithDefaults.name);
      if (existing) {
        return prev.map(e =>
          e.id === existing.id ? { ...e, amount: e.amount + entryWithDefaults.amount, totalBilled: e.totalBilled + entryWithDefaults.amount } : e
        );
      }
      return [entryWithDefaults, ...prev];
    });
  };

  const payUdhari = (id: string, amount: number, method: string = "cash", note?: string) => {
    const now = new Date();
    const payment: PaymentRecord = {
      id: Date.now().toString(),
      udhariId: id,
      amount,
      date: now.toISOString().split("T")[0],
      time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true }),
      method,
      note,
    };
    setUdhariEntries(prev => {
      const updated = prev.map(e => e.id === id ? { ...e, amount: e.amount - amount, payments: [...(e.payments || []), payment] } : e);
      // Move fully paid to paidOff
      const fullyPaid = updated.find(e => e.id === id && e.amount <= 0);
      if (fullyPaid) {
        setPaidOffCustomers(pOff => [{
          id: fullyPaid.id,
          name: fullyPaid.name,
          phone: fullyPaid.phone,
          totalBilled: fullyPaid.totalBilled,
          totalPaid: (fullyPaid.payments || []).reduce((s, p) => s + p.amount, 0),
          clearedDate: now.toISOString().split("T")[0],
          payments: fullyPaid.payments || [],
          billNos: fullyPaid.billNo ? [fullyPaid.billNo] : [],
        }, ...pOff]);
        return updated.filter(e => e.amount > 0);
      }
      return updated;
    });
  };

  const deleteUdhari = (id: string) => setUdhariEntries(prev => prev.filter(e => e.id !== id));
  const deletePaidOff = (id: string) => setPaidOffCustomers(prev => prev.filter(e => e.id !== id));

  const updateSettings = (s: Partial<ShopSettings>) => setSettings(prev => ({ ...prev, ...s }));

  return (
    <StoreContext.Provider value={{ bills, addBill, confirmBillPayment, udhariEntries, paidOffCustomers, addUdhari, payUdhari, deleteUdhari, deletePaidOff, settings, updateSettings }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be inside StoreProvider");
  return ctx;
};
