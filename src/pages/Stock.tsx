import { useState, useRef } from "react";
import { Plus, Search, Package, X, Eye, Pencil, Trash2, Upload, CheckCircle, Camera, ScanLine } from "lucide-react";
import BarcodeScanner from "@/components/BarcodeScanner";

interface Product {
  id: string;
  name: string;
  costPrice: number;
  sellPrice: number;
  unit: string;
  stock: number;
  expiry: string;
  barcode: string;
  image: string;
}

const initialProducts: Product[] = [
  { id: "1", name: "Tata Salt", costPrice: 18, sellPrice: 22, unit: "kg", stock: 45, expiry: "2026-12-01", barcode: "8901234567890", image: "" },
  { id: "2", name: "Aashirvaad Atta", costPrice: 280, sellPrice: 320, unit: "kg", stock: 12, expiry: "2026-06-15", barcode: "8901234567891", image: "" },
  { id: "3", name: "Fortune Oil", costPrice: 140, sellPrice: 165, unit: "liter", stock: 3, expiry: "2026-03-20", barcode: "8901234567892", image: "" },
  { id: "4", name: "Sugar", costPrice: 38, sellPrice: 45, unit: "kg", stock: 28, expiry: "2027-01-01", barcode: "8901234567893", image: "" },
  { id: "5", name: "Tata Tea", costPrice: 95, sellPrice: 120, unit: "pcs", stock: 0, expiry: "2026-08-10", barcode: "8901234567894", image: "" },
];

const UNITS = ["kg", "gram", "liter", "ml", "pcs"];

const Stock = () => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({ unit: "kg", image: "" });
  const [imageUploadSuccess, setImageUploadSuccess] = useState<string | null>(null);
  const [customUnit, setCustomUnit] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanTarget, setScanTarget] = useState<"search" | "new" | "edit">("search");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.barcode.includes(search)
  );

  const getStatus = (p: Product) => {
    if (p.stock === 0) return { label: "Out", color: "bg-destructive/20 text-destructive", dot: "bg-destructive" };
    if (p.stock <= 5) return { label: "Low", color: "bg-warning/20 text-warning", dot: "bg-warning" };
    const expDate = new Date(p.expiry);
    const now = new Date();
    const diffDays = (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    if (p.expiry && diffDays <= 30 && diffDays > 0) return { label: "Expiring", color: "bg-warning/20 text-warning", dot: "bg-warning" };
    if (p.expiry && diffDays <= 0) return { label: "Expired", color: "bg-destructive/20 text-destructive", dot: "bg-destructive" };
    return { label: "Safe", color: "bg-success/20 text-success", dot: "bg-success" };
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: "new" | "edit") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (target === "new") {
        setNewProduct({ ...newProduct, image: dataUrl });
      } else if (editingProduct) {
        setEditingProduct({ ...editingProduct, image: dataUrl });
      }
      setImageUploadSuccess(dataUrl);
      setTimeout(() => setImageUploadSuccess(null), 2500);
    };
    reader.readAsDataURL(file);
  };

  const handleAdd = () => {
    if (!newProduct.name || !newProduct.sellPrice) return;
    const product: Product = {
      id: Date.now().toString(),
      name: newProduct.name || "",
      costPrice: newProduct.costPrice || 0,
      sellPrice: newProduct.sellPrice || 0,
      unit: newProduct.unit || "pcs",
      stock: newProduct.stock || 0,
      expiry: newProduct.expiry || "",
      barcode: newProduct.barcode || "",
      image: newProduct.image || "",
    };
    setProducts([product, ...products]);
    setNewProduct({ unit: "kg", image: "" });
    setCustomUnit(false);
    setShowAdd(false);
  };

  const handleEdit = () => {
    if (!editingProduct) return;
    setProducts(products.map(p => p.id === editingProduct.id ? editingProduct : p));
    setSelectedProduct(editingProduct);
    setEditingProduct(null);
  };

  const handleDelete = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
    setSelectedProduct(null);
  };

  const handleBarcodeScan = (barcode: string) => {
    setShowScanner(false);
    if (scanTarget === "search") {
      setSearch(barcode);
      // Check if product exists
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

      {/* Search */}
      <div className="glass-card flex items-center gap-2 px-3 py-2.5">
        <Search size={16} className="text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or barcode..."
          className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground w-full outline-none"
        />
        <button onClick={() => openScanner("search")} className="text-primary hover:text-primary/80 transition-colors">
          <ScanLine size={16} />
        </button>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 gap-3">
        {filtered.map((p) => {
          const status = getStatus(p);
          return (
            <div
              key={p.id}
              className="glass-card-hover p-0 overflow-hidden group cursor-pointer"
              onClick={() => setSelectedProduct(p)}
            >
              {/* Product Image */}
              <div className="relative w-full aspect-square bg-secondary/50 flex items-center justify-center overflow-hidden">
                {p.image ? (
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <Package size={36} className="text-muted-foreground/50" />
                )}
                {/* Status Badge */}
                <span className={`absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md ${status.color}`}>
                  {status.label}
                </span>
              </div>
              {/* Info */}
              <div className="p-3 space-y-1">
                <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground">Stock: {p.stock} {p.unit}</p>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-xs font-bold text-primary">₹{p.sellPrice}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedProduct(p); }}
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-lg gradient-primary text-primary-foreground flex items-center gap-1"
                  >
                    <Eye size={10} /> View
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ===== ADD PRODUCT MODAL ===== */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="glass-card w-[92%] max-w-md p-5 animate-slide-up max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-foreground">Add Product</h3>
              <button onClick={() => { setShowAdd(false); setNewProduct({ unit: "kg", image: "" }); setCustomUnit(false); }} className="text-muted-foreground hover:text-foreground transition-colors"><X size={20} /></button>
            </div>

            {/* Image Upload */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="w-full aspect-video rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors mb-4 overflow-hidden bg-secondary/30"
            >
              {newProduct.image ? (
                <img src={newProduct.image} alt="Preview" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <>
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <Camera size={22} className="text-primary" />
                  </div>
                  <p className="text-xs text-muted-foreground">Tap to upload image</p>
                </>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, "new")} />

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
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={(newProduct as any)[field.key] || ""}
                    onChange={e => setNewProduct({ ...newProduct, [field.key]: field.type === "number" ? Number(e.target.value) : e.target.value })}
                    className="w-full glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none focus:ring-1 focus:ring-primary rounded-lg"
                  />
                </div>
              ))}

              {/* Barcode with scan button */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Barcode</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Scan or enter barcode"
                    value={newProduct.barcode || ""}
                    onChange={e => setNewProduct({ ...newProduct, barcode: e.target.value })}
                    className="flex-1 glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none focus:ring-1 focus:ring-primary rounded-lg font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => openScanner("new")}
                    className="gradient-primary text-primary-foreground px-3 py-2.5 rounded-lg flex items-center gap-1 text-xs font-semibold glow-primary"
                  >
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
                      <button
                        key={u}
                        type="button"
                        onClick={() => setNewProduct({ ...newProduct, unit: u })}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${newProduct.unit === u ? "gradient-primary text-primary-foreground glow-primary" : "glass-card text-muted-foreground hover:text-foreground"}`}
                      >
                        {u}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => { setCustomUnit(true); setNewProduct({ ...newProduct, unit: "" }); }}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold glass-card text-muted-foreground hover:text-foreground"
                    >
                      Custom
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter unit..."
                      value={newProduct.unit || ""}
                      onChange={e => setNewProduct({ ...newProduct, unit: e.target.value })}
                      className="flex-1 glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none focus:ring-1 focus:ring-primary rounded-lg"
                    />
                    <button type="button" onClick={() => { setCustomUnit(false); setNewProduct({ ...newProduct, unit: "kg" }); }} className="text-xs text-muted-foreground px-2">Back</button>
                  </div>
                )}
              </div>

              <button onClick={handleAdd} className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm mt-2 glow-primary">
                Add Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== PRODUCT DETAIL MODAL with 3D rotation ===== */}
      {selectedProduct && !editingProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="glass-card w-[92%] max-w-md p-5 animate-slide-up max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-foreground">{selectedProduct.name}</h3>
              <button onClick={() => setSelectedProduct(null)} className="text-muted-foreground hover:text-foreground transition-colors"><X size={20} /></button>
            </div>

            {/* 3D Rotating Image */}
            <div className="flex justify-center mb-5">
              <div className="product-3d-container">
                <div className="product-3d-image">
                  {selectedProduct.image ? (
                    <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover rounded-2xl" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-secondary rounded-2xl">
                      <Package size={48} className="text-muted-foreground/40" />
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Status */}
            {(() => {
              const status = getStatus(selectedProduct);
              return (
                <div className={`flex items-center justify-center gap-2 mb-4 py-2 rounded-xl ${status.color} backdrop-blur-sm`}>
                  <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                  <span className="text-xs font-bold">{status.label}</span>
                </div>
              );
            })()}

            {/* Details Grid */}
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { l: "Cost Price", v: `₹${selectedProduct.costPrice}` },
                { l: "Sell Price", v: `₹${selectedProduct.sellPrice}` },
                { l: "Unit", v: selectedProduct.unit },
                { l: "Stock", v: `${selectedProduct.stock} ${selectedProduct.unit}` },
                { l: "Expiry", v: selectedProduct.expiry || "N/A" },
                { l: "Barcode", v: selectedProduct.barcode || "N/A" },
              ].map(item => (
                <div key={item.l} className="glass-card p-3 rounded-xl">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{item.l}</p>
                  <p className="font-semibold text-foreground mt-0.5">{item.v}</p>
                </div>
              ))}
            </div>

            {/* Profit Info */}
            <div className="glass-card p-3 rounded-xl mt-3 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Profit per unit</span>
              <span className="text-sm font-bold text-success">₹{selectedProduct.sellPrice - selectedProduct.costPrice}</span>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleDelete(selectedProduct.id)}
                className="flex-1 py-2.5 rounded-xl border border-destructive/30 text-destructive text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-destructive/10 transition-colors"
              >
                <Trash2 size={14} /> Delete
              </button>
              <button
                onClick={() => setEditingProduct({ ...selectedProduct })}
                className="flex-1 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-1.5 glow-primary"
              >
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

            {/* Image */}
            <div
              onClick={() => editFileInputRef.current?.click()}
              className="w-full aspect-video rounded-xl border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors mb-4 overflow-hidden bg-secondary/30"
            >
              {editingProduct.image ? (
                <img src={editingProduct.image} alt="Preview" className="w-full h-full object-cover rounded-xl" />
              ) : (
                <>
                  <Upload size={22} className="text-primary" />
                  <p className="text-xs text-muted-foreground">Tap to upload image</p>
                </>
              )}
            </div>
            <input ref={editFileInputRef} type="file" accept="image/*" className="hidden" onChange={e => handleImageUpload(e, "edit")} />

            <div className="space-y-3">
              {[
                { key: "name", label: "Product Name", type: "text" },
                { key: "costPrice", label: "Cost Price (₹)", type: "number" },
                { key: "sellPrice", label: "Sell Price (₹)", type: "number" },
                { key: "stock", label: "Stock Quantity", type: "number" },
                { key: "expiry", label: "Expiry Date", type: "date" },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-xs text-muted-foreground mb-1 block">{field.label}</label>
                  <input
                    type={field.type}
                    value={(editingProduct as any)[field.key] || ""}
                    onChange={e => setEditingProduct({ ...editingProduct, [field.key]: field.type === "number" ? Number(e.target.value) : e.target.value })}
                    className="w-full glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none focus:ring-1 focus:ring-primary rounded-lg"
                  />
                </div>
              ))}

              {/* Barcode with scan button */}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Barcode</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingProduct.barcode || ""}
                    onChange={e => setEditingProduct({ ...editingProduct, barcode: e.target.value })}
                    className="flex-1 glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none focus:ring-1 focus:ring-primary rounded-lg font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => openScanner("edit")}
                    className="gradient-primary text-primary-foreground px-3 py-2.5 rounded-lg flex items-center gap-1 text-xs font-semibold glow-primary"
                  >
                    <ScanLine size={14} /> Scan
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Unit</label>
                <div className="flex flex-wrap gap-2">
                  {UNITS.map(u => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setEditingProduct({ ...editingProduct, unit: u })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${editingProduct.unit === u ? "gradient-primary text-primary-foreground" : "glass-card text-muted-foreground"}`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={handleEdit} className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm mt-2 glow-primary">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== IMAGE UPLOAD SUCCESS POPUP ===== */}
      {imageUploadSuccess && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center" style={{ background: "hsl(220 20% 5% / 0.7)", backdropFilter: "blur(6px)" }}>
          <div className="glass-card p-6 rounded-2xl animate-scale-in flex flex-col items-center gap-4 max-w-xs w-[85%]">
            <div className="w-16 h-16 rounded-full bg-success/20 flex items-center justify-center">
              <CheckCircle size={32} className="text-success" />
            </div>
            <p className="text-sm font-bold text-foreground text-center">Image Uploaded Successfully!</p>
            <div className="w-24 h-24 rounded-xl overflow-hidden border border-border">
              <img src={imageUploadSuccess} alt="Uploaded" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner */}
      <BarcodeScanner
        open={showScanner}
        onClose={() => setShowScanner(false)}
        onScan={handleBarcodeScan}
      />
    </div>
  );
};

export default Stock;
