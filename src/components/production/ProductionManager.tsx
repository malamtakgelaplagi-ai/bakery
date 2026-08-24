import React, { useState } from 'react';
import { useBakery } from '../../context/BakeryContext';
import { ProductionRun, ProductionStatus } from '../../types';
import { formatRupiah, formatDateIndo } from '../../utils/formatters';
import { NewProductionModal } from './NewProductionModal';
import { ProductionDetailModal } from './ProductionDetailModal';
import {
  ChefHat,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Snowflake,
  ShieldCheck,
  Search,
} from 'lucide-react';

export const ProductionManager: React.FC = () => {
  const { productions } = useBakery();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedProduction, setSelectedProduction] = useState<ProductionRun | null>(null);

  const activeProductions = productions.filter(
    (p) => p.status !== 'SELESAI' && p.status !== 'BATAL'
  );
  const completedProductions = productions.filter((p) => p.status === 'SELESAI');

  const filtered = productions.filter((p) => {
    const matchesSearch =
      p.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.batchNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.operatorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'ALL' || p.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusConfig = (status: ProductionStatus) => {
    switch (status) {
      case 'DRAFT':
        return { color: 'bg-stone-100 text-stone-700 border-stone-300', icon: Clock, label: 'Draft Rencana' };
      case 'DIRACIK':
        return { color: 'bg-blue-50 text-blue-800 border-blue-200', icon: ChefHat, label: 'Sedang Diracik' };
      case 'DIPANGGANG':
        return { color: 'bg-amber-50 text-amber-900 border-amber-300 animate-pulse', icon: Flame, label: 'Dalam Oven 175°C' };
      case 'PENDINGINAN':
        return { color: 'bg-cyan-50 text-cyan-800 border-cyan-200', icon: Snowflake, label: 'Pendinginan' };
      case 'QC':
        return { color: 'bg-purple-50 text-purple-800 border-purple-200', icon: ShieldCheck, label: 'Pemeriksaan QC' };
      case 'SELESAI':
        return { color: 'bg-emerald-50 text-emerald-800 border-emerald-200', icon: CheckCircle2, label: 'Selesai / Ready' };
      case 'BATAL':
        return { color: 'bg-rose-50 text-rose-800 border-rose-200', icon: AlertTriangle, label: 'Dibatalkan' };
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Modul Dapur & Produksi
            </span>
          </div>
          <h2 className="text-xl font-bold text-stone-900 mt-1">
            Manajemen Batch Produksi & Pemanggangan Bolu
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Kontrol tahapan pembuatan adonan, pemotongan otomatis stok bahan baku, dan penambahan produk ke etalase.
          </p>
        </div>

        <button
          onClick={() => setIsNewModalOpen(true)}
          className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs rounded-lg transition shadow-sm flex items-center space-x-1.5 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>+ Mulai Batch Produksi Baru</span>
        </button>
      </div>

      {/* Overview Stat Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Batch Aktif di Dapur
            </span>
            <div className="text-xl font-bold text-amber-800 mt-1">
              {activeProductions.length} Batch
            </div>
            <span className="text-[11px] text-stone-500">
              {activeProductions.reduce((s, p) => s + p.targetQty, 0)} Pcs sedang diproses
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
            <Flame className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Batch Selesai Hari Ini
            </span>
            <div className="text-xl font-bold text-emerald-800 mt-1">
              {completedProductions.length} Batch
            </div>
            <span className="text-[11px] text-stone-500">
              {completedProductions.reduce((s, p) => s + (p.actualYieldQty || p.targetQty), 0)} Bolu siap jual
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
              Total Biaya Produksi Hari Ini
            </span>
            <div className="text-xl font-bold text-stone-900 mt-1">
              {formatRupiah(productions.reduce((s, p) => s + p.totalProductionCost, 0))}
            </div>
            <span className="text-[11px] text-stone-500">Bahan baku + energi oven + upah</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-stone-100 text-stone-700 flex items-center justify-center">
            <ChefHat className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-xl border border-stone-200 shadow-sm text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari no batch, produk, baker..."
            className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white focus:outline-none font-medium"
          >
            <option value="ALL">Semua Status Batch</option>
            <option value="DRAFT">Draft</option>
            <option value="DIRACIK">Diracik</option>
            <option value="DIPANGGANG">Dipanggang</option>
            <option value="PENDINGINAN">Pendinginan</option>
            <option value="QC">QC</option>
            <option value="SELESAI">Selesai</option>
          </select>
        </div>
      </div>

      {/* Production Runs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((prod) => {
          const cfg = getStatusConfig(prod.status);
          const Icon = cfg.icon;

          return (
            <div
              key={prod.id}
              onClick={() => setSelectedProduction(prod)}
              className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm hover:border-amber-400/80 transition cursor-pointer flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-stone-900">
                    {prod.batchNumber}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center space-x-1 ${cfg.color}`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{prod.status}</span>
                  </span>
                </div>

                <h3 className="font-bold text-sm text-stone-900 mt-2">{prod.productName}</h3>
                <div className="text-xs text-amber-900 font-semibold mt-0.5">
                  Target: {prod.targetQty} Pcs • v{prod.recipeVersionNumber}
                </div>

                {prod.notes && (
                  <p className="text-[11px] text-stone-500 mt-1 italic line-clamp-1">
                    "{prod.notes}"
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-stone-100 space-y-2 text-xs">
                <div className="flex justify-between text-stone-500 text-[11px]">
                  <span>Operator: <strong>{prod.operatorName}</strong></span>
                  <span>{formatDateIndo(prod.date)}</span>
                </div>

                <div className="flex justify-between items-center pt-1 border-t border-stone-50">
                  <div>
                    <span className="text-[10px] text-stone-400 block">Total Biaya:</span>
                    <span className="font-mono font-bold text-stone-900">
                      {formatRupiah(prod.totalProductionCost)}
                    </span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedProduction(prod);
                    }}
                    className="px-3 py-1 bg-stone-900 hover:bg-stone-800 text-amber-400 font-semibold text-xs rounded-md shadow-xs transition"
                  >
                    Kontrol Alur →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modals */}
      <NewProductionModal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
      />

      <ProductionDetailModal
        isOpen={!!selectedProduction}
        onClose={() => setSelectedProduction(null)}
        production={selectedProduction}
      />
    </div>
  );
};
