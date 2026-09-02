import React from 'react';
import { useBakery } from '../../context/BakeryContext';
import {
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  Database,
  Cloud,
  Zap,
  ArrowDownToLine,
  ArrowUpFromLine,
} from 'lucide-react';

interface GoogleSyncBannerProps {
  moduleName: string;
  moduleDescription?: string;
}

export const GoogleSyncBanner: React.FC<GoogleSyncBannerProps> = ({
  moduleName,
  moduleDescription,
}) => {
  const {
    googleSheetsConfig,
    appsScriptConfig,
    isGoogleSyncing,
    isAppsScriptSyncing,
    syncNowToGoogleSheets,
    loadDataFromGoogleSheets,
    syncNowToAppsScript,
    loadDataFromAppsScript,
    googleUser,
  } = useBakery();

  const isConnected = Boolean(googleSheetsConfig.spreadsheetId || appsScriptConfig.webAppUrl);
  const isSyncing = isGoogleSyncing || isAppsScriptSyncing;

  const handlePullData = async () => {
    if (appsScriptConfig.webAppUrl) {
      await loadDataFromAppsScript();
    } else if (googleSheetsConfig.spreadsheetId) {
      await loadDataFromGoogleSheets();
    }
  };

  const handlePushData = async () => {
    if (appsScriptConfig.webAppUrl) {
      await syncNowToAppsScript();
    } else if (googleSheetsConfig.spreadsheetId) {
      await syncNowToGoogleSheets();
    }
  };

  return (
    <div className="bg-gradient-to-r from-emerald-900/90 via-stone-900 to-stone-900 border border-emerald-500/40 text-white p-4 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
      <div className="flex items-start sm:items-center space-x-3">
        <div className="p-2.5 bg-emerald-500/20 rounded-lg text-emerald-400 border border-emerald-500/30 shrink-0">
          <FileSpreadsheet className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center space-x-2 flex-wrap">
            <span className="text-xs font-bold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-600/50 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              Google Spreadsheet Live Sync
            </span>
            {isConnected ? (
              <span className="text-[11px] text-emerald-300 font-medium">
                {googleSheetsConfig.spreadsheetTitle || 'PUSAKA Bakery Cloud DB'}
              </span>
            ) : (
              <span className="text-[11px] text-amber-300 font-medium flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-amber-400" />
                Mode Google Sheets Aktif (Langsung dari Cloud Spreadsheet)
              </span>
            )}
          </div>
          <p className="text-xs text-stone-300 mt-1">
            Data <strong>{moduleName}</strong> disinkronkan langsung ke Google Sheets. {moduleDescription || 'Semua perubahan otomatis terbaca dan tersimpan di spreadsheet.'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 self-start md:self-auto shrink-0 flex-wrap">
        <button
          onClick={handlePullData}
          disabled={isSyncing}
          className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold rounded-lg border border-stone-700 transition flex items-center gap-1.5 disabled:opacity-50"
          title="Muat data terbaru dari Google Sheets"
        >
          <ArrowDownToLine className={`w-3.5 h-3.5 ${isSyncing ? 'animate-bounce' : ''}`} />
          <span>Tarik Data Sheets</span>
        </button>

        <button
          onClick={handlePushData}
          disabled={isSyncing}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition flex items-center gap-1.5 disabled:opacity-50"
          title="Kirim dan perbarui data ke Google Sheets"
        >
          <ArrowUpFromLine className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
          <span>{isSyncing ? 'Menyinkronkan...' : 'Kirim ke Sheets'}</span>
        </button>

        {googleSheetsConfig.spreadsheetUrl && (
          <a
            href={googleSheetsConfig.spreadsheetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white rounded-lg border border-stone-700 transition"
            title="Buka Spreadsheet di Tab Baru"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  );
};
