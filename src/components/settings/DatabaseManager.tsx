import React, { useState, useEffect } from 'react';
import {
  Database,
  Server,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Copy,
  Check,
  Eye,
  EyeOff,
  ExternalLink,
  ShieldCheck,
  Zap,
} from 'lucide-react';

interface DatabaseStatus {
  mode: 'MYSQL' | 'LOCAL_JSON';
  isMySQLConfigured: boolean;
  connection: {
    connected: boolean;
    message: string;
    host?: string;
    database?: string;
  };
  config?: {
    host: string;
    port: number;
    database: string;
    user: string;
    hasPassword: boolean;
  };
  counts: {
    products: number;
    orders: number;
    customers: number;
    sessions: number;
  };
}

export const DatabaseManager: React.FC = () => {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [migrating, setMigrating] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form credentials
  const [host, setHost] = useState('localhost');
  const [port, setPort] = useState('3306');
  const [database, setDatabase] = useState('');
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/database/status');
      if (res.ok) {
        const data: DatabaseStatus = await res.json();
        setStatus(data);
        if (data.config) {
          if (data.config.host) setHost(data.config.host);
          if (data.config.port) setPort(data.config.port.toString());
          if (data.config.database) setDatabase(data.config.database);
          if (data.config.user) setUser(data.config.user);
        }
      }
    } catch (err: any) {
      console.error('Failed to fetch database status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSaveAndTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);
    setMessage(null);

    try {
      const res = await fetch('/api/database/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          host,
          port: parseInt(port, 10) || 3306,
          database,
          user,
          password,
        }),
      });

      const result = await res.json();
      if (res.ok && result.success) {
        setMessage({
          type: 'success',
          text: result.message || 'Koneksi MySQL berhasil disimpan dan seluruh tabel telah dibuat/disinkronkan!',
        });
        await fetchStatus();
      } else {
        setMessage({
          type: 'error',
          text: result.message || result.error || 'Gagal terhubung ke database MySQL. Periksa nama database, user, dan password.',
        });
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: `Error sistem: ${err?.message || err}`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleManualMigrate = async () => {
    setMigrating(true);
    setMessage(null);
    try {
      const res = await fetch('/api/database/migrate', { method: 'POST' });
      const result = await res.json();
      if (res.ok && result.success) {
        setMessage({
          type: 'success',
          text: result.message || 'Berhasil menyinkronkan data ke MySQL!',
        });
        await fetchStatus();
      } else {
        setMessage({
          type: 'error',
          text: result.message || result.error || 'Gagal sinkronisasi ke MySQL.',
        });
      }
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: `Error migrasi: ${err?.message || err}`,
      });
    } finally {
      setMigrating(false);
    }
  };

  const handleCopySchema = async () => {
    try {
      const res = await fetch('/api/database/schema-sql');
      const text = await res.text();
      await navigator.clipboard.writeText(text);
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 3000);
    } catch (err) {
      alert('Gagal menyalin SQL schema. Silakan buka file schema.sql di root direktori hosting Anda.');
    }
  };

  const isConnected = status?.connection?.connected ?? false;

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-5 text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-stone-100 gap-2">
        <div className="flex items-center space-x-2">
          <Database className="w-4 h-4 text-amber-600" />
          <span className="font-bold text-sm text-stone-900">Database MySQL / MariaDB (Hosting cPanel)</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={fetchStatus}
            disabled={loading}
            className="px-2.5 py-1 text-stone-600 bg-stone-100 hover:bg-stone-200 rounded font-medium flex items-center space-x-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Perbarui Status</span>
          </button>
        </div>
      </div>

      {/* Status Card */}
      <div
        className={`p-4 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
          isConnected
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
            : 'bg-amber-50/80 border-amber-200 text-amber-950'
        }`}
      >
        <div className="flex items-start space-x-3">
          <div
            className={`p-2.5 rounded-lg shrink-0 mt-0.5 ${
              isConnected ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'
            }`}
          >
            {isConnected ? <ShieldCheck className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-sm">
                {isConnected ? 'Status: MySQL / MariaDB Aktif' : 'Status: Local JSON Storage (MySQL Belum Terhubung)'}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isConnected ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
                }`}
              >
                {status?.mode || 'CHECKING...'}
              </span>
            </div>
            <p className="text-xs mt-1 text-stone-700 leading-relaxed">
              {status?.connection?.message || 'Memeriksa status koneksi ke server database...'}
            </p>
            {status?.counts && (
              <div className="flex flex-wrap gap-3 mt-2 text-[11px] font-semibold text-stone-600">
                <span className="bg-white/80 px-2 py-0.5 rounded border border-stone-200/60">
                  Produk: <strong className="text-stone-900">{status.counts.products}</strong>
                </span>
                <span className="bg-white/80 px-2 py-0.5 rounded border border-stone-200/60">
                  Pesanan: <strong className="text-stone-900">{status.counts.orders}</strong>
                </span>
                <span className="bg-white/80 px-2 py-0.5 rounded border border-stone-200/60">
                  Pelanggan: <strong className="text-stone-900">{status.counts.customers}</strong>
                </span>
              </div>
            )}
          </div>
        </div>

        {isConnected && (
          <div className="flex sm:flex-col gap-2 shrink-0 w-full md:w-auto">
            <button
              type="button"
              onClick={handleManualMigrate}
              disabled={migrating}
              className="w-full px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg shadow-sm flex items-center justify-center space-x-1.5 transition-colors"
            >
              <Zap className={`w-3.5 h-3.5 ${migrating ? 'animate-spin' : ''}`} />
              <span>{migrating ? 'Menyinkronkan...' : 'Sinkronkan Ulang ke MySQL'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Alert Message */}
      {message && (
        <div
          className={`p-3 rounded-lg border text-xs flex items-center space-x-2 ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
              : 'bg-rose-50 border-rose-300 text-rose-800'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Database Connection Form */}
      <form onSubmit={handleSaveAndTest} className="space-y-4 pt-2">
        <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-xs text-stone-800 flex items-center space-x-1.5">
              <Server className="w-3.5 h-3.5 text-stone-600" />
              <span>Kredensial Database MySQL Hosting (cPanel / Hostinger)</span>
            </h4>
            <button
              type="button"
              onClick={handleCopySchema}
              className="text-amber-700 hover:text-amber-800 font-bold flex items-center space-x-1 text-[11px]"
            >
              {copiedSql ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
              <span>{copiedSql ? 'Tersalin!' : 'Salin SQL Schema (phpMyAdmin)'}</span>
            </button>
          </div>

          <p className="text-stone-500 text-[11px] leading-relaxed">
            Masukkan data yang Anda buat di menu <strong>cPanel &gt; MySQL Databases</strong>. Jangan lupa bahwa nama
            database dan user di cPanel biasanya diawali dengan username hosting Anda (contoh: <code>u265351091_pusaka</code>).
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-stone-700 mb-1">Host Database *</label>
              <input
                type="text"
                value={host}
                onChange={(e) => setHost(e.target.value)}
                required
                placeholder="localhost atau 127.0.0.1"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none font-mono text-xs"
              />
              <span className="text-[10px] text-stone-400 mt-0.5 block">Default: localhost</span>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Port</label>
              <input
                type="number"
                value={port}
                onChange={(e) => setPort(e.target.value)}
                placeholder="3306"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none font-mono text-xs"
              />
              <span className="text-[10px] text-stone-400 mt-0.5 block">Default: 3306</span>
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">Nama Database (DB_NAME) *</label>
              <input
                type="text"
                value={database}
                onChange={(e) => setDatabase(e.target.value)}
                required
                placeholder="u265351091_pusaka"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none font-mono text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-700 mb-1">User MySQL (DB_USER) *</label>
              <input
                type="text"
                value={user}
                onChange={(e) => setUser(e.target.value)}
                required
                placeholder="u265351091_admin"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none font-mono text-xs"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block font-bold text-stone-700 mb-1">Password User MySQL (DB_PASSWORD)</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={status?.config?.hasPassword ? '•••••••• (tersimpan, isi jika ingin mengubah)' : 'Masukkan password user database'}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none font-mono text-xs pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <span className="text-[11px] text-stone-500">
              * Tombol di samping akan menguji koneksi langsung, membuat tabel-tabel secara otomatis, dan memigrasikan data.
            </span>
            <button
              type="submit"
              disabled={testing}
              className="w-full sm:w-auto px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
            >
              <Server className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'Menguji & Menginisialisasi...' : 'Sambungkan & Buat Tabel di MySQL'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Guide Steps */}
      <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-stone-600 text-[11px] space-y-2">
        <h5 className="font-bold text-stone-800 text-xs flex items-center space-x-1.5">
          <ExternalLink className="w-3.5 h-3.5 text-stone-500" />
          <span>Panduan Lengkap 3 Langkah di Hosting Anda:</span>
        </h5>
        <ol className="list-decimal list-inside space-y-1.5 pl-1 leading-relaxed text-stone-600">
          <li>
            Buka <strong>cPanel / hPanel &gt; MySQL Databases</strong>. Buat database baru (misal: <code>pusaka</code>). Nama akhirnya akan menjadi <code>u265351091_pusaka</code>.
          </li>
          <li>
            Buat <strong>User MySQL</strong> baru dan catat passwordnya, lalu masukkan user tersebut ke database dengan mencentang <strong>ALL PRIVILEGES</strong>.
          </li>
          <li>
            Ketik nama database, user, dan password pada formulir di atas, lalu klik <strong>"Sambungkan &amp; Buat Tabel di MySQL"</strong>. Sistem akan otomatis membuat tabel dan memindahkan produk serta pesanan ke database MySQL Anda.
          </li>
        </ol>
      </div>
    </div>
  );
};
