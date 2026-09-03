import React, { useState } from 'react';
import { useBakery } from '../../context/BakeryContext';
import {
  ChefHat,
  ShoppingBag,
  Lock,
  Menu,
  X,
  Phone,
  LayoutDashboard,
  MapPin,
  Sparkles,
} from 'lucide-react';

interface CustomerHeaderProps {
  cartCount: number;
  onOpenCart: () => void;
  onOpenLogin: () => void;
  onNavigateToDashboard: () => void;
  isManagementAuthenticated: boolean;
}

export const CustomerHeader: React.FC<CustomerHeaderProps> = ({
  cartCount,
  onOpenCart,
  onOpenLogin,
  onNavigateToDashboard,
  isManagementAuthenticated,
}) => {
  const { businessProfile, currentUser } = useBakery();
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const cleanPhone = (businessProfile.phone || '082115181105').replace(/\D/g, '');
  const waPhone = cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs transition-all">
      {/* Top Notification Bar / Announcement */}
      <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 text-amber-50 text-[11px] sm:text-xs py-1.5 px-4 text-center font-medium flex items-center justify-center space-x-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-200 animate-pulse shrink-0" />
        <span>
          <strong>Fresh From The Oven Setiap Pagi!</strong> Pengiriman Instant Bandung & Terima Pesanan Arisan/Hampers via WhatsApp
        </span>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand Name */}
          <div className="flex items-center space-x-3">
            <a href="#hero" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-stone-950 font-black shadow-md group-hover:scale-105 transition">
                <ChefHat className="w-5 h-5 sm:w-6 sm:h-6 text-stone-950" />
              </div>
              <div>
                <span className="block text-base sm:text-lg font-black tracking-tight text-stone-900 group-hover:text-amber-700 transition leading-tight">
                  {businessProfile.name}
                </span>
                <span className="block text-[11px] sm:text-xs text-stone-500 font-medium tracking-normal">
                  {businessProfile.tagline || 'Artisan Bolu Tradisional & Cake Nusantara'}
                </span>
              </div>
            </a>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6 text-sm font-semibold text-stone-700">
            <a
              href="#produk"
              className="hover:text-amber-600 transition py-1 relative group"
            >
              Menu Bolu & Produk
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-500 transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a
              href="#profil"
              className="hover:text-amber-600 transition py-1 relative group"
            >
              Cerita & Profil
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-500 transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a
              href="#keunggulan"
              className="hover:text-amber-600 transition py-1 relative group"
            >
              Keunggulan
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-500 transition-all duration-300 group-hover:w-full"></span>
            </a>
            <a
              href="#lokasi"
              className="hover:text-amber-600 transition py-1 relative group"
            >
              Lokasi & Jam Buka
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-amber-500 transition-all duration-300 group-hover:w-full"></span>
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* WhatsApp Quick Chat */}
            <a
              href={`https://wa.me/${waPhone}?text=Halo%20${encodeURIComponent(businessProfile.name)}%2C%20saya%20ingin%20tanya%20menu%20dan%20pemesanan%20bolu.`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden lg:inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp Toko</span>
            </a>

            {/* Shopping Cart Button */}
            <button
              onClick={onOpenCart}
              className="relative p-2 sm:px-3.5 sm:py-2 text-stone-800 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 rounded-xl transition flex items-center space-x-2 font-bold text-xs"
              title="Keranjang Pesanan"
            >
              <ShoppingBag className="w-4 h-4 sm:w-4 sm:h-4 text-amber-700" />
              <span className="hidden sm:inline text-amber-950 font-bold">Keranjang</span>
              {cartCount > 0 && (
                <span className="bg-amber-500 text-stone-950 text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Management Access / Login Button */}
            {isManagementAuthenticated ? (
              <button
                onClick={onNavigateToDashboard}
                className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-xs transition"
                title="Buka Dashboard Manajemen Bisnis"
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Dashboard Bisnis</span>
                <span className="sm:hidden">Dashboard</span>
              </button>
            ) : (
              <button
                onClick={onOpenLogin}
                className="inline-flex items-center space-x-1.5 px-3 py-2 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 hover:text-stone-950 rounded-xl border border-stone-200 transition shadow-2xs"
                title="Login Pengelola / Manajemen"
              >
                <Lock className="w-3.5 h-3.5 text-stone-600" />
                <span>Login Manajemen</span>
              </button>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="p-2 text-stone-600 hover:text-stone-950 md:hidden rounded-lg hover:bg-stone-100 transition"
              aria-label="Menu"
            >
              {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {isMobileNavOpen && (
        <div className="md:hidden bg-white border-b border-stone-200 px-4 pt-2 pb-6 space-y-3 animate-in slide-in-from-top-2 duration-200">
          <div className="flex flex-col space-y-2 pt-2 text-sm font-semibold text-stone-800">
            <a
              href="#produk"
              onClick={() => setIsMobileNavOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-amber-50 hover:text-amber-700 transition"
            >
              🍰 Menu Bolu & Produk
            </a>
            <a
              href="#profil"
              onClick={() => setIsMobileNavOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-amber-50 hover:text-amber-700 transition"
            >
              📖 Profil & Cerita Rasa
            </a>
            <a
              href="#keunggulan"
              onClick={() => setIsMobileNavOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-amber-50 hover:text-amber-700 transition"
            >
              ⭐ Keunggulan
            </a>
            <a
              href="#lokasi"
              onClick={() => setIsMobileNavOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-amber-50 hover:text-amber-700 transition"
            >
              📍 Lokasi Outlet & Jam Buka
            </a>
          </div>

          <div className="pt-3 border-t border-stone-100 flex flex-col gap-2">
            <a
              href={`https://wa.me/${waPhone}?text=Halo%20${encodeURIComponent(businessProfile.name)}%2C%20saya%20ingin%20tanya%20menu%20dan%20pemesanan.`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200 transition"
            >
              <Phone className="w-4 h-4 text-emerald-600" />
              <span>Chat WhatsApp Admin ({businessProfile.phone})</span>
            </a>

            {isManagementAuthenticated ? (
              <button
                onClick={() => {
                  setIsMobileNavOpen(false);
                  onNavigateToDashboard();
                }}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-xl shadow-xs transition"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Masuk ke Dashboard Bisnis PUSAKA</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setIsMobileNavOpen(false);
                  onOpenLogin();
                }}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 text-xs font-bold text-stone-800 bg-stone-100 hover:bg-stone-200 rounded-xl border border-stone-300 transition"
              >
                <Lock className="w-4 h-4 text-stone-600" />
                <span>Portal Login Staf / Manajemen</span>
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
