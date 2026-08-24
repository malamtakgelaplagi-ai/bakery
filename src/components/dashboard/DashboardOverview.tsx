import React from 'react';
import { useBakery } from '../../context/BakeryContext';
import { formatRupiah, formatDateIndo, formatDateTimeIndo } from '../../utils/formatters';
import {
  TrendingUp,
  DollarSign,
  Package,
  ChefHat,
  AlertTriangle,
  ShoppingCart,
  ArrowUpRight,
  ArrowRight,
  Clock,
  CheckCircle2,
  Boxes,
  PlusCircle,
  Truck,
  Sparkles,
} from 'lucide-react';

interface DashboardProps {
  onNavigate: (tab: string) => void;
  onOpenNewOrder: () => void;
  onOpenNewProduction: () => void;
  onOpenNewPurchase: () => void;
}

export const DashboardOverview: React.FC<DashboardProps> = ({
  onNavigate,
  onOpenNewOrder,
  onOpenNewProduction,
  onOpenNewPurchase,
}) => {
  const {
    businessProfile,
    orders,
    productions,
    ingredients,
    products,
    expenses,
    lowStockIngredients,
    lowStockProducts,
    activeProductionsCount,
    pendingOrdersCount,
  } = useBakery();

  const todayStr = '2026-08-23'; // Simulation date based on metadata context

  // Today sales stats
  const safeOrders = orders || [];
  const safeProductions = productions || [];
  const safeIngredients = ingredients || [];
  const safeProducts = products || [];
  const safeExpenses = expenses || [];
  const safeLowStockIngredients = lowStockIngredients || [];
  const safeLowStockProducts = lowStockProducts || [];

  const todayOrders = safeOrders.filter((o) => o.date === todayStr && o.fulfillmentStatus !== 'BATAL');
  const todaySalesCount = todayOrders.length;
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const todayHpp = todayOrders.reduce((sum, o) => sum + (o.totalHpp || 0), 0);
  const todayGrossProfit = todayOrders.reduce((sum, o) => sum + (o.grossProfit || 0), 0);
  const todayProductsSold = todayOrders.reduce(
    (sum, o) => sum + (o.items || []).reduce((iSum, item) => iSum + (item.qty || 0), 0),
    0
  );

  // All time / Month to date stats
  const validOrders = safeOrders.filter((o) => o.fulfillmentStatus !== 'BATAL');
  const totalRevenue = validOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  const totalHpp = validOrders.reduce((sum, o) => sum + (o.totalHpp || 0), 0);
  const totalGrossProfit = validOrders.reduce((sum, o) => sum + (o.grossProfit || 0), 0);
  const totalExpenses = safeExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const totalNetProfit = totalGrossProfit - totalExpenses;

  // Production pipeline stats
  const completedProductions = safeProductions.filter((p) => p.status === 'SELESAI');
  const activeProductions = safeProductions.filter(
    (p) => p.status !== 'SELESAI' && p.status !== 'BATAL'
  );

  return (
    <div className="space-y-6">
      {/* Top Banner / Welcome & Quick Action Bar */}
      <div className="bg-stone-900 text-stone-100 rounded-xl p-5 border border-stone-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-[11px] font-bold rounded uppercase tracking-wider border border-amber-500/30">
              Live Bakery Dashboard
            </span>
            <span className="text-xs text-stone-400">
              {formatDateIndo(todayStr)}
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mt-1 text-white">
            {businessProfile.name}
          </h1>
          <p className="text-xs text-stone-400 mt-0.5">
            {businessProfile.tagline} • Pengelolaan Produksi & Penjualan Terintegrasi
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenNewOrder}
            className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs rounded-lg transition flex items-center space-x-1.5 shadow-sm whitespace-nowrap"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Kasir / Order Baru</span>
          </button>

          <button
            onClick={onOpenNewProduction}
            className="px-3.5 py-2 bg-stone-800 hover:bg-stone-700 text-amber-400 font-semibold text-xs rounded-lg border border-stone-700 transition flex items-center space-x-1.5 whitespace-nowrap"
          >
            <ChefHat className="w-3.5 h-3.5" />
            <span>Mulai Batch Produksi</span>
          </button>

          <button
            onClick={onOpenNewPurchase}
            className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium text-xs rounded-lg border border-stone-700 transition flex items-center space-x-1.5 whitespace-nowrap"
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>+ Belanja Bahan (PO)</span>
          </button>
        </div>
      </div>

      {/* Critical Stock Alert Bar (if any) */}
      {(safeLowStockIngredients.length > 0 || safeLowStockProducts.length > 0) && (
        <div className="bg-amber-50 border border-amber-300/80 rounded-xl p-4 flex items-start justify-between gap-3 text-amber-900 shadow-sm">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-xs sm:text-sm">
                Peringatan Stok Rendah Membutuhkan Tindakan
              </h4>
              <p className="text-xs text-amber-800 mt-0.5">
                {safeLowStockIngredients.length > 0 && (
                  <span>
                    <strong>{safeLowStockIngredients.length} bahan baku</strong> berada di bawah batas minimum (
                    {safeLowStockIngredients.map((i) => i.name).slice(0, 3).join(', ')}
                    {safeLowStockIngredients.length > 3 ? '...' : ''}).{' '}
                  </span>
                )}
                {safeLowStockProducts.length > 0 && (
                  <span>
                    <strong>{safeLowStockProducts.length} produk siap jual</strong> menipis di etalase.
                  </span>
                )}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2 shrink-0">
            {safeLowStockIngredients.length > 0 && (
              <button
                onClick={() => onNavigate('inventory')}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-md shadow-sm transition whitespace-nowrap"
              >
                Beli Bahan
              </button>
            )}
            {safeLowStockProducts.length > 0 && (
              <button
                onClick={() => onNavigate('production')}
                className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-md shadow-sm transition whitespace-nowrap"
              >
                Buat Produksi
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main KPI Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today Omzet */}
        <div className="bg-white rounded-xl p-4 border border-stone-200/90 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Omzet Hari Ini
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-stone-900">
              {formatRupiah(todayRevenue)}
            </div>
            <div className="flex items-center justify-between text-xs text-stone-500 mt-1">
              <span>{todaySalesCount} Transaksi Pesanan</span>
              <span className="font-semibold text-emerald-700">{todayProductsSold} Bolu Terjual</span>
            </div>
          </div>
        </div>

        {/* Laba Kotor Hari Ini */}
        <div className="bg-white rounded-xl p-4 border border-stone-200/90 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Laba Kotor Hari Ini
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-stone-900">
              {formatRupiah(todayGrossProfit)}
            </div>
            <div className="flex items-center justify-between text-xs text-stone-500 mt-1">
              <span>HPP Bahan: {formatRupiah(todayHpp)}</span>
              <span className="font-semibold text-blue-700">
                Margin {todayRevenue > 0 ? ((todayGrossProfit / todayRevenue) * 100).toFixed(0) : 0}%
              </span>
            </div>
          </div>
        </div>

        {/* Status Produksi Dapur */}
        <div className="bg-white rounded-xl p-4 border border-stone-200/90 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Produksi Dapur
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
              <ChefHat className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-stone-900">
              {activeProductionsCount} Batch Aktif
            </div>
            <div className="flex items-center justify-between text-xs text-stone-500 mt-1">
              <span>{completedProductions.length} Batch Selesai</span>
              <button
                onClick={() => onNavigate('production')}
                className="text-amber-700 hover:underline font-semibold"
              >
                Lihat Oven →
              </button>
            </div>
          </div>
        </div>

        {/* Laba Bersih Estimasi Bulan Ini */}
        <div className="bg-white rounded-xl p-4 border border-stone-200/90 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Estimasi Laba Bersih
            </span>
            <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-xl font-bold text-stone-900">
              {formatRupiah(totalNetProfit)}
            </div>
            <div className="flex items-center justify-between text-xs text-stone-500 mt-1">
              <span>Beban Ops: {formatRupiah(totalExpenses)}</span>
              <button
                onClick={() => onNavigate('finance')}
                className="text-stone-700 hover:underline font-semibold"
              >
                Lap. Laba Rugi →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Section: Active Production Runs & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Production Flow & Pipeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Productions Pipeline */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-bold text-sm text-stone-900 flex items-center space-x-2">
                  <ChefHat className="w-4 h-4 text-amber-600" />
                  <span>Pipeline Dapur & Batch Produksi</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Alur otomatisasi: Draft → Diracik → Dipanggang → Pendinginan → QC → Selesai
                </p>
              </div>
              <button
                onClick={() => onNavigate('production')}
                className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center space-x-1"
              >
                <span>Kelola Dapur</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {safeProductions.length === 0 ? (
                <div className="text-center py-6 text-stone-400 text-xs">
                  Belum ada batch produksi aktif hari ini.
                </div>
              ) : (
                safeProductions.slice(0, 3).map((prod) => {
                  const getStatusBadge = (status: string) => {
                    switch (status) {
                      case 'DRAFT':
                        return 'bg-stone-100 text-stone-700 border-stone-300';
                      case 'DIRACIK':
                        return 'bg-blue-50 text-blue-800 border-blue-200';
                      case 'DIPANGGANG':
                        return 'bg-amber-50 text-amber-800 border-amber-200 animate-pulse';
                      case 'PENDINGINAN':
                        return 'bg-cyan-50 text-cyan-800 border-cyan-200';
                      case 'QC':
                        return 'bg-purple-50 text-purple-800 border-purple-200';
                      case 'SELESAI':
                        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
                      default:
                        return 'bg-stone-100 text-stone-700';
                    }
                  };

                  return (
                    <div
                      key={prod.id}
                      className="p-3.5 rounded-lg border border-stone-200/80 bg-stone-50/50 hover:bg-stone-50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-xs font-bold text-stone-900">
                            {prod.batchNumber}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-bold border ${getStatusBadge(
                              prod.status
                            )}`}
                          >
                            {prod.status}
                          </span>
                          <span className="text-[11px] text-stone-400">
                            v{prod.recipeVersionNumber}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-stone-800">
                          {prod.productName} —{' '}
                          <span className="text-amber-700 font-bold">
                            {prod.targetQty} Pcs
                          </span>
                        </div>
                        <div className="text-[11px] text-stone-500">
                          Operator: {prod.operatorName} • Biaya Batch: {formatRupiah(prod.totalProductionCost)} (HPP {formatRupiah(prod.unitProductionCost)}/pcs)
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center space-x-2">
                        <button
                          onClick={() => onNavigate('production')}
                          className="px-3 py-1.5 text-xs font-medium text-stone-700 bg-white hover:bg-stone-100 border border-stone-300 rounded-md transition"
                        >
                          Detail Batch
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Finished Goods Inventory Status */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <div>
                <h3 className="font-bold text-sm text-stone-900 flex items-center space-x-2">
                  <Package className="w-4 h-4 text-amber-600" />
                  <span>Stok Produk Siap Jual di Etalase</span>
                </h3>
                <p className="text-xs text-stone-500">
                  Monitoring ketersediaan produk jadi dan margin keuntungan per pcs
                </p>
              </div>
              <button
                onClick={() => onNavigate('products')}
                className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center space-x-1"
              >
                <span>Semua Produk</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
              {safeProducts.map((prod) => {
                const isLow = prod.stockFinishedGoods <= prod.minStockFinishedGoods;
                return (
                  <div
                    key={prod.id}
                    className="p-3.5 rounded-lg border border-stone-200 bg-stone-50/50 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-stone-400 font-bold">
                          {prod.sku}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            isLow
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {prod.stockFinishedGoods} Ready
                        </span>
                      </div>
                      <h4 className="font-bold text-xs text-stone-900 mt-1 truncate">
                        {prod.name}
                      </h4>
                      <p className="text-[11px] text-stone-500">{prod.sizeSpec}</p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-stone-200/80 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-[10px] text-stone-400 block">Harga Jual</span>
                        <span className="font-bold text-stone-900">
                          {formatRupiah(prod.sellingPrice)}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-stone-400 block">Margin</span>
                        <span className="font-bold text-emerald-700">
                          {prod.grossMarginPercent}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Recent Orders & Quick CRM */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-sm text-stone-900 flex items-center space-x-2">
                <ShoppingCart className="w-4 h-4 text-amber-600" />
                <span>Transaksi Pesanan Terkini</span>
              </h3>
              <button
                onClick={() => onNavigate('pos')}
                className="text-xs font-semibold text-stone-600 hover:text-stone-900 flex items-center space-x-1"
              >
                <span>Lihat Kasir</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {safeOrders.slice(0, 4).map((order) => {
                const getPayBadge = (status: string) => {
                  if (status === 'LUNAS') return 'bg-emerald-100 text-emerald-800';
                  if (status === 'DP') return 'bg-amber-100 text-amber-800';
                  return 'bg-rose-100 text-rose-800';
                };

                return (
                  <div
                    key={order.id}
                    className="p-3 rounded-lg border border-stone-200 bg-stone-50/50 hover:bg-stone-50 transition space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[11px] font-bold text-stone-900">
                        #{order.invoiceNumber}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${getPayBadge(
                          order.paymentStatus
                        )}`}
                      >
                        {order.paymentStatus}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-stone-800 truncate max-w-[140px]">
                        {order.customerName}
                      </span>
                      <span className="font-bold text-stone-900">
                        {formatRupiah(order.totalAmount)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1 border-t border-stone-200/60">
                      <span>
                        {(order.items || []).reduce((s, i) => s + (i.qty || 0), 0)} Pcs via {order.source}
                      </span>
                      <span className="capitalize text-stone-600 font-medium">
                        {(order.fulfillmentStatus || 'SELESAI').toLowerCase().replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              onClick={onOpenNewOrder}
              className="mt-4 w-full py-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-lg transition flex items-center justify-center space-x-1.5"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Input Pesanan Baru</span>
            </button>
          </div>

          {/* Quick Raw Material Stock Status */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
            <div className="flex items-center justify-between pb-3 border-b border-stone-100">
              <h3 className="font-bold text-sm text-stone-900 flex items-center space-x-2">
                <Boxes className="w-4 h-4 text-amber-600" />
                <span>Bahan Baku Utama</span>
              </h3>
              <button
                onClick={() => onNavigate('inventory')}
                className="text-xs font-semibold text-stone-600 hover:text-stone-900"
              >
                Detail →
              </button>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              {safeIngredients.slice(0, 5).map((ing) => {
                const isLow = ing.stockInRecipeUnit <= ing.minStockInRecipeUnit;
                return (
                  <div
                    key={ing.id}
                    className="flex items-center justify-between py-1.5 border-b border-stone-100 last:border-0"
                  >
                    <div className="truncate max-w-[150px]">
                      <span className="font-medium text-stone-800 block truncate">
                        {ing.name}
                      </span>
                      <span className="text-[10px] text-stone-400">
                        {formatRupiah(ing.latestBuyPrice)} / {ing.buyUnit}
                      </span>
                    </div>

                    <div className="text-right">
                      <span
                        className={`font-bold ${
                          isLow ? 'text-rose-600' : 'text-stone-800'
                        }`}
                      >
                        {ing.recipeUnit === 'g'
                          ? `${(ing.stockInRecipeUnit / 1000).toFixed(1)} kg`
                          : `${ing.stockInRecipeUnit} ${ing.recipeUnit}`}
                      </span>
                      {isLow && (
                        <span className="text-[10px] text-rose-500 font-bold block">
                          Menipis!
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
