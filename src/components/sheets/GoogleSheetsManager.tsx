import React, { useState } from 'react';
import {
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  PlusCircle,
  Link2,
  Unlink,
  LogOut,
  AlertCircle,
  Layers,
  ArrowRight,
  Download,
  Upload,
  Sparkles,
  Database,
  ArrowDownToLine,
  ArrowUpFromLine,
  Settings2,
  HelpCircle,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { useBakery } from '../../context/BakeryContext';

export const GoogleSheetsManager: React.FC = () => {
  const {
    googleUser,
    googleSheetsConfig,
    isGoogleLoading,
    isGoogleSyncing,
    signInWithGoogle,
    signOutFromGoogle,
    createBakeryGoogleSheet,
    connectGoogleSheetById,
    syncNowToGoogleSheets,
    loadDataFromGoogleSheets,
    disconnectGoogleSheet,
    updateGoogleSheetsConfig,
    businessProfile,
    ingredients,
    orders,
    productions,
    exportDataJson,
    importDataJson,
  } = useBakery();

  const [customTitle, setCustomTitle] = useState(
    `${businessProfile.name} - Database Master (${new Date().getFullYear()})`
  );
  const [existingSheetInput, setExistingSheetInput] = useState('');
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [activeMode, setActiveMode] = useState<'create' | 'connect'>('create');
  const [showPopupHelp, setShowPopupHelp] = useState(false);

  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  const handleOpenInNewTab = () => {
    if (typeof window !== 'undefined') {
      window.open(window.location.href, '_blank', 'noopener,noreferrer');
    }
  };

  const handleGoogleSignIn = async () => {
    setSyncStatusMsg(null);
    const res = await signInWithGoogle();
    if (res.success) {
      setSyncStatusMsg({ type: 'success', text: res.message || 'Berhasil login dengan Google.' });
      setShowPopupHelp(false);
    } else {
      setSyncStatusMsg({
        type: 'error',
        text: res.message || 'Gagal login. Pastikan popup tidak diblokir oleh browser.',
      });
      setShowPopupHelp(true);
    }
  };

  const handleCreateSheet = async () => {
    setSyncStatusMsg(null);
    const res = await createBakeryGoogleSheet(customTitle);
    if (res.success) {
      setSyncStatusMsg({ type: 'success', text: res.message || 'Spreadsheet berhasil dibuat dan disinkronkan!' });
    } else {
      setSyncStatusMsg({ type: 'error', text: res.message || 'Gagal membuat spreadsheet.' });
    }
  };

  const handleConnectSheet = async () => {
    setSyncStatusMsg(null);
    if (!existingSheetInput.trim()) {
      setSyncStatusMsg({ type: 'error', text: 'Silakan masukkan Spreadsheet ID atau Link URL.' });
      return;
    }

    // Extract ID if full URL pasted
    let id = existingSheetInput.trim();
    const match = id.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      id = match[1];
    }

    const res = await connectGoogleSheetById(id);
    if (res.success) {
      setSyncStatusMsg({ type: 'success', text: res.message || 'Berhasil terhubung ke spreadsheet!' });
      setExistingSheetInput('');
    } else {
      setSyncStatusMsg({ type: 'error', text: res.message || 'Gagal menghubungkan ke spreadsheet.' });
    }
  };

  const handleManualSync = async () => {
    setSyncStatusMsg(null);
    const res = await syncNowToGoogleSheets();
    if (res.success) {
      setSyncStatusMsg({ type: 'success', text: res.message || 'Sinkronisasi tulis ke Google Sheets berhasil!' });
    } else {
      setSyncStatusMsg({ type: 'error', text: res.message || 'Gagal sinkronisasi data.' });
    }
  };

  const handleLoadFromSheets = async () => {
    setSyncStatusMsg(null);
    const res = await loadDataFromGoogleSheets();
    if (res.success) {
      setSyncStatusMsg({
        type: 'success',
        text: res.message || 'Data dari Google Sheets berhasil dimuat ke aplikasi!',
      });
    } else {
      setSyncStatusMsg({
        type: 'error',
        text: res.message || 'Gagal memuat data dari Google Sheets.',
      });
    }
  };

  const handleDownloadBackup = () => {
    const jsonStr = exportDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${businessProfile.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSyncStatusMsg({ type: 'success', text: 'File cadangan data sistem berhasil diunduh.' });
  };

  const handleUploadBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const ok = importDataJson(text);
        if (ok) {
          setSyncStatusMsg({ type: 'success', text: 'Data dari file cadangan berhasil dipulihkan!' });
        } else {
          setSyncStatusMsg({ type: 'error', text: 'Format file cadangan tidak valid.' });
        }
      } catch (err: any) {
        setSyncStatusMsg({ type: 'error', text: 'Gagal membaca berkas cadangan.' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 sm:p-6 text-stone-100 shadow-lg space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-stone-800">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <span>Integrasi Google Sheets Persisten</span>
              {googleSheetsConfig.spreadsheetId && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>TERHUBUNG</span>
                </span>
              )}
            </h3>
            <p className="text-xs text-stone-400">
              Sinkronisasi 2 arah (Read & Write) antara PUSAKA Bakery OS dan Google Spreadsheet untuk Inventory, Pesanan, dan Produksi.
            </p>
          </div>
        </div>

        {/* User auth badge */}
        {googleUser ? (
          <div className="flex items-center space-x-3 bg-stone-950/70 border border-stone-800 px-3 py-1.5 rounded-lg">
            {googleUser.photoURL ? (
              <img
                src={googleUser.photoURL}
                alt={googleUser.displayName || 'Google User'}
                className="w-6 h-6 rounded-full border border-stone-700"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-emerald-600 text-[10px] flex items-center justify-center font-bold">
                {googleUser.email?.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="text-left">
              <div className="text-xs font-semibold text-stone-200 truncate max-w-[150px]">
                {googleUser.displayName || googleUser.email}
              </div>
              <div className="text-[10px] text-stone-500 truncate max-w-[150px]">
                {googleUser.email}
              </div>
            </div>
            <button
              onClick={signOutFromGoogle}
              className="p-1 text-stone-400 hover:text-rose-400 rounded transition"
              title="Logout Google"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center space-x-2">
            {isIframe && (
              <button
                onClick={handleOpenInNewTab}
                className="inline-flex items-center space-x-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs font-semibold transition border border-stone-700"
                title="Buka aplikasi di tab baru jika browser memblokir popup di dalam panel iframe"
              >
                <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                <span>Buka di Tab Baru</span>
              </button>
            )}
            <button
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="inline-flex items-center space-x-2 px-4 py-2 bg-white hover:bg-stone-100 text-stone-900 rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.16 0 9.98 0 12s.45 3.84 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
              <span>{isGoogleLoading ? 'Menghubungkan...' : 'Login Akun Google'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Alert Status Feedback */}
      {syncStatusMsg && (
        <div
          className={`p-3 rounded-lg text-xs flex items-start space-x-2.5 ${
            syncStatusMsg.type === 'success'
              ? 'bg-emerald-950/60 border border-emerald-800 text-emerald-300'
              : 'bg-rose-950/60 border border-rose-800 text-rose-300'
          }`}
        >
          {syncStatusMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
          )}
          <div className="flex-1">
            <span>{syncStatusMsg.text}</span>
          </div>
        </div>
      )}

      {/* Popup Troubleshooting Guide if blocked or help toggled */}
      {(!googleUser || showPopupHelp) && (
        <div className="bg-amber-950/30 border border-amber-800/60 rounded-lg p-4 text-xs text-amber-200/90 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 font-bold text-amber-300">
              <ShieldAlert className="w-4 h-4" />
              <span>Petunjuk Jika Pop-Up Login Google Terblokir di Browser</span>
            </div>
            <button
              onClick={() => setShowPopupHelp(!showPopupHelp)}
              className="text-[11px] underline text-amber-400 hover:text-amber-300"
            >
              {showPopupHelp ? 'Sembunyikan' : 'Bantuan Popup'}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-[11px] text-stone-300">
            <div className="bg-stone-950/50 p-2.5 rounded border border-stone-800 space-y-1">
              <div className="font-semibold text-amber-400">Cara 1: Izinkan Pop-Up di Bar Alamat URL</div>
              <p className="text-stone-400 leading-relaxed">
                Di sebelah kanan atau kiri kolom URL browser, klik ikon <strong>"Pop-up diblokir"</strong> (atau ikon gembok) ➔ Pilih <strong>"Selalu izinkan pop-up dan pengalihan"</strong> ➔ Klik tombol <em>Login Akun Google</em> kembali.
              </p>
            </div>

            <div className="bg-stone-950/50 p-2.5 rounded border border-stone-800 space-y-1">
              <div className="font-semibold text-amber-400">Cara 2: Buka di Tab Penuh (Direkomendasikan)</div>
              <p className="text-stone-400 leading-relaxed mb-2">
                Jika Anda sedang membuka aplikasi di dalam jendela pratinjau preview, buka tab browser baru agar pop-up tidak terhambat.
              </p>
              <button
                onClick={handleOpenInNewTab}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-amber-400 text-stone-950 font-bold rounded text-[11px] hover:bg-amber-300 transition"
              >
                <ExternalLink className="w-3 h-3" />
                <span>Buka Aplikasi di Tab Baru</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* State 1: User Not Logged In */}
      {!googleUser && (
        <div className="bg-stone-950/50 border border-stone-800/80 rounded-lg p-5 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-stone-800 flex items-center justify-center mx-auto text-amber-400">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div className="max-w-md mx-auto">
            <h4 className="text-sm font-bold text-stone-200">Hubungkan Akun Google Anda</h4>
            <p className="text-xs text-stone-400 mt-1">
              Login dengan Google untuk membuat Spreadsheet database cloud otomatis yang dapat dibaca (Read) dan ditulis (Write) secara langsung.
            </p>
          </div>
          <div className="flex items-center justify-center space-x-3 pt-2">
            <button
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading}
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50"
            >
              <span>Masuk dengan Google</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* State 2: Logged In but Not Connected to Sheet */}
      {googleUser && !googleSheetsConfig.spreadsheetId && (
        <div className="space-y-4">
          <div className="flex border-b border-stone-800">
            <button
              onClick={() => setActiveMode('create')}
              className={`pb-2 px-4 text-xs font-bold border-b-2 transition ${
                activeMode === 'create'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              1. Buat Spreadsheet Database Baru (Otomatis)
            </button>
            <button
              onClick={() => setActiveMode('connect')}
              className={`pb-2 px-4 text-xs font-bold border-b-2 transition ${
                activeMode === 'connect'
                  ? 'border-amber-400 text-amber-400'
                  : 'border-transparent text-stone-400 hover:text-stone-200'
              }`}
            >
              2. Hubungkan ke Spreadsheet yang Sudah Ada
            </button>
          </div>

          {activeMode === 'create' ? (
            <div className="bg-stone-950/60 border border-stone-800 rounded-lg p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Nama File Google Spreadsheet
                </label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  placeholder="Misal: PUSAKA Bakery - Database 2026"
                />
              </div>

              <div className="bg-stone-900/80 rounded-lg p-3 border border-stone-800 text-xs space-y-2">
                <div className="font-semibold text-stone-300 flex items-center space-x-1.5">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Sheet / Tab yang akan otomatis dibuat:</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-stone-400">
                  <span className="bg-stone-800/60 px-2 py-1 rounded">🧾 Orders_Penjualan</span>
                  <span className="bg-stone-800/60 px-2 py-1 rounded">📦 Bahan_Baku_Stok</span>
                  <span className="bg-stone-800/60 px-2 py-1 rounded">🍳 Resep_BOM</span>
                  <span className="bg-stone-800/60 px-2 py-1 rounded">🍞 Produk_Katalog</span>
                  <span className="bg-stone-800/60 px-2 py-1 rounded">👥 Pelanggan_CRM</span>
                  <span className="bg-stone-800/60 px-2 py-1 rounded">👨‍🍳 Produksi_Batch</span>
                  <span className="bg-stone-800/60 px-2 py-1 rounded">🗑️ Waste_Kerusakan</span>
                  <span className="bg-stone-800/60 px-2 py-1 rounded">🛒 Pembelian_PO</span>
                </div>
              </div>

              <button
                onClick={handleCreateSheet}
                disabled={isGoogleSyncing}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
              >
                <PlusCircle className="w-4 h-4" />
                <span>{isGoogleSyncing ? 'Sedang Membuat Database...' : 'Buat & Sinkronkan Data Sekarang'}</span>
              </button>
            </div>
          ) : (
            <div className="bg-stone-950/60 border border-stone-800 rounded-lg p-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  Spreadsheet ID atau Link Google Sheets
                </label>
                <input
                  type="text"
                  value={existingSheetInput}
                  onChange={(e) => setExistingSheetInput(e.target.value)}
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  placeholder="https://docs.google.com/spreadsheets/d/1A2B3C.../edit atau ID Spreadsheet"
                />
                <p className="text-[11px] text-stone-500 mt-1">
                  Pastikan akun Google yang Anda gunakan telah memiliki hak akses edit pada spreadsheet tersebut.
                </p>
              </div>

              <button
                onClick={handleConnectSheet}
                disabled={isGoogleSyncing}
                className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-lg text-xs font-bold transition flex items-center justify-center space-x-2 shadow-sm disabled:opacity-50"
              >
                <Link2 className="w-4 h-4" />
                <span>{isGoogleSyncing ? 'Menghubungkan...' : 'Hubungkan ke Database Ini'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* State 3: Logged In AND Connected */}
      {googleUser && googleSheetsConfig.spreadsheetId && (
        <div className="space-y-5">
          {/* Active Sheet Card */}
          <div className="bg-stone-950/80 border border-emerald-500/30 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider flex items-center space-x-1.5">
                <Database className="w-3.5 h-3.5" />
                <span>Database Google Sheets Aktif</span>
              </div>
              <h4 className="text-sm font-bold text-white">
                {googleSheetsConfig.spreadsheetTitle || 'PUSAKA Bakery Database'}
              </h4>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-stone-400">
                <span className="font-mono text-[11px] bg-stone-800/80 px-2 py-0.5 rounded text-stone-300">
                  ID: {googleSheetsConfig.spreadsheetId}
                </span>
                <span>Terakhir Sinkron: {googleSheetsConfig.lastSyncedAt || 'Baru saja'}</span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {googleSheetsConfig.spreadsheetUrl && (
                <a
                  href={googleSheetsConfig.spreadsheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-semibold transition border border-stone-700"
                >
                  <span>Buka di Google Drive</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              <button
                onClick={handleLoadFromSheets}
                disabled={isGoogleSyncing}
                className="inline-flex items-center space-x-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 shadow-sm"
                title="Tarik data terbaru dari Google Sheets ke Aplikasi"
              >
                <ArrowDownToLine className={`w-3.5 h-3.5 ${isGoogleSyncing ? 'animate-spin' : ''}`} />
                <span>{isGoogleSyncing ? 'Memuat...' : 'Baca Data (Pull)'}</span>
              </button>

              <button
                onClick={handleManualSync}
                disabled={isGoogleSyncing}
                className="inline-flex items-center space-x-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 shadow-sm"
                title="Kirim semua data aplikasi saat ini ke Google Sheets"
              >
                <ArrowUpFromLine className={`w-3.5 h-3.5 ${isGoogleSyncing ? 'animate-spin' : ''}`} />
                <span>{isGoogleSyncing ? 'Menyinkronkan...' : 'Kirim Data (Push)'}</span>
              </button>

              <button
                onClick={disconnectGoogleSheet}
                className="inline-flex items-center space-x-1 px-3 py-2 bg-stone-900 border border-stone-700 hover:border-rose-700 text-stone-400 hover:text-rose-400 rounded-lg text-xs transition"
                title="Putuskan Hubungan Spreadsheet"
              >
                <Unlink className="w-3.5 h-3.5" />
                <span>Putuskan</span>
              </button>
            </div>
          </div>

          {/* Module Data Counts & Sync Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-stone-950/70 border border-stone-800/80 rounded-lg p-3 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-stone-400">Stok Bahan Baku</div>
                <div className="text-base font-bold text-stone-100">{(ingredients || []).length} Item Terdaftar</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold text-xs">
                📦
              </div>
            </div>

            <div className="bg-stone-950/70 border border-stone-800/80 rounded-lg p-3 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-stone-400">Total Transaksi Order</div>
                <div className="text-base font-bold text-stone-100">{(orders || []).length} Pesanan</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-xs">
                🧾
              </div>
            </div>

            <div className="bg-stone-950/70 border border-stone-800/80 rounded-lg p-3 flex items-center justify-between">
              <div>
                <div className="text-[11px] text-stone-400">Riwayat Batch Produksi</div>
                <div className="text-base font-bold text-stone-100">{(productions || []).length} Batch</div>
              </div>
              <div className="w-8 h-8 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-xs">
                👨‍🍳
              </div>
            </div>
          </div>

          {/* Sync Settings */}
          <div className="bg-stone-950/50 border border-stone-800/80 rounded-lg p-4 space-y-3">
            <div className="text-xs font-bold text-stone-300 flex items-center space-x-1.5">
              <Settings2 className="w-4 h-4 text-amber-400" />
              <span>Pengaturan Sinkronisasi Otomatis Terhubung</span>
            </div>
            <label className="flex items-start space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={googleSheetsConfig.autoSyncOrders}
                onChange={(e) => updateGoogleSheetsConfig({ autoSyncOrders: e.target.checked })}
                className="mt-0.5 w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-stone-900 border-stone-700"
              />
              <div>
                <span className="text-xs font-semibold text-stone-200">
                  Otomatis tambahkan transaksi kasir baru ke sheet Orders_Penjualan
                </span>
                <p className="text-[11px] text-stone-400">
                  Setiap kali transaksi baru dibuat di kasir (POS), baris baru akan langsung ditambahkan ke Google Sheets secara real-time.
                </p>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* Offline Backup & Restore Section (Always Accessible) */}
      <div className="pt-4 border-t border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-0.5">
          <div className="font-semibold text-stone-300 flex items-center space-x-1.5">
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span>Cadangan & Ekspor Data Lokal (Offline JSON / Backup)</span>
          </div>
          <p className="text-[11px] text-stone-500">
            Ekspor seluruh database (Resep, HPP, Stok, Pesanan, CRM) ke berkas file cadangan kapan saja tanpa memerlukan izin pop-up.
          </p>
        </div>
        <div className="flex items-center space-x-2 shrink-0">
          <label className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs font-medium cursor-pointer border border-stone-700 transition">
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span>Pulihkan File</span>
            <input type="file" accept=".json" onChange={handleUploadBackup} className="hidden" />
          </label>
          <button
            onClick={handleDownloadBackup}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs font-medium border border-stone-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Unduh Cadangan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
