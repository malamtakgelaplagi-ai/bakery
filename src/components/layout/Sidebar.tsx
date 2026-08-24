import React from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  ChefHat,
  BookOpen,
  Package,
  Boxes,
  Users,
  Trash2,
  PieChart,
  Settings,
  AlertCircle,
  Truck,
  RotateCcw,
  Sparkles,
  X,
  Menu,
  MoreHorizontal,
  FileSpreadsheet,
} from 'lucide-react';
import { useBakery } from '../../context/BakeryContext';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const {
    lowStockIngredients,
    lowStockProducts,
    activeProductionsCount,
    pendingOrdersCount,
    resetDemoData,
    currentRole,
    googleSheetsConfig,
  } = useBakery();

  const menuItems = [
    {
      id: 'dashboard',
      label: 'Dashboard Bisnis',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'pos',
      label: 'Kasir POS & Pesanan',
      icon: ShoppingCart,
      badge: pendingOrdersCount > 0 ? `${pendingOrdersCount} Baru` : null,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    },
    {
      id: 'production',
      label: 'Manajemen Produksi',
      icon: ChefHat,
      badge: activeProductionsCount > 0 ? `${activeProductionsCount} Aktif` : null,
      badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
    },
    {
      id: 'recipes',
      label: 'Resep BOM & HPP',
      icon: BookOpen,
      badge: null,
    },
    {
      id: 'products',
      label: 'Katalog Produk Jadi',
      icon: Package,
      badge: lowStockProducts.length > 0 ? `${lowStockProducts.length} Kritis` : null,
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    },
    {
      id: 'inventory',
      label: 'Bahan Baku & PO',
      icon: Boxes,
      badge: lowStockIngredients.length > 0 ? `${lowStockIngredients.length} Menipis` : null,
      badgeColor: 'bg-rose-100 text-rose-800 border-rose-300',
    },
    {
      id: 'customers',
      label: 'Pelanggan & CRM WA',
      icon: Users,
      badge: null,
    },
    {
      id: 'waste',
      label: 'Waste & Kerusakan',
      icon: Trash2,
      badge: null,
    },
    {
      id: 'finance',
      label: 'Laba Rugi & Kas',
      icon: PieChart,
      badge: null,
    },
    {
      id: 'sheets',
      label: 'Google Sheets DB',
      icon: FileSpreadsheet,
      badge: googleSheetsConfig?.spreadsheetId ? 'Aktif' : 'Cloud',
      badgeColor: googleSheetsConfig?.spreadsheetId
        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
        : 'bg-stone-700 text-stone-300 border-stone-600',
    },
    {
      id: 'settings',
      label: 'Pengaturan Bisnis',
      icon: Settings,
      badge: null,
    },
  ];

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const navContent = (
    <div className="flex flex-col justify-between h-full">
      <div className="p-4 space-y-6">
        <div>
          <div className="px-3 mb-2 text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center justify-between">
            <span>Navigasi Modul</span>
            {onCloseMobile && (
              <button
                onClick={onCloseMobile}
                className="md:hidden p-1 text-stone-400 hover:text-white rounded"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <nav className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-amber-400 text-stone-950 shadow-sm font-bold'
                      : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center space-x-3 truncate">
                    <Icon
                      className={`w-4 h-4 shrink-0 ${
                        isActive ? 'text-stone-950' : 'text-stone-400'
                      }`}
                    />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && !isActive && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium border shrink-0 ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div className="p-4 border-t border-stone-800 space-y-3 bg-stone-950/40">
        <div className="flex items-center justify-between text-[11px] text-stone-400">
          <span>Engine:</span>
          <span className="font-mono text-amber-400 font-semibold">BakeryOS v1.0</span>
        </div>

        <button
          onClick={() => {
            if (window.confirm('Reset semua data ke data sampel bawaan PUSAKA Bolu Pisang?')) {
              resetDemoData();
            }
          }}
          className="w-full flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded text-[11px] font-medium text-stone-400 hover:text-stone-200 bg-stone-800/80 hover:bg-stone-800 border border-stone-700 transition"
        >
          <RotateCcw className="w-3 h-3 text-stone-400" />
          <span>Reset Data Sampel</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 bg-stone-900 text-stone-300 flex-col justify-between border-r border-stone-800 shrink-0 no-print">
        {navContent}
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={onCloseMobile}
          />
          {/* Slide-over panel */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-stone-900 text-stone-300 z-50 shadow-2xl animate-in slide-in-from-left duration-200">
            {navContent}
          </div>
        </div>
      )}

      {/* Mobile Smartphone Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-stone-900/95 border-t border-stone-800 backdrop-blur-sm px-2 py-1.5 flex items-center justify-around text-stone-400 shadow-lg no-print">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center p-1 min-w-[54px] rounded-lg text-[10px] font-medium transition ${
            activeTab === 'dashboard' ? 'text-amber-400 font-bold' : 'hover:text-stone-200'
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('pos')}
          className={`flex flex-col items-center justify-center p-1 min-w-[54px] rounded-lg text-[10px] font-medium transition relative ${
            activeTab === 'pos' ? 'text-amber-400 font-bold' : 'hover:text-stone-200'
          }`}
        >
          <ShoppingCart className="w-5 h-5 mb-0.5" />
          <span>Kasir</span>
          {pendingOrdersCount > 0 && (
            <span className="absolute top-0 right-2 w-2 h-2 bg-amber-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('production')}
          className={`flex flex-col items-center justify-center p-1 min-w-[54px] rounded-lg text-[10px] font-medium transition relative ${
            activeTab === 'production' ? 'text-amber-400 font-bold' : 'hover:text-stone-200'
          }`}
        >
          <ChefHat className="w-5 h-5 mb-0.5" />
          <span>Dapur</span>
          {activeProductionsCount > 0 && (
            <span className="absolute top-0 right-2 w-2 h-2 bg-blue-400 rounded-full" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('inventory')}
          className={`flex flex-col items-center justify-center p-1 min-w-[54px] rounded-lg text-[10px] font-medium transition relative ${
            activeTab === 'inventory' ? 'text-amber-400 font-bold' : 'hover:text-stone-200'
          }`}
        >
          <Boxes className="w-5 h-5 mb-0.5" />
          <span>Bahan</span>
          {lowStockIngredients.length > 0 && (
            <span className="absolute top-0 right-2 w-2 h-2 bg-rose-500 rounded-full" />
          )}
        </button>

        <button
          onClick={() => {
            if (onCloseMobile && isMobileOpen) {
              onCloseMobile();
            } else if (onCloseMobile) {
              // open drawer
              onCloseMobile();
            }
          }}
          className={`flex flex-col items-center justify-center p-1 min-w-[54px] rounded-lg text-[10px] font-medium transition ${
            isMobileOpen ? 'text-amber-400 font-bold' : 'hover:text-stone-200'
          }`}
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          <span>Semua</span>
        </button>
      </div>
    </>
  );
};

