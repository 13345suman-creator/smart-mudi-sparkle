import { useState } from "react";
import { Plus, Search, Package, X, Eye, Pencil, Trash2, CheckCircle, ScanLine, AlertTriangle, Loader2 } from "lucide-react";
import BarcodeScanner from "@/components/BarcodeScanner";
import { useStore, type Product } from "@/lib/store";
import { useAuth } from "@/lib/auth";
import { useLanguage } from "@/lib/language";
import { toast } from "sonner";

const UNITS = ["kg", "gram", "liter", "ml", "pcs"];

const Stock = () => {
  const { user } = useAuth();
  const { products, addProduct, updateProduct, deleteProduct, loading } = useStore();
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({ unit: "kg", imageUrl: "", lowStockAlert: 5 });
  const [customUnit, setCustomUnit] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanTarget, setScanTarget] = useState<"search" | "new" | "edit">("search");
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode.includes(search)
  );

  const getStatus = (p: Product) => {
    if (p.stock === 0) return { label: "Out", color: "bg-destructive/20 text-destructive", dot: "bg-destructive" };
    if (p.stock <= (p.lowStockAlert || 5)) return { label: "Low", color: "bg-warning/20 text-warning", dot: "bg-warning" };
    const expDate = new Date(p.expiry);
    const now = new Date();
    const diffDays = (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (p.expiry && diffDays <= 30 && diffDays > 0) return { label: "Expiring", color: "bg-warning/20 text-warning", dot: "bg-warning" };
    if (p.expiry && diffDays <= 0) return { label: "Expired", color: "bg-destructive/20 text-destructive", dot: "bg-destructive" };
    return { label: "Safe", color: "bg-success/20 text-success", dot: "bg-success" };
  };

  const handleAdd = async () => {
    if (!newProduct.name || !newProduct.sellPrice) return;
    try {
      const product: Product = {
        id: Date.now().toString(),
        name: newProduct.name || "",
        costPrice: newProduct.costPrice || 0,
        sellPrice: newProduct.sellPrice || 0,
        unit: newProduct.unit || "pcs",
        stock: newProduct.stock || 0,
        lowStockAlert: newProduct.lowStockAlert || 5,
        expiry: newProduct.expiry || "",
        barcode: newProduct.barcode || "",
        imageUrl: "",
      };
      await addProduct(product);
      setNewProduct({ unit: "kg", imageUrl: "", lowStockAlert: 5 });
      setCustomUnit(false);
      setShowAdd(false);
      toast.success("Product added successfully!");
    } catch (err: any) {
      toast.error(err.message || "Failed to add product");
    }
  };

  const handleEdit = async () => {
    if (!editingProduct) return;
    try {
      await updateProduct({ ...editingProduct });
      setSelectedProduct({ ...editingProduct });
      setEditingProduct(null);
      toast.success("Product updated!");
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id);
      setSelectedProduct(null);
      setDeleteConfirm(null);
      toast.success("Product deleted!");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleBarcodeScan = (barcode: string) => {
    setShowScanner(false);
    if (scanTarget === "search") {
      setSearch(barcode);
      const found = products.find(p => p.barcode === barcode);
      if (found) setSelectedProduct(found);
    } else if (scanTarget === "new") {
      setNewProduct({ ...newProduct, barcode });
    } else if (scanTarget === "edit" && editingProduct) {
      setEditingProduct({ ...editingProduct, barcode });
    }
  };

  const openScanner = (target: "search" | "new" | "edit") => {
    setScanTarget(target);
    setShowScanner(true);
  };

  const lowStockItems = products.filter(p => p.stock > 0 && p.stock <= (p.lowStockAlert || 5));
  const outOfStockItems = products.filter(p => p.stock === 0);

  if (loading) {
    return (
      <div className="px-4 flex items-center justify-center py-20">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={24} className="text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-foreground">Stock Management</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => openScanner("search")} className="glass-card p-2 rounded-xl text-primary hover:text-primary/80 transition-colors" title="Scan Barcode">
            <ScanLine size={18} />
          </button>
          <button onClick={() => setShowAdd(true)} className="gradient-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 glow-primary">
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {/* Low Stock Alert Banner */}
      {(lowStockItems.length > 0 || outOfStockItems.length > 0) && (
        <div className="glass-card p-3 border border-warning/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-warning" />
            <p className="text-xs font-bold text-warning">Stock Alerts</p>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {outOfStockItems.map(p => (
              <button key={p.id} onClick={() => setSelectedProduct(p)} className="flex-shrink-0 glass-card px-3 py-2 rounded-xl border border-destructive/20 hover:bg-destructive/5 transition-colors">
                <p className="text-xs font-semibold text-foreground whitespace-nowrap">{p.name}</p>
                <p className="text-[10px] font-bold text-destructive">Out of Stock</p>
              </button>
            ))}
            {lowStockItems.map(p => (
              <button key={p.id} onClick={() => setSelectedProduct(p)} className="flex-shrink-0 glass-card px-3 py-2 rounded-xl border border-warning/20 hover:bg-warning/5 transition-colors">
                <p className="text-xs font-semibold text-foreground whitespace-nowrap">{p.name}</p>
                <p className="text-[10px] font-bold text-warning">{p.stock} {p.unit} left</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search */}
      <div className="glass-card flex items-center gap-2 px-3 py-2.5">
        <Search size={16} className="text-muted-foreground" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or barcode..." className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground w-full outline-none" />
        <button onClick={() => openScanner("search")} className="text-primary hover:text-primary/80 transition-colors">
          <ScanLine size={16} />
        </button>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((p) => {
          const status = getStatus(p);
          return (
            <div key={p.id} className="glass-card-hover p-0 overflow-hidden group cursor-pointer" onClick={() => setSelectedProduct(p)}>
              <div className="relative w-full aspect-square bg-secondary/50 flex items-center justify-center overflow-hidden">
                <Package size={36} className="text-muted-foreground/50" />
                <span className={`absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md ${status.color}`}>
                  {status.label}
                </span>
              </div>
              <div className="p-3 space-y-1">
                <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground">Stock: {p.stock} {p.unit}</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold text-primary">₹{p.sellPrice}</span>
                  <button onClick={(e) => { e.stopPropagation(); setSelectedProduct(p); }} className="text-[10px] font-semibold px-2.5 py-1 rounded-lg gradient-primary text-primary-foreground flex items-center gap-1">
                    <Eye size={10} /> View
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {products.length === 0 && !loading && (
        <div className="glass-card p-8 text-center">
          <Package size={40} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No products yet. Add your first product!</p>
        </div>
      )}

      {/* ===== ADD PRODUCT MODAL ===== */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="glass-card w-[92%] max-w-md p-5 animate-slide-up max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-foreground">Add Product</h3>
              <button onClick={() => { setShowAdd(false); setNewProduct({ unit: "kg", imageUrl: "", lowStockAlert: 5 }); setCustomUnit(false); }} className="text-muted-foreground hover:text-foreground transition-colors"><X size={20} /></button>
            </div>

            <div className="space-y-3">
              {[
                { key: "name", label: "Product Name", type: "text", placeholder: "e.g. Tata Salt" },
                { key: "costPrice", label: "Cost Price (₹)", type: "number", placeholder: "0" },
                { key: "sellPrice", label: "Sell Price (₹)", type: "number", placeholder: "0" },
                { key: "stock", label: "Stock Quantity", type: "number", placeholder: "0" },
                { key: "expiry", label: "Expiry Date", type: "date", placeholder: "" },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-xs text-muted-foreground mb-1 block">{field.label}</label>
                  <input type={field.type} placeholder={field.placeholder} value={(newProduct as any)[field.key] || ""} onChange={e => setNewProduct({ ...newProduct, [field.key]: field.type === "number" ? Number(e.target.value) : e.target.value })} className="w-full glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none focus:ring-1 focus:ring-primary rounded-lg" />
                </div>
              ))}

              {/* Low Stock Alert */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block flex items-center gap-1">
                  <AlertTriangle size={10} className="text-warning" /> Low Stock Alert
                </label>
                <input type="number" placeholder="e.g. 5" value={newProduct.lowStockAlert || ""} onChange={e => setNewProduct({ ...newProduct, lowStockAlert: Number(e.target.value) })} className="w-full glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none focus:ring-1 focus:ring-primary rounded-lg" />
                <p className="text-[10px] text-muted-foreground mt-1">Alert when stock falls below this quantity</p>
              </div>

              {/* Barcode */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Barcode</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="Scan or enter barcode" value={newProduct.barcode || ""} onChange={e => setNewProduct({ ...newProduct, barcode: e.target.value })} className="flex-1 glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none focus:ring-1 focus:ring-primary rounded-lg font-mono" />
                  <button type="button" onClick={() => openScanner("new")} className="gradient-primary text-primary-foreground px-3 py-2.5 rounded-lg flex items-center gap-1 text-xs font-semibold glow-primary">
                    <ScanLine size={14} /> Scan
                  </button>
                </div>
              </div>

              {/* Unit selector */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Unit</label>
                {!customUnit ? (
                  <div className="flex flex-wrap gap-2">
                    {UNITS.map(u => (
                      <button key={u} type="button" onClick={() => setNewProduct({ ...newProduct, unit: u })} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${newProduct.unit === u ? "gradient-primary text-primary-foreground glow-primary" : "glass-card text-muted-foreground hover:text-foreground"}`}>
                        {u}
                      </button>
                    ))}
                    <button type="button" onClick={() => { setCustomUnit(true); setNewProduct({ ...newProduct, unit: "" }); }} className="px-3 py-1.5 rounded-lg text-xs font-semibold glass-card text-muted-foreground hover:text-foreground">
                      Custom
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input type="text" placeholder="Enter unit..." value={newProduct.unit || ""} onChange={e => setNewProduct({ ...newProduct, unit: e.target.value })} className="flex-1 glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none focus:ring-1 focus:ring-primary rounded-lg" />
                    <button type="button" onClick={() => { setCustomUnit(false); setNewProduct({ ...newProduct, unit: "kg" }); }} className="text-xs text-muted-foreground px-2">Back</button>
                  </div>
                )}
              </div>

              <button onClick={handleAdd} className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm mt-2 glow-primary flex items-center justify-center gap-2">
                Add Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== PRODUCT DETAIL MODAL ===== */}
      {selectedProduct && !editingProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="glass-card w-[92%] max-w-md p-5 animate-slide-up max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-foreground">{selectedProduct.name}</h3>
              <button onClick={() => setSelectedProduct(null)} className="text-muted-foreground hover:text-foreground transition-colors"><X size={20} /></button>
            </div>

            <div className="flex justify-center mb-5">
              <div className="w-24 h-24 rounded-2xl bg-secondary/50 flex items-center justify-center">
                <Package size={40} className="text-muted-foreground/40" />
              </div>
            </div>

            {(() => {
              const status = getStatus(selectedProduct);
              return (
                <div className={`flex items-center justify-center gap-2 mb-4 py-2 rounded-xl ${status.color} backdrop-blur-sm`}>
                  <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                  <span className="text-xs font-bold">{status.label}</span>
                </div>
              );
            })()}

            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { l: "Cost Price", v: `₹${selectedProduct.costPrice}` },
                { l: "Sell Price", v: `₹${selectedProduct.sellPrice}` },
                { l: "Unit", v: selectedProduct.unit },
                { l: "Stock", v: `${selectedProduct.stock} ${selectedProduct.unit}` },
                { l: "Low Alert", v: `${selectedProduct.lowStockAlert || 5} ${selectedProduct.unit}` },
                { l: "Expiry", v: selectedProduct.expiry || "N/A" },
                { l: "Barcode", v: selectedProduct.barcode || "N/A" },
              ].map(item => (
                <div key={item.l} className="glass-card p-3 rounded-xl">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.l}</p>
                  <p className="font-semibold text-foreground mt-0.5">{item.v}</p>
                </div>
              ))}
            </div>

            <div className="glass-card p-3 rounded-xl mt-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Profit per unit</span>
              <span className="text-sm font-bold text-[hsl(var(--success))]">₹{selectedProduct.sellPrice - selectedProduct.costPrice}</span>
            </div>

            <div className="flex gap-2 mt-4">
              <button onClick={() => setDeleteConfirm(selectedProduct)} className="flex-1 py-2.5 rounded-xl border border-destructive/30 text-destructive text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-destructive/10 transition-colors">
                <Trash2 size={14} /> Delete
              </button>
              <button onClick={() => { setEditingProduct({ ...selectedProduct }); }} className="flex-1 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-1.5 glow-primary">
                <Pencil size={14} /> Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== EDIT PRODUCT MODAL ===== */}
      {editingProduct && (
        <div className="modal-overlay" onClick={() => setEditingProduct(null)}>
          <div className="glass-card w-[92%] max-w-md p-5 animate-slide-up max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-foreground">Edit Product</h3>
              <button onClick={() => setEditingProduct(null)} className="text-muted-foreground hover:text-foreground transition-colors"><X size={20} /></button>
            </div>

            <div className="space-y-3">
              {[
                { key: "name", label: "Product Name", type: "text" },
                { key: "costPrice", label: "Cost Price (₹)", type: "number" },
                { key: "sellPrice", label: "Sell Price (₹)", type: "number" },
                { key: "stock", label: "Stock Quantity", type: "number" },
                { key: "lowStockAlert", label: "Low Stock Alert", type: "number" },
                { key: "expiry", label: "Expiry Date", type: "date" },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-xs text-muted-foreground mb-1 block">{field.label}</label>
                  <input type={field.type} value={(editingProduct as any)[field.key] || ""} onChange={e => setEditingProduct({ ...editingProduct, [field.key]: field.type === "number" ? Number(e.target.value) : e.target.value })} className="w-full glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none focus:ring-1 focus:ring-primary rounded-lg" />
                </div>
              ))}

              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Barcode</label>
                <div className="flex gap-2">
                  <input type="text" value={editingProduct.barcode || ""} onChange={e => setEditingProduct({ ...editingProduct, barcode: e.target.value })} className="flex-1 glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none focus:ring-1 focus:ring-primary rounded-lg font-mono" />
                  <button type="button" onClick={() => openScanner("edit")} className="gradient-primary text-primary-foreground px-3 py-2.5 rounded-lg flex items-center gap-1 text-xs font-semibold glow-primary">
                    <ScanLine size={14} /> Scan
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Unit</label>
                <div className="flex flex-wrap gap-2">
                  {UNITS.map(u => (
                    <button key={u} type="button" onClick={() => setEditingProduct({ ...editingProduct, unit: u })} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${editingProduct.unit === u ? "gradient-primary text-primary-foreground" : "glass-card text-muted-foreground"}`}>
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleEdit} className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm mt-2 glow-primary flex items-center justify-center gap-2">
                Save Changes
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
              <h3 className="font-display font-bold text-lg text-foreground">Delete Product?</h3>
              <p className="text-sm text-muted-foreground">
                Are you sure you want to delete <span className="font-bold text-foreground">{deleteConfirm.name}</span>? This cannot be undone.
              </p>
              <div className="flex gap-2 w-full mt-2">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-muted/50 text-foreground border border-border">Cancel</button>
                <button onClick={() => handleDelete(deleteConfirm.id)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-destructive text-destructive-foreground">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <BarcodeScanner open={showScanner} onClose={() => setShowScanner(false)} onScan={handleBarcodeScan} />
    </div>
  );
};

export default Stock;
