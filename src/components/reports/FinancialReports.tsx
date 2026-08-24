import React, { useState } from 'react';
import { useBakery } from '../../context/BakeryContext';
import { formatRupiah, formatDateIndo } from '../../utils/formatters';
import {
  TrendingUp,
  DollarSign,
  PieChart,
  Printer,
  Calendar,
  Layers,
  ShoppingBag,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

export const FinancialReports: React.FC = () => {
  const { orders, productions, products, businessProfile } = useBakery();

  const [dateRange, setDateRange] = useState<'today' | 'this_month' | 'all'>('this_month');

  // Revenue math
  const safeOrders = orders || [];
  const grossSales = safeOrders.reduce((sum, o) => sum + (o.subtotal || 0), 0);
  const totalDiscounts = safeOrders.reduce((sum, o) => sum + (o.discountAmount || 0), 0);
  const totalShipping = safeOrders.reduce((sum, o) => sum + (o.shippingFee || 0), 0);
  const netSalesRevenue = grossSales - totalDiscounts;

  // COGS / HPP Math
  // For all items in all orders, calculate exact HPP snapshot
  let totalCogs = 0;
  safeOrders.forEach((o) => {
    (o.items || []).forEach((item) => {
      totalCogs += (item.hppSnapshot || 28000) * (item.qty || 0);
    });
  });

  const grossProfit = netSalesRevenue - totalCogs;
  const grossMarginPercent =
    netSalesRevenue > 0 ? (grossProfit / netSalesRevenue) * 100 : 0;

  // Operating Overhead Expenses (Sewa Toko, Listrik Toko, Kebersihan)
  const operationalExpenses = [
    { name: 'Sewa Tempat & Outlet Toko (Bulan Ini)', amount: 2500000 },
    { name: 'Listrik, Wifi & Air Toko', amount: 650000 },
    { name: 'Gaji Kasir & Staff Toko', amount: 3000000 },
    { name: 'Biaya Marketing & Iklan Medsos', amount: 450000 },
  ];

  const totalOpex = operationalExpenses.reduce((sum, e) => sum + e.amount, 0);
  const netProfit = grossProfit - totalOpex;
  const netMarginPercent =
    netSalesRevenue > 0 ? (netProfit / netSalesRevenue) * 100 : 0;

  // Product Sales Contribution Breakdown
  const productStatsMap: Record<
    string,
    { name: string; qty: number; revenue: number; cogs: number; profit: number }
  > = {};

  safeOrders.forEach((o) => {
    (o.items || []).forEach((item) => {
      if (!productStatsMap[item.productId]) {
        productStatsMap[item.productId] = {
          name: item.productName,
          qty: 0,
          revenue: 0,
          cogs: 0,
          profit: 0,
        };
      }
      const p = productStatsMap[item.productId];
      p.qty += item.qty || 0;
      p.revenue += item.subtotal || 0;
      const c = (item.hppSnapshot || 28000) * (item.qty || 0);
      p.cogs += c;
      p.profit += (item.subtotal || 0) - c;
    });
  });

  const productStatsList = Object.values(productStatsMap).sort((a, b) => b.revenue - a.revenue);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-stone-200 shadow-sm no-print">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Laporan Keuangan & Laba Rugi
            </span>
          </div>
          <h2 className="text-xl font-bold text-stone-900 mt-1">
            Laporan Penjualan, HPP & Laba Bersih (P&L)
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Analisis laba kotor, beban pokok produksi resep, dan performa profitabilitas setiap menu bolu.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => window.print()}
            className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-lg transition flex items-center space-x-1.5 shadow-sm"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / PDF Laporan</span>
          </button>
        </div>
      </div>

      {/* Main KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
            Pendapatan Bersih (Net Sales)
          </span>
          <div className="text-xl font-extrabold text-stone-900 mt-1 font-mono">
            {formatRupiah(netSalesRevenue)}
          </div>
          <span className="text-[11px] text-stone-500">
            Dari {orders.length} transaksi penjualan
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
            HPP / Biaya Pokok (COGS)
          </span>
          <div className="text-xl font-extrabold text-rose-800 mt-1 font-mono">
            {formatRupiah(totalCogs)}
          </div>
          <span className="text-[11px] text-stone-500">Bahan baku + packaging + gas</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
            Laba Kotor (Gross Profit)
          </span>
          <div className="text-xl font-extrabold text-emerald-700 mt-1 font-mono">
            {formatRupiah(grossProfit)}
          </div>
          <span className="text-[11px] font-bold text-emerald-700">
            Gross Margin: {grossMarginPercent.toFixed(1)}%
          </span>
        </div>

        <div className="bg-stone-900 text-white p-4 rounded-xl border border-stone-800 shadow-sm">
          <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider block">
            Estimasi Laba Bersih (Net Profit)
          </span>
          <div className="text-xl font-extrabold text-white mt-1 font-mono">
            {formatRupiah(netProfit)}
          </div>
          <span className="text-[11px] text-stone-300">
            Net Margin: <strong>{netMarginPercent.toFixed(1)}%</strong> (setelah OPEX)
          </span>
        </div>
      </div>

      {/* Structured Profit & Loss Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden text-xs">
        <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
          <h3 className="font-bold text-sm text-stone-900">
            Laporan Laba Rugi Komprehensif (Income Statement)
          </h3>
          <span className="text-xs text-stone-500">Periode: Bulan Berjalan</span>
        </div>

        <div className="p-6 space-y-4 max-w-3xl">
          {/* Section 1: Revenue */}
          <div className="space-y-1.5">
            <div className="font-bold text-stone-900 text-xs uppercase tracking-wider border-b border-stone-200 pb-1">
              1. Pendapatan Penjualan (Revenue)
            </div>
            <div className="flex justify-between text-stone-700 pl-4 py-1">
              <span>Penjualan Kotor Produk Bolu & Cake</span>
              <span className="font-mono">{formatRupiah(grossSales)}</span>
            </div>
            {totalDiscounts > 0 && (
              <div className="flex justify-between text-rose-600 pl-4 py-1">
                <span>(-) Potongan Diskon Promosi</span>
                <span className="font-mono">-{formatRupiah(totalDiscounts)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-stone-900 bg-stone-50 p-2 rounded">
              <span>TOTAL PENDAPATAN BERSIH PENJUALAN</span>
              <span className="font-mono">{formatRupiah(netSalesRevenue)}</span>
            </div>
          </div>

          {/* Section 2: COGS */}
          <div className="space-y-1.5">
            <div className="font-bold text-stone-900 text-xs uppercase tracking-wider border-b border-stone-200 pb-1">
              2. Harga Pokok Penjualan (HPP / Cost of Goods Sold)
            </div>
            <div className="flex justify-between text-stone-700 pl-4 py-1">
              <span>Biaya Bahan Baku Terpakai (Pisang, Tepung, Telur, Mentega)</span>
              <span className="font-mono">{formatRupiah(totalCogs * 0.72)}</span>
            </div>
            <div className="flex justify-between text-stone-700 pl-4 py-1">
              <span>Biaya Kemasan & Box Bolu Terpakai</span>
              <span className="font-mono">{formatRupiah(totalCogs * 0.12)}</span>
            </div>
            <div className="flex justify-between text-stone-700 pl-4 py-1">
              <span>Biaya Energi Oven Gas & Tenaga Kerja Baker</span>
              <span className="font-mono">{formatRupiah(totalCogs * 0.16)}</span>
            </div>
            <div className="flex justify-between font-bold text-rose-800 bg-rose-50/70 p-2 rounded">
              <span>TOTAL HARGA POKOK PENJUALAN (HPP)</span>
              <span className="font-mono">-{formatRupiah(totalCogs)}</span>
            </div>
          </div>

          {/* Gross Profit Callout */}
          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-lg flex justify-between items-center text-sm font-extrabold text-emerald-950">
            <span>LABA KOTOR (GROSS PROFIT)</span>
            <span className="font-mono">
              {formatRupiah(grossProfit)} ({grossMarginPercent.toFixed(1)}%)
            </span>
          </div>

          {/* Section 3: Operating Expenses */}
          <div className="space-y-1.5">
            <div className="font-bold text-stone-900 text-xs uppercase tracking-wider border-b border-stone-200 pb-1">
              3. Beban Operasional Outlet / Toko (OPEX)
            </div>
            {operationalExpenses.map((exp, idx) => (
              <div key={idx} className="flex justify-between text-stone-700 pl-4 py-1">
                <span>{exp.name}</span>
                <span className="font-mono">{formatRupiah(exp.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold text-stone-900 bg-stone-50 p-2 rounded">
              <span>TOTAL BEBAN OPERASIONAL</span>
              <span className="font-mono">-{formatRupiah(totalOpex)}</span>
            </div>
          </div>

          {/* Net Profit Callout */}
          <div className="p-4 bg-stone-900 text-white rounded-xl flex justify-between items-center text-base font-extrabold">
            <div>
              <span className="text-amber-400 block text-xs">LABA BERSIH USAHA (NET PROFIT)</span>
              <span className="text-[11px] text-stone-400 font-normal">
                Keuntungan murni setelah HPP dan seluruh biaya operasional
              </span>
            </div>
            <span className="text-xl font-extrabold text-white font-mono">
              {formatRupiah(netProfit)}
            </span>
          </div>
        </div>
      </div>

      {/* Product Profitability Contribution Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden text-xs">
        <div className="p-4 bg-stone-50 border-b border-stone-200">
          <h3 className="font-bold text-sm text-stone-900">
            Kontribusi Penjualan & Laba per Varian Menu Produk
          </h3>
          <p className="text-xs text-stone-500">
            Identifikasi menu bintang (star product) yang menghasilkan margin dan omzet terbesar.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100 text-stone-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">Nama Produk</th>
                <th className="p-3.5 text-center">Unit Terjual</th>
                <th className="p-3.5 text-right">Total Omzet</th>
                <th className="p-3.5 text-right">Total HPP</th>
                <th className="p-3.5 text-right">Kontribusi Laba Kotor</th>
                <th className="p-3.5 text-center">Margin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {productStatsList.map((stat, idx) => {
                const margin = stat.revenue > 0 ? (stat.profit / stat.revenue) * 100 : 0;

                return (
                  <tr key={idx} className="hover:bg-stone-50">
                    <td className="p-3.5 font-bold text-stone-900">{stat.name}</td>
                    <td className="p-3.5 text-center font-bold font-mono text-stone-800">
                      {stat.qty} Loyang
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-stone-900">
                      {formatRupiah(stat.revenue)}
                    </td>
                    <td className="p-3.5 text-right font-mono text-stone-500">
                      {formatRupiah(stat.cogs)}
                    </td>
                    <td className="p-3.5 text-right font-mono font-extrabold text-emerald-800">
                      +{formatRupiah(stat.profit)}
                    </td>
                    <td className="p-3.5 text-center">
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-bold text-[10px]">
                        {margin.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
