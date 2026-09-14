import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const BaseComponent: any = Component;

export class ErrorBoundary extends BaseComponent {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    (this as any).setState({ hasError: false, error: null });
    window.location.reload();
  };

  private handleGoHome = () => {
    try {
      sessionStorage.removeItem('PUSAKA_MGMT_AUTH');
    } catch {
      // ignore
    }
    (this as any).setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    const state = (this as any).state as State;
    const props = (this as any).props as Props;

    if (state.hasError) {
      return (
        <div className="min-h-screen bg-stone-900 text-stone-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-stone-850 border border-stone-750 rounded-2xl p-6 sm:p-8 text-center shadow-2xl space-y-5">
            <div className="w-14 h-14 bg-amber-500/20 text-amber-400 rounded-2xl flex items-center justify-center mx-auto border border-amber-500/30">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white mb-2">
                Terjadi Kendala Tampilan
              </h2>
              <p className="text-xs sm:text-sm text-stone-400">
                Sistem mendeteksi kendala pada sesi saat ini. Anda dapat memuat ulang aplikasi atau kembali ke halaman etalase.
              </p>
            </div>

            {state.error && (
              <div className="p-3 bg-stone-950/80 rounded-xl text-left border border-stone-800">
                <p className="text-[11px] font-mono text-rose-400 break-words">
                  {state.error.message || 'Unknown error'}
                </p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 inline-flex items-center justify-center space-x-2 py-2.5 px-4 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl transition shadow-sm"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Muat Ulang Halaman</span>
              </button>

              <button
                type="button"
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center space-x-2 py-2.5 px-4 bg-stone-750 hover:bg-stone-700 text-stone-200 font-semibold text-xs rounded-xl transition border border-stone-650"
              >
                <Home className="w-4 h-4" />
                <span>Ke Beranda</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return props.children;
  }
}
