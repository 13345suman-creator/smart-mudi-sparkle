import { useState, useRef, useCallback } from "react";
import { Plus, Search, Package, X, Pencil, Trash2, ScanLine, AlertTriangle, Loader2, ChevronRight, TrendingUp, TrendingDown, BarChart3, Filter, CheckCircle2 } from "lucide-react";
import BarcodeScanner from "@/components/BarcodeScanner";
import { useStore, type Product } from "@/lib/store";
import { useLanguage } from "@/lib/language";
import { toast } from "sonner";

const UNITS = ["kg", "gram", "liter", "ml", "pcs", "pkd"];

const Stock = () => {
  const { products, addProduct, updateProduct, deleteProduct, loading } = useStore();
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({ unit: "kg", imageUrl: "", lowStockAlert: 5 });
  const [customUnit, setCustomUnit] = useState(false);
  const [editCustomUnit, setEditCustomUnit] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanTarget, setScanTarget] = useState<"search" | "new" | "edit">("search");
  const [deleteConfirm, setDeleteConfirm] = useState<Product | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | "low" | "out" | "expiring">("all");
  
  // Selection mode for long-press delete
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggered = useRef(false);

  const getStatus = (p: Product) => {
    if (p.stock === 0) return { label: "Out of Stock", short: "Out", color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20", dot: "bg-destructive" };
    if (p.stock <= (p.lowStockAlert || 5)) return { label: "Low Stock", short: "Low", color: "text-warning", bg: "bg-warning/10", border: "border-warning/20", dot: "bg-warning" };
    const expDate = new Date(p.expiry);
    const now = new Date();
    const diffDays = (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (p.expiry && diffDays <= 0) return { label: "Expired", short: "Expired", color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/20", dot: "bg-destructive" };
    if (p.expiry && diffDays <= 30 && diffDays > 0) return { label: "Expiring Soon", short: "Expiring", color: "text-warning", bg: "bg-warning/10", border: "border-warning/20", dot: "bg-warning" };
    return { label: "In Stock", short: "Safe", color: "text-[hsl(var(--success))]", bg: "bg-[hsl(var(--success))]/10", border: "border-[hsl(var(--success))]/20", dot: "bg-[hsl(var(--success))]" };
  };

  const filtered = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode.includes(search);
    if (!matchSearch) return false;
    if (filterStatus === "all") return true;
    const status = getStatus(p);
    if (filterStatus === "low") return status.short === "Low";
    if (filterStatus === "out") return status.short === "Out";
    if (filterStatus === "expiring") return status.short === "Expiring" || status.short === "Expired";
    return true;
  });

  const totalValue = products.reduce((s, p) => s + p.sellPrice * p.stock, 0);
  const totalCost = products.reduce((s, p) => s + p.costPrice * p.stock, 0);
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock <= (p.lowStockAlert || 5)).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  // Duplicate check
  const isDuplicate = (name: string, barcode: string, excludeId?: string) => {
    return products.some(p => {
      if (excludeId && p.id === excludeId) return false;
      if (name && p.name.toLowerCase().trim() === name.toLowerCase().trim()) return true;
      if (barcode && barcode.length > 3 && p.barcode === barcode) return true;
      return false;
    });
  };

  const handleAdd = async () => {
    if (!newProduct.name || !newProduct.sellPrice || !newProduct.costPrice || !newProduct.stock || newProduct.stock <= 0 || !newProduct.unit) {
      toast.error("Name, Cost Price, Sell Price, Stock & Unit are required!");
      return;
    }
    // Check duplicate
    if (isDuplicate(newProduct.name || "", newProduct.barcode || "")) {
      toast.error("এই নামে বা barcode এ product আগে থেকেই আছে!");
      return;
    }
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
      toast.success("Product added!");
    } catch (err: any) {
      toast.error(err.message || "Failed to add product");
    }
  };

  const handleEdit = async () => {
    if (!editingProduct) return;
    // Check duplicate (exclude self)
    if (isDuplicate(editingProduct.name, editingProduct.barcode, editingProduct.id)) {
      toast.error("এই নামে বা barcode এ অন্য product আগে থেকেই আছে!");
      return;
    }
    try {
      await updateProduct({ ...editingProduct });
      setSelectedProduct({ ...editingProduct });
      setEditingProduct(null);
      setEditCustomUnit(false);
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

  const handleBulkDelete = async () => {
    try {
      const ids = Array.from(selectedIds);
      for (const id of ids) {
        await deleteProduct(id);
      }
      toast.success(`${ids.length} টি product delete হয়েছে!`);
      setSelectedIds(new Set());
      setSelectionMode(false);
      setBulkDeleteConfirm(false);
    } catch {
      toast.error("Failed to delete");
    }
  };

  // Long press handlers
  const handlePointerDown = useCallback((productId: string) => {
    longPressTriggered.current = false;
    longPressTimer.current = setTimeout(() => {
      longPressTriggered.current = true;
      // Vibrate if supported
      if (navigator.vibrate) navigator.vibrate(50);
      setSelectionMode(true);
      setSelectedIds(new Set([productId]));
    }, 800);
  }, []);

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handlePointerLeave = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleProductClick = (p: Product) => {
    if (longPressTriggered.current) return;
    if (selectionMode) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(p.id)) next.delete(p.id);
        else next.add(p.id);
        if (next.size === 0) setSelectionMode(false);
        return next;
      });
    } else {
      setSelectedProduct(p);
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

  // Check if editing unit is custom (not in UNITS list)
  const isEditUnitCustom = editingProduct ? !UNITS.includes(editingProduct.unit) : false;

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
        {selectionMode ? (
          <>
            <div className="flex items-center gap-2">
              <button onClick={() => { setSelectionMode(false); setSelectedIds(new Set()); }} className="text-muted-foreground hover:text-foreground transition-colors">
                <X size={20} />
              </button>
              <span className="font-display text-lg font-bold text-foreground">{selectedIds.size} selected</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  if (selectedIds.size === filtered.length) setSelectedIds(new Set());
                  else setSelectedIds(new Set(filtered.map(p => p.id)));
                }}
                className="text-xs font-semibold text-primary px-3 py-2 rounded-xl glass-card"
              >
                {selectedIds.size === filtered.length ? "Deselect All" : "Select All"}
              </button>
              <button 
                onClick={() => setBulkDeleteConfirm(true)} 
                disabled={selectedIds.size === 0}
                className="bg-destructive text-destructive-foreground px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 disabled:opacity-40"
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <h1 className="font-display text-xl font-bold text-foreground">Stock</h1>
              <p className="text-[10px] text-muted-foreground">{products.length} products</p>
            </div>
            <button onClick={() => setShowAdd(true)} className="gradient-primary text-primary-foreground px-4 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-1.5 glow-primary">
              <Plus size={16} /> Add
            </button>
          </>
        )}
      </div>

      {/* Stats Row */}
      {products.length > 0 && !selectionMode && (
        <div className="grid grid-cols-3 gap-2">
          <div className="glass-card p-3 rounded-xl text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <BarChart3 size={12} className="text-primary" />
            </div>
            <p className="text-sm font-bold text-foreground">₹{totalValue.toLocaleString()}</p>
            <p className="text-[9px] text-muted-foreground">Stock Value</p>
          </div>
          <div className="glass-card p-3 rounded-xl text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingUp size={12} className="text-[hsl(var(--success))]" />
            </div>
            <p className="text-sm font-bold text-foreground">₹{(totalValue - totalCost).toLocaleString()}</p>
            <p className="text-[9px] text-muted-foreground">Potential Profit</p>
          </div>
          <div className="glass-card p-3 rounded-xl text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <TrendingDown size={12} className="text-destructive" />
            </div>
            <p className="text-sm font-bold text-foreground">{lowStockCount + outOfStockCount}</p>
            <p className="text-[9px] text-muted-foreground">Need Restock</p>
          </div>
        </div>
      )}

      {/* Search + Scan */}
      <div className="glass-card flex items-center gap-2 px-3 py-2.5 rounded-xl">
        <Search size={16} className="text-muted-foreground flex-shrink-0" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products..." className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground w-full outline-none" />
        <button onClick={() => openScanner("search")} className="text-primary hover:text-primary/80 transition-colors flex-shrink-0">
          <ScanLine size={16} />
        </button>
      </div>

      {/* Filter Tabs */}
      {!selectionMode && (
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1">
          {([
            { id: "all" as const, label: "All", count: products.length },
            { id: "low" as const, label: "Low Stock", count: lowStockCount },
            { id: "out" as const, label: "Out", count: outOfStockCount },
            { id: "expiring" as const, label: "Expiring", count: products.filter(p => { const d = (new Date(p.expiry).getTime() - Date.now()) / 86400000; return p.expiry && d <= 30; }).length },
          ]).map(tab => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                filterStatus === tab.id
                  ? "gradient-primary text-primary-foreground"
                  : "glass-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${filterStatus === tab.id ? "bg-white/20" : "bg-muted"}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Selection mode hint */}
      {!selectionMode && products.length > 0 && (
        <p className="text-[9px] text-muted-foreground text-center opacity-60">Long press to select & delete multiple</p>
      )}

      {/* Product List */}
      <div className="space-y-2">
        {filtered.map((p) => {
          const status = getStatus(p);
          const profit = p.sellPrice - p.costPrice;
          const isSelected = selectedIds.has(p.id);
          return (
            <div
              key={p.id}
              onPointerDown={() => handlePointerDown(p.id)}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerLeave}
              onContextMenu={e => e.preventDefault()}
              onClick={() => handleProductClick(p)}
              className={`glass-card-hover p-4 flex items-center gap-3 cursor-pointer group select-none transition-all ${
                isSelected ? "ring-2 ring-primary bg-primary/5" : ""
              }`}
            >
              {/* Selection checkbox or Product Icon */}
              {selectionMode ? (
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 transition-all ${
                  isSelected ? "bg-primary" : "glass-card border border-border"
                }`}>
                  {isSelected ? (
                    <CheckCircle2 size={22} className="text-primary-foreground" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30" />
                  )}
                </div>
              ) : (
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${status.bg} border ${status.border}`}>
                  <Package size={20} className={status.color} />
                </div>
              )}
              
              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${status.bg} ${status.color} flex-shrink-0`}>
                    {status.short}
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-muted-foreground">{p.stock} {p.unit}</span>
                  <span className="text-[10px] text-muted-foreground">•</span>
                  <span className="text-xs font-bold text-primary">₹{p.sellPrice}</span>
                  {profit > 0 && (
                    <>
                      <span className="text-[10px] text-muted-foreground">•</span>
                      <span className="text-[10px] text-[hsl(var(--success))] font-medium">+₹{profit}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Arrow */}
              {!selectionMode && (
                <ChevronRight size={16} className="text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && products.length > 0 && (
        <div className="glass-card p-8 text-center">
          <Filter size={32} className="text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No products match your filter</p>
        </div>
      )}

      {products.length === 0 && !loading && (
        <div className="glass-card p-10 text-center">
          <Package size={48} className="text-muted-foreground/20 mx-auto mb-4" />
          <p className="text-sm font-semibold text-foreground mb-1">No products yet</p>
          <p className="text-xs text-muted-foreground mb-4">Add your first product to get started</p>
          <button onClick={() => setShowAdd(true)} className="gradient-primary text-primary-foreground px-6 py-2.5 rounded-xl text-sm font-semibold glow-primary">
            <Plus size={14} className="inline mr-1" /> Add Product
          </button>
        </div>
      )}

      {/* ===== ADD PRODUCT MODAL ===== */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="glass-card w-[92%] max-w-md p-5 animate-slide-up max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-display font-bold text-lg text-foreground">New Product</h3>
              <button onClick={() => { setShowAdd(false); setNewProduct({ unit: "kg", imageUrl: "", lowStockAlert: 5 }); setCustomUnit(false); }} className="text-muted-foreground hover:text-foreground transition-colors"><X size={20} /></button>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">Product Name *</label>
                <input type="text" placeholder="e.g. Tata Salt" value={newProduct.name || ""} onChange={e => setNewProduct({ ...newProduct, name: e.target.value })} className="w-full glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none focus:ring-2 focus:ring-primary/50 rounded-xl" />
              </div>

              {/* Price Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">Cost Price (₹) *</label>
                  <input type="number" placeholder="0" value={newProduct.costPrice || ""} onChange={e => setNewProduct({ ...newProduct, costPrice: Number(e.target.value) })} className="w-full glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none focus:ring-2 focus:ring-primary/50 rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">Sell Price (₹) *</label>
                  <input type="number" placeholder="0" value={newProduct.sellPrice || ""} onChange={e => setNewProduct({ ...newProduct, sellPrice: Number(e.target.value) })} className="w-full glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none focus:ring-2 focus:ring-primary/50 rounded-xl" />
                </div>
              </div>

              {/* Stock & Alert Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">Stock Qty *</label>
                  <input type="number" placeholder="0" value={newProduct.stock || ""} onChange={e => setNewProduct({ ...newProduct, stock: Number(e.target.value) })} className="w-full glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none focus:ring-2 focus:ring-primary/50 rounded-xl" />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 flex items-center gap-1">
                    <AlertTriangle size={10} className="text-warning" /> Low Alert
                  </label>
                  <input type="number" placeholder="5" value={newProduct.lowStockAlert || ""} onChange={e => setNewProduct({ ...newProduct, lowStockAlert: Number(e.target.value) })} className="w-full glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none focus:ring-2 focus:ring-primary/50 rounded-xl" />
                </div>
              </div>

              {/* Expiry */}
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Expiry Date (optional)</label>
                <input type="date" value={newProduct.expiry || ""} onChange={e => setNewProduct({ ...newProduct, expiry: e.target.value })} className="w-full glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none focus:ring-2 focus:ring-primary/50 rounded-xl" />
              </div>

              {/* Barcode */}
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">Barcode</label>
                <div className="flex gap-2">
                  <input type="text" placeholder="Scan or type" value={newProduct.barcode || ""} onChange={e => setNewProduct({ ...newProduct, barcode: e.target.value })} className="flex-1 glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none focus:ring-2 focus:ring-primary/50 rounded-xl font-mono" />
                  <button type="button" onClick={() => openScanner("new")} className="gradient-primary text-primary-foreground px-3 py-2.5 rounded-xl flex items-center gap-1 text-xs font-semibold glow-primary">
                    <ScanLine size={14} />
                  </button>
                </div>
              </div>

              {/* Unit selector */}
              <div>
                <label className="text-xs font-medium text-foreground mb-1.5 block">Unit</label>
                {!customUnit ? (
                  <div className="flex flex-wrap gap-2">
                    {UNITS.map(u => (
                      <button key={u} type="button" onClick={() => setNewProduct({ ...newProduct, unit: u })} className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${newProduct.unit === u ? "gradient-primary text-primary-foreground glow-primary" : "glass-card text-muted-foreground hover:text-foreground"}`}>
                        {u}
                      </button>
                    ))}
                    <button type="button" onClick={() => { setCustomUnit(true); setNewProduct({ ...newProduct, unit: "" }); }} className="px-3 py-2 rounded-xl text-xs font-semibold glass-card text-muted-foreground hover:text-foreground">
                      Other
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input type="text" placeholder="Enter unit..." value={newProduct.unit || ""} onChange={e => setNewProduct({ ...newProduct, unit: e.target.value })} className="flex-1 glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none focus:ring-2 focus:ring-primary/50 rounded-xl" />
                    <button type="button" onClick={() => { setCustomUnit(false); setNewProduct({ ...newProduct, unit: "kg" }); }} className="text-xs text-primary px-3 font-semibold">Back</button>
                  </div>
                )}
              </div>

              <button onClick={handleAdd} className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm mt-1 glow-primary flex items-center justify-center gap-2">
                <Plus size={16} /> Add Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== PRODUCT DETAIL MODAL ===== */}
      {selectedProduct && !editingProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="glass-card w-[92%] max-w-md p-5 animate-slide-up max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getStatus(selectedProduct).bg} border ${getStatus(selectedProduct).border}`}>
                  <Package size={24} className={getStatus(selectedProduct).color} />
                </div>
                <div>
                  <h3 className="font-display font-bold text-lg text-foreground">{selectedProduct.name}</h3>
                  <span className={`text-[10px] font-bold ${getStatus(selectedProduct).color}`}>
                    {getStatus(selectedProduct).label}
                  </span>
                </div>
              </div>
              <button onClick={() => setSelectedProduct(null)} className="text-muted-foreground hover:text-foreground transition-colors"><X size={20} /></button>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { l: "Cost Price", v: `₹${selectedProduct.costPrice}`, icon: "💰" },
                { l: "Sell Price", v: `₹${selectedProduct.sellPrice}`, icon: "🏷️" },
                { l: "Stock", v: `${selectedProduct.stock} ${selectedProduct.unit}`, icon: "📦" },
                { l: "Low Alert", v: `${selectedProduct.lowStockAlert || 5} ${selectedProduct.unit}`, icon: "⚠️" },
                { l: "Expiry", v: selectedProduct.expiry || "N/A", icon: "📅" },
                { l: "Barcode", v: selectedProduct.barcode || "N/A", icon: "📊" },
              ].map(item => (
                <div key={item.l} className="glass-card p-3 rounded-xl">
                  <p className="text-[9px] text-muted-foreground uppercase tracking-wider flex items-center gap-1">{item.icon} {item.l}</p>
                  <p className="font-semibold text-sm text-foreground mt-1 truncate">{item.v}</p>
                </div>
              ))}
            </div>

            {/* Profit Card */}
            <div className="glass-card p-3.5 rounded-xl mt-3 flex items-center justify-between border border-[hsl(var(--success))]/20">
              <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                <TrendingUp size={14} className="text-[hsl(var(--success))]" /> Profit/Unit
              </span>
              <span className="text-sm font-bold text-[hsl(var(--success))]">₹{selectedProduct.sellPrice - selectedProduct.costPrice}</span>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <button onClick={() => setDeleteConfirm(selectedProduct)} className="flex-1 py-2.5 rounded-xl border border-destructive/30 text-destructive text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-destructive/10 transition-colors">
                <Trash2 size={14} /> Delete
              </button>
              <button onClick={() => { setEditingProduct({ ...selectedProduct }); setEditCustomUnit(!UNITS.includes(selectedProduct.unit)); }} className="flex-1 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-1.5 glow-primary">
                <Pencil size={14} /> Edit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== EDIT PRODUCT MODAL ===== */}
      {editingProduct && (
        <div className="modal-overlay" onClick={() => { setEditingProduct(null); setEditCustomUnit(false); }}>
          <div className="glass-card w-[92%] max-w-md animate-slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {/* Compact Header */}
            <div className="px-4 pt-4 pb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pencil size={14} className="text-primary" />
                <h3 className="font-display font-bold text-base text-foreground">Edit Product</h3>
              </div>
              <button onClick={() => { setEditingProduct(null); setEditCustomUnit(false); }} className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><X size={14} /></button>
            </div>

            <div className="px-4 pb-4 space-y-3">
              {/* Name */}
              <input type="text" value={editingProduct.name || ""} onChange={e => setEditingProduct({ ...editingProduct, name: e.target.value })} className="w-full glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none focus:ring-2 focus:ring-primary/50 rounded-xl font-medium" placeholder="Product Name" />

              {/* Price Row - Compact */}
              <div className="grid grid-cols-2 gap-2">
                <div className="glass-card px-3 py-2 rounded-xl">
                  <p className="text-[9px] text-muted-foreground mb-0.5">Cost ₹</p>
                  <input type="number" value={editingProduct.costPrice || ""} onChange={e => setEditingProduct({ ...editingProduct, costPrice: Number(e.target.value) })} className="w-full bg-transparent text-sm font-bold text-foreground outline-none" />
                </div>
                <div className="glass-card px-3 py-2 rounded-xl border border-primary/20">
                  <p className="text-[9px] text-primary mb-0.5">Sell ₹</p>
                  <input type="number" value={editingProduct.sellPrice || ""} onChange={e => setEditingProduct({ ...editingProduct, sellPrice: Number(e.target.value) })} className="w-full bg-transparent text-sm font-bold text-foreground outline-none" />
                </div>
              </div>
              {editingProduct.sellPrice > editingProduct.costPrice && (
                <div className="flex items-center justify-center gap-1 py-1 rounded-lg bg-[hsl(var(--success))]/5">
                  <TrendingUp size={10} className="text-[hsl(var(--success))]" />
                  <span className="text-[10px] font-bold text-[hsl(var(--success))]">Profit: ₹{editingProduct.sellPrice - editingProduct.costPrice}/unit</span>
                </div>
              )}

              {/* Stock - Compact inline */}
              <div className="glass-card px-3 py-2.5 rounded-xl">
                <p className="text-[9px] text-muted-foreground mb-1.5">📦 Stock</p>
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => setEditingProduct({ ...editingProduct, stock: Math.max(0, (editingProduct.stock || 0) - 1) })} className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center text-sm font-bold text-destructive active:scale-95">−</button>
                  <input type="number" value={editingProduct.stock || ""} onChange={e => setEditingProduct({ ...editingProduct, stock: Number(e.target.value) })} className="flex-1 text-center text-lg font-display font-black text-foreground bg-transparent outline-none" />
                  <button type="button" onClick={() => setEditingProduct({ ...editingProduct, stock: (editingProduct.stock || 0) + 1 })} className="w-8 h-8 rounded-lg bg-[hsl(var(--success))]/10 flex items-center justify-center text-sm font-bold text-[hsl(var(--success))] active:scale-95">+</button>
                </div>
                <div className="grid grid-cols-6 gap-1 mt-2 pt-2 border-t border-border/30">
                  {[-10, -5, -1, 1, 5, 10].map(v => (
                    <button key={v} type="button" onClick={() => setEditingProduct({ ...editingProduct, stock: Math.max(0, (editingProduct.stock || 0) + v) })} className={`py-1 rounded text-[10px] font-bold active:scale-95 ${v > 0 ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]" : "bg-destructive/10 text-destructive"}`}>
                      {v > 0 ? `+${v}` : v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Low Alert - Inline compact */}
              <div className="glass-card px-3 py-2.5 rounded-xl flex items-center gap-2">
                <AlertTriangle size={12} className="text-warning flex-shrink-0" />
                <span className="text-[10px] text-muted-foreground flex-shrink-0">Low Alert</span>
                <div className="flex items-center gap-1.5 ml-auto">
                  <button type="button" onClick={() => setEditingProduct({ ...editingProduct, lowStockAlert: Math.max(0, (editingProduct.lowStockAlert || 0) - 1) })} className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center text-xs font-bold text-foreground">−</button>
                  <input type="number" value={editingProduct.lowStockAlert || ""} onChange={e => setEditingProduct({ ...editingProduct, lowStockAlert: Number(e.target.value) })} className="w-12 text-center text-sm font-bold text-foreground bg-transparent outline-none" />
                  <button type="button" onClick={() => setEditingProduct({ ...editingProduct, lowStockAlert: (editingProduct.lowStockAlert || 0) + 1 })} className="w-7 h-7 rounded-lg bg-muted/50 flex items-center justify-center text-xs font-bold text-foreground">+</button>
                </div>
              </div>

              {/* Unit - Compact chips */}
              <div>
                <p className="text-[9px] text-muted-foreground mb-1.5">📏 Unit</p>
                {!editCustomUnit ? (
                  <div className="flex flex-wrap gap-1.5">
                    {UNITS.map(u => (
                      <button key={u} type="button" onClick={() => setEditingProduct({ ...editingProduct, unit: u })} className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${editingProduct.unit === u ? "gradient-primary text-primary-foreground" : "glass-card text-muted-foreground"}`}>
                        {u}
                      </button>
                    ))}
                    <button type="button" onClick={() => { setEditCustomUnit(true); setEditingProduct({ ...editingProduct, unit: "" }); }} className="px-3 py-1.5 rounded-lg text-[11px] font-semibold glass-card text-muted-foreground border border-dashed border-muted-foreground/30">
                      Other
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input type="text" placeholder="Custom unit..." value={editingProduct.unit || ""} onChange={e => setEditingProduct({ ...editingProduct, unit: e.target.value })} className="flex-1 glass-card px-3 py-2 text-sm text-foreground bg-transparent outline-none focus:ring-2 focus:ring-primary/50 rounded-xl" autoFocus />
                    <button type="button" onClick={() => { setEditCustomUnit(false); setEditingProduct({ ...editingProduct, unit: "kg" }); }} className="text-[11px] text-primary px-2 font-semibold">Back</button>
                  </div>
                )}
              </div>

              {/* Expiry & Barcode - Compact */}
              <div className="grid grid-cols-2 gap-2">
                <div className="glass-card px-3 py-2 rounded-xl">
                  <p className="text-[9px] text-muted-foreground mb-0.5">📅 Expiry</p>
                  <input type="date" value={editingProduct.expiry || ""} onChange={e => setEditingProduct({ ...editingProduct, expiry: e.target.value })} className="w-full bg-transparent text-xs text-foreground outline-none" />
                </div>
                <div className="glass-card px-3 py-2 rounded-xl">
                  <p className="text-[9px] text-muted-foreground mb-0.5">📊 Barcode</p>
                  <div className="flex items-center gap-1">
                    <input type="text" value={editingProduct.barcode || ""} onChange={e => setEditingProduct({ ...editingProduct, barcode: e.target.value })} className="w-full bg-transparent text-xs text-foreground outline-none font-mono" placeholder="—" />
                    <button type="button" onClick={() => openScanner("edit")} className="text-primary flex-shrink-0"><ScanLine size={14} /></button>
                  </div>
                </div>
              </div>

              {/* Save */}
              <button onClick={handleEdit} className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm glow-primary flex items-center justify-center gap-2 active:scale-[0.98] transition-transform">
                <CheckCircle2 size={16} /> Save Changes
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
                <span className="font-bold text-foreground">{deleteConfirm.name}</span> permanently delete হবে
              </p>
              <div className="flex gap-2 w-full mt-2">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold glass-card text-foreground">Cancel</button>
                <button onClick={() => handleDelete(deleteConfirm.id)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-destructive text-destructive-foreground">Delete</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {bulkDeleteConfirm && (
        <div className="modal-overlay" style={{ zIndex: 200 }} onClick={() => setBulkDeleteConfirm(false)}>
          <div className="glass-card w-[85%] max-w-sm p-5 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex flex-col items-center text-center gap-3">
              <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle size={28} className="text-destructive" />
              </div>
              <h3 className="font-display font-bold text-lg text-foreground">Delete {selectedIds.size} Products?</h3>
              <p className="text-sm text-muted-foreground">
                Selected {selectedIds.size} টি product permanently delete হবে। এটি undo করা যাবে না।
              </p>
              <div className="flex gap-2 w-full mt-2">
                <button onClick={() => setBulkDeleteConfirm(false)} className="flex-1 py-2.5 rounded-xl text-sm font-semibold glass-card text-foreground">Cancel</button>
                <button onClick={handleBulkDelete} className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-destructive text-destructive-foreground">Delete All</button>
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
