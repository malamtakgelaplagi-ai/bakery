import React, { useState, useEffect } from 'react';
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
  KeyRound,
  Check,
  RotateCcw,
  Sliders,
  Copy,
  Code2,
  Zap,
  Globe,
  Radio,
} from 'lucide-react';
import { useBakery } from '../../context/BakeryContext';
import {
  getCustomFirebaseConfig,
  saveCustomFirebaseConfig,
  isUsingCustomFirebase,
  setDirectAccessToken,
  FirebaseAppConfig,
} from '../../services/googleAuth';

export const GoogleSheetsManager: React.FC = () => {
  const {
    // Apps Script
    appsScriptConfig,
    isAppsScriptSyncing,
    updateAppsScriptConfig,
    testAppsScript,
    syncNowToAppsScript,
    loadDataFromAppsScript,
    appsScriptTemplateCode,

    // Google OAuth
    googleUser,
    googleSheetsConfig,
    isGoogleLoading,
    isGoogleSyncing,
    signInWithGoogle,
    signInWithGoogleRedirect,
    signOutFromGoogle,
    createBakeryGoogleSheet,
    connectGoogleSheetById,
    syncNowToGoogleSheets,
    loadDataFromGoogleSheets,
    disconnectGoogleSheet,
    updateGoogleSheetsConfig,

    // Business Data
    businessProfile,
    ingredients,
    orders,
    productions,
    exportDataJson,
    importDataJson,
  } = useBakery();

  // Top Level Tab: 'appscript' (Default & Recommended) vs 'oauth'
  const [activeTab, setActiveTab] = useState<'appscript' | 'oauth'>('appscript');

  // Apps Script Form State
  const [webAppUrlInput, setWebAppUrlInput] = useState(appsScriptConfig.webAppUrl || '');
  const [copiedScript, setCopiedScript] = useState(false);
  const [showCodePreview, setShowCodePreview] = useState(false);

  // OAuth Form State
  const [customTitle, setCustomTitle] = useState(
    `${businessProfile.name} - Database Master (${new Date().getFullYear()})`
  );
  const [existingSheetInput, setExistingSheetInput] = useState('');
  const [oauthMode, setOauthMode] = useState<'create' | 'connect'>('create');
  const [showConfigModal, setShowConfigModal] = useState(false);

  // Common Feedback
  const [syncStatusMsg, setSyncStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Custom Firebase State
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [authDomainInput, setAuthDomainInput] = useState('');
  const [projectIdInput, setProjectIdInput] = useState('');
  const [appIdInput, setAppIdInput] = useState('');
  const [jsonConfigInput, setJsonConfigInput] = useState('');
  const [directTokenInput, setDirectTokenInput] = useState('');
  const [isCustomActive, setIsCustomActive] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const isIframe = typeof window !== 'undefined' && window.self !== window.top;
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : 'pusakabakery.vercel.app';
  const isUnauthorizedDomain =
    syncStatusMsg?.text?.includes('Authorized Domains') ||
    syncStatusMsg?.text?.includes('unauthorized-domain') ||
    syncStatusMsg?.text?.includes('Firebase Config');

  useEffect(() => {
    setWebAppUrlInput(appsScriptConfig.webAppUrl || '');
  }, [appsScriptConfig.webAppUrl]);

  useEffect(() => {
    const custom = getCustomFirebaseConfig();
    if (custom) {
      setApiKeyInput(custom.apiKey || '');
      setAuthDomainInput(custom.authDomain || '');
      setProjectIdInput(custom.projectId || '');
      setAppIdInput(custom.appId || '');
      setIsCustomActive(true);
    } else {
      setIsCustomActive(false);
    }
  }, []);

  const handleCopyCode = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(appsScriptTemplateCode);
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 2500);
    }
  };

  const handleCopyHostname = () => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(currentHostname);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 2000);
    }
  };

  const handleOpenInNewTab = () => {
    if (typeof window !== 'undefined') {
      window.open(window.location.href, '_blank', 'noopener,noreferrer');
    }
  };

  // -------------------------------------------------------------
  // APPS SCRIPT HANDLERS
  // -------------------------------------------------------------
  const handleSaveAppsScriptUrl = () => {
    const trimmed = webAppUrlInput.trim();
    if (!trimmed) {
      updateAppsScriptConfig({ webAppUrl: '' });
      setSyncStatusMsg({ type: 'success', text: 'URL Google Apps Script telah dihapus.' });
      return;
    }
    if (!trimmed.startsWith('https://script.google.com/macros/s/')) {
      setSyncStatusMsg({
        type: 'error',
        text: 'URL harus berformat: https://script.google.com/macros/s/.../exec',
      });
      return;
    }
    updateAppsScriptConfig({ webAppUrl: trimmed });
    setSyncStatusMsg({ type: 'success', text: 'URL Web App berhasil disimpan! Silakan klik "Uji Koneksi".' });
  };

  const handleTestAppsScript = async () => {
    setSyncStatusMsg(null);
    const trimmed = webAppUrlInput.trim();
    if (!trimmed) {
      setSyncStatusMsg({ type: 'error', text: 'Silakan masukkan URL Web App Apps Script terlebih dahulu.' });
      return;
    }
    updateAppsScriptConfig({ webAppUrl: trimmed });
    const res = await testAppsScript();
    if (res.success) {
      setSyncStatusMsg({
        type: 'success',
        text: `✓ Sukses terhubung ke Spreadsheet: "${res.spreadsheetTitle || 'PUSAKA Bakery DB'}"!`,
      });
    } else {
      setSyncStatusMsg({
        type: 'error',
        text: res.message || 'Koneksi gagal. Pastikan setting "Who has access" disetel "Anyone".',
      });
    }
  };

  const handlePushAppsScript = async () => {
    setSyncStatusMsg(null);
    if (!appsScriptConfig.webAppUrl) {
      setSyncStatusMsg({ type: 'error', text: 'Harap simpan URL Web App Apps Script terlebih dahulu.' });
      return;
    }
    const res = await syncNowToAppsScript();
    if (res.success) {
      setSyncStatusMsg({ type: 'success', text: '✓ Seluruh database berhasil dikirim & diperbarui di Google Sheets!' });
    } else {
      setSyncStatusMsg({ type: 'error', text: res.message || 'Gagal sinkronisasi data.' });
    }
  };

  const handlePullAppsScript = async () => {
    setSyncStatusMsg(null);
    if (!appsScriptConfig.webAppUrl) {
      setSyncStatusMsg({ type: 'error', text: 'Harap simpan URL Web App Apps Script terlebih dahulu.' });
      return;
    }
    const res = await loadDataFromAppsScript();
    if (res.success) {
      setSyncStatusMsg({ type: 'success', text: res.message });
    } else {
      setSyncStatusMsg({ type: 'error', text: res.message || 'Gagal memuat data dari Apps Script.' });
    }
  };

  // -------------------------------------------------------------
  // OAUTH HANDLERS
  // -------------------------------------------------------------
  const handleGoogleSignIn = async () => {
    setSyncStatusMsg(null);
    const res = await signInWithGoogle();
    if (res.success) {
      setSyncStatusMsg({ type: 'success', text: res.message || 'Berhasil login dengan Google.' });
    } else {
      setSyncStatusMsg({
        type: 'error',
        text: res.message || 'Gagal login. Pastikan popup tidak diblokir.',
      });
    }
  };

  const handleGoogleSignInRedirect = async () => {
    setSyncStatusMsg(null);
    try {
      await signInWithGoogleRedirect();
    } catch (err: any) {
      setSyncStatusMsg({
        type: 'error',
        text: err?.message || 'Gagal memulai redirect login.',
      });
    }
  };

  const handleCreateOAuthSheet = async () => {
    setSyncStatusMsg(null);
    const res = await createBakeryGoogleSheet(customTitle);
    if (res.success) {
      setSyncStatusMsg({ type: 'success', text: res.message || 'Spreadsheet berhasil dibuat!' });
    } else {
      setSyncStatusMsg({ type: 'error', text: res.message || 'Gagal membuat spreadsheet.' });
    }
  };

  const handleConnectOAuthSheet = async () => {
    setSyncStatusMsg(null);
    if (!existingSheetInput.trim()) {
      setSyncStatusMsg({ type: 'error', text: 'Silakan masukkan Spreadsheet ID atau URL.' });
      return;
    }
    let id = existingSheetInput.trim();
    const match = id.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) id = match[1];

    const res = await connectGoogleSheetById(id);
    if (res.success) {
      setSyncStatusMsg({ type: 'success', text: res.message || 'Berhasil terhubung ke spreadsheet!' });
      setExistingSheetInput('');
    } else {
      setSyncStatusMsg({ type: 'error', text: res.message || 'Gagal menghubungkan.' });
    }
  };

  const handleManualOAuthSync = async () => {
    setSyncStatusMsg(null);
    const res = await syncNowToGoogleSheets();
    if (res.success) {
      setSyncStatusMsg({ type: 'success', text: 'Sinkronisasi ke Google Sheets berhasil!' });
    } else {
      setSyncStatusMsg({ type: 'error', text: res.message || 'Gagal sinkronisasi.' });
    }
  };

  const handleLoadFromOAuthSheets = async () => {
    setSyncStatusMsg(null);
    const res = await loadDataFromGoogleSheets();
    if (res.success) {
      setSyncStatusMsg({ type: 'success', text: res.message || 'Data berhasil dimuat!' });
    } else {
      setSyncStatusMsg({ type: 'error', text: res.message || 'Gagal memuat data.' });
    }
  };

  const handleParseJsonConfig = () => {
    try {
      let cleaned = jsonConfigInput.trim();
      if (cleaned.includes('const firebaseConfig =')) {
        cleaned = cleaned.replace(/const\s+firebaseConfig\s*=\s*/, '').replace(/;$/, '');
      }
      const parsed = Function(`'use strict'; return (${cleaned})`)();
      if (parsed.apiKey) setApiKeyInput(parsed.apiKey);
      if (parsed.authDomain) setAuthDomainInput(parsed.authDomain);
      if (parsed.projectId) setProjectIdInput(parsed.projectId);
      if (parsed.appId) setAppIdInput(parsed.appId);
      setSyncStatusMsg({ type: 'success', text: 'Konfigurasi Firebase berhasil diekstrak!' });
    } catch {
      setSyncStatusMsg({ type: 'error', text: 'Format JSON/JS Firebase tidak valid.' });
    }
  };

  const handleSaveCustomFirebase = () => {
    if (!apiKeyInput.trim() || !authDomainInput.trim() || !projectIdInput.trim()) {
      setSyncStatusMsg({ type: 'error', text: 'Harap isi API Key, Auth Domain, dan Project ID.' });
      return;
    }
    const config: FirebaseAppConfig = {
      apiKey: apiKeyInput.trim(),
      authDomain: authDomainInput.trim(),
      projectId: projectIdInput.trim(),
      appId: appIdInput.trim() || undefined,
    };
    saveCustomFirebaseConfig(config);
    setIsCustomActive(true);
    setSyncStatusMsg({ type: 'success', text: 'Firebase pribadi disimpan! Silakan coba login.' });
    setShowConfigModal(false);
  };

  const handleResetToDefaultFirebase = () => {
    saveCustomFirebaseConfig(null);
    setApiKeyInput('');
    setAuthDomainInput('');
    setProjectIdInput('');
    setAppIdInput('');
    setJsonConfigInput('');
    setIsCustomActive(false);
    setSyncStatusMsg({ type: 'success', text: 'Kembali ke pengaturan Firebase sandbox bawaan.' });
  };

  const handleApplyDirectToken = () => {
    if (!directTokenInput.trim()) {
      setSyncStatusMsg({ type: 'error', text: 'Token akses tidak boleh kosong.' });
      return;
    }
    setDirectAccessToken(directTokenInput.trim(), 'Akses Token Manual');
    setSyncStatusMsg({ type: 'success', text: 'Token akses Google Sheets berhasil diterapkan!' });
    setDirectTokenInput('');
    setShowConfigModal(false);
    window.location.reload();
  };

  // -------------------------------------------------------------
  // BACKUP / RESTORE HANDLERS
  // -------------------------------------------------------------
  const handleDownloadBackup = () => {
    const jsonStr = exportDataJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${businessProfile.name.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setSyncStatusMsg({ type: 'success', text: 'File cadangan JSON berhasil diunduh.' });
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
      } catch {
        setSyncStatusMsg({ type: 'error', text: 'Gagal membaca berkas cadangan.' });
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const isAppsScriptConnected = Boolean(appsScriptConfig.webAppUrl && appsScriptConfig.webAppUrl.length > 20);

  return (
    <div className="bg-stone-900 border border-stone-800 rounded-xl p-5 sm:p-6 text-stone-100 shadow-lg space-y-6">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-800">
        <div className="flex items-center space-x-3">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <span>Integrasi Google Sheets Database</span>
              {isAppsScriptConnected && activeTab === 'appscript' && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>APPS SCRIPT AKTIF</span>
                </span>
              )}
            </h3>
            <p className="text-xs text-stone-400">
              Sinkronisasi 2 arah untuk Inventory Bahan Baku, Resep &amp; HPP, Katalog Produk, Pesanan POS, dan Batch Produksi.
            </p>
          </div>
        </div>

        {/* Quick Stats Summary */}
        <div className="flex items-center space-x-2 text-xs">
          <div className="bg-stone-950/70 border border-stone-800 px-3 py-1.5 rounded-lg text-stone-300 flex items-center space-x-2">
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span>{(ingredients || []).length} Bahan</span>
            <span className="text-stone-600">•</span>
            <span>{(orders || []).length} Order</span>
          </div>
        </div>
      </div>

      {/* Main Mode Selector: Apps Script (Recommended) vs OAuth Direct */}
      <div className="flex flex-wrap gap-2 border-b border-stone-800 pb-3">
        <button
          onClick={() => setActiveTab('appscript')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === 'appscript'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-300" />
          <span>Metode 1: Google Apps Script Web App (Paling Simpel &amp; Anti-Gagal)</span>
          <span className="bg-amber-400 text-stone-950 px-1.5 py-0.2 rounded text-[10px] font-black uppercase">
            Rekomendasi
          </span>
        </button>

        <button
          onClick={() => setActiveTab('oauth')}
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-xs font-bold transition ${
            activeTab === 'oauth'
              ? 'bg-amber-500 text-stone-950 shadow-sm'
              : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
          }`}
        >
          <Globe className="w-4 h-4" />
          <span>Metode 2: Google OAuth / Firebase Login</span>
        </button>
      </div>

      {/* Feedback Status Alert */}
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
            <p className="font-semibold">{syncStatusMsg.text}</p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: GOOGLE APPS SCRIPT WEB APP (SUPER SIMPLE - NO FIREBASE / NO POPUP) */}
      {/* ========================================================================= */}
      {activeTab === 'appscript' && (
        <div className="space-y-6">
          {/* Card 1: Web App URL Configuration */}
          <div className="bg-stone-950/70 border border-stone-800 rounded-xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="space-y-0.5">
                <label className="text-xs font-bold text-stone-200 flex items-center space-x-1.5">
                  <Link2 className="w-4 h-4 text-emerald-400" />
                  <span>URL Web App Google Apps Script</span>
                </label>
                <p className="text-[11px] text-stone-400">
                  Tempel URL Web App dari Google Sheets Anda di sini. Bekerja 100% langsung di domain Vercel, HP, dan Browser mana saja tanpa popup.
                </p>
              </div>

              {appsScriptConfig.spreadsheetUrl && (
                <a
                  href={appsScriptConfig.spreadsheetUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-emerald-400 rounded-lg text-xs font-semibold border border-stone-700 transition self-start sm:self-auto"
                >
                  <span>Buka Spreadsheet</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={webAppUrlInput}
                onChange={(e) => setWebAppUrlInput(e.target.value)}
                placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                className="flex-1 bg-stone-900 border border-stone-700 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-emerald-400 font-mono"
              />
              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleSaveAppsScriptUrl}
                  className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-bold transition border border-stone-700"
                >
                  Simpan URL
                </button>
                <button
                  type="button"
                  onClick={handleTestAppsScript}
                  disabled={isAppsScriptSyncing}
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow-sm disabled:opacity-50 flex items-center space-x-1.5"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isAppsScriptSyncing ? 'animate-spin' : ''}`} />
                  <span>{isAppsScriptSyncing ? 'Menguji...' : 'Uji Koneksi'}</span>
                </button>
              </div>
            </div>

            {/* Sync Controls if connected */}
            {isAppsScriptConnected && (
              <div className="pt-3 border-t border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={handlePushAppsScript}
                    disabled={isAppsScriptSyncing}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition disabled:opacity-50 shadow-sm"
                  >
                    <ArrowUpFromLine className={`w-3.5 h-3.5 ${isAppsScriptSyncing ? 'animate-spin' : ''}`} />
                    <span>{isAppsScriptSyncing ? 'Menyinkronkan...' : 'Kirim Semua Data (Push Sync)'}</span>
                  </button>

                  <button
                    onClick={handlePullAppsScript}
                    disabled={isAppsScriptSyncing}
                    className="inline-flex items-center space-x-1.5 px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-semibold transition border border-stone-700 disabled:opacity-50"
                  >
                    <ArrowDownToLine className={`w-3.5 h-3.5 ${isAppsScriptSyncing ? 'animate-spin' : ''}`} />
                    <span>{isAppsScriptSyncing ? 'Membaca...' : 'Tarik Data dari Sheets (Pull)'}</span>
                  </button>
                </div>

                <div className="text-[11px] text-stone-400">
                  Terakhir Sinkron: <span className="text-emerald-300 font-semibold">{appsScriptConfig.lastSyncedAt || 'Belum pernah'}</span>
                </div>
              </div>
            )}

            {/* Auto-Sync Option */}
            <div className="pt-2">
              <label className="flex items-center space-x-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={appsScriptConfig.autoSyncOrders}
                  onChange={(e) => updateAppsScriptConfig({ autoSyncOrders: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400 bg-stone-900 border-stone-700"
                />
                <span className="text-xs text-stone-300 font-medium">
                  Otomatis kirim setiap transaksi penjualan Kasir (POS) baru langsung ke Google Sheets
                </span>
              </label>
            </div>
          </div>

          {/* Card 2: 1-Minute Step by Step Guide & Copy Script */}
          <div className="bg-stone-950/50 border border-emerald-800/40 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-stone-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold">
                  ⚡
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">
                    Panduan 1 Menit Menghubungkan Google Spreadsheet
                  </h4>
                  <p className="text-[11px] text-stone-400">
                    Tidak memerlukan setup Google Cloud / Firebase / OAuth yang rumit.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyCode}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold rounded-lg text-xs transition shadow-sm"
              >
                {copiedScript ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                <span>{copiedScript ? '✓ Kode Script Tersalin!' : '1. Salin Kode Apps Script'}</span>
              </button>
            </div>

            {/* Steps */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-stone-900/80 border border-stone-800 rounded-lg p-3 space-y-1">
                <div className="text-emerald-400 font-bold flex items-center justify-between">
                  <span>Langkah 1</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
                <p className="text-stone-300 font-semibold">Buat Spreadsheet</p>
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  Buka{' '}
                  <a
                    href="https://sheets.new"
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-400 underline font-bold"
                  >
                    sheets.new
                  </a>{' '}
                  di browser Anda untuk membuat Spreadsheet kosong baru.
                </p>
              </div>

              <div className="bg-stone-900/80 border border-stone-800 rounded-lg p-3 space-y-1">
                <div className="text-emerald-400 font-bold">Langkah 2</div>
                <p className="text-stone-300 font-semibold">Buka Apps Script</p>
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  Di Google Sheets, klik menu <strong>Extensions (Ekstensi)</strong> ➔ <strong>Apps Script</strong>.
                </p>
              </div>

              <div className="bg-stone-900/80 border border-stone-800 rounded-lg p-3 space-y-1">
                <div className="text-emerald-400 font-bold">Langkah 3</div>
                <p className="text-stone-300 font-semibold">Tempel &amp; Deploy</p>
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  Hapus kode default, tempel kode yang sudah disalin. Klik <strong>Deploy</strong> (Terapkan) ➔ <strong>New deployment</strong> ➔ pilih <strong>Web app</strong>.
                </p>
              </div>

              <div className="bg-stone-900/80 border border-stone-800 rounded-lg p-3 space-y-1">
                <div className="text-emerald-400 font-bold">Langkah 4</div>
                <p className="text-stone-300 font-semibold">Set "Anyone" &amp; Selesai</p>
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  Pilih <em>Who has access:</em> <strong>Anyone</strong> (Siapa saja). Salin <strong>Web app URL</strong> lalu tempel di kotak di atas.
                </p>
              </div>
            </div>

            {/* Collapsible Script Code Preview */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowCodePreview(!showCodePreview)}
                className="text-xs text-stone-400 hover:text-stone-200 flex items-center space-x-1.5 underline"
              >
                <Code2 className="w-3.5 h-3.5 text-amber-400" />
                <span>{showCodePreview ? 'Sembunyikan Cuplikan Kode Script' : 'Lihat / Periksa Kode Apps Script Lengkap'}</span>
              </button>

              {showCodePreview && (
                <div className="mt-3 bg-stone-950 border border-stone-800 rounded-lg p-3 relative">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-800 text-[11px] text-stone-400">
                    <span>Google Apps Script (Code.gs)</span>
                    <button
                      onClick={handleCopyCode}
                      className="px-2 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-[10px] font-bold"
                    >
                      {copiedScript ? '✓ Tersalin' : 'Salin Kode'}
                    </button>
                  </div>
                  <pre className="text-[10px] font-mono text-stone-300 overflow-x-auto max-h-60 mt-2 p-2 bg-stone-900/70 rounded">
                    {appsScriptTemplateCode}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: GOOGLE OAUTH / FIREBASE LOGIN METHOD */}
      {/* ========================================================================= */}
      {activeTab === 'oauth' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-stone-950/70 border border-stone-800 rounded-xl">
            <div>
              <div className="text-xs font-bold text-stone-200">Status Autentikasi Google OAuth</div>
              <p className="text-[11px] text-stone-400">
                Memerlukan Google Cloud &amp; Firebase Project dengan konfigurasi domain yang diizinkan.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowConfigModal(!showConfigModal)}
                className={`inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                  isCustomActive
                    ? 'bg-amber-400/10 border-amber-400/40 text-amber-300 hover:bg-amber-400/20'
                    : 'bg-stone-800 border-stone-700 text-stone-300 hover:bg-stone-700'
                }`}
              >
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                <span>{isCustomActive ? 'Firebase Kustom Aktif' : 'Setup Kredensial Vercel'}</span>
              </button>

              {googleUser && (
                <button
                  onClick={signOutFromGoogle}
                  className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-rose-300 rounded-lg text-xs border border-stone-700 flex items-center space-x-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              )}
            </div>
          </div>

          {/* Modal Setup Firebase */}
          {showConfigModal && (
            <div className="bg-stone-950 border border-amber-500/40 rounded-xl p-5 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-stone-800 pb-3">
                <div className="flex items-center space-x-2">
                  <KeyRound className="w-5 h-5 text-amber-400" />
                  <h4 className="text-sm font-bold text-white">Konfigurasi Firebase Pribadi untuk Vercel</h4>
                </div>
                <button
                  onClick={() => setShowConfigModal(false)}
                  className="text-stone-400 hover:text-white text-xs px-2 py-1 bg-stone-900 rounded border border-stone-800"
                >
                  ✕ Tutup
                </button>
              </div>

              <div className="space-y-3">
                <textarea
                  rows={2}
                  value={jsonConfigInput}
                  onChange={(e) => setJsonConfigInput(e.target.value)}
                  placeholder="Tempel const firebaseConfig = { apiKey: '...', authDomain: '...', projectId: '...' };"
                  className="w-full bg-stone-900 border border-stone-700 rounded-lg p-2 text-xs font-mono text-white focus:border-amber-400 focus:outline-none"
                />
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={handleParseJsonConfig}
                    className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-amber-300 rounded-lg text-xs font-bold border border-stone-700"
                  >
                    Ekstrak Form
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCustomFirebase}
                    className="px-4 py-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-lg text-xs font-bold"
                  >
                    Simpan Firebase Pribadi
                  </button>
                  {isCustomActive && (
                    <button
                      type="button"
                      onClick={handleResetToDefaultFirebase}
                      className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs border border-stone-700"
                    >
                      Reset Default
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* User Not Logged In */}
          {!googleUser ? (
            <div className="bg-stone-950/50 border border-stone-800/80 rounded-lg p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-stone-800/80 border border-stone-700 flex items-center justify-center mx-auto text-amber-400">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h4 className="text-sm font-bold text-stone-200">Login dengan Akun Google</h4>
                <p className="text-xs text-stone-400">
                  Pilih salah satu metode login Google di bawah ini.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-lg text-xs font-bold transition disabled:opacity-50"
                >
                  <span>Masuk via Popup</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={handleGoogleSignInRedirect}
                  disabled={isGoogleLoading}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-semibold border border-stone-700 transition disabled:opacity-50"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
                  <span>Masuk via Halaman Penuh (Redirect)</span>
                </button>
              </div>
            </div>
          ) : (
            /* Logged in OAuth state */
            <div className="space-y-4">
              {googleSheetsConfig.spreadsheetId ? (
                <div className="bg-stone-950/80 border border-emerald-500/30 rounded-lg p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="text-[10px] text-emerald-400 uppercase font-bold tracking-wider">
                      Google Spreadsheet OAuth Terhubung
                    </div>
                    <h4 className="text-sm font-bold text-white">
                      {googleSheetsConfig.spreadsheetTitle || 'PUSAKA Bakery Database'}
                    </h4>
                    <div className="text-xs text-stone-400">ID: {googleSheetsConfig.spreadsheetId}</div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={handleManualOAuthSync}
                      disabled={isGoogleSyncing}
                      className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
                    >
                      Kirim Data (Push)
                    </button>
                    <button
                      onClick={handleLoadFromOAuthSheets}
                      disabled={isGoogleSyncing}
                      className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold"
                    >
                      Baca Data (Pull)
                    </button>
                    <button
                      onClick={disconnectGoogleSheet}
                      className="px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-lg text-xs border border-stone-700"
                    >
                      Putuskan
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-stone-950/60 border border-stone-800 rounded-lg p-4 space-y-4">
                  <div className="flex border-b border-stone-800 pb-2 gap-4">
                    <button
                      onClick={() => setOauthMode('create')}
                      className={`text-xs font-bold pb-1 ${oauthMode === 'create' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-stone-400'}`}
                    >
                      Buat Spreadsheet Baru
                    </button>
                    <button
                      onClick={() => setOauthMode('connect')}
                      className={`text-xs font-bold pb-1 ${oauthMode === 'connect' ? 'text-amber-400 border-b-2 border-amber-400' : 'text-stone-400'}`}
                    >
                      Hubungkan Spreadsheet ID
                    </button>
                  </div>

                  {oauthMode === 'create' ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-white"
                      />
                      <button
                        onClick={handleCreateOAuthSheet}
                        disabled={isGoogleSyncing}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold"
                      >
                        Buat &amp; Sinkronkan Sekarang
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={existingSheetInput}
                        onChange={(e) => setExistingSheetInput(e.target.value)}
                        placeholder="Spreadsheet ID atau Link URL"
                        className="w-full bg-stone-900 border border-stone-700 rounded-lg px-3 py-2 text-xs text-white"
                      />
                      <button
                        onClick={handleConnectOAuthSheet}
                        disabled={isGoogleSyncing}
                        className="w-full py-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-lg text-xs font-bold"
                      >
                        Hubungkan ke Spreadsheet
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* OFFLINE BACKUP & RESTORE SECTION */}
      {/* ========================================================================= */}
      <div className="pt-4 border-t border-stone-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-0.5">
          <div className="font-semibold text-stone-300 flex items-center space-x-1.5">
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span>Cadangan &amp; Ekspor Data Lokal (Offline JSON Backup)</span>
          </div>
          <p className="text-[11px] text-stone-500">
            Simpan salinan database lengkap ke file lokal komputer atau pulihkan kapan saja tanpa memerlukan koneksi internet.
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
