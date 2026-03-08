import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from "react";
import { notifyBill, notifyUdhari, notifyLowStock } from "./notifications";
import { useAuth } from "./auth";
import { db } from "./firebase";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
  updateDoc,
  writeBatch,
  getDocs,
} from "firebase/firestore";

const STORAGE_LIMIT_MB = 900;

function estimateStorageMB(bills: any[], udhari: any[], paidoff: any[], products: any[], settings: any): number {
  try {
    const totalBytes = 
      JSON.stringify(bills).length +
      JSON.stringify(udhari).length +
      JSON.stringify(paidoff).length +
      JSON.stringify(products).length +
      JSON.stringify(settings).length;
    return totalBytes / (1024 * 1024);
  } catch {
    return 0;
  }
}

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
  storageLimitExceeded: boolean;
  storageMB: number;
  showStorageLimitDialog: boolean;
  setShowStorageLimitDialog: (show: boolean) => void;
}

const defaultSettings: ShopSettings = {
  shopName: "Smart Mudi Store",
  shopAddress: "",
  shopGST: "",
  upiIds: ["", "", ""],
};

const LS_KEYS = {
  bills: "smk_bills",
  udhari: "smk_udhari",
  paidoff: "smk_paidoff",
  settings: "smk_settings",
  products: "smk_products",
};

function loadLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch { return fallback; }
}

function saveLocal<T>(key: string, data: T) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch {}
}

const StoreContext = createContext<StoreContextType | null>(null);

export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const uid = user?.uid;

  const [bills, setBills] = useState<CompletedBill[]>(() => loadLocal(LS_KEYS.bills, []));
  const [udhariEntries, setUdhariEntries] = useState<UdhariEntry[]>(() => loadLocal(LS_KEYS.udhari, []));
  const [paidOffCustomers, setPaidOffCustomers] = useState<PaidOffCustomer[]>(() => loadLocal(LS_KEYS.paidoff, []));
  const [settings, setSettings] = useState<ShopSettings>(() => loadLocal(LS_KEYS.settings, defaultSettings));
  const [products, setProducts] = useState<Product[]>(() => loadLocal(LS_KEYS.products, []));
  const [loading, setLoading] = useState(false);
  const [showStorageLimitDialog, setShowStorageLimitDialog] = useState(false);

  const storageMB = estimateStorageMB(bills, udhariEntries, paidOffCustomers, products, settings);
  const storageLimitExceeded = storageMB >= STORAGE_LIMIT_MB;

  const checkStorageLimit = (): boolean => {
    if (storageLimitExceeded) {
      setShowStorageLimitDialog(true);
      return true;
    }
    return false;
  };
  
  // Track whether we're listening to Firestore to prevent local saves from overwriting
  const firestoreActiveRef = useRef(false);
  const unsubsRef = useRef<(() => void)[]>([]);

  // Save to localStorage whenever data changes (only when NOT listening to Firestore to avoid loops)
  useEffect(() => { saveLocal(LS_KEYS.bills, bills); }, [bills]);
  useEffect(() => { saveLocal(LS_KEYS.udhari, udhariEntries); }, [udhariEntries]);
  useEffect(() => { saveLocal(LS_KEYS.paidoff, paidOffCustomers); }, [paidOffCustomers]);
  useEffect(() => { saveLocal(LS_KEYS.settings, settings); }, [settings]);
  useEffect(() => { saveLocal(LS_KEYS.products, products); }, [products]);

  // Cleanup all Firestore listeners
  const cleanupListeners = useCallback(() => {
    unsubsRef.current.forEach(u => u());
    unsubsRef.current = [];
    firestoreActiveRef.current = false;
  }, []);

  // Sync local data to Firestore when user logs in
  const syncLocalToFirestore = useCallback(async (userId: string) => {
    try {
      const localBills = loadLocal<CompletedBill[]>(LS_KEYS.bills, []);
      const localUdhari = loadLocal<UdhariEntry[]>(LS_KEYS.udhari, []);
      const localPaidoff = loadLocal<PaidOffCustomer[]>(LS_KEYS.paidoff, []);
      const localSettings = loadLocal<ShopSettings>(LS_KEYS.settings, defaultSettings);
      const localProducts = loadLocal<Product[]>(LS_KEYS.products, []);

      const billsSnap = await getDocs(collection(db, `users/${userId}/bills`));
      const hasFirestoreData = !billsSnap.empty;

      if (!hasFirestoreData && (localBills.length > 0 || localProducts.length > 0)) {
        const batch = writeBatch(db);
        localBills.forEach(b => batch.set(doc(db, `users/${userId}/bills`, b.id), b));
        localUdhari.forEach(u => batch.set(doc(db, `users/${userId}/udhari`, u.id), u));
        localPaidoff.forEach(p => batch.set(doc(db, `users/${userId}/paidoff`, p.id), p));
        localProducts.forEach(p => batch.set(doc(db, `users/${userId}/products`, p.id), p));
        batch.set(doc(db, `users/${userId}/settings/main`), localSettings);
        await batch.commit();
      }
    } catch (err) {
      console.warn("Sync to Firestore failed:", err);
    }
  }, []);

  // Firestore real-time listeners when logged in
  useEffect(() => {
    // Always cleanup previous listeners first
    cleanupListeners();

    if (!uid) {
      setLoading(false);
      return;
    }

    setLoading(true);
    let cancelled = false;

    syncLocalToFirestore(uid).then(() => {
      if (cancelled) return;

      let loaded = 0;
      const total = 5;
      const checkLoaded = () => { loaded++; if (loaded >= total) { setLoading(false); firestoreActiveRef.current = true; } };

      const unsubs = [
        onSnapshot(collection(db, `users/${uid}/bills`), (snap) => {
          if (cancelled) return;
          const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as CompletedBill)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
          setBills(data);
          checkLoaded();
        }, (error) => {
          console.warn("Bills listener error:", error.message);
          checkLoaded();
        }),
        onSnapshot(collection(db, `users/${uid}/udhari`), (snap) => {
          if (cancelled) return;
          setUdhariEntries(snap.docs.map(d => ({ id: d.id, ...d.data() } as UdhariEntry)));
          checkLoaded();
        }, (error) => {
          console.warn("Udhari listener error:", error.message);
          checkLoaded();
        }),
        onSnapshot(collection(db, `users/${uid}/paidoff`), (snap) => {
          if (cancelled) return;
          setPaidOffCustomers(snap.docs.map(d => ({ id: d.id, ...d.data() } as PaidOffCustomer)));
          checkLoaded();
        }, (error) => {
          console.warn("Paidoff listener error:", error.message);
          checkLoaded();
        }),
        onSnapshot(doc(db, `users/${uid}/settings/main`), (snap) => {
          if (cancelled) return;
          if (snap.exists()) setSettings(snap.data() as ShopSettings);
          checkLoaded();
        }, (error) => {
          console.warn("Settings listener error:", error.message);
          checkLoaded();
        }),
        onSnapshot(collection(db, `users/${uid}/products`), (snap) => {
          if (cancelled) return;
          setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
          checkLoaded();
        }, (error) => {
          console.warn("Products listener error:", error.message);
          checkLoaded();
        }),
      ];

      unsubsRef.current = unsubs;
    }).catch(() => {
      setLoading(false);
    });

    return () => {
      cancelled = true;
      cleanupListeners();
    };
  }, [uid, syncLocalToFirestore, cleanupListeners]);

  const isOnline = !!uid;

  const addBill = async (bill: CompletedBill) => {
    setBills(prev => [bill, ...prev]);
    const currency = localStorage.getItem("smk_currency") || "₹";
    notifyBill(bill.billNo, bill.total, currency);
    if (isOnline) {
      try { await setDoc(doc(db, `users/${uid}/bills`, bill.id), bill); } catch (e) { console.warn("Firestore write failed, saved locally:", e); }
    }
  };

  const confirmBillPayment = async (billId: string) => {
    setBills(prev => prev.map(b => b.id === billId ? { ...b, paymentConfirmed: true } : b));
    if (isOnline) {
      try { await updateDoc(doc(db, `users/${uid}/bills`, billId), { paymentConfirmed: true }); } catch (e) { console.warn(e); }
    }
  };

  const addUdhari = async (entry: UdhariEntry) => {
    const currency = localStorage.getItem("smk_currency") || "₹";
    const entryWithDefaults = { ...entry, totalBilled: entry.totalBilled || entry.amount, payments: entry.payments || [] };
    const existing = udhariEntries.find(e => e.phone === entryWithDefaults.phone && e.name === entryWithDefaults.name);
    if (existing) {
      const updated = { ...existing, amount: existing.amount + entryWithDefaults.amount, totalBilled: existing.totalBilled + entryWithDefaults.amount };
      setUdhariEntries(prev => prev.map(e => e.id === existing.id ? updated : e));
      notifyUdhari(entry.name, entryWithDefaults.amount, currency);
      if (isOnline) {
        try { await updateDoc(doc(db, `users/${uid}/udhari`, existing.id), { amount: updated.amount, totalBilled: updated.totalBilled }); } catch (e) { console.warn(e); }
      }
    } else {
      setUdhariEntries(prev => [...prev, entryWithDefaults]);
      notifyUdhari(entry.name, entryWithDefaults.amount, currency);
      if (isOnline) {
        try { await setDoc(doc(db, `users/${uid}/udhari`, entryWithDefaults.id), entryWithDefaults); } catch (e) { console.warn(e); }
      }
    }
  };

  const payUdhari = async (id: string, amount: number, method: string = "cash", note?: string) => {
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
      setUdhariEntries(prev => prev.filter(e => e.id !== id));
      setPaidOffCustomers(prev => [...prev, paidOff]);
      if (isOnline) {
        try {
          const batch = writeBatch(db);
          batch.delete(doc(db, `users/${uid}/udhari`, id));
          batch.set(doc(db, `users/${uid}/paidoff`, paidOff.id), paidOff);
          await batch.commit();
        } catch (e) { console.warn(e); }
      }
    } else {
      setUdhariEntries(prev => prev.map(e => e.id === id ? { ...e, amount: newAmount, payments: newPayments } : e));
      if (isOnline) {
        try { await updateDoc(doc(db, `users/${uid}/udhari`, id), { amount: newAmount, payments: newPayments }); } catch (e) { console.warn(e); }
      }
    }
  };

  const deleteUdhari = async (id: string) => {
    setUdhariEntries(prev => prev.filter(e => e.id !== id));
    if (isOnline) {
      try { await deleteDoc(doc(db, `users/${uid}/udhari`, id)); } catch (e) { console.warn(e); }
    }
  };

  const deletePaidOff = async (id: string) => {
    setPaidOffCustomers(prev => prev.filter(e => e.id !== id));
    if (isOnline) {
      try { await deleteDoc(doc(db, `users/${uid}/paidoff`, id)); } catch (e) { console.warn(e); }
    }
  };

  const updateSettings = async (s: Partial<ShopSettings>) => {
    const updated = { ...settings, ...s };
    setSettings(updated);
    if (isOnline) {
      try { await setDoc(doc(db, `users/${uid}/settings/main`), updated); } catch (e) { console.warn(e); }
    }
  };

  const addProduct = async (product: Product) => {
    setProducts(prev => [...prev, product]);
    if (isOnline) {
      try { await setDoc(doc(db, `users/${uid}/products`, product.id), product); } catch (e) { console.warn(e); }
    }
  };

  const updateProduct = async (product: Product) => {
    setProducts(prev => prev.map(p => p.id === product.id ? product : p));
    // Check low stock
    const threshold = parseInt(localStorage.getItem("smk_lowstock_threshold") || "10");
    if (product.stock > 0 && product.stock <= threshold) {
      notifyLowStock(product.name, product.stock);
    }
    if (isOnline) {
      try { await setDoc(doc(db, `users/${uid}/products`, product.id), product); } catch (e) { console.warn(e); }
    }
  };

  const deleteProduct = async (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    if (isOnline) {
      try { await deleteDoc(doc(db, `users/${uid}/products`, id)); } catch (e) { console.warn(e); }
    }
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
