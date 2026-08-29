import React, { useState } from 'react';
import { useBakery } from '../../context/BakeryContext';
import { UserRole } from '../../types';
import {
  Bell,
  ChefHat,
  Store,
  ShieldCheck,
  AlertTriangle,
  PackageCheck,
  RotateCcw,
  Sparkles,
  Menu,
  X,
  FileSpreadsheet,
} from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenQuickOrder?: () => void;
  onOpenQuickProduction?: () => void;
  onToggleMobileMenu?: () => void;
  isMobileMenuOpen?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenQuickOrder,
  onOpenQuickProduction,
  onToggleMobileMenu,
  isMobileMenuOpen,
}) => {
  const {
    businessProfile,
    currentRole,
    setCurrentRole,
    currentUser,
    setCurrentUser,
    users,
    currentOutlet,
    outlets,
    setCurrentOutlet,
    lowStockIngredients,
    lowStockProducts,
    activeProductionsCount,
    pendingOrdersCount,
    resetDemoData,
    googleSheetsConfig,
  } = useBakery();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showOutletDropdown, setShowOutletDropdown] = useState(false);

  const safeLowStockIngredients = lowStockIngredients || [];
  const safeLowStockProducts = lowStockProducts || [];
  const totalAlerts =
    safeLowStockIngredients.length +
    safeLowStockProducts.length +
    ((pendingOrdersCount || 0) > 0 ? 1 : 0);

  const roles: { role: UserRole; label: string; desc: string }[] = [
    { role: 'OWNER', label: 'Owner / Pemilik', desc: 'Akses penuh seluruh laporan & pengaturan' },
    { role: 'ADMIN', label: 'Admin Operasional', desc: 'Kelola pesanan, pelanggan & pembelian' },
    { role: 'PRODUKSI', label: 'Head Baker / Tim Dapur', desc: 'Akses resep, batch produksi & stok bahan' },
    { role: 'KASIR', label: 'Kasir & Sales', desc: 'Fokus kasir POS, order & cetak invoice' },
    { role: 'SUPERVISOR', label: 'Supervisor Toko', desc: 'Monitoring stok, QC & pengawasan' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-stone-900 text-stone-100 border-b border-stone-800 shadow-sm no-print">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          {/* Zone 1: Brand & Mobile Menu Button */}
          <div className="flex items-center space-x-2 sm:space-x-3 shrink-0">
            {onToggleMobileMenu && (
              <button
                type="button"
                onClick={onToggleMobileMenu}
                className="p-1.5 -ml-1 text-stone-300 hover:text-white md:hidden rounded-lg hover:bg-stone-800 focus:outline-none"
                aria-label="Buka Menu"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            )}

            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-amber-500 flex items-center justify-center text-stone-950 font-bold shadow-sm shrink-0">
              <ChefHat className="w-4 h-4 sm:w-5 sm:h-5" />
            </div>
            <button
              onClick={() => setActiveTab('dashboard')}
              className="text-left focus:outline-none truncate max-w-[140px] sm:max-w-none"
            >
              <span className="text-sm sm:text-lg font-extrabold tracking-tight text-white whitespace-nowrap">
                {businessProfile.name}
              </span>
            </button>
          </div>

          {/* Zone 2: 4-6 primary single-line nav links */}
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {[
              { id: 'dashboard', label: 'Ringkasan' },
              { id: 'pos', label: 'Kasir POS' },
              { id: 'production', label: 'Produksi' },
              { id: 'recipes', label: 'Resep & HPP' },
              { id: 'inventory', label: 'Bahan Baku' },
              { id: 'finance', label: 'Keuangan' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-md whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-stone-800 text-amber-400 border border-stone-700'
                    : 'text-stone-300 hover:bg-stone-800 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Zone 3: Actions & Controls */}
          <div className="flex items-center space-x-1.5 sm:space-x-2.5 shrink-0">
            {/* Quick Outlet Selector */}
            <div className="relative">
              <button
                onClick={() => setShowOutletDropdown(!showOutletDropdown)}
                className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 text-xs font-medium text-stone-300 bg-stone-800/80 hover:bg-stone-800 border border-stone-700 rounded-md whitespace-nowrap truncate max-w-[170px]"
                title="Pilih Outlet Aktif"
              >
                <Store className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{currentOutlet.code}</span>
              </button>

              {showOutletDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-stone-900 border border-stone-700 rounded-lg shadow-xl py-2 z-50">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                    Pilih Outlet Aktif
                  </div>
                  {outlets.map((outlet) => (
                    <button
                      key={outlet.id}
                      onClick={() => {
                        setCurrentOutlet(outlet);
                        setShowOutletDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs flex flex-col hover:bg-stone-800 transition ${
                        currentOutlet.id === outlet.id ? 'bg-amber-500/10 text-amber-400' : 'text-stone-200'
                      }`}
                    >
                      <div className="font-medium flex items-center justify-between">
                        <span>{outlet.name}</span>
                        {outlet.isMain && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-stone-700 text-stone-300 rounded">
                            Pusat
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-stone-400 truncate mt-0.5">{outlet.address}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-1.5 sm:p-2 text-stone-300 hover:text-white hover:bg-stone-800 rounded-md focus:outline-none transition"
                title="Pemberitahuan Sistem"
              >
                <Bell className="w-4 h-4" />
                {totalAlerts > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-stone-900 border border-stone-700 rounded-lg shadow-2xl p-3 z-50 text-xs">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-800">
                    <span className="font-bold text-stone-200">Pemberitahuan & Alert</span>
                    <span className="text-[10px] px-2 py-0.5 bg-stone-800 text-amber-400 rounded-full font-semibold">
                      {totalAlerts} Alert
                    </span>
                  </div>

                  <div className="space-y-2 mt-2 max-h-64 overflow-y-auto">
                    {safeLowStockIngredients.length > 0 && (
                      <div className="p-2 bg-rose-950/40 border border-rose-800/60 rounded text-rose-200">
                        <div className="flex items-center font-semibold text-rose-300">
                          <AlertTriangle className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                          <span>{safeLowStockIngredients.length} Bahan Menipis</span>
                        </div>
                        <p className="text-[11px] text-rose-300/80 mt-1">
                          {safeLowStockIngredients.slice(0, 2).map((i) => i.name).join(', ')}
                          {safeLowStockIngredients.length > 2 ? ' ...' : ''}
                        </p>
                      </div>
                    )}

                    {activeProductionsCount > 0 && (
                      <div className="p-2 bg-amber-950/40 border border-amber-800/60 rounded text-amber-200">
                        <div className="flex items-center font-semibold text-amber-300">
                          <PackageCheck className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                          <span>{activeProductionsCount} Batch Produksi Berjalan</span>
                        </div>
                        <p className="text-[11px] text-amber-300/80 mt-1">
                          Proses pemanggangan & pendinginan sedang aktif.
                        </p>
                      </div>
                    )}

                    {totalAlerts === 0 && (
                      <div className="text-center py-4 text-stone-400">
                        Semua stok & produksi dalam kondisi aman 👍
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Role / User Switcher Pill */}
            <div className="relative">
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="flex items-center space-x-1 sm:space-x-1.5 px-2 sm:px-2.5 py-1 text-xs font-semibold rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 whitespace-nowrap transition"
                title={`Akun Aktif: ${currentUser.name} (${currentRole})`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline font-bold">{currentUser.name.split(' ')[0]} ({currentRole})</span>
                <span className="sm:hidden">{currentRole}</span>
              </button>

              {showRoleDropdown && (
                <div className="absolute right-0 mt-2 w-72 bg-stone-900 border border-stone-700 rounded-lg shadow-xl py-2 z-50">
                  <div className="px-3 py-1 text-[11px] font-semibold text-stone-400 uppercase tracking-wider flex items-center justify-between">
                    <span>Ganti Akun & Hak Akses</span>
                    <span className="text-[10px] text-amber-400 font-mono">{users.length} Akun</span>
                  </div>
                  <div className="max-h-60 overflow-y-auto divide-y divide-stone-800">
                    {users.map((u) => {
                      const isCurrent = u.id === currentUser.id;
                      return (
                        <button
                          key={u.id}
                          onClick={() => {
                            setCurrentUser(u);
                            setShowRoleDropdown(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs flex flex-col hover:bg-stone-800 transition ${
                            isCurrent ? 'bg-amber-500/20 text-amber-400 font-semibold' : 'text-stone-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold truncate">{u.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-stone-800 text-stone-300 ml-1 border border-stone-700">
                              {u.role}
                            </span>
                          </div>
                          <span className="text-[10px] text-stone-400 truncate">
                            {u.title || u.email || 'Staff Operasional'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="pt-2 px-3 border-t border-stone-800 mt-1">
                    <button
                      onClick={() => {
                        setShowRoleDropdown(false);
                        setActiveTab('settings');
                      }}
                      className="w-full text-center text-[11px] text-amber-400 hover:text-amber-300 hover:underline py-1 font-semibold"
                    >
                      ⚙️ Kelola / Edit Staff di Pengaturan
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Google Sheets Status Pill */}
            <button
              onClick={() => setActiveTab('settings')}
              className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1 text-xs font-semibold rounded-md border transition whitespace-nowrap ${
                googleSheetsConfig.spreadsheetId
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
                  : 'bg-stone-800 text-stone-400 border-stone-700 hover:text-stone-200'
              }`}
              title={
                googleSheetsConfig.spreadsheetId
                  ? `Google Sheets Aktif: ${googleSheetsConfig.spreadsheetTitle}`
                  : 'Hubungkan Google Sheets sebagai Database'
              }
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span className="text-[11px]">
                {googleSheetsConfig.spreadsheetId ? 'Sheets Terhubung' : 'Google Sheets'}
              </span>
              {googleSheetsConfig.spreadsheetId && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              )}
            </button>

            {/* Quick Action Button */}
            {onOpenQuickOrder && (
              <button
                onClick={onOpenQuickOrder}
                className="inline-flex items-center justify-center px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-md transition shadow-sm whitespace-nowrap shrink-0"
              >
                <span className="hidden xs:inline">+ Kasir</span>
                <span className="xs:hidden">+ POS</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

