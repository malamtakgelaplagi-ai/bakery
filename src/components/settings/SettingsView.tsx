import React, { useState } from 'react';
import { useBakery } from '../../context/BakeryContext';
import { BusinessProfile } from '../../types';
import { GoogleSheetsManager } from '../sheets/GoogleSheetsManager';
import {
  Store,
  Save,
  Users,
  Shield,
  RefreshCw,
  CheckCircle2,
  Phone,
  MapPin,
  FileText,
  DollarSign,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { businessProfile, updateBusinessProfile, currentUser, users, setCurrentUser } =
    useBakery();

  const [form, setForm] = useState<BusinessProfile>({ ...businessProfile });
  const [isSaved, setIsSaved] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBusinessProfile(form);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  const handleResetData = () => {
    if (
      window.confirm(
        'Apakah Anda yakin ingin mereset seluruh data aplikasi kembali ke data demo awal? Perubahan yang belum diekspor akan hilang.'
      )
    ) {
      localStorage.removeItem('PUSAKA_BAKERY_SAAS_STATE_V1');
      window.location.reload();
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Pengaturan Sistem
            </span>
          </div>
          <h2 className="text-xl font-bold text-stone-900 mt-1">
            Profil Bakery, Identitas Nota & Pengguna
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Konfigurasi informasi toko yang tampil pada invoice kasir, WhatsApp, dan integrasi Google Sheets.
          </p>
        </div>
      </div>

      {/* Google Sheets Database Section */}
      <GoogleSheetsManager />

      {/* Profile Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-5 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <span className="font-bold text-sm text-stone-900 flex items-center space-x-2">
            <Store className="w-4 h-4 text-amber-600" />
            <span>Informasi & Identitas Usaha Bakery</span>
          </span>
          {isSaved && (
            <span className="text-emerald-700 font-bold text-xs flex items-center space-x-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Pengaturan Berhasil Disimpan!</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-stone-700 mb-1">Nama Usaha / Brand *</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">Slogan / Tagline</label>
            <input
              type="text"
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-bold text-stone-700 mb-1">Nomor WhatsApp Usaha *</label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              required
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">Email Toko</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">Kota / Domisili</label>
            <input
              type="text"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-stone-700 mb-1">Alamat Outlet / Dapur Produksi</label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
            className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-bold text-stone-700 mb-1">
              Catatan Rekening Pembayaran (Tampil di Nota)
            </label>
            <textarea
              value={form.bankAccountInfo || ''}
              onChange={(e) => setForm({ ...form, bankAccountInfo: e.target.value })}
              rows={2}
              placeholder="BCA: 1234567890 a.n PUSAKA BOLU&#10;Mandiri: 9876543210 a.n PUSAKA BOLU"
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none font-mono text-[11px]"
            />
          </div>

          <div>
            <label className="block font-bold text-stone-700 mb-1">
              Catatan Kaki Faktur / Terima Kasih
            </label>
            <textarea
              value={form.invoiceFooterNotes || ''}
              onChange={(e) => setForm({ ...form, invoiceFooterNotes: e.target.value })}
              rows={2}
              placeholder="Terima kasih atas pesanan Anda! Simpan di suhu ruang..."
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none text-[11px]"
            />
          </div>
        </div>

        <div className="pt-3 border-t border-stone-100 flex justify-end">
          <button
            type="submit"
            className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs rounded-lg transition shadow-sm flex items-center space-x-1.5"
          >
            <Save className="w-4 h-4" />
            <span>Simpan Perubahan Profil</span>
          </button>
        </div>
      </form>

      {/* Staff & Multi-User Switcher */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <span className="font-bold text-sm text-stone-900 flex items-center space-x-2">
            <Users className="w-4 h-4 text-amber-600" />
            <span>Staff & Multi-Role Pengguna (Simulasi Akun Aktif)</span>
          </span>
          <span className="text-stone-500 text-[11px]">
            Login Saat Ini: <strong>{currentUser.name}</strong> ({currentUser.role})
          </span>
        </div>

        <p className="text-stone-500 text-[11px]">
          SaaS PUSAKA mendukung pembagian peran kerja (Owner, Baker Dapur, Kasir Outlet, dan Kurir). Klik untuk beralih profil:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {users.map((u) => {
            const isCurrent = u.id === currentUser.id;

            return (
              <button
                key={u.id}
                type="button"
                onClick={() => setCurrentUser(u)}
                className={`p-3 rounded-lg border text-left transition flex items-center justify-between ${
                  isCurrent
                    ? 'bg-amber-500/10 border-amber-500 text-stone-950 ring-1 ring-amber-500'
                    : 'bg-stone-50 border-stone-200 hover:bg-stone-100 text-stone-700'
                }`}
              >
                <div>
                  <div className="font-bold text-xs">{u.name}</div>
                  <div className="text-[11px] text-stone-500">{u.role}</div>
                </div>
                {isCurrent && (
                  <span className="px-2 py-0.5 bg-amber-400 text-stone-950 rounded text-[10px] font-bold">
                    Aktif
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Data Backup & Reset */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-3 text-xs">
        <h3 className="font-bold text-sm text-stone-900">Manajemen Data & Reset Demo</h3>
        <p className="text-stone-500 text-[11px]">
          Aplikasi menyimpan data secara lokal di browser Anda. Anda dapat mengembalikan data ke format bawaan pabrik (default demo) jika diperlukan.
        </p>

        <div className="pt-2">
          <button
            type="button"
            onClick={handleResetData}
            className="px-3.5 py-2 bg-stone-100 hover:bg-rose-50 text-rose-700 font-bold rounded-lg border border-stone-300 hover:border-rose-300 transition flex items-center space-x-1.5 text-xs"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset Database ke Data Demo Pabrik</span>
          </button>
        </div>
      </div>
    </div>
  );
};
