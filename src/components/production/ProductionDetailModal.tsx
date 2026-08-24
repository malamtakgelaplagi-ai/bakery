import React, { useState } from 'react';
import { useBakery } from '../../context/BakeryContext';
import { ProductionRun, ProductionStatus } from '../../types';
import { formatRupiah, formatDateTimeIndo } from '../../utils/formatters';
import {
  X,
  ChefHat,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Boxes,
  Package,
  Layers,
  XCircle,
} from 'lucide-react';

interface ProductionDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  production: ProductionRun | null;
}

const STAGES: { status: ProductionStatus; label: string; desc: string }[] = [
  { status: 'DRAFT', label: '1. Draft Rencana', desc: 'Rencana kuantiti & cek stok' },
  { status: 'DIRACIK', label: '2. Diracik / Ditimbang', desc: 'Potong stok bahan baku' },
  { status: 'DIPANGGANG', label: '3. Dipanggang di Oven', desc: 'Proses baking 175°C' },
  { status: 'PENDINGINAN', label: '4. Pendinginan', desc: 'Cooling rack suhu ruang' },
  { status: 'QC', label: '5. Quality Control', desc: 'Uji aroma, tekstur & bobot' },
  { status: 'SELESAI', label: '6. Selesai & Masuk Etalase', desc: 'Tambah stok siap jual' },
];

export const ProductionDetailModal: React.FC<ProductionDetailModalProps> = ({
  isOpen,
  onClose,
  production,
}) => {
  const { advanceProductionStatus, cancelProductionRun } = useBakery();

  const [stepNote, setStepNote] = useState('');
  const [actualYield, setActualYield] = useState<number>(production?.targetQty || 5);

  if (!isOpen || !production) return null;

  const currentStageIndex = STAGES.findIndex((s) => s.status === production.status);

  const handleAdvance = (nextStatus: ProductionStatus) => {
    advanceProductionStatus(production.id, nextStatus, stepNote);
    setStepNote('');
  };

  const handleCancel = () => {
    if (window.confirm(`Batalkan batch produksi ${production.batchNumber}? Stok bahan akan dikembalikan jika sebelumnya telah dipotong.`)) {
      cancelProductionRun(production.id, 'Dibatalkan oleh operator');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ChefHat className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm sm:text-base">
                Batch Produksi #{production.batchNumber}
              </h3>
              <span className="text-[11px] text-stone-400">
                {production.productName} ({production.targetQty} Pcs) • Operator: {production.operatorName}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[82vh] overflow-y-auto text-xs">
          {/* Status Pipeline Progress Bar */}
          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-stone-800">
              <span>Alur Produksi Dapur</span>
              <span className="text-amber-800 font-mono">
                Status Saat Ini: <strong>{production.status}</strong>
              </span>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 text-center">
              {STAGES.map((s, idx) => {
                const isPassed = currentStageIndex >= idx;
                const isCurrent = s.status === production.status;

                return (
                  <div
                    key={s.status}
                    className={`p-2 rounded-lg border text-[10px] font-bold transition flex flex-col items-center justify-center ${
                      isCurrent
                        ? 'bg-amber-400 text-stone-950 border-amber-500 shadow-sm'
                        : isPassed
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : 'bg-white text-stone-400 border-stone-200'
                    }`}
                  >
                    <span className="truncate w-full">{s.label.split(' ')[1]}</span>
                    {isPassed && !isCurrent && <CheckCircle2 className="w-3 h-3 text-emerald-600 mt-0.5" />}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Advance Bar */}
          {production.status !== 'SELESAI' && production.status !== 'BATAL' && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-amber-950">
                  Lanjutkan Tahapan Produksi:
                </span>
                {currentStageIndex < STAGES.length - 1 && (
                  <span className="text-[11px] text-amber-800">
                    Tahap Selanjutnya: <strong>{STAGES[currentStageIndex + 1]?.label}</strong>
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={stepNote}
                  onChange={(e) => setStepNote(e.target.value)}
                  placeholder="Catatan tahap ini (opsional, misal: suhu oven 175°C pas)..."
                  className="flex-1 px-3 py-1.5 text-xs bg-white border border-amber-300 rounded-lg focus:outline-none"
                />

                {currentStageIndex < STAGES.length - 1 && (
                  <button
                    onClick={() => handleAdvance(STAGES[currentStageIndex + 1].status)}
                    className="px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-amber-400 font-bold text-xs rounded-lg transition shadow-sm flex items-center space-x-1.5 whitespace-nowrap"
                  >
                    <span>Lanjut → {STAGES[currentStageIndex + 1]?.status}</span>
                  </button>
                )}
              </div>

              {production.status === 'DRAFT' && (
                <p className="text-[11px] text-amber-800">
                  ⚠️ Memajukan ke <strong>DIRACIK</strong> akan otomatis memotong stok bahan baku dari gudang.
                </p>
              )}
            </div>
          )}

          {/* Ingredients & Cost Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white p-3.5 rounded-xl border border-stone-200 space-y-2">
              <span className="font-bold text-xs text-stone-900 block border-b border-stone-100 pb-1">
                Bahan Baku Yang Digunakan
              </span>
              <div className="space-y-1.5 max-h-40 overflow-y-auto">
                {(production.ingredients || []).map((ing, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px]">
                    <span className="text-stone-700">{ing.ingredientName}</span>
                    <span className="font-bold text-stone-900 font-mono">
                      {ing.requiredQty} {ing.unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-stone-200 space-y-2">
              <span className="font-bold text-xs text-stone-900 block border-b border-stone-100 pb-1">
                Kalkulasi Biaya Batch
              </span>
              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-stone-500">Target Hasil:</span>
                  <span className="font-bold text-stone-900">{production.targetQty} Pcs</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Total Biaya Batch:</span>
                  <span className="font-mono font-bold text-stone-900">
                    {formatRupiah(production.totalProductionCost)}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-stone-100 font-bold">
                  <span className="text-stone-700">HPP Rata-rata:</span>
                  <span className="text-amber-800 font-mono">
                    {formatRupiah(production.unitProductionCost)} / pcs
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-stone-100">
                  <span className="text-stone-500">Potong Stok Bahan:</span>
                  <span className={production.isStockDeducted ? 'text-emerald-700 font-bold' : 'text-stone-400'}>
                    {production.isStockDeducted ? '✓ Sudah Dipotong' : 'Belum (Masih Draft)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Masuk Stok Jadi:</span>
                  <span className={production.isFinishedStockAdded ? 'text-emerald-700 font-bold' : 'text-stone-400'}>
                    {production.isFinishedStockAdded ? '✓ Sudah Masuk Etalase' : 'Belum'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Logs */}
          <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 space-y-2">
            <span className="font-bold text-xs text-stone-900 block">
              Riwayat Waktu & Catatan Dapur (Timeline)
            </span>
            <div className="space-y-1.5">
              {(production.timeline || []).map((t, idx) => (
                <div key={idx} className="flex items-start space-x-2 text-[11px]">
                  <Clock className="w-3.5 h-3.5 text-stone-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="font-bold text-stone-800">{t.status}</span> —{' '}
                    <span className="text-stone-500">{formatDateTimeIndo(t.timestamp)}</span>
                    {t.note && <span className="text-stone-600 italic block">"{t.note}"</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-between">
            {production.status !== 'SELESAI' && production.status !== 'BATAL' ? (
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition"
              >
                Batalkan Batch
              </button>
            ) : (
              <div />
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
