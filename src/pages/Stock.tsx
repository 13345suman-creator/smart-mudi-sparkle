import { useState } from "react";
import { Plus, Search, Package, X, AlertTriangle, CheckCircle } from "lucide-react";

interface Product {
  id: string;
  name: string;
  costPrice: number;
  sellPrice: number;
  unit: string;
  stock: number;
  expiry: string;
  barcode: string;
}

const initialProducts: Product[] = [
  { id: "1", name: "Tata Salt", costPrice: 18, sellPrice: 22, unit: "kg", stock: 45, expiry: "2026-12-01", barcode: "8901234567890" },
  { id: "2", name: "Aashirvaad Atta", costPrice: 280, sellPrice: 320, unit: "kg", stock: 12, expiry: "2026-06-15", barcode: "8901234567891" },
  { id: "3", name: "Fortune Oil", costPrice: 140, sellPrice: 165, unit: "liter", stock: 3, expiry: "2026-03-20", barcode: "8901234567892" },
  { id: "4", name: "Sugar", costPrice: 38, sellPrice: 45, unit: "kg", stock: 28, expiry: "2027-01-01", barcode: "8901234567893" },
  { id: "5", name: "Tata Tea", costPrice: 95, sellPrice: 120, unit: "pcs", stock: 0, expiry: "2026-08-10", barcode: "8901234567894" },
];

const Stock = () => {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({ unit: "kg" });

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const getStatus = (p: Product) => {
    if (p.stock === 0) return { label: "Out", color: "bg-destructive/20 text-destructive" };
    if (p.stock <= 5) return { label: "Low", color: "bg-warning/20 text-warning" };
    return { label: "Safe", color: "bg-success/20 text-success" };
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
    };
    setProducts([product, ...products]);
    setNewProduct({ unit: "kg" });
    setShowAdd(false);
  };

  const handleDelete = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
    setSelectedProduct(null);
  };

  return (
    <div className="px-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-xl font-bold text-foreground">Stock</h1>
        <button onClick={() => setShowAdd(true)} className="gradient-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-1.5 glow-primary">
          <Plus size={16} /> Add
        </button>
      </div>

      {/* Search */}
      <div className="glass-card flex items-center gap-2 px-3 py-2.5">
        <Search size={16} className="text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search products..."
          className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground w-full outline-none"
        />
      </div>

      {/* Product List */}
      <div className="space-y-2">
        {filtered.map((p) => {
          const status = getStatus(p);
          return (
            <button
              key={p.id}
              onClick={() => setSelectedProduct(p)}
              className="glass-card-hover p-3 flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                  <Package size={18} className="text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">₹{p.sellPrice}/{p.unit} · Stock: {p.stock}</p>
                </div>
              </div>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${status.color}`}>
                {status.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Add Product Modal */}
      {showAdd && (
        <div className="modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="glass-card w-[92%] max-w-md p-5 animate-slide-up max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-foreground">Add Product</h3>
              <button onClick={() => setShowAdd(false)} className="text-muted-foreground"><X size={20} /></button>
            </div>
            <div className="space-y-3">
              {[
                { key: "name", label: "Product Name", type: "text" },
                { key: "costPrice", label: "Cost Price (₹)", type: "number" },
                { key: "sellPrice", label: "Sell Price (₹)", type: "number" },
                { key: "stock", label: "Stock Quantity", type: "number" },
                { key: "barcode", label: "Barcode", type: "text" },
                { key: "expiry", label: "Expiry Date", type: "date" },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-xs text-muted-foreground mb-1 block">{field.label}</label>
                  <input
                    type={field.type}
                    value={(newProduct as any)[field.key] || ""}
                    onChange={e => setNewProduct({ ...newProduct, [field.key]: field.type === "number" ? Number(e.target.value) : e.target.value })}
                    className="w-full glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none focus:ring-1 focus:ring-primary rounded-lg"
                  />
                </div>
              ))}
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Unit</label>
                <select
                  value={newProduct.unit}
                  onChange={e => setNewProduct({ ...newProduct, unit: e.target.value })}
                  className="w-full glass-card px-3 py-2.5 text-sm text-foreground bg-transparent outline-none rounded-lg"
                >
                  {["kg", "gram", "liter", "ml", "pcs"].map(u => (
                    <option key={u} value={u} className="bg-card">{u}</option>
                  ))}
                </select>
              </div>
              <button onClick={handleAdd} className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm mt-2">
                Add Product
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
          <div className="glass-card w-[92%] max-w-md p-5 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-foreground">{selectedProduct.name}</h3>
              <button onClick={() => setSelectedProduct(null)} className="text-muted-foreground"><X size={20} /></button>
            </div>
            <div className="w-24 h-24 mx-auto rounded-2xl bg-secondary flex items-center justify-center mb-4" style={{ animation: "float 3s ease-in-out infinite" }}>
              <Package size={40} className="text-muted-foreground" />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { l: "Cost Price", v: `₹${selectedProduct.costPrice}` },
                { l: "Sell Price", v: `₹${selectedProduct.sellPrice}` },
                { l: "Unit", v: selectedProduct.unit },
                { l: "Stock", v: selectedProduct.stock.toString() },
                { l: "Expiry", v: selectedProduct.expiry || "N/A" },
                { l: "Barcode", v: selectedProduct.barcode || "N/A" },
              ].map(item => (
                <div key={item.l} className="glass-card p-2.5 rounded-lg">
                  <p className="text-[10px] text-muted-foreground">{item.l}</p>
                  <p className="font-semibold text-foreground">{item.v}</p>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => handleDelete(selectedProduct.id)}
                className="flex-1 py-2.5 rounded-xl border border-destructive/30 text-destructive text-sm font-semibold"
              >
                Delete
              </button>
              <button className="flex-1 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold">
                Edit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Stock;
