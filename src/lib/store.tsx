import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./auth";
import { db } from "./firebase";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  updateDoc,
  getDoc,
  writeBatch,
} from "firebase/firestore";

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
  method: string;
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

export interface Product {
  id: string;
  name: string;
  costPrice: number;
  sellPrice: number;
  unit: string;
  stock: number;
  lowStockAlert: number;
  expiry: string;
  barcode: string;
  imageUrl: string;
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
  products: Product[];
  addProduct: (product: Product) => void;
  updateProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
  loading: boolean;
}

const defaultSettings: ShopSettings = {
  shopName: "Smart Mudi Store",
  shopAddress: "",
  shopGST: "",
  upiIds: ["", "", ""],
};

const StoreContext = createContext<StoreContextType | null>(null);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const uid = user?.uid;

  const [bills, setBills] = useState<CompletedBill[]>([]);
  const [udhariEntries, setUdhariEntries] = useState<UdhariEntry[]>([]);
  const [paidOffCustomers, setPaidOffCustomers] = useState<PaidOffCustomer[]>([]);
  const [settings, setSettings] = useState<ShopSettings>(defaultSettings);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Real-time Firestore listeners
  useEffect(() => {
    if (!uid) {
      setBills([]);
      setUdhariEntries([]);
      setPaidOffCustomers([]);
      setSettings(defaultSettings);
      setProducts([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let loaded = 0;
    const total = 5;
    const checkLoaded = () => { loaded++; if (loaded >= total) setLoading(false); };

    const unsubs = [
      onSnapshot(collection(db, `users/${uid}/bills`), (snap) => {
        setBills(snap.docs.map(d => ({ id: d.id, ...d.data() } as CompletedBill)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        checkLoaded();
      }),
      onSnapshot(collection(db, `users/${uid}/udhari`), (snap) => {
        setUdhariEntries(snap.docs.map(d => ({ id: d.id, ...d.data() } as UdhariEntry)));
        checkLoaded();
      }),
      onSnapshot(collection(db, `users/${uid}/paidoff`), (snap) => {
        setPaidOffCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() } as PaidOffCustomer)));
        checkLoaded();
      }),
      onSnapshot(doc(db, `users/${uid}/settings/main`), (snap) => {
        if (snap.exists()) setSettings(snap.data() as ShopSettings);
        checkLoaded();
      }),
      onSnapshot(collection(db, `users/${uid}/products`), (snap) => {
        setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
        checkLoaded();
      }),
    ];

    return () => unsubs.forEach(u => u());
  }, [uid]);

  const addBill = async (bill: CompletedBill) => {
    if (!uid) return;
    await setDoc(doc(db, `users/${uid}/bills`, bill.id), bill);
  };

  const confirmBillPayment = async (billId: string) => {
    if (!uid) return;
    await updateDoc(doc(db, `users/${uid}/bills`, billId), { paymentConfirmed: true });
  };

  const addUdhari = async (entry: UdhariEntry) => {
    if (!uid) return;
    const entryWithDefaults = { ...entry, totalBilled: entry.totalBilled || entry.amount, payments: entry.payments || [] };
    // Check if customer already exists
    const existing = udhariEntries.find(e => e.phone === entryWithDefaults.phone && e.name === entryWithDefaults.name);
    if (existing) {
      await updateDoc(doc(db, `users/${uid}/udhari`, existing.id), {
        amount: existing.amount + entryWithDefaults.amount,
        totalBilled: existing.totalBilled + entryWithDefaults.amount,
      });
    } else {
      await setDoc(doc(db, `users/${uid}/udhari`, entryWithDefaults.id), entryWithDefaults);
    }
  };

  const payUdhari = async (id: string, amount: number, method: string = "cash", note?: string) => {
    if (!uid) return;
    const entry = udhariEntries.find(e => e.id === id);
    if (!entry) return;

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

    const newAmount = entry.amount - amount;
    const newPayments = [...(entry.payments || []), payment];

    if (newAmount <= 0) {
      // Move to paid off
      const paidOff: PaidOffCustomer = {
        id: entry.id,
        name: entry.name,
        phone: entry.phone,
        totalBilled: entry.totalBilled,
        totalPaid: newPayments.reduce((s, p) => s + p.amount, 0),
        clearedDate: now.toISOString().split("T")[0],
        payments: newPayments,
        billNos: entry.billNo ? [entry.billNo] : [],
      };
      const batch = writeBatch(db);
      batch.delete(doc(db, `users/${uid}/udhari`, id));
      batch.set(doc(db, `users/${uid}/paidoff`, paidOff.id), paidOff);
      await batch.commit();
    } else {
      await updateDoc(doc(db, `users/${uid}/udhari`, id), {
        amount: newAmount,
        payments: newPayments,
      });
    }
  };

  const deleteUdhari = async (id: string) => {
    if (!uid) return;
    await deleteDoc(doc(db, `users/${uid}/udhari`, id));
  };

  const deletePaidOff = async (id: string) => {
    if (!uid) return;
    await deleteDoc(doc(db, `users/${uid}/paidoff`, id));
  };

  const updateSettings = async (s: Partial<ShopSettings>) => {
    if (!uid) return;
    const updated = { ...settings, ...s };
    setSettings(updated);
    await setDoc(doc(db, `users/${uid}/settings/main`), updated);
  };

  const addProduct = async (product: Product) => {
    if (!uid) return;
    await setDoc(doc(db, `users/${uid}/products`, product.id), product);
  };

  const updateProduct = async (product: Product) => {
    if (!uid) return;
    await setDoc(doc(db, `users/${uid}/products`, product.id), product);
  };

  const deleteProduct = async (id: string) => {
    if (!uid) return;
    await deleteDoc(doc(db, `users/${uid}/products`, id));
  };

  return (
    <StoreContext.Provider value={{
      bills, addBill, confirmBillPayment,
      udhariEntries, paidOffCustomers, addUdhari, payUdhari, deleteUdhari, deletePaidOff,
      settings, updateSettings,
      products, addProduct, updateProduct, deleteProduct,
      loading,
    }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be inside StoreProvider");
  return ctx;
};
