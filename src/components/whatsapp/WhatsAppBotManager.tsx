import React, { useState, useRef, useEffect } from 'react';
import { useBakery } from '../../context/BakeryContext';
import {
  MessageSquare,
  Send,
  RotateCcw,
  Smartphone,
  CheckCircle2,
  Phone,
  MapPin,
  Package,
  UserCheck,
  ExternalLink,
  Code2,
  Copy,
  Check,
  Store,
  Sparkles,
  ArrowRight,
  Clock,
  ShoppingCart,
  Layers,
  Settings2,
  ShieldCheck,
  AlertCircle,
  QrCode,
  Wifi,
  WifiOff,
  RefreshCw,
  Zap,
  Info
} from 'lucide-react';
import { formatRupiah } from '../../utils/formatters';
import { WhatsAppBotService } from '../../services/whatsappBotService';

export const WhatsAppBotManager: React.FC<{ onNavigateToPos?: () => void }> = ({ onNavigateToPos }) => {
  const {
    businessProfile,
    updateBusinessProfile,
    products,
    whatsappSessions,
    sendWhatsAppSimulatorMessage,
    resetWhatsAppSession,
    toggleWhatsAppAdminHandoff,
    activeWhatsAppPhone,
    setActiveWhatsAppPhone,
    orders,
  } = useBakery();

  const [activeSubTab, setActiveSubTab] = useState<'baileys' | 'simulator' | 'config' | 'sessions' | 'webhook'>('baileys');
  const [inputText, setInputText] = useState('');
  const [selectedPhone, setSelectedPhone] = useState(activeWhatsAppPhone || '081298765432');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);
  const [lastCreatedOrderInvoice, setLastCreatedOrderInvoice] = useState<string | null>(null);

  // Baileys Live State
  const [baileysStatus, setBaileysStatus] = useState<{
    status: 'DISCONNECTED' | 'SCAN_QR' | 'CONNECTING' | 'CONNECTED';
    qrCodeUrl: string | null;
    rawQr: string | null;
    connectedPhone: string | null;
    connectedName: string | null;
    lastConnectedTime: string | null;
    lastErrorMessage: string | null;
  }>({
    status: 'DISCONNECTED',
    qrCodeUrl: null,
    rawQr: null,
    connectedPhone: null,
    connectedName: null,
    lastConnectedTime: null,
    lastErrorMessage: null,
  });
  const [loadingBaileys, setLoadingBaileys] = useState(false);
  const [testPhone, setTestPhone] = useState('081234567890');
  const [testMsg, setTestMsg] = useState('Halo! Ini pesan tes otomatis dari PUSAKA Bakery.');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Custom Backend URL (for Vercel frontend connecting to Railway/Render/VPS backend)
  const [customBackendUrl, setCustomBackendUrl] = useState<string>(() => {
    return localStorage.getItem('pusaka_backend_api_url') || (import.meta as any).env?.VITE_API_URL || '';
  });
  const [showServerConfig, setShowServerConfig] = useState<boolean>(false);
  const [serverPingStatus, setServerPingStatus] = useState<{ testing: boolean; message: string | null; success?: boolean }>({
    testing: false,
    message: null,
  });

  const getApiUrl = (endpoint: string) => {
    const base = (customBackendUrl || '').trim().replace(/\/+$/, '');
    return `${base}${endpoint}`;
  };

  const handleSaveBackendUrl = (newUrl: string) => {
    const trimmed = newUrl.trim().replace(/\/+$/, '');
    setCustomBackendUrl(trimmed);
    if (trimmed) {
      localStorage.setItem('pusaka_backend_api_url', trimmed);
    } else {
      localStorage.removeItem('pusaka_backend_api_url');
    }
  };

  const handleTestBackendPing = async () => {
    setServerPingStatus({ testing: true, message: null });
    try {
      const pingUrl = getApiUrl('/api/health');
      const res = await fetch(pingUrl, {
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setServerPingStatus({
          testing: false,
          success: true,
          message: `Terhubung ke Backend! (${data.service || 'Server Aktif'})`,
        });
      } else {
        setServerPingStatus({
          testing: false,
          success: false,
          message: `Gagal: Server merespons HTTP ${res.status}`,
        });
      }
    } catch (err: any) {
      setServerPingStatus({
        testing: false,
        success: false,
        message: `Koneksi gagal: Pastikan server di Railway/Render sudah online dan URL benar.`,
      });
    }
  };

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch Baileys status with robust error handling and AbortController
  const fetchBaileysStatus = async (signal?: AbortSignal) => {
    try {
      const res = await fetch(getApiUrl('/api/baileys/status'), {
        signal,
        headers: { 'Accept': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object' && data.status) {
          setBaileysStatus(data);
        }
      }
    } catch (e: any) {
      // Ignore AbortError on unmount or tab switch
      if (e?.name === 'AbortError') return;
      // Graceful fallback without triggering unhandled console error banners
    }
  };

  // Poll Baileys status only when the Baileys tab is active
  useEffect(() => {
    if (activeSubTab !== 'baileys') return;

    const controller = new AbortController();
    fetchBaileysStatus(controller.signal);

    const interval = setInterval(() => {
      fetchBaileysStatus(controller.signal);
    }, 5000);

    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [activeSubTab, customBackendUrl]);

  const handleConnectBaileys = async () => {
    setLoadingBaileys(true);
    try {
      const res = await fetch(getApiUrl('/api/baileys/connect'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setBaileysStatus(data);
      }
    } catch (e: any) {
      // Graceful error state update
      setBaileysStatus((prev) => ({
        ...prev,
        status: 'DISCONNECTED',
        lastErrorMessage: 'Server Baileys tidak dapat dihubungi. Pastikan server Railway/Render aktif.',
      }));
    } finally {
      setLoadingBaileys(false);
    }
  };

  const handleDisconnectBaileys = async () => {
    setLoadingBaileys(true);
    try {
      const res = await fetch(getApiUrl('/api/baileys/disconnect'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      });
      if (res.ok) {
        const data = await res.json();
        setBaileysStatus(data);
      }
    } catch (e: any) {
      setBaileysStatus((prev) => ({
        ...prev,
        status: 'DISCONNECTED',
      }));
    } finally {
      setLoadingBaileys(false);
    }
  };

  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone || !testMsg) return;
    setTestSending(true);
    setTestResult(null);
    try {
      const res = await fetch(getApiUrl('/api/baileys/send-test'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: testPhone, message: testMsg }),
      });
      const data = await res.json();
      if (res.ok) {
        setTestResult({ success: true, message: data.message || 'Pesan tes terkirim!' });
      } else {
        setTestResult({ success: false, message: data.error || 'Gagal mengirim pesan' });
      }
    } catch (e: any) {
      setTestResult({ success: false, message: e.message || 'Gagal mengirim pesan' });
    } finally {
      setTestSending(false);
    }
  };

  const currentSession = whatsappSessions.find((s) => s.customerPhone === selectedPhone) || {
    id: 'sess-default',
    customerPhone: selectedPhone,
    customerName: 'Pelanggan Baru',
    currentStep: 'MAIN_MENU',
    isHumanHandled: false,
    lastMessageTime: 'Baru saja',
    messages: [WhatsAppBotService.buildMainMenuMessage(businessProfile)],
  };

  const activeProducts = (products || []).filter((p) => p.status === 'active');

  // Auto scroll messages in simulator
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentSession.messages]);

  const handleSendMessage = async (textToSend?: string, payloadToSend?: string | null) => {
    const text = textToSend !== undefined ? textToSend : inputText;
    if (!text.trim() && !payloadToSend) return;

    setInputText('');
    const res = await sendWhatsAppSimulatorMessage(selectedPhone, text, payloadToSend);

    if (res.orderCreated) {
      setLastCreatedOrderInvoice(res.orderCreated.invoiceNumber);
    }
  };

  const handleButtonClick = (payload: string, label: string) => {
    handleSendMessage(label, payload);
  };

  const handleResetCurrent = () => {
    resetWhatsAppSession(selectedPhone);
    setLastCreatedOrderInvoice(null);
  };

  const handleCopyWebhookCode = () => {
    const code = WhatsAppBotService.generateExpressWebhookCode(
      businessProfile,
      window.location.origin
    );
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  // Recent WhatsApp Orders
  const whatsappOrders = (orders || []).filter(
    (o) => o.cashierName?.includes('WhatsApp') || o.notes?.includes('WhatsApp')
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                WhatsApp Automation Hub
              </span>
              <span className="text-xs font-bold text-stone-700 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                100% Menu & Data SaaS (Tanpa AI)
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900">
              WhatsApp Bot Interaktif 4 Pilihan
            </h1>
            <p className="text-xs text-stone-600 max-w-3xl">
              Melayani pemesanan langsung dari katalog SaaS, memberikan petunjuk lokasi toko & Google Maps, menampilkan varian bolu, serta pengalihan langsung ke Admin manusia.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <div className="text-[11px] text-stone-500">Sinkronisasi Data</div>
              <div className="text-xs font-bold text-emerald-700 flex items-center justify-end gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {activeProducts.length} Produk Aktif SaaS
              </div>
            </div>
            <button
              onClick={() => handleSendMessage('0', 'MENU_HOME')}
              className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-lg border border-stone-300 transition flex items-center gap-1.5"
              title="Kirim reset menu utama"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Simulator</span>
            </button>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-2 mt-5 pt-4 border-t border-stone-100 overflow-x-auto">
          <button
            onClick={() => setActiveSubTab('baileys')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'baileys'
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/20'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <QrCode className="w-4 h-4 text-amber-300" />
            <span>⚡ Scan QR WhatsApp (Baileys Open-Source)</span>
            <span className="text-[10px] bg-emerald-700 text-white px-1.5 py-0.5 rounded font-mono">100% Gratis</span>
          </button>

          <button
            onClick={() => setActiveSubTab('simulator')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'simulator'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            <span>📱 Simulator WhatsApp (Live Test)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('config')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'config'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Settings2 className="w-4 h-4" />
            <span>⚙️ Struktur 4 Menu & Data SaaS</span>
          </button>

          <button
            onClick={() => setActiveSubTab('sessions')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'sessions'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>📋 Riwayat Chat & Pesanan WA ({whatsappSessions.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('webhook')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === 'webhook'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>🔌 Integrasi Gateway (Fonnte / Meta)</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 0: SCAN QR WHATSAPP ASLI (BAILEYS OPEN SOURCE) */}
      {/* ========================================================================= */}
      {activeSubTab === 'baileys' && (
        <div className="space-y-6">
          {/* Status & Connection Card */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-100 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5 fill-emerald-600" />
                    Baileys Engine Active
                  </span>
                  <span className="text-xs font-semibold text-stone-500 bg-stone-100 px-2 py-0.5 rounded border border-stone-200">
                    Bebas Biaya Gateway & Tanpa Syarat PT/CV
                  </span>
                </div>
                <h2 className="text-lg font-bold text-stone-900">
                  Hubungkan Nomor WhatsApp Toko / Bisnis Anda
                </h2>
                <p className="text-xs text-stone-600 max-w-2xl">
                  Cukup scan QR code sekali menggunakan WhatsApp di HP toko Anda. Bot otomatis aktif membalas menu 1–4 dan mencatat pesanan ke POS tanpa perantara gateway berbayar.
                </p>
              </div>

              {/* Status Badge */}
              <div>
                {baileysStatus.status === 'CONNECTED' ? (
                  <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-300 text-emerald-800 px-4 py-2.5 rounded-xl shadow-sm">
                    <Wifi className="w-5 h-5 text-emerald-600 animate-pulse" />
                    <div>
                      <div className="text-xs font-black uppercase tracking-wider text-emerald-900">WhatsApp Tersambung</div>
                      <div className="text-xs font-mono font-bold text-emerald-700">+{baileysStatus.connectedPhone || '628xxxx'}</div>
                    </div>
                  </div>
                ) : baileysStatus.status === 'SCAN_QR' ? (
                  <div className="flex items-center gap-2 bg-amber-50 border border-amber-300 text-amber-900 px-4 py-2.5 rounded-xl shadow-sm">
                    <QrCode className="w-5 h-5 text-amber-600" />
                    <div>
                      <div className="text-xs font-black uppercase tracking-wider text-amber-900">Menunggu Scan QR</div>
                      <div className="text-[11px] text-amber-700">Arahkan kamera WhatsApp HP Anda</div>
                    </div>
                  </div>
                ) : baileysStatus.status === 'CONNECTING' ? (
                  <div className="flex items-center gap-2 bg-blue-50 border border-blue-300 text-blue-900 px-4 py-2.5 rounded-xl shadow-sm">
                    <RefreshCw className="w-5 h-5 text-blue-600 animate-spin" />
                    <div>
                      <div className="text-xs font-black uppercase tracking-wider text-blue-900">Menghubungkan...</div>
                      <div className="text-[11px] text-blue-700">Sedang memproses socket WhatsApp</div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 bg-stone-100 border border-stone-300 text-stone-700 px-4 py-2.5 rounded-xl">
                    <WifiOff className="w-5 h-5 text-stone-500" />
                    <div>
                      <div className="text-xs font-black uppercase tracking-wider text-stone-800">Belum Terhubung</div>
                      <div className="text-[11px] text-stone-500">Klik tombol Mulai Scan QR di bawah</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Error Banner if any */}
            {baileysStatus.lastErrorMessage && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{baileysStatus.lastErrorMessage}</span>
              </div>
            )}

            {/* Backend Server Configuration for Railway / Vercel Split */}
            <div className="bg-stone-50 rounded-xl border border-stone-200 p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${customBackendUrl ? 'bg-purple-500' : 'bg-blue-500'}`}></div>
                  <span className="text-xs font-bold text-stone-800">
                    Target Server Backend: {customBackendUrl ? (
                      <span className="text-purple-700 font-mono font-normal">{customBackendUrl}</span>
                    ) : (
                      <span className="text-stone-500 font-normal">Lokal / Preview Terpadu (Relative)</span>
                    )}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowServerConfig(!showServerConfig)}
                  className="text-xs font-semibold text-stone-700 hover:text-stone-900 bg-white border border-stone-200 px-2.5 py-1 rounded-lg hover:bg-stone-100 flex items-center gap-1.5 shadow-sm transition"
                >
                  <Settings2 className="w-3.5 h-3.5 text-stone-500" />
                  {showServerConfig ? 'Tutup Pengaturan Server' : 'Atur URL Server Railway/Render'}
                </button>
              </div>

              {showServerConfig && (
                <div className="pt-2 border-t border-stone-200 space-y-3">
                  <p className="text-[11px] text-stone-600 leading-relaxed">
                    💡 <strong>Tips Vercel + Railway:</strong> Jika Frontend di-deploy di Vercel dan Backend Baileys di-deploy di Railway / Render, masukkan URL publik Railway Anda di sini (contoh: <code className="bg-stone-200 px-1 py-0.5 rounded text-stone-800 font-mono">https://pusaka-backend-production.up.railway.app</code>).
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="url"
                      value={customBackendUrl}
                      onChange={(e) => setCustomBackendUrl(e.target.value)}
                      placeholder="https://pusaka-backend-production.up.railway.app"
                      className="flex-1 px-3 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-mono text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleSaveBackendUrl(customBackendUrl)}
                        className="px-3 py-1.5 bg-stone-900 text-white rounded-lg text-xs font-semibold hover:bg-stone-800 transition shadow-sm"
                      >
                        Simpan URL
                      </button>
                      <button
                        type="button"
                        onClick={handleTestBackendPing}
                        disabled={serverPingStatus.testing}
                        className="px-3 py-1.5 bg-white border border-stone-300 text-stone-700 rounded-lg text-xs font-semibold hover:bg-stone-50 transition shadow-sm flex items-center gap-1.5"
                      >
                        {serverPingStatus.testing ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Wifi className="w-3 h-3 text-emerald-600" />}
                        Test Koneksi
                      </button>
                      {customBackendUrl && (
                        <button
                          type="button"
                          onClick={() => handleSaveBackendUrl('')}
                          className="px-2.5 py-1.5 text-stone-500 hover:text-red-600 rounded-lg text-xs"
                          title="Reset ke default"
                        >
                          Reset
                        </button>
                      )}
                    </div>
                  </div>
                  {serverPingStatus.message && (
                    <div className={`p-2 rounded-lg text-xs flex items-center gap-2 ${
                      serverPingStatus.success
                        ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                        : 'bg-red-50 border border-red-200 text-red-800'
                    }`}>
                      {serverPingStatus.success ? <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" /> : <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />}
                      <span>{serverPingStatus.message}</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Main Interactive Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: QR Code Container or Connected Info (6 cols) */}
              <div className="lg:col-span-6 bg-stone-50 rounded-2xl border border-stone-200 p-6 flex flex-col items-center justify-center text-center relative min-h-[380px]">
                {baileysStatus.status === 'CONNECTED' ? (
                  <div className="space-y-4 py-6 max-w-sm">
                    <div className="w-20 h-20 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-200">
                      <CheckCircle2 className="w-10 h-10" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-stone-900">Perangkat WhatsApp Aktif!</h3>
                      <p className="text-xs text-stone-600">
                        Bot WhatsApp PUSAKA siap membalas otomatis setiap pesan masuk ke nomor toko Anda.
                      </p>
                    </div>

                    <div className="bg-white p-4 rounded-xl border border-stone-200 text-left text-xs space-y-2">
                      <div className="flex justify-between border-b border-stone-100 pb-1.5">
                        <span className="text-stone-500">Nomor WhatsApp:</span>
                        <span className="font-bold text-stone-800 font-mono">+{baileysStatus.connectedPhone || '-'}</span>
                      </div>
                      <div className="flex justify-between border-b border-stone-100 pb-1.5">
                        <span className="text-stone-500">Nama Perangkat:</span>
                        <span className="font-bold text-stone-800">{baileysStatus.connectedName || 'PUSAKA Bakery'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-stone-500">Status State Machine:</span>
                        <span className="font-bold text-emerald-700">100% Deterministic (4 Menu)</span>
                      </div>
                    </div>

                    <button
                      onClick={handleDisconnectBaileys}
                      disabled={loadingBaileys}
                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 w-full"
                    >
                      <WifiOff className="w-3.5 h-3.5" />
                      <span>{loadingBaileys ? 'Memutuskan...' : 'Putuskan Koneksi (Logout)'}</span>
                    </button>
                  </div>
                ) : baileysStatus.status === 'SCAN_QR' && baileysStatus.qrCodeUrl ? (
                  <div className="space-y-4 py-2">
                    <div className="relative p-3 bg-white rounded-2xl shadow-md border border-stone-300 inline-block">
                      <img
                        src={baileysStatus.qrCodeUrl}
                        alt="WhatsApp Scan QR"
                        className="w-64 h-64 mx-auto rounded-lg object-contain"
                      />
                    </div>
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-stone-800 flex items-center justify-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                        QR Code Siap Discan
                      </div>
                      <p className="text-[11px] text-stone-500 max-w-xs">
                        QR akan diperbarui otomatis jika sesi kedaluwarsa.
                      </p>
                    </div>

                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={handleConnectBaileys}
                        disabled={loadingBaileys}
                        className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingBaileys ? 'animate-spin' : ''}`} />
                        <span>Refresh QR Baru</span>
                      </button>
                      <button
                        onClick={handleDisconnectBaileys}
                        className="px-3.5 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-lg text-xs font-bold transition"
                      >
                        Batal
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 py-8 max-w-sm">
                    <div className="w-20 h-20 bg-stone-200 text-stone-600 rounded-full flex items-center justify-center mx-auto border border-stone-300">
                      <QrCode className="w-10 h-10" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-stone-900">Belum Terhubung ke WhatsApp</h3>
                      <p className="text-xs text-stone-600">
                        Klik tombol di bawah untuk men-generate kode QR Baileys langsung dari server.
                      </p>
                    </div>
                    <button
                      onClick={handleConnectBaileys}
                      disabled={loadingBaileys}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md w-full"
                    >
                      {loadingBaileys ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Menyiapkan Engine Baileys...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />
                          <span>Mulai Sambungkan & Tampilkan QR</span>
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Right Column: Step-by-Step Instructions & Test Tool (6 cols) */}
              <div className="lg:col-span-6 space-y-6">
                {/* 3 Step Instruction */}
                <div className="bg-stone-50 rounded-2xl border border-stone-200 p-5 space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-stone-700 flex items-center gap-2">
                    <Info className="w-4 h-4 text-emerald-600" />
                    <span>Cara Menghubungkan WhatsApp di HP Toko</span>
                  </h4>

                  <div className="space-y-3 text-xs">
                    <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-stone-200">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-sm">
                        1
                      </span>
                      <div>
                        <strong className="text-stone-900 block font-semibold">Buka Aplikasi WhatsApp di HP Toko</strong>
                        <p className="text-stone-600 text-[11.5px] mt-0.5">
                          Buka WhatsApp pada HP yang nomornya digunakan untuk melayani pesanan bakery.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-stone-200">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-sm">
                        2
                      </span>
                      <div>
                        <strong className="text-stone-900 block font-semibold">Buka Menu Perangkat Tertaut (Linked Devices)</strong>
                        <p className="text-stone-600 text-[11.5px] mt-0.5">
                          <strong>Android:</strong> Ketuk ikon titik tiga (⋮) di kanan atas $\rightarrow$ <em>Perangkat Tertaut</em>.<br />
                          <strong>iPhone:</strong> Buka tab <em>Pengaturan</em> (Settings) $\rightarrow$ <em>Perangkat Tertaut</em>.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start gap-3 bg-white p-3 rounded-xl border border-stone-200">
                      <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-xs shadow-sm">
                        3
                      </span>
                      <div>
                        <strong className="text-stone-900 block font-semibold">Scan QR Code di Samping</strong>
                        <p className="text-stone-600 text-[11.5px] mt-0.5">
                          Ketuk <strong>Tautkan Perangkat</strong> lalu arahkan kamera HP Anda ke QR code. Setelah tersambung, bot langsung otomatis aktif 24/7.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Direct Test Send Form (Only active when connected) */}
                <div className="bg-white rounded-2xl border border-stone-200 p-5 space-y-4 shadow-sm">
                  <h4 className="text-xs font-black uppercase tracking-wider text-stone-700 flex items-center gap-2">
                    <Send className="w-4 h-4 text-emerald-600" />
                    <span>Kirim Pesan Uji Coba WhatsApp Langsung</span>
                  </h4>
                  <p className="text-xs text-stone-500">
                    Kirimkan pesan tes ke nomor pribadi Anda untuk memastikan koneksi Baileys berjalan sempurna.
                  </p>

                  <form onSubmit={handleSendTestMessage} className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">Nomor WhatsApp Tujuan:</label>
                      <input
                        type="text"
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                        placeholder="Contoh: 081298765432"
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-stone-700 mb-1">Isi Pesan:</label>
                      <input
                        type="text"
                        value={testMsg}
                        onChange={(e) => setTestMsg(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    {testResult && (
                      <div
                        className={`p-2.5 rounded-lg text-xs flex items-center gap-1.5 ${
                          testResult.success
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-300'
                            : 'bg-rose-50 text-rose-800 border border-rose-300'
                        }`}
                      >
                        {testResult.success ? <Check className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                        <span>{testResult.message}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={testSending || baileysStatus.status !== 'CONNECTED'}
                      className={`w-full py-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        baileysStatus.status === 'CONNECTED'
                          ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                          : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                      }`}
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>
                        {testSending
                          ? 'Mengirim...'
                          : baileysStatus.status === 'CONNECTED'
                          ? 'Kirim Pesan Tes Sekarang'
                          : 'Scan QR Terlebih Dahulu untuk Mengirim'}
                      </span>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Highlights Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-1.5">
              <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4" />
                <span>100% Gratis Selamanya</span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Menggunakan protokol open-source Baileys langsung dari Node.js backend. Tidak ada biaya langganan bulanan gateway pihak ketiga.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-1.5">
              <div className="flex items-center gap-2 text-amber-700 font-bold text-xs">
                <Layers className="w-4 h-4" />
                <span>Sinkronisasi POS & Stok Otomatis</span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Setiap pelanggan menyelesaikan pesanan via WhatsApp, nomor faktur otomatis terbit dan stok bolu di POS berkurang secara real-time.
              </p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-1.5">
              <div className="flex items-center gap-2 text-blue-700 font-bold text-xs">
                <ShieldCheck className="w-4 h-4" />
                <span>Zero AI & Handoff Admin</span>
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Alur menu 1–4 berjalan pasti tanpa halusinasi AI. Saat pelanggan memilih Menu 4 (Chat Admin), bot langsung hening agar admin bisa mengetik manual.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: SIMULATOR WHATSAPP INTERAKTIF */}
      {/* ========================================================================= */}
      {activeSubTab === 'simulator' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* WhatsApp Smartphone Frame (7 cols) */}
          <div className="lg:col-span-7 bg-stone-900 rounded-[2.5rem] p-3 sm:p-4 shadow-2xl border-4 border-stone-800 relative max-w-lg mx-auto w-full">
            {/* Phone Speaker & Camera Notch */}
            <div className="w-32 h-4 bg-stone-800 rounded-full mx-auto mb-2 flex items-center justify-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-stone-900"></div>
              <div className="w-10 h-1.5 rounded-full bg-stone-900"></div>
            </div>

            {/* WhatsApp App Container */}
            <div className="bg-[#e5ddd5] rounded-[1.8rem] overflow-hidden flex flex-col h-[640px] sm:h-[680px] shadow-inner border border-stone-700">
              {/* WhatsApp Header */}
              <div className="bg-[#075e54] text-white px-4 py-3 flex items-center justify-between shadow-md z-10">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center font-black text-sm shadow">
                    🍌
                  </div>
                  <div>
                    <div className="font-bold text-sm leading-tight flex items-center gap-1.5">
                      <span>{businessProfile.name}</span>
                      <span className="text-[10px] bg-emerald-700 text-emerald-100 px-1.5 py-0.2 rounded font-normal">
                        Official
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-100 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-300"></span>
                      {currentSession.isHumanHandled ? '👨‍💼 Chat Admin Langsung' : 'Bot Otomatis (Menu Aktif)'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleResetCurrent}
                    className="p-1.5 hover:bg-[#128c7e] rounded-full text-white/90 hover:text-white transition"
                    title="Mulai Ulang Chat"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chat Messages Body */}
              <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
                {/* Notice Badge */}
                <div className="text-center my-1">
                  <span className="bg-amber-100/95 text-amber-900 text-[10px] font-medium px-3 py-1 rounded-md shadow-xs border border-amber-200 inline-block max-w-xs">
                    🔒 Chat terenkripsi. PUSAKA Bakery melayani order otomatis dari data SaaS.
                  </span>
                </div>

                {currentSession.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[88%] sm:max-w-[82%] rounded-xl p-3 text-xs shadow-sm relative ${
                        msg.sender === 'user'
                          ? 'bg-[#dcf8c6] text-stone-900 rounded-tr-none'
                          : 'bg-white text-stone-900 rounded-tl-none border border-stone-200'
                      }`}
                    >
                      {/* Header */}
                      {msg.header && (
                        <div className="font-bold text-[11px] text-emerald-800 pb-1 mb-1.5 border-b border-stone-100 flex items-center justify-between">
                          <span>{msg.header}</span>
                        </div>
                      )}

                      {/* Body Text */}
                      <div className="whitespace-pre-line text-[11.5px] leading-relaxed text-stone-800 font-sans">
                        {msg.text}
                      </div>

                      {/* Footer */}
                      {msg.footer && (
                        <div className="text-[9.5px] text-stone-400 mt-1 italic">
                          {msg.footer}
                        </div>
                      )}

                      {/* Interactive Buttons (WhatsApp Reply Buttons) */}
                      {msg.buttons && msg.buttons.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-stone-100 space-y-1.5">
                          {msg.buttons.map((btn) => (
                            <button
                              key={btn.id}
                              onClick={() => handleButtonClick(btn.payload, btn.label)}
                              className="w-full text-center py-2 px-3 bg-stone-50 hover:bg-emerald-50 active:bg-emerald-100 text-emerald-700 hover:text-emerald-800 text-[11px] font-bold rounded-lg border border-stone-200 hover:border-emerald-300 transition flex items-center justify-center gap-1.5 shadow-xs"
                            >
                              <span>{btn.label}</span>
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Timestamp */}
                      <div
                        className={`text-[9px] text-right mt-1 ${
                          msg.sender === 'user' ? 'text-stone-500' : 'text-stone-400'
                        }`}
                      >
                        {msg.timestamp} {msg.sender === 'user' && '✓✓'}
                      </div>
                    </div>
                  </div>
                ))}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Suggestion Chips */}
              <div className="bg-stone-100/90 px-3 py-1.5 border-t border-stone-200 flex items-center gap-1.5 overflow-x-auto text-[11px]">
                <span className="text-[10px] text-stone-500 font-bold whitespace-nowrap">Ketik Cepat:</span>
                <button
                  onClick={() => handleSendMessage('1', 'MENU_1_PESAN')}
                  className="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-800 rounded border border-stone-300 font-bold whitespace-nowrap"
                >
                  1. Pesan Bolu
                </button>
                <button
                  onClick={() => handleSendMessage('2', 'MENU_2_LOKASI')}
                  className="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-800 rounded border border-stone-300 font-bold whitespace-nowrap"
                >
                  2. Lokasi
                </button>
                <button
                  onClick={() => handleSendMessage('3', 'MENU_3_VARIAN')}
                  className="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-800 rounded border border-stone-300 font-bold whitespace-nowrap"
                >
                  3. Varian
                </button>
                <button
                  onClick={() => handleSendMessage('4', 'MENU_4_ADMIN')}
                  className="px-2 py-1 bg-white hover:bg-emerald-50 text-emerald-800 rounded border border-stone-300 font-bold whitespace-nowrap"
                >
                  4. Chat Admin
                </button>
                <button
                  onClick={() => handleSendMessage('0', 'MENU_HOME')}
                  className="px-2 py-1 bg-stone-200 hover:bg-stone-300 text-stone-700 rounded font-bold whitespace-nowrap"
                >
                  0. Menu Utama
                </button>
              </div>

              {/* Chat Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="bg-[#f0f0f0] p-2 sm:p-3 flex items-center space-x-2 border-t border-stone-200"
              >
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Ketik pesan / nomor menu (1, 2, 3, 4, YA)..."
                  className="flex-1 px-3.5 py-2.5 bg-white rounded-full border border-stone-300 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-stone-900"
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="w-10 h-10 rounded-full bg-[#128c7e] hover:bg-[#075e54] disabled:bg-stone-300 text-white flex items-center justify-center transition shadow-sm"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
            </div>
          </div>

          {/* Right Information & Simulation Control Panel (5 cols) */}
          <div className="lg:col-span-5 space-y-5">
            {/* Live Order Created Alert */}
            {lastCreatedOrderInvoice && (
              <div className="bg-emerald-50 border-2 border-emerald-400 rounded-xl p-4 shadow-sm animate-in fade-in">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-emerald-500 text-white rounded-lg">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-sm text-emerald-950">
                      Pesanan WhatsApp Berhasil Dibuat di SaaS!
                    </h4>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      Pesanan otomatis masuk ke Kasir POS dengan status <strong>PENDING</strong> dan nomor invoice <strong>#{lastCreatedOrderInvoice}</strong>.
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      {onNavigateToPos && (
                        <button
                          onClick={onNavigateToPos}
                          className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition flex items-center gap-1"
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>Buka Kasir POS & Pesanan</span>
                        </button>
                      )}
                      <button
                        onClick={() => setLastCreatedOrderInvoice(null)}
                        className="px-2.5 py-1.5 bg-white text-stone-600 text-xs rounded-lg border border-emerald-300 hover:bg-emerald-100/50 transition font-medium"
                      >
                        Tutup
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Test Customer Phone Switcher */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 text-xs space-y-3">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-emerald-600" />
                <span>Simulasi Nomor Konsumen</span>
              </h3>
              <p className="text-stone-500 text-[11px]">
                Pilih atau ganti nomor WhatsApp konsumen untuk menguji multi-sesi percakapan dan status order yang berbeda.
              </p>

              <div className="space-y-2">
                <label className="block font-bold text-stone-700">Nomor WhatsApp Penguji:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={selectedPhone}
                    onChange={(e) => {
                      setSelectedPhone(e.target.value);
                      setActiveWhatsAppPhone(e.target.value);
                    }}
                    placeholder="081298765432"
                    className="flex-1 px-3 py-2 border border-stone-300 rounded-lg font-mono text-xs focus:ring-2 focus:ring-emerald-400 focus:outline-none"
                  />
                  <button
                    onClick={handleResetCurrent}
                    className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-lg border border-stone-300 text-xs transition"
                  >
                    Reset Sesi
                  </button>
                </div>
              </div>

              {/* Status Session Card */}
              <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-stone-500">Tahap Sesi Saat Ini:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {currentSession.currentStep}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Status Handoff Admin:</span>
                  <span className={`font-bold ${currentSession.isHumanHandled ? 'text-amber-700' : 'text-stone-700'}`}>
                    {currentSession.isHumanHandled ? '👨‍💼 Ditangani Manusia (No AI)' : '🤖 Bot Menu Aktif'}
                  </span>
                </div>
                {currentSession.cartItem && (
                  <div className="pt-1.5 border-t border-stone-200 flex justify-between font-bold text-stone-900">
                    <span>Item Dipilih:</span>
                    <span>{currentSession.cartItem.productName} ({currentSession.cartItem.qty}x)</span>
                  </div>
                )}
              </div>
            </div>

            {/* How the 4 Menus Work Card */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 text-xs space-y-3">
              <h3 className="font-bold text-sm text-stone-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-amber-600" />
                <span>Alur Kerja 4 Menu WhatsApp (No AI)</span>
              </h3>

              <div className="space-y-2 text-[11.5px]">
                <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200">
                  <div className="font-bold text-emerald-950 flex items-center gap-1">
                    <span>1️⃣ Pesan Bolu</span>
                  </div>
                  <div className="text-stone-600 text-[11px] mt-0.5">
                    Mengambil {activeProducts.length} produk aktif dari SaaS $\rightarrow$ Pilih Jumlah $\rightarrow$ Delivery / Pickup $\rightarrow$ Alamat $\rightarrow$ Konfirmasi $\rightarrow$ <strong>Auto-insert ke POS & Google Sheets</strong>.
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200">
                  <div className="font-bold text-blue-950 flex items-center gap-1">
                    <span>2️⃣ 📍 Lokasi Toko/Pabrik</span>
                  </div>
                  <div className="text-stone-600 text-[11px] mt-0.5">
                    Kirim Alamat lengkap, Jam Buka, dan Link Google Maps toko dari Profil SaaS: <em>{businessProfile.address}</em>.
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-purple-50/70 border border-purple-200">
                  <div className="font-bold text-purple-950 flex items-center gap-1">
                    <span>3️⃣ 🍰 Jenis Varian Bolu</span>
                  </div>
                  <div className="text-stone-600 text-[11px] mt-0.5">
                    Informasi katalog varian, foto, ukuran gramasi, ketahanan, dan harga tanpa membuat order langsung.
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200">
                  <div className="font-bold text-amber-950 flex items-center gap-1">
                    <span>4️⃣ 👨‍💼 Chat dengan Admin</span>
                  </div>
                  <div className="text-stone-600 text-[11px] mt-0.5">
                    Pengalihan (handoff) langsung ke staf manusia via nomor WA: <strong>{businessProfile.adminWhatsAppPhone || businessProfile.phone}</strong>. AI tidak ikut andil sama sekali.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: CONFIG 4 MENUS & SAAS DATA MAPPING */}
      {/* ========================================================================= */}
      {activeSubTab === 'config' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Menu 1: Products Mapping */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                    1️⃣
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-stone-900">Menu 1: Pesan Bolu</h3>
                    <p className="text-[11px] text-stone-500">Otomatis sinkron dengan Katalog Produk Jadi di SaaS</p>
                  </div>
                </div>
                <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200">
                  {activeProducts.length} Produk Siap Jual
                </span>
              </div>

              <p className="text-xs text-stone-600 leading-relaxed">
                Ketika Anda menambah atau mengubah harga bolu di menu <strong>Katalog Produk Jadi</strong>, daftar di WhatsApp akan langsung terupdate secara otomatis tanpa perlu mengubah kode WhatsApp.
              </p>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {activeProducts.map((prod, idx) => (
                  <div
                    key={prod.id}
                    className="p-3 bg-stone-50 rounded-lg border border-stone-200 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-stone-900">{idx + 1}. {prod.name}</div>
                      <div className="text-stone-500 text-[11px]">
                        {prod.sizeSpec || `${prod.bakedWeightGram}g`} • Stok: {prod.stockFinishedGoods} box
                      </div>
                    </div>
                    <div className="font-bold text-emerald-700 font-mono">
                      {formatRupiah(prod.sellingPrice)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Menu 2: Store Location Mapping */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-sm">
                    2️⃣
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-stone-900">Menu 2: Lokasi Toko/Pabrik</h3>
                    <p className="text-[11px] text-stone-500">Sumber data dari Pengaturan Profil Usaha</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Nama Toko & Alamat:</label>
                  <input
                    type="text"
                    value={businessProfile.address}
                    onChange={(e) => updateBusinessProfile({ address: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Kota / Domisili:</label>
                    <input
                      type="text"
                      value={businessProfile.city}
                      onChange={(e) => updateBusinessProfile({ city: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-stone-700 mb-1">Jam Operasional:</label>
                    <input
                      type="text"
                      value={businessProfile.operatingHours || '07.00 - 20.00 WIB'}
                      onChange={(e) => updateBusinessProfile({ operatingHours: e.target.value })}
                      className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-stone-700 mb-1">Link Google Maps (URL):</label>
                  <input
                    type="text"
                    value={businessProfile.googleMapsUrl || ''}
                    onChange={(e) => updateBusinessProfile({ googleMapsUrl: e.target.value })}
                    placeholder="https://maps.google.com/?q=..."
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Menu 3: Variants Information Catalog */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-sm">
                    3️⃣
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-stone-900">Menu 3: Jenis Varian Bolu</h3>
                    <p className="text-[11px] text-stone-500">Katalog informatif untuk mengenalkan produk</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-stone-600">
                Menyajikan informasi varian lengkap (deskripsi kelezatan, ukuran loyang/berat, ketahanan suhu ruang, dan harga) tanpa langsung memicu alur pembuatan invoice.
              </p>

              <div className="bg-stone-50 p-3 rounded-lg border border-stone-200 text-xs space-y-2">
                <div className="font-bold text-stone-800">Contoh Format Pesan WhatsApp:</div>
                <pre className="text-[10.5px] text-stone-700 bg-white p-2.5 rounded border border-stone-200 overflow-x-auto whitespace-pre-wrap font-sans">
                  {`🍰 VARIAN BOLU PUSAKA\n\n🍌 1. Bolu Pisang Original\n📝 Bolu pisang klasik lembut dengan aroma rempah harum.\n⚖️ Ukuran: Ø20 cm (900g)\n⏳ Ketahanan: 4 hari\n💰 Harga: Rp 55.000`}
                </pre>
              </div>
            </div>

            {/* Menu 4: Admin Handoff Settings */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
                    4️⃣
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-stone-900">Menu 4: Chat dengan Admin</h3>
                    <p className="text-[11px] text-stone-500">100% Ditangani Manusia (AI Tidak Mengganggu)</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">Nomor WhatsApp Staf Admin / CS:</label>
                  <input
                    type="text"
                    value={businessProfile.adminWhatsAppPhone || businessProfile.phone}
                    onChange={(e) => updateBusinessProfile({ adminWhatsAppPhone: e.target.value })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono"
                    placeholder="081234567890"
                  />
                  <p className="text-[10px] text-stone-500 mt-1">
                    Nomor ini akan menerima pesan langsung saat konsumen memilih Menu 4.
                  </p>
                </div>

                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-amber-900 text-xs">
                  <div className="font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-700" />
                    <span>Garansi Tanpa AI</span>
                  </div>
                  <p className="text-[11px] mt-0.5">
                    Ketika konsumen memilih Menu 4, bot otomatis menjeda respon otomatis dan mengarahkan percakapan langsung ke WhatsApp Admin manusia agar tidak terjadi kesalahan pemahaman pesanan.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: SESSIONS & ORDERS MONITORING */}
      {/* ========================================================================= */}
      {activeSubTab === 'sessions' && (
        <div className="space-y-6">
          {/* Active WhatsApp Sessions Table */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-stone-900">Daftar Sesi Percakapan Konsumen WhatsApp</h3>
                <p className="text-xs text-stone-500">Pantau interaksi bot dan ambil alih chat admin kapan saja.</p>
              </div>
              <span className="text-xs font-bold text-stone-700 bg-stone-100 px-2.5 py-1 rounded-md border border-stone-200">
                {whatsappSessions.length} Sesi Terbuka
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-stone-100 text-stone-700 font-bold uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Konsumen</th>
                    <th className="py-2.5 px-3">Nomor WA</th>
                    <th className="py-2.5 px-3">Tahap Terakhir</th>
                    <th className="py-2.5 px-3">Status Penanganan</th>
                    <th className="py-2.5 px-3">Waktu</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200">
                  {whatsappSessions.map((sess) => (
                    <tr key={sess.id} className="hover:bg-stone-50 transition">
                      <td className="py-2.5 px-3 font-bold text-stone-900">{sess.customerName}</td>
                      <td className="py-2.5 px-3 font-mono text-stone-700">{sess.customerPhone}</td>
                      <td className="py-2.5 px-3">
                        <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-stone-100 text-stone-800 border border-stone-200">
                          {sess.currentStep}
                        </span>
                      </td>
                      <td className="py-2.5 px-3">
                        {sess.isHumanHandled ? (
                          <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1 w-fit">
                            <UserCheck className="w-3 h-3" />
                            Admin Manusia
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 w-fit">
                            <Sparkles className="w-3 h-3" />
                            Bot Otomatis
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-stone-500 text-[11px]">{sess.lastMessageTime}</td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedPhone(sess.customerPhone);
                              setActiveWhatsAppPhone(sess.customerPhone);
                              setActiveSubTab('simulator');
                            }}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold transition flex items-center gap-1"
                          >
                            <Smartphone className="w-3 h-3" />
                            <span>Buka Chat</span>
                          </button>
                          <button
                            onClick={() => toggleWhatsAppAdminHandoff(sess.customerPhone, !sess.isHumanHandled)}
                            className="px-2 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded text-[11px] font-medium border border-stone-300 transition"
                          >
                            {sess.isHumanHandled ? 'Kembalikan ke Bot' : 'Ambil Alih Admin'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Orders Made via WhatsApp */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-stone-900">Pesanan Masuk dari WhatsApp Bot</h3>
                <p className="text-xs text-stone-500">Daftar transaksi yang otomatis tercatat dari konfirmasi order WhatsApp.</p>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
                {whatsappOrders.length} Transaksi WhatsApp
              </span>
            </div>

            {whatsappOrders.length === 0 ? (
              <div className="p-8 text-center bg-stone-50 rounded-xl border border-dashed border-stone-300 text-xs text-stone-500 space-y-2">
                <ShoppingCart className="w-8 h-8 mx-auto text-stone-400" />
                <p className="font-medium">Belum ada pesanan dari WhatsApp yang tercatat.</p>
                <p className="text-[11px]">Coba lakukan pesanan di <strong>Simulator WhatsApp</strong> untuk melihat hasilnya secara langsung di sini.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-stone-100 text-stone-700 font-bold uppercase text-[10px] tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3">No. Invoice</th>
                      <th className="py-2.5 px-3">Tanggal</th>
                      <th className="py-2.5 px-3">Konsumen</th>
                      <th className="py-2.5 px-3">Item Pesanan</th>
                      <th className="py-2.5 px-3">Total</th>
                      <th className="py-2.5 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-200">
                    {whatsappOrders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-stone-50 transition">
                        <td className="py-2.5 px-3 font-bold text-stone-900 font-mono">#{ord.invoiceNumber}</td>
                        <td className="py-2.5 px-3 text-stone-600">{ord.date}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-stone-900">{ord.customerName}</div>
                          <div className="text-[10px] text-stone-500">{ord.customerPhone}</div>
                        </td>
                        <td className="py-2.5 px-3 text-stone-700">
                          {ord.items.map((i) => `${i.productName} (${i.qty}x)`).join(', ')}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-emerald-700 font-mono">
                          {formatRupiah(ord.totalAmount)}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded text-[10.5px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                            {ord.orderStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: WEBHOOK & GATEWAY INTEGRATION */}
      {/* ========================================================================= */}
      {activeSubTab === 'webhook' && (
        <div className="space-y-6">
          {/* Gateway Credentials */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-sm text-stone-900 flex items-center gap-2">
              <Code2 className="w-4 h-4 text-emerald-600" />
              <span>Konfigurasi WhatsApp Gateway (Fonnte / Meta Cloud API)</span>
            </h3>
            <p className="text-xs text-stone-500">
              Hubungkan WhatsApp nomor bisnis Anda ke PUSAKA SaaS menggunakan penyedia gateway seperti <strong>Fonnte</strong>, <strong>Meta WhatsApp Cloud API</strong>, atau <strong>Wablas</strong>.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Penyedia Gateway WhatsApp:</label>
                <select
                  value={businessProfile.whatsappGatewayProvider || 'FONNTE'}
                  onChange={(e: any) => updateBusinessProfile({ whatsappGatewayProvider: e.target.value })}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-bold"
                >
                  <option value="FONNTE">Fonnte (Rekomendasi Indonesia - Mudah & Murah)</option>
                  <option value="WABA_META">Meta WhatsApp Business Cloud API (Official)</option>
                  <option value="WABLAS">Wablas Webhook</option>
                  <option value="GENERIC_WEBHOOK">Custom Node.js Baileys Webhook</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">API Token / Secret Key Gateway:</label>
                <input
                  type="password"
                  value={businessProfile.whatsappGatewayApiKey || ''}
                  onChange={(e) => updateBusinessProfile({ whatsappGatewayApiKey: e.target.value })}
                  placeholder="Tempel API Token Fonnte / WhatsApp di sini..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Ready-to-use Backend Webhook Snippet */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-stone-900">Kode Webhook Server (Node.js Express)</h3>
                <p className="text-xs text-stone-500">Siap dideploy untuk menerima pesan WhatsApp dan meneruskannya ke SaaS.</p>
              </div>
              <button
                onClick={handleCopyWebhookCode}
                className="px-3 py-1.5 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'Tersalin!' : 'Salin Kode Webhook'}</span>
              </button>
            </div>

            <div className="bg-stone-900 text-stone-100 rounded-xl p-4 font-mono text-[11px] overflow-x-auto max-h-96">
              <pre>{WhatsAppBotService.generateExpressWebhookCode(businessProfile, window.location.origin)}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
