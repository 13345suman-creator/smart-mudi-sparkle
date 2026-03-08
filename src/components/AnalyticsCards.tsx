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

  // Check if monthly report is available (last 3 days of month)
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const currentDay = now.getDate();
  const isMonthEnd = currentDay >= daysInCurrentMonth - 2; // Last 3 days
  const monthlyReportAvailable = isMonthEnd && monthlyBills.length > 0;

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

    const dateStr = now.toLocaleDateString("en-IN", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
    const timeStr = now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    const title = type === "today" ? "Daily Sales Report" : `Monthly Sales Report — ${now.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}`;
    const totalAmount = targetBills.reduce((s, b) => s + b.total, 0);
    const cashBills = targetBills.filter(b => b.paymentMode === "cash");
    const upiBills = targetBills.filter(b => b.paymentMode === "upi");
    const udhariBills = targetBills.filter(b => b.paymentMode === "udhari");
    const paidBills = targetBills.filter(b => b.paymentConfirmed);
    const avgBill = totalAmount / (targetBills.length || 1);
    const maxBill = Math.max(...targetBills.map(b => b.total));
    const minBill = Math.min(...targetBills.map(b => b.total));
    const totalItemsSold = targetBills.reduce((s, b) => s + b.items.length, 0);
    const cashTotal = cashBills.reduce((s, b) => s + b.total, 0);
    const upiTotal = upiBills.reduce((s, b) => s + b.total, 0);
    const udhariTotal = udhariBills.reduce((s, b) => s + b.total, 0);
    const paidPercentage = targetBills.length > 0 ? ((paidBills.length / targetBills.length) * 100).toFixed(0) : "0";

    // Peak hour analysis for today
    const hourlyBreakdown: { hour: number; sales: number; count: number }[] = [];
    for (let h = 0; h < 24; h++) {
      const hourBills = targetBills.filter(b => new Date(b.date).getHours() === h);
      if (hourBills.length > 0) {
        hourlyBreakdown.push({ hour: h, sales: hourBills.reduce((s, b) => s + b.total, 0), count: hourBills.length });
      }
    }
    const peakHour = hourlyBreakdown.sort((a, b) => b.sales - a.sales)[0];
    const peakHourLabel = peakHour ? `${peakHour.hour > 12 ? peakHour.hour - 12 : peakHour.hour}:00 ${peakHour.hour >= 12 ? 'PM' : 'AM'}` : "N/A";

    // Chart data
    let chartSVG = '';
    if (type === "today") {
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
      const dailyData = getDailyChartData();
      chartSVG = generateSVGChart(dailyData.map(d => ({ label: `${d.day}`, value: d.sales })));
    }

    const pieSVG = generatePieChart([
      { label: `Cash (${cashBills.length})`, value: cashTotal, color: "#10b981" },
      { label: `UPI (${upiBills.length})`, value: upiTotal, color: "#3b82f6" },
      { label: `Udhari (${udhariBills.length})`, value: udhariTotal, color: "#f59e0b" },
    ]);

    // Top products
    const productSales: Record<string, { name: string; qty: number; revenue: number }> = {};
    targetBills.forEach(b => b.items.forEach(item => {
      if (!productSales[item.name]) productSales[item.name] = { name: item.name, qty: 0, revenue: 0 };
      productSales[item.name].qty += item.quantity;
      productSales[item.name].revenue += item.money;
    }));
    const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 10);

    // Unique customers
    const uniqueCustomers = new Set(targetBills.map(b => b.customerName || "Walk-in")).size;

    // Revenue progress bar segments
    const revenueSegments = [
      { label: "Cash", pct: totalAmount > 0 ? (cashTotal / totalAmount * 100) : 0, color: "#10b981" },
      { label: "UPI", pct: totalAmount > 0 ? (upiTotal / totalAmount * 100) : 0, color: "#3b82f6" },
      { label: "Udhari", pct: totalAmount > 0 ? (udhariTotal / totalAmount * 100) : 0, color: "#f59e0b" },
    ];

    let html = `<html><head><title>${title} - ${settings.shopName}</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&display=swap');
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #1a1a2e; background: #f0f2f5; }
      .page { max-width: 850px; margin: 0 auto; padding: 24px; }

      /* Premium Header */
      .header { background: linear-gradient(145deg, #0a0a1a 0%, #1a1a3e 40%, #0d2847 70%, #0a3d62 100%); color: white; padding: 40px 36px; border-radius: 20px; margin-bottom: 20px; position: relative; overflow: hidden; box-shadow: 0 20px 60px rgba(10,10,26,0.4); }
      .header::before { content: ''; position: absolute; top: -100px; right: -80px; width: 350px; height: 350px; background: radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 65%); }
      .header::after { content: ''; position: absolute; bottom: -80px; left: -60px; width: 250px; height: 250px; background: radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 65%); }
      .header-inner { position: relative; z-index: 2; }
      .header-top { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
      .header h1 { font-size: 28px; font-weight: 900; letter-spacing: -1px; line-height: 1.1; background: linear-gradient(135deg, #ffffff 0%, #a5f3fc 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      .header .subtitle { font-size: 13px; color: #67e8f9; margin-top: 6px; font-weight: 600; letter-spacing: 0.5px; }
      .header .shop-info { text-align: right; }
      .header .shop-name { font-size: 18px; font-weight: 800; color: #e0f2fe; }
      .header .shop-details { font-size: 10px; color: #94a3b8; margin-top: 4px; line-height: 1.6; }
      .header-badges { display: flex; gap: 8px; margin-top: 16px; flex-wrap: wrap; }
      .header .badge { display: inline-flex; align-items: center; gap: 4px; background: rgba(6,182,212,0.15); border: 1px solid rgba(6,182,212,0.25); padding: 5px 14px; border-radius: 20px; font-size: 10px; color: #67e8f9; font-weight: 700; letter-spacing: 0.3px; text-transform: uppercase; }
      .header .badge-accent { background: rgba(139,92,246,0.15); border-color: rgba(139,92,246,0.25); color: #c4b5fd; }
      .divider-glow { height: 3px; background: linear-gradient(90deg, transparent, #06b6d4, #8b5cf6, transparent); border-radius: 2px; margin: 0 0 20px; opacity: 0.6; }

      /* Revenue Hero */
      .revenue-hero { background: linear-gradient(135deg, #ffffff, #f8fafc); border: 1px solid #e2e8f0; border-radius: 18px; padding: 28px 32px; margin-bottom: 20px; text-align: center; position: relative; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
      .revenue-hero::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: linear-gradient(90deg, #06b6d4, #3b82f6, #8b5cf6, #f59e0b); }
      .revenue-hero .label { font-size: 11px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1.5px; font-weight: 700; }
      .revenue-hero .amount { font-size: 48px; font-weight: 900; background: linear-gradient(135deg, #0f172a, #1e40af); -webkit-background-clip: text; -webkit-text-fill-color: transparent; margin: 8px 0; letter-spacing: -2px; font-family: 'JetBrains Mono', monospace; }
      .revenue-hero .sub { font-size: 12px; color: #64748b; }
      .revenue-bar { display: flex; height: 8px; border-radius: 4px; overflow: hidden; margin-top: 16px; background: #e2e8f0; }
      .revenue-bar-seg { height: 100%; transition: width 0.3s; }

      /* KPI Grid */
      .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 20px; }
      .kpi-card { background: #ffffff; border: 1px solid #e8ecf1; border-radius: 16px; padding: 20px 16px; text-align: center; position: relative; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
      .kpi-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; }
      .kpi-card.emerald::before { background: linear-gradient(90deg, #10b981, #34d399); }
      .kpi-card.sky::before { background: linear-gradient(90deg, #06b6d4, #22d3ee); }
      .kpi-card.violet::before { background: linear-gradient(90deg, #8b5cf6, #a78bfa); }
      .kpi-card.amber::before { background: linear-gradient(90deg, #f59e0b, #fbbf24); }
      .kpi-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; margin: 0 auto 10px; font-size: 16px; }
      .kpi-card.emerald .kpi-icon { background: linear-gradient(135deg, #ecfdf5, #d1fae5); }
      .kpi-card.sky .kpi-icon { background: linear-gradient(135deg, #ecfeff, #cffafe); }
      .kpi-card.violet .kpi-icon { background: linear-gradient(135deg, #f5f3ff, #ede9fe); }
      .kpi-card.amber .kpi-icon { background: linear-gradient(135deg, #fffbeb, #fef3c7); }
      .kpi-num { font-size: 22px; font-weight: 900; color: #0f172a; font-family: 'JetBrains Mono', monospace; letter-spacing: -0.5px; }
      .kpi-label { font-size: 9px; color: #94a3b8; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; font-weight: 700; }

      /* Sections */
      .section { margin-bottom: 20px; }
      .section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; }
      .section-icon { width: 32px; height: 32px; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 14px; }
      .section-title { font-size: 15px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px; }
      .section-line { flex: 1; height: 1px; background: linear-gradient(90deg, #e2e8f0, transparent); }

      /* Charts */
      .chart-wrapper { background: #ffffff; border: 1px solid #e8ecf1; border-radius: 16px; padding: 24px; box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
      .charts-grid { display: grid; grid-template-columns: 1fr 240px; gap: 16px; align-items: start; }

      /* Payment Cards */
      .payment-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
      .pay-card { padding: 20px 16px; border-radius: 14px; text-align: center; border: 1px solid; position: relative; overflow: hidden; }
      .pay-card::after { content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 40%; opacity: 0.05; }
      .pay-card.cash { background: linear-gradient(160deg, #ecfdf5, #d1fae5); border-color: #a7f3d0; }
      .pay-card.cash::after { background: linear-gradient(to top, #10b981, transparent); }
      .pay-card.upi { background: linear-gradient(160deg, #eff6ff, #dbeafe); border-color: #93c5fd; }
      .pay-card.upi::after { background: linear-gradient(to top, #3b82f6, transparent); }
      .pay-card.udhari { background: linear-gradient(160deg, #fffbeb, #fef3c7); border-color: #fcd34d; }
      .pay-card.udhari::after { background: linear-gradient(to top, #f59e0b, transparent); }
      .pay-emoji { font-size: 24px; margin-bottom: 8px; }
      .pay-amount { font-size: 20px; font-weight: 900; color: #0f172a; font-family: 'JetBrains Mono', monospace; }
      .pay-label { font-size: 10px; color: #64748b; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 700; margin-top: 4px; }
      .pay-meta { font-size: 11px; color: #94a3b8; margin-top: 6px; }
      .pay-pct { font-size: 18px; font-weight: 800; margin-top: 4px; }
      .pay-card.cash .pay-pct { color: #059669; }
      .pay-card.upi .pay-pct { color: #2563eb; }
      .pay-card.udhari .pay-pct { color: #d97706; }

      /* Insights */
      .insights-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 20px; }
      .insight-card { background: #ffffff; border: 1px solid #e8ecf1; border-radius: 14px; padding: 18px; text-align: center; box-shadow: 0 2px 6px rgba(0,0,0,0.02); }
      .insight-emoji { font-size: 20px; margin-bottom: 6px; }
      .insight-val { font-size: 18px; font-weight: 900; color: #0f172a; font-family: 'JetBrains Mono', monospace; }
      .insight-label { font-size: 9px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.8px; font-weight: 600; margin-top: 3px; }

      /* Top Products */
      .top-product-item { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-radius: 12px; margin-bottom: 6px; border: 1px solid transparent; transition: all 0.2s; }
      .top-product-item:nth-child(odd) { background: #fafbfc; }
      .top-product-item:nth-child(1) { background: linear-gradient(135deg, #fffbeb, #fef3c7); border-color: #fde68a; }
      .top-product-item:nth-child(2) { background: linear-gradient(135deg, #f8fafc, #f1f5f9); border-color: #e2e8f0; }
      .top-product-item:nth-child(3) { background: linear-gradient(135deg, #fef7ee, #fed7aa50); border-color: #fdba7440; }
      .medal { width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 900; color: white; margin-right: 12px; flex-shrink: 0; }
      .medal-1 { background: linear-gradient(135deg, #f59e0b, #d97706); box-shadow: 0 2px 8px rgba(245,158,11,0.4); }
      .medal-2 { background: linear-gradient(135deg, #94a3b8, #64748b); box-shadow: 0 2px 8px rgba(148,163,184,0.4); }
      .medal-3 { background: linear-gradient(135deg, #d97706, #92400e); box-shadow: 0 2px 8px rgba(217,119,6,0.3); }
      .medal-def { background: #cbd5e1; }
      .prod-name { font-size: 13px; font-weight: 700; color: #0f172a; }
      .prod-qty { font-size: 10px; color: #94a3b8; margin-top: 1px; }
      .prod-rev { font-size: 14px; font-weight: 900; color: #059669; font-family: 'JetBrains Mono', monospace; }

      /* Table */
      table { width: 100%; border-collapse: separate; border-spacing: 0; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 2px 8px rgba(0,0,0,0.03); }
      thead th { background: linear-gradient(145deg, #0a0a1a, #1a1a3e); color: white; padding: 14px 12px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; font-weight: 800; }
      tbody td { padding: 11px 12px; border-bottom: 1px solid #f1f5f9; font-size: 11px; color: #374151; }
      tbody tr:hover { background: #f0f9ff; }
      tbody tr:last-child td { border-bottom: none; }
      .bill-no { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #64748b; font-weight: 500; }
      .status-chip { display: inline-flex; align-items: center; gap: 3px; padding: 3px 10px; border-radius: 20px; font-size: 9px; font-weight: 700; letter-spacing: 0.3px; }
      .status-paid { background: linear-gradient(135deg, #ecfdf5, #d1fae5); color: #059669; border: 1px solid #a7f3d0; }
      .status-pending { background: linear-gradient(135deg, #fffbeb, #fef3c7); color: #d97706; border: 1px solid #fcd34d; }
      .payment-chip { display: inline-block; text-transform: uppercase; font-size: 8px; font-weight: 700; padding: 3px 8px; border-radius: 8px; background: #f1f5f9; color: #475569; letter-spacing: 0.5px; }
      .amount-cell { font-weight: 900; color: #0f172a; font-family: 'JetBrains Mono', monospace; font-size: 12px; }
      .total-row { background: linear-gradient(135deg, #ecfeff, #cffafe) !important; }
      .total-row td { font-weight: 900; font-size: 15px; padding: 16px 12px; border-top: 2px solid #06b6d4; color: #0891b2; }

      /* Footer */
      .footer { margin-top: 30px; text-align: center; padding: 24px; border-radius: 16px; background: linear-gradient(135deg, #f8fafc, #f1f5f9); border: 1px solid #e2e8f0; }
      .footer .brand { font-weight: 900; font-size: 14px; background: linear-gradient(135deg, #06b6d4, #3b82f6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; letter-spacing: -0.3px; }
      .footer .gen-info { font-size: 10px; color: #94a3b8; margin-top: 6px; line-height: 1.6; }
      .footer .confidential { display: inline-block; margin-top: 10px; font-size: 8px; color: #cbd5e1; text-transform: uppercase; letter-spacing: 2px; font-weight: 700; border: 1px solid #e2e8f0; padding: 4px 14px; border-radius: 20px; }

      .watermark { position: fixed; bottom: 30px; right: 40px; font-size: 80px; color: rgba(0,0,0,0.015); font-weight: 900; transform: rotate(-12deg); pointer-events: none; letter-spacing: -4px; }

      @media print { 
        @page { margin: 6mm; size: A4; } 
        .no-print { display: none !important; } 
        body { print-color-adjust: exact; -webkit-print-color-adjust: exact; background: #fff; }
        .page { padding: 0; }
      }
    </style></head><body>
    <div class="page">
      <!-- Header -->
      <div class="header">
        <div class="header-inner">
          <div class="header-top">
            <div>
              <h1>📊 ${title}</h1>
              <p class="subtitle">${type === "today" ? "Real-time Daily Performance Analytics" : "Comprehensive Monthly Business Overview"}</p>
            </div>
            <div class="shop-info">
              <div class="shop-name">🏪 ${settings.shopName}</div>
              <div class="shop-details">
                ${settings.shopAddress ? `📍 ${settings.shopAddress}<br/>` : ""}
                ${settings.shopGST ? `🏛️ GST: ${settings.shopGST}<br/>` : ""}
                📅 ${dateStr}
              </div>
            </div>
          </div>
          <div class="header-badges">
            <span class="badge">📋 Report ID: RPT-${Date.now().toString(36).toUpperCase()}</span>
            <span class="badge badge-accent">⏰ Generated: ${timeStr}</span>
            <span class="badge">${type === "today" ? "📅 DAILY" : "📆 MONTHLY"} REPORT</span>
          </div>
        </div>
      </div>
      <div class="divider-glow"></div>

      <!-- Revenue Hero -->
      <div class="revenue-hero">
        <div class="label">Total Revenue ${type === "today" ? "Today" : "This Month"}</div>
        <div class="amount">${currency}${totalAmount.toLocaleString()}</div>
        <div class="sub">${targetBills.length} transactions • ${totalItemsSold} items sold • ${uniqueCustomers} customers</div>
        <div class="revenue-bar">
          ${revenueSegments.map(s => `<div class="revenue-bar-seg" style="width:${s.pct}%;background:${s.color}"></div>`).join('')}
        </div>
        <div style="display:flex;justify-content:center;gap:20px;margin-top:8px">
          ${revenueSegments.map(s => `<span style="font-size:9px;color:#64748b;display:flex;align-items:center;gap:4px"><span style="width:8px;height:8px;border-radius:50%;background:${s.color};display:inline-block"></span>${s.label} ${s.pct.toFixed(0)}%</span>`).join('')}
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card emerald">
          <div class="kpi-icon">💰</div>
          <div class="kpi-num">${targetBills.length}</div>
          <div class="kpi-label">Total Bills</div>
        </div>
        <div class="kpi-card sky">
          <div class="kpi-icon">📊</div>
          <div class="kpi-num">${currency}${avgBill.toFixed(0)}</div>
          <div class="kpi-label">Avg Bill Value</div>
        </div>
        <div class="kpi-card violet">
          <div class="kpi-icon">✅</div>
          <div class="kpi-num">${paidPercentage}%</div>
          <div class="kpi-label">Collection Rate</div>
        </div>
        <div class="kpi-card amber">
          <div class="kpi-icon">🕐</div>
          <div class="kpi-num">${peakHourLabel}</div>
          <div class="kpi-label">Peak Hour</div>
        </div>
      </div>

      <!-- Quick Insights -->
      <div class="insights-grid">
        <div class="insight-card">
          <div class="insight-emoji">📈</div>
          <div class="insight-val">${currency}${maxBill.toLocaleString()}</div>
          <div class="insight-label">Highest Bill</div>
        </div>
        <div class="insight-card">
          <div class="insight-emoji">📉</div>
          <div class="insight-val">${currency}${minBill.toLocaleString()}</div>
          <div class="insight-label">Lowest Bill</div>
        </div>
        <div class="insight-card">
          <div class="insight-emoji">🛒</div>
          <div class="insight-val">${totalItemsSold}</div>
          <div class="insight-label">Total Items Sold</div>
        </div>
      </div>

      <!-- Charts Section -->
      <div class="section">
        <div class="section-header">
          <div class="section-icon" style="background:linear-gradient(135deg,#ecfeff,#cffafe)">📈</div>
          <div class="section-title">${type === "today" ? "Hourly Sales Performance" : "Daily Sales Trend"}</div>
          <div class="section-line"></div>
        </div>
        <div class="charts-grid">
          <div class="chart-wrapper">${chartSVG}</div>
          <div class="chart-wrapper">
            <p style="font-size:12px;font-weight:800;color:#0f172a;margin-bottom:12px;text-align:center">Payment Distribution</p>
            ${pieSVG}
          </div>
        </div>
      </div>

      <!-- Payment Methods -->
      <div class="section">
        <div class="section-header">
          <div class="section-icon" style="background:linear-gradient(135deg,#f5f3ff,#ede9fe)">💳</div>
          <div class="section-title">Payment Method Breakdown</div>
          <div class="section-line"></div>
        </div>
        <div class="payment-cards">
          <div class="pay-card cash">
            <div class="pay-emoji">💵</div>
            <div class="pay-amount">${currency}${cashTotal.toLocaleString()}</div>
            <div class="pay-label">Cash Payment</div>
            <div class="pay-pct">${totalAmount > 0 ? (cashTotal/totalAmount*100).toFixed(1) : 0}%</div>
            <div class="pay-meta">${cashBills.length} transactions</div>
          </div>
          <div class="pay-card upi">
            <div class="pay-emoji">📱</div>
            <div class="pay-amount">${currency}${upiTotal.toLocaleString()}</div>
            <div class="pay-label">UPI Payment</div>
            <div class="pay-pct">${totalAmount > 0 ? (upiTotal/totalAmount*100).toFixed(1) : 0}%</div>
            <div class="pay-meta">${upiBills.length} transactions</div>
          </div>
          <div class="pay-card udhari">
            <div class="pay-emoji">📝</div>
            <div class="pay-amount">${currency}${udhariTotal.toLocaleString()}</div>
            <div class="pay-label">Udhari (Credit)</div>
            <div class="pay-pct">${totalAmount > 0 ? (udhariTotal/totalAmount*100).toFixed(1) : 0}%</div>
            <div class="pay-meta">${udhariBills.length} transactions</div>
          </div>
        </div>
      </div>

      <!-- Top Products -->
      ${topProducts.length > 0 ? `<div class="section">
        <div class="section-header">
          <div class="section-icon" style="background:linear-gradient(135deg,#fffbeb,#fef3c7)">🏆</div>
          <div class="section-title">Top Selling Products</div>
          <div class="section-line"></div>
        </div>
        <div class="chart-wrapper">
          ${topProducts.map((p, i) => `<div class="top-product-item">
            <div style="display:flex;align-items:center">
              <div class="medal ${i === 0 ? 'medal-1' : i === 1 ? 'medal-2' : i === 2 ? 'medal-3' : 'medal-def'}">${i < 3 ? ['🥇','🥈','🥉'][i] : i + 1}</div>
              <div><div class="prod-name">${p.name}</div><div class="prod-qty">${p.qty} units sold</div></div>
            </div>
            <div class="prod-rev">${currency}${p.revenue.toLocaleString()}</div>
          </div>`).join('')}
        </div>
      </div>` : ''}

      <!-- Transaction Table -->
      <div class="section">
        <div class="section-header">
          <div class="section-icon" style="background:linear-gradient(135deg,#ecfdf5,#d1fae5)">📋</div>
          <div class="section-title">Complete Transaction Log</div>
          <div class="section-line"></div>
        </div>
        <table>
          <thead><tr><th>#</th><th>Bill No</th><th>Customer</th><th>Items</th><th>Payment</th><th>Amount</th><th>Status</th><th>${type === "monthly" ? "Date" : "Time"}</th></tr></thead>
          <tbody>`;

    targetBills.forEach((b, i) => {
      const bDate = new Date(b.date);
      const timeStr2 = bDate.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
      const dateStr2 = type === "monthly" ? bDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }) : timeStr2;
      html += `<tr>
        <td style="color:#cbd5e1;font-weight:700;font-size:10px">${String(i + 1).padStart(2, '0')}</td>
        <td class="bill-no">${b.billNo.slice(-12)}</td>
        <td style="font-weight:700;color:#0f172a">${b.customerName || "Walk-in Customer"}</td>
        <td><span style="background:#f1f5f9;padding:2px 8px;border-radius:6px;font-size:10px;font-weight:600">${b.items.length} items</span></td>
        <td><span class="payment-chip">${b.paymentMode}${b.upiApp ? ` • ${b.upiApp}` : ""}</span></td>
        <td class="amount-cell">${currency}${b.total.toLocaleString()}</td>
        <td><span class="status-chip ${b.paymentConfirmed ? 'status-paid' : 'status-pending'}">${b.paymentConfirmed ? "✓ Paid" : "⏳ Pending"}</span></td>
        <td style="color:#64748b;font-size:10px">${dateStr2}</td>
      </tr>`;
    });

    html += `<tr class="total-row"><td colspan="5" style="text-align:right;padding-right:20px">GRAND TOTAL</td><td colspan="3" style="font-family:'JetBrains Mono',monospace;font-size:20px">${currency}${totalAmount.toLocaleString()}</td></tr>`;
    html += `</tbody></table></div>

      <!-- Footer -->
      <div class="footer">
        <div class="brand">⚡ Smart Mudi Khana</div>
        <div class="gen-info">
          Report generated on ${dateStr} at ${timeStr}<br/>
          This is a computer-generated document and does not require a physical signature
        </div>
        <div class="confidential">Confidential • Internal Use Only</div>
      </div>

      <div class="watermark">SMK</div>

      <div class="no-print" style="text-align:center;margin-top:28px;display:flex;gap:12px;justify-content:center">
        <button onclick="window.print()" style="padding:14px 40px;font-size:13px;cursor:pointer;border:none;background:linear-gradient(145deg,#06b6d4,#0891b2);color:white;border-radius:12px;font-weight:800;letter-spacing:0.3px;box-shadow:0 4px 15px rgba(6,182,212,0.3)">🖨️ Print / Save as PDF</button>
        <button onclick="window.close()" style="padding:14px 40px;font-size:13px;cursor:pointer;border:1px solid #e2e8f0;background:white;border-radius:12px;font-weight:700;color:#64748b;box-shadow:0 2px 8px rgba(0,0,0,0.05)">✕ Close</button>
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
            <button key={stat.label} onClick={() => setSelectedStat(i)} className={`glass-card-hover p-4 text-left ${stat.gradient} relative`} style={{ animationDelay: `${i * 100}ms` }}>
              <div className="flex items-center justify-between mb-3">
                <div className="w-8 h-8 rounded-lg bg-foreground/10 flex items-center justify-center">
                  <Icon size={16} className="text-foreground" />
                </div>
                <span className="text-[10px] text-primary font-semibold">{stat.change}</span>
              </div>
              <p className="text-lg font-bold font-display text-foreground">{stat.value}</p>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                {i === 0 && todayBills.length > 0 && (
                  <span
                    onClick={(e) => { e.stopPropagation(); generateSalesPDF("today"); }}
                    className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg hover:bg-primary/20 transition-colors"
                  >
                    <Download size={10} /> PDF
                  </span>
                )}
                {i === 1 && monthlyReportAvailable && (
                  <span
                    onClick={(e) => { e.stopPropagation(); generateSalesPDF("monthly"); }}
                    className="flex items-center gap-1 text-[10px] font-bold text-primary bg-primary/10 px-2 py-1 rounded-lg hover:bg-primary/20 transition-colors animate-pulse"
                  >
                    <Download size={10} /> PDF
                  </span>
                )}
              </div>
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
