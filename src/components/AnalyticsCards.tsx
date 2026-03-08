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

  // Check if monthly report is available (at least 1 full month of data)
  const getFirstBillDate = () => {
    if (bills.length === 0) return null;
    const sorted = [...bills].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return new Date(sorted[0].date);
  };
  const firstBillDate = getFirstBillDate();
  const monthlyReportAvailable = (() => {
    if (!firstBillDate || monthlyBills.length === 0) return false;
    const diffMs = now.getTime() - firstBillDate.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);
    return diffDays >= 30;
  })();

  // Generate daily chart data for monthly report
  const getDailyChartData = () => {
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dayBills = monthlyBills.filter(b => new Date(b.date).getDate() === day);
      return { day, sales: dayBills.reduce((s, b) => s + b.total, 0), count: dayBills.length };
    });
  };

  // Generate SVG bar chart for PDF
  const generateSVGChart = (data: { label: string; value: number }[], width = 700, height = 220) => {
    const maxVal = Math.max(...data.map(d => d.value), 1);
    const barWidth = Math.max(8, Math.min(40, (width - 80) / data.length - 4));
    const chartLeft = 60;
    const chartBottom = height - 40;
    const chartTop = 20;
    const chartHeight = chartBottom - chartTop;

    let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#06b6d4"/>
          <stop offset="100%" stop-color="#0891b2"/>
        </linearGradient>
        <linearGradient id="barGrad2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#8b5cf6"/>
          <stop offset="100%" stop-color="#7c3aed"/>
        </linearGradient>
        <filter id="shadow3d">
          <feDropShadow dx="2" dy="3" stdDeviation="2" flood-color="#000" flood-opacity="0.15"/>
        </filter>
        <filter id="glow">
          <feGaussianBlur stdDeviation="3" result="blur"/>
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <rect width="${width}" height="${height}" fill="#fafbfc" rx="12"/>`;

    // Grid lines
    for (let i = 0; i <= 4; i++) {
      const y = chartTop + (chartHeight * i / 4);
      const val = Math.round(maxVal * (4 - i) / 4);
      svg += `<line x1="${chartLeft}" y1="${y}" x2="${width - 20}" y2="${y}" stroke="#e5e7eb" stroke-dasharray="4,4"/>`;
      svg += `<text x="${chartLeft - 8}" y="${y + 4}" text-anchor="end" fill="#9ca3af" font-size="9" font-family="system-ui">${currency}${val >= 1000 ? (val/1000).toFixed(1)+'k' : val}</text>`;
    }

    // Bars with 3D effect
    data.forEach((d, i) => {
      const barH = (d.value / maxVal) * chartHeight;
      const x = chartLeft + i * ((width - 80) / data.length) + ((width - 80) / data.length - barWidth) / 2;
      const y = chartBottom - barH;
      
      // 3D side
      svg += `<path d="M${x + barWidth},${y} L${x + barWidth + 6},${y - 4} L${x + barWidth + 6},${chartBottom - 4} L${x + barWidth},${chartBottom} Z" fill="#0e7490" opacity="0.6"/>`;
      // 3D top
      svg += `<path d="M${x},${y} L${x + 6},${y - 4} L${x + barWidth + 6},${y - 4} L${x + barWidth},${y} Z" fill="#22d3ee" opacity="0.5"/>`;
      // Main bar
      svg += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" fill="url(#barGrad)" rx="2" filter="url(#shadow3d)"/>`;
      // Value on top
      if (d.value > 0) svg += `<text x="${x + barWidth/2}" y="${y - 8}" text-anchor="middle" fill="#0891b2" font-size="8" font-weight="700" font-family="system-ui">${currency}${d.value >= 1000 ? (d.value/1000).toFixed(1)+'k' : d.value}</text>`;
      // Label
      svg += `<text x="${x + barWidth/2}" y="${chartBottom + 14}" text-anchor="middle" fill="#6b7280" font-size="${data.length > 15 ? 7 : 9}" font-family="system-ui" transform="rotate(${data.length > 15 ? -45 : 0}, ${x + barWidth/2}, ${chartBottom + 14})">${d.label}</text>`;
    });

    svg += `</svg>`;
    return svg;
  };

  // Generate pie chart SVG
  const generatePieChart = (segments: { label: string; value: number; color: string }[], size = 200) => {
    const total = segments.reduce((s, seg) => s + seg.value, 0);
    if (total === 0) return '';
    const cx = size / 2, cy = size / 2, r = size * 0.35;
    let currentAngle = -Math.PI / 2;
    let svg = `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <defs><filter id="pieShadow"><feDropShadow dx="1" dy="2" stdDeviation="3" flood-opacity="0.2"/></filter></defs>`;

    segments.forEach(seg => {
      if (seg.value === 0) return;
      const angle = (seg.value / total) * 2 * Math.PI;
      const x1 = cx + r * Math.cos(currentAngle);
      const y1 = cy + r * Math.sin(currentAngle);
      const x2 = cx + r * Math.cos(currentAngle + angle);
      const y2 = cy + r * Math.sin(currentAngle + angle);
      const large = angle > Math.PI ? 1 : 0;
      // 3D offset
      const midAngle = currentAngle + angle / 2;
      const ox = Math.cos(midAngle) * 4;
      const oy = Math.sin(midAngle) * 4;
      svg += `<path d="M${cx + ox},${cy + oy} L${x1 + ox},${y1 + oy} A${r},${r} 0 ${large},1 ${x2 + ox},${y2 + oy} Z" fill="${seg.color}" filter="url(#pieShadow)" opacity="0.9"/>`;
      // Label
      const lx = cx + (r + 30) * Math.cos(midAngle);
      const ly = cy + (r + 30) * Math.sin(midAngle);
      svg += `<text x="${lx}" y="${ly}" text-anchor="middle" fill="#374151" font-size="9" font-weight="600" font-family="system-ui">${seg.label}</text>`;
      svg += `<text x="${lx}" y="${ly + 12}" text-anchor="middle" fill="#6b7280" font-size="8" font-family="system-ui">${((seg.value/total)*100).toFixed(0)}%</text>`;
      currentAngle += angle;
    });
    svg += `</svg>`;
    return svg;
  };

  const generateSalesPDF = (type: "today" | "monthly") => {
    const targetBills = type === "today" ? todayBills : monthlyBills;
    if (targetBills.length === 0) return;

    const dateStr = now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
    const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    const title = type === "today" ? "Today's Sales Report" : `Monthly Sales Report — ${now.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}`;
    const totalAmount = targetBills.reduce((s, b) => s + b.total, 0);
    const cashBills = targetBills.filter(b => b.paymentMode === "cash");
    const upiBills = targetBills.filter(b => b.paymentMode === "upi");
    const udhariBills = targetBills.filter(b => b.paymentMode === "udhari");
    const paidBills = targetBills.filter(b => b.paymentConfirmed);
    const avgBill = totalAmount / (targetBills.length || 1);
    const maxBill = Math.max(...targetBills.map(b => b.total));
    const minBill = Math.min(...targetBills.map(b => b.total));

    // Chart data
    let chartSVG = '';
    if (type === "today") {
      // Hourly breakdown for today
      const hourlyData: { label: string; value: number }[] = [];
      for (let h = 6; h <= 23; h++) {
        const hourBills = todayBills.filter(b => new Date(b.date).getHours() === h);
        const val = hourBills.reduce((s, b) => s + b.total, 0);
        if (val > 0 || (h >= 8 && h <= 21)) {
          hourlyData.push({ label: `${h > 12 ? h - 12 : h}${h >= 12 ? 'PM' : 'AM'}`, value: val });
        }
      }
      chartSVG = generateSVGChart(hourlyData);
    } else {
      // Daily breakdown for monthly
      const dailyData = getDailyChartData();
      chartSVG = generateSVGChart(dailyData.map(d => ({ label: `${d.day}`, value: d.sales })));
    }

    // Pie chart for payment methods
    const pieSVG = generatePieChart([
      { label: `Cash (${cashBills.length})`, value: cashBills.reduce((s, b) => s + b.total, 0), color: "#10b981" },
      { label: `UPI (${upiBills.length})`, value: upiBills.reduce((s, b) => s + b.total, 0), color: "#3b82f6" },
      { label: `Udhari (${udhariBills.length})`, value: udhariBills.reduce((s, b) => s + b.total, 0), color: "#f59e0b" },
    ]);

    // Top products
    const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
    targetBills.forEach(b => b.items.forEach(item => {
      if (!productSales[item.name]) productSales[item.name] = { name: item.name, qty: 0, revenue: 0 };
      productSales[item.name].qty += item.quantity;
      productSales[item.name].revenue += item.money;
    }));
    const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    let html = `<html><head><title>${title}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Inter', system-ui, sans-serif; color: #1f2937; background: #fff; }
      .page { max-width: 800px; margin: 0 auto; padding: 30px; }

      .header { background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%); color: white; padding: 32px; border-radius: 16px; margin-bottom: 24px; position: relative; overflow: hidden; }
      .header::before { content: ''; position: absolute; top: -50%; right: -20%; width: 300px; height: 300px; background: radial-gradient(circle, rgba(6,182,212,0.15) 0%, transparent 70%); }
      .header::after { content: ''; position: absolute; bottom: -30%; left: -10%; width: 200px; height: 200px; background: radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%); }
      .header h1 { font-size: 26px; font-weight: 800; letter-spacing: -0.5px; position: relative; z-index: 1; }
      .header .shop-name { font-size: 15px; font-weight: 600; color: #67e8f9; margin-top: 4px; position: relative; z-index: 1; }
      .header .meta { font-size: 11px; color: #94a3b8; margin-top: 8px; position: relative; z-index: 1; }
      .header .badge { display: inline-block; background: rgba(6,182,212,0.2); border: 1px solid rgba(6,182,212,0.3); padding: 4px 12px; border-radius: 20px; font-size: 10px; color: #67e8f9; font-weight: 600; margin-top: 8px; position: relative; z-index: 1; }

      .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 24px; }
      .kpi-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; text-align: center; position: relative; overflow: hidden; }
      .kpi-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
      .kpi-card.blue::before { background: linear-gradient(90deg, #06b6d4, #3b82f6); }
      .kpi-card.green::before { background: linear-gradient(90deg, #10b981, #34d399); }
      .kpi-card.purple::before { background: linear-gradient(90deg, #8b5cf6, #a78bfa); }
      .kpi-card.orange::before { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
      .kpi-num { font-size: 24px; font-weight: 800; color: #0f172a; }
      .kpi-label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; margin-top: 4px; font-weight: 600; }

      .section { margin-bottom: 24px; }
      .section-title { font-size: 14px; font-weight: 700; color: #0f172a; margin-bottom: 12px; display: flex; align-items: center; gap: 8px; border-bottom: 2px solid #e2e8f0; padding-bottom: 8px; }
      .section-title .icon { font-size: 16px; }

      .chart-container { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 14px; padding: 20px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
      .charts-row { display: grid; grid-template-columns: 1fr auto; gap: 16px; align-items: start; }

      .payment-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 24px; }
      .pay-card { padding: 16px; border-radius: 12px; text-align: center; border: 1px solid; }
      .pay-card.cash { background: linear-gradient(135deg, #ecfdf5, #d1fae5); border-color: #a7f3d0; }
      .pay-card.upi { background: linear-gradient(135deg, #eff6ff, #dbeafe); border-color: #93c5fd; }
      .pay-card.udhari { background: linear-gradient(135deg, #fffbeb, #fef3c7); border-color: #fcd34d; }
      .pay-num { font-size: 18px; font-weight: 800; color: #0f172a; }
      .pay-label { font-size: 9px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; margin-top: 2px; }
      .pay-count { font-size: 11px; color: #94a3b8; margin-top: 4px; }

      .top-products { width: 100%; }
      .top-product-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 14px; border-radius: 10px; margin-bottom: 6px; }
      .top-product-row:nth-child(odd) { background: #f8fafc; }
      .top-product-row .rank { width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 800; color: white; margin-right: 10px; }
      .rank-1 { background: linear-gradient(135deg, #f59e0b, #d97706); }
      .rank-2 { background: linear-gradient(135deg, #94a3b8, #64748b); }
      .rank-3 { background: linear-gradient(135deg, #d97706, #b45309); }
      .rank-default { background: #cbd5e1; }

      table { width: 100%; border-collapse: separate; border-spacing: 0; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; }
      thead th { background: linear-gradient(135deg, #0f172a, #1e293b); color: white; padding: 12px 10px; text-align: left; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 700; }
      tbody td { padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 11px; }
      tbody tr:hover { background: #f0f9ff; }
      tbody tr:last-child td { border-bottom: none; }
      .status-paid { color: #059669; font-weight: 700; background: #ecfdf5; padding: 2px 8px; border-radius: 12px; font-size: 9px; }
      .status-pending { color: #d97706; font-weight: 700; background: #fffbeb; padding: 2px 8px; border-radius: 12px; font-size: 9px; }
      .total-row { background: linear-gradient(135deg, #f0f9ff, #e0f2fe) !important; }
      .total-row td { font-weight: 800; font-size: 14px; padding: 14px 10px; border-top: 2px solid #06b6d4; }

      .stats-mini { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 20px; }
      .stats-mini-card { text-align: center; padding: 12px; background: #fafbfc; border-radius: 10px; border: 1px solid #e5e7eb; }
      .stats-mini-card .val { font-size: 15px; font-weight: 800; color: #0f172a; }
      .stats-mini-card .lbl { font-size: 9px; color: #9ca3af; text-transform: uppercase; margin-top: 2px; }

      .footer { margin-top: 32px; text-align: center; color: #94a3b8; font-size: 10px; border-top: 2px solid #e2e8f0; padding-top: 16px; }
      .footer .brand { font-weight: 700; color: #06b6d4; font-size: 12px; }
      .watermark { position: fixed; bottom: 20px; right: 30px; font-size: 60px; color: rgba(0,0,0,0.02); font-weight: 900; transform: rotate(-15deg); pointer-events: none; }

      @media print { 
        @page { margin: 8mm; size: A4; } 
        .no-print { display: none !important; } 
        body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
      }
    </style></head><body>
    <div class="page">
      <div class="header">
        <h1>📊 ${title}</h1>
        <p class="shop-name">🏪 ${settings.shopName}</p>
        <p class="meta">${settings.shopAddress || ""} ${settings.shopGST ? `• GST: ${settings.shopGST}` : ""}</p>
        <p class="meta">Generated: ${dateStr} at ${timeStr}</p>
        <span class="badge">${type === "today" ? "📅 DAILY REPORT" : "📆 MONTHLY REPORT"}</span>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card blue"><div class="kpi-num">${targetBills.length}</div><div class="kpi-label">Total Bills</div></div>
        <div class="kpi-card green"><div class="kpi-num">${currency}${totalAmount.toLocaleString()}</div><div class="kpi-label">Total Revenue</div></div>
        <div class="kpi-card purple"><div class="kpi-num">${paidBills.length}/${targetBills.length}</div><div class="kpi-label">Paid / Total</div></div>
        <div class="kpi-card orange"><div class="kpi-num">${currency}${avgBill.toFixed(0)}</div><div class="kpi-label">Avg Bill Value</div></div>
      </div>

      <div class="stats-mini">
        <div class="stats-mini-card"><div class="val">${currency}${maxBill.toLocaleString()}</div><div class="lbl">Highest Bill</div></div>
        <div class="stats-mini-card"><div class="val">${currency}${minBill.toLocaleString()}</div><div class="lbl">Lowest Bill</div></div>
        <div class="stats-mini-card"><div class="val">${targetBills.reduce((s, b) => s + b.items.length, 0)}</div><div class="lbl">Total Items Sold</div></div>
      </div>

      <div class="section">
        <div class="section-title"><span class="icon">📈</span> ${type === "today" ? "Hourly Sales Breakdown" : "Daily Sales Trend"}</div>
        <div class="charts-row">
          <div class="chart-container">${chartSVG}</div>
          <div class="chart-container" style="min-width:200px"><p style="font-size:11px;font-weight:700;color:#374151;margin-bottom:8px">Payment Split</p>${pieSVG}</div>
        </div>
      </div>

      <div class="section">
        <div class="section-title"><span class="icon">💳</span> Payment Method Summary</div>
        <div class="payment-grid">
          <div class="pay-card cash"><div class="pay-num">${currency}${cashBills.reduce((s, b) => s + b.total, 0).toLocaleString()}</div><div class="pay-label">Cash</div><div class="pay-count">${cashBills.length} bills</div></div>
          <div class="pay-card upi"><div class="pay-num">${currency}${upiBills.reduce((s, b) => s + b.total, 0).toLocaleString()}</div><div class="pay-label">UPI</div><div class="pay-count">${upiBills.length} bills</div></div>
          <div class="pay-card udhari"><div class="pay-num">${currency}${udhariBills.reduce((s, b) => s + b.total, 0).toLocaleString()}</div><div class="pay-label">Udhari</div><div class="pay-count">${udhariBills.length} bills</div></div>
        </div>
      </div>

      ${topProducts.length > 0 ? `<div class="section">
        <div class="section-title"><span class="icon">🏆</span> Top Selling Products</div>
        <div class="top-products">
          ${topProducts.map((p, i) => `<div class="top-product-row">
            <div style="display:flex;align-items:center">
              <div class="rank ${i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : 'rank-default'}">${i + 1}</div>
              <div><div style="font-size:12px;font-weight:700;color:#0f172a">${p.name}</div><div style="font-size:10px;color:#94a3b8">${p.qty} units sold</div></div>
            </div>
            <div style="font-size:13px;font-weight:800;color:#059669">${currency}${p.revenue.toLocaleString()}</div>
          </div>`).join('')}
        </div>
      </div>` : ''}

      <div class="section">
        <div class="section-title"><span class="icon">📋</span> Transaction Details</div>
        <table>
          <thead><tr><th>#</th><th>Bill No</th><th>Customer</th><th>Items</th><th>Payment</th><th>Amount</th><th>Status</th><th>${type === "monthly" ? "Date" : "Time"}</th></tr></thead>
          <tbody>`;

    targetBills.forEach((b, i) => {
      const bDate = new Date(b.date);
      const timeStr2 = bDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      const dateStr2 = type === "monthly" ? bDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : timeStr2;
      html += `<tr>
        <td style="color:#94a3b8;font-weight:600">${i + 1}</td>
        <td style="font-family:monospace;font-size:10px;color:#475569">${b.billNo.slice(-12)}</td>
        <td style="font-weight:600">${b.customerName || "Walk-in"}</td>
        <td>${b.items.length} items</td>
        <td><span style="text-transform:uppercase;font-size:9px;font-weight:600;padding:2px 6px;border-radius:8px;background:#f1f5f9">${b.paymentMode}${b.upiApp ? ` (${b.upiApp})` : ""}</span></td>
        <td style="font-weight:800;color:#0f172a">${currency}${b.total.toLocaleString()}</td>
        <td><span class="${b.paymentConfirmed ? 'status-paid' : 'status-pending'}">${b.paymentConfirmed ? "✓ PAID" : "⏳ PENDING"}</span></td>
        <td style="color:#64748b">${dateStr2}</td>
      </tr>`;
    });

    html += `<tr class="total-row"><td colspan="5" style="text-align:right;padding-right:16px;color:#0891b2">GRAND TOTAL</td><td colspan="3" style="color:#0891b2;font-size:18px">${currency}${totalAmount.toLocaleString()}</td></tr>`;
    html += `</tbody></table></div>

      <div class="footer">
        <p class="brand">Smart Mudi Khana</p>
        <p style="margin-top:4px">Generated on ${dateStr} at ${timeStr} • Computer-generated report</p>
        <p style="margin-top:2px;font-size:9px">This report is auto-generated and does not require a signature</p>
      </div>

      <div class="watermark">SMK</div>

      <div class="no-print" style="text-align:center;margin-top:24px;display:flex;gap:10px;justify-content:center">
        <button onclick="window.print()" style="padding:12px 32px;font-size:13px;cursor:pointer;border:none;background:linear-gradient(135deg,#06b6d4,#0891b2);color:white;border-radius:10px;font-weight:700">🖨️ Print / Save PDF</button>
        <button onclick="window.close()" style="padding:12px 32px;font-size:13px;cursor:pointer;border:1px solid #e2e8f0;background:white;border-radius:10px;font-weight:600;color:#64748b">✕ Close</button>
      </div>
    </div></body></html>`;

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
                {selectedStat === 1 && (
                  monthlyReportAvailable ? (
                    monthlyBills.length > 0 && (
                      <button onClick={() => generateSalesPDF("monthly")} className="w-full gradient-primary text-primary-foreground py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2">
                        <Download size={14} /> {t("download_monthly_sales")}
                      </button>
                    )
                  ) : (
                    <div className="w-full bg-muted/50 border border-border/50 py-3 rounded-xl text-sm text-center text-muted-foreground">
                      🔒 {t("monthly_pdf_locked") || "Monthly PDF unlocks after 30 days of usage"}
                    </div>
                  )
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
