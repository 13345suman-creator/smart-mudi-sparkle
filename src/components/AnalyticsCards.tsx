import { TrendingUp, Package, IndianRupee, Users, X, Download } from "lucide-react";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useStore } from "@/lib/store";
import { useLanguage } from "@/lib/language";

interface AnalyticsCardsProps {
  todaySales?: number;
  pendingUdhari?: number;
  udhariCustomers?: number;
}

const AnalyticsCards = ({ todaySales = 0, pendingUdhari = 0, udhariCustomers = 0 }: AnalyticsCardsProps) => {
  const [selectedStat, setSelectedStat] = useState<number | null>(null);
  const { bills, products, settings } = useStore();
  const { t } = useLanguage();
  const currency = localStorage.getItem("smk_currency") || "₹";

  // Calculate monthly sales
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const monthlyBills = bills.filter(b => {
    const d = new Date(b.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });
  const monthlySales = monthlyBills.reduce((s, b) => s + b.total, 0);

  // Today's bills
  const todayBills = bills.filter(b => new Date(b.date).toDateString() === now.toDateString());

  // Weekly chart data
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayBills = bills.filter(b => new Date(b.date).toDateString() === d.toDateString());
    return {
      name: weekDays[d.getDay()],
      value: dayBills.reduce((s, b) => s + b.total, 0),
      date: d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
    };
  });

  const stats = [
    { label: t("today_sales"), value: `${currency}${todaySales.toLocaleString()}`, icon: IndianRupee, gradient: "gradient-card-blue", change: `${todayBills.length} bills` },
    { label: t("monthly_sales"), value: `${currency}${monthlySales.toLocaleString()}`, icon: TrendingUp, gradient: "gradient-card-green", change: `${monthlyBills.length} bills` },
    { label: t("total_products"), value: String(products.length), icon: Package, gradient: "gradient-card-orange", change: `${products.filter(p => p.stock <= (p.lowStockAlert || 5)).length} low` },
    { label: t("pending_udhari"), value: `${currency}${pendingUdhari.toLocaleString()}`, icon: Users, gradient: "gradient-card-purple", change: `${udhariCustomers} ${t("customers")}` },
  ];

  const generateSalesPDF = (type: "today" | "monthly") => {
    const targetBills = type === "today" ? todayBills : monthlyBills;
    if (targetBills.length === 0) return;

    const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    const title = type === "today" ? "Today's Sales Report" : `Monthly Sales Report - ${now.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}`;
    const totalAmount = targetBills.reduce((s, b) => s + b.total, 0);
    const cashBills = targetBills.filter(b => b.paymentMode === "cash");
    const upiBills = targetBills.filter(b => b.paymentMode === "upi");
    const udhariBills = targetBills.filter(b => b.paymentMode === "udhari");
    const paidBills = targetBills.filter(b => b.paymentConfirmed);

    let html = `<html><head><title>${title}</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Segoe UI', Tahoma, sans-serif; padding: 30px; color: #1a1a2e; background: #fff; }
      .header { text-align: center; border-bottom: 3px solid #1a1a2e; padding-bottom: 15px; margin-bottom: 20px; }
      .header h1 { font-size: 24px; margin-bottom: 4px; }
      .header .shop { font-size: 14px; color: #333; font-weight: 600; }
      .meta { color: #666; font-size: 11px; margin-top: 4px; }
      .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
      .summary-card { background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 10px; padding: 14px; text-align: center; }
      .summary-card .num { font-size: 22px; font-weight: 800; color: #1a1a2e; }
      .summary-card .lbl { font-size: 10px; color: #666; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; }
      .payment-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
      .pay-card { padding: 10px; border-radius: 8px; text-align: center; }
      .pay-card.cash { background: #d4edda; border: 1px solid #c3e6cb; }
      .pay-card.upi { background: #d1ecf1; border: 1px solid #bee5eb; }
      .pay-card.udhari { background: #fff3cd; border: 1px solid #ffeaa7; }
      .pay-card .num { font-size: 16px; font-weight: 700; }
      .pay-card .lbl { font-size: 9px; color: #555; text-transform: uppercase; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      th { background: #1a1a2e; color: white; padding: 10px 8px; text-align: left; font-size: 11px; text-transform: uppercase; }
      td { padding: 8px; border-bottom: 1px solid #e5e5e5; font-size: 11px; }
      tr:nth-child(even) { background: #f9f9f9; }
      .status-paid { color: #28a745; font-weight: 600; }
      .status-pending { color: #ffc107; font-weight: 600; }
      .footer { margin-top: 30px; text-align: center; color: #999; font-size: 10px; border-top: 1px solid #e5e5e5; padding-top: 15px; }
      .total-row { font-weight: 800; font-size: 13px; background: #f0f9ff !important; }
      @media print { @page { margin: 10mm; } .no-print { display: none; } }
    </style></head><body>
    <div class="header">
      <h1>📊 ${title}</h1>
      <p class="shop">${settings.shopName}</p>
      <p class="meta">${settings.shopAddress || ""} ${settings.shopGST ? `| GST: ${settings.shopGST}` : ""}</p>
      <p class="meta">Generated: ${dateStr} at ${timeStr}</p>
    </div>

    <div class="summary-grid">
      <div class="summary-card"><div class="num">${targetBills.length}</div><div class="lbl">Total Bills</div></div>
      <div class="summary-card"><div class="num">${currency}${totalAmount.toLocaleString()}</div><div class="lbl">Total Revenue</div></div>
      <div class="summary-card"><div class="num">${paidBills.length}</div><div class="lbl">Paid Bills</div></div>
      <div class="summary-card"><div class="num">${currency}${(totalAmount / (targetBills.length || 1)).toFixed(0)}</div><div class="lbl">Avg Bill</div></div>
    </div>

    <div class="payment-summary">
      <div class="pay-card cash"><div class="num">${currency}${cashBills.reduce((s, b) => s + b.total, 0).toLocaleString()}</div><div class="lbl">Cash (${cashBills.length})</div></div>
      <div class="pay-card upi"><div class="num">${currency}${upiBills.reduce((s, b) => s + b.total, 0).toLocaleString()}</div><div class="lbl">UPI (${upiBills.length})</div></div>
      <div class="pay-card udhari"><div class="num">${currency}${udhariBills.reduce((s, b) => s + b.total, 0).toLocaleString()}</div><div class="lbl">Udhari (${udhariBills.length})</div></div>
    </div>

    <table>
      <tr><th>#</th><th>Bill No</th><th>Customer</th><th>Items</th><th>Payment</th><th>Amount</th><th>Status</th><th>Time</th></tr>`;

    targetBills.forEach((b, i) => {
      const bDate = new Date(b.date);
      const timeStr2 = bDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      const dateStr2 = type === "monthly" ? bDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : timeStr2;
      html += `<tr>
        <td>${i + 1}</td>
        <td style="font-family:monospace;font-size:10px">${b.billNo.slice(-12)}</td>
        <td>${b.customerName || "Walk-in"}</td>
        <td>${b.items.length} items</td>
        <td style="text-transform:uppercase;font-size:10px">${b.paymentMode}${b.upiApp ? ` (${b.upiApp})` : ""}</td>
        <td style="font-weight:700">${currency}${b.total.toLocaleString()}</td>
        <td class="${b.paymentConfirmed ? 'status-paid' : 'status-pending'}">${b.paymentConfirmed ? "PAID" : "PENDING"}</td>
        <td>${dateStr2}</td>
      </tr>`;
    });

    html += `<tr class="total-row"><td colspan="5" style="text-align:right;padding-right:12px">GRAND TOTAL</td><td colspan="3" style="font-size:16px">${currency}${totalAmount.toLocaleString()}</td></tr>`;
    html += `</table>
    <div class="footer">
      <p>Generated by Smart Mudi Khana | ${dateStr}</p>
      <p style="margin-top:4px">This is a computer-generated report</p>
    </div>
    <div class="no-print" style="text-align:center;margin-top:20px">
      <button onclick="window.print()" style="padding:10px 30px;font-size:13px;cursor:pointer;border:1px solid #333;background:#f5f5f5;border-radius:6px;margin:0 5px">🖨️ Print</button>
      <button onclick="window.close()" style="padding:10px 30px;font-size:13px;cursor:pointer;border:1px solid #333;background:#f5f5f5;border-radius:6px;margin:0 5px">✕ Close</button>
    </div>
    </body></html>`;

    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
  };

  return (
    <>
      <div className="px-4 grid grid-cols-2 gap-3">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <button key={stat.label} onClick={() => setSelectedStat(i)} className={`glass-card-hover p-4 text-left ${stat.gradient}`} style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-foreground/10 flex items-center justify-center">
                  <Icon size={16} className="text-foreground" />
                </div>
                <span className="text-[10px] text-primary font-semibold">{stat.change}</span>
              </div>
              <p className="text-lg font-bold font-display text-foreground">{stat.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
            </button>
          );
        })}
      </div>

      {selectedStat !== null && (
        <div className="modal-overlay animate-scale-in" onClick={() => setSelectedStat(null)}>
          <div className="glass-card w-[92%] max-w-md p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-display font-bold text-lg text-foreground">{stats[selectedStat].label}</h3>
              <button onClick={() => setSelectedStat(null)} className="text-muted-foreground"><X size={20} /></button>
            </div>
            <p className="text-2xl font-bold gradient-text mb-4">{stats[selectedStat].value}</p>
            
            <div className="h-48 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last7Days}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 15% 20%)" />
                  <XAxis dataKey="name" stroke="hsl(215 15% 55%)" fontSize={11} />
                  <YAxis stroke="hsl(215 15% 55%)" fontSize={11} />
                  <Tooltip 
                    contentStyle={{ background: "hsl(220 20% 12%)", border: "1px solid hsl(220 15% 25%)", borderRadius: "8px", color: "hsl(210 40% 95%)" }}
                    formatter={(value: number) => [`${currency}${value.toLocaleString()}`, "Sales"]}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.date || label}
                  />
                  <Bar dataKey="value" fill="hsl(175 80% 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* PDF Download Buttons */}
            {(selectedStat === 0 || selectedStat === 1) && (
              <div className="space-y-2">
                {selectedStat === 0 && todayBills.length > 0 && (
                  <button onClick={() => generateSalesPDF("today")} className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                    <Download size={14} /> {t("download_today_sales")}
                  </button>
                )}
                {selectedStat === 1 && monthlyBills.length > 0 && (
                  <button onClick={() => generateSalesPDF("monthly")} className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                    <Download size={14} /> {t("download_monthly_sales")}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AnalyticsCards;
