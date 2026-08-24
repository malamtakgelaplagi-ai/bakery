import React, { useState } from 'react';
import { useBakery } from '../../context/BakeryContext';
import { Recipe, RecipeVersion } from '../../types';
import { formatRupiah, formatDateIndo } from '../../utils/formatters';
import { RecipeEditorModal } from './RecipeEditorModal';
import { HppSimulatorModal } from './HppSimulatorModal';
import {
  BookOpen,
  Plus,
  Layers,
  Calculator,
  History,
  CheckCircle,
  TrendingUp,
  Scale,
  Sparkles,
  ChevronDown,
  Info,
} from 'lucide-react';

export const RecipeList: React.FC = () => {
  const { recipes } = useBakery();

  const [selectedRecipeId, setSelectedRecipeId] = useState<string>(recipes[0]?.id || '');
  const [selectedVersionId, setSelectedVersionId] = useState<string>('');

  // Modals state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editorMode, setEditorMode] = useState<'NEW_RECIPE' | 'NEW_VERSION'>('NEW_RECIPE');
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  const currentRecipe = (recipes || []).find((r) => r.id === selectedRecipeId) || (recipes || [])[0];
  const recipeVersions = currentRecipe?.versions || [];
  const activeVersion = currentRecipe
    ? recipeVersions.find((v) => v.id === (selectedVersionId || currentRecipe.currentVersionId)) ||
      recipeVersions[recipeVersions.length - 1]
    : null;

  const handleOpenNewVersion = () => {
    setEditorMode('NEW_VERSION');
    setIsEditorOpen(true);
  };

  const handleOpenNewRecipe = () => {
    setEditorMode('NEW_RECIPE');
    setIsEditorOpen(true);
  };

  if (!currentRecipe || !activeVersion) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-stone-200">
        <p className="text-stone-500">Belum ada data resep.</p>
        <button
          onClick={handleOpenNewRecipe}
          className="mt-3 px-4 py-2 bg-amber-400 font-bold text-xs rounded-lg"
        >
          Buat Resep Pertama
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Modul Resep & Kalkulator HPP
            </span>
          </div>
          <h2 className="text-xl font-bold text-stone-900 mt-1">
            Resep BOM, Versi Resep & Perhitungan HPP Otomatis
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Sistem Bill of Materials (BOM) multi-versi dengan kalkulasi biaya bahan, kemasan, dan energi oven secara presisi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsSimulatorOpen(true)}
            className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-amber-400 font-bold text-xs rounded-lg transition shadow-sm flex items-center space-x-1.5 whitespace-nowrap"
          >
            <Calculator className="w-4 h-4" />
            <span>Simulasi Margin & Harga</span>
          </button>

          <button
            onClick={handleOpenNewRecipe}
            className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs rounded-lg transition shadow-sm flex items-center space-x-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>+ Resep Produk Baru</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Workspace: Left Recipe Selector & Version History, Right BOM & HPP Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col (4 cols): Recipe Tabs & Version Picker */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <h3 className="font-bold text-xs text-stone-800 uppercase tracking-wider">
                Daftar Resep Produk ({(recipes || []).length})
              </h3>
            </div>

            <div className="space-y-2">
              {(recipes || []).map((rec) => {
                const isSelected = rec.id === currentRecipe.id;
                const recVers = rec.versions || [];
                const latestVer =
                  recVers.find((v) => v.id === rec.currentVersionId) ||
                  recVers[recVers.length - 1];

                return (
                  <button
                    key={rec.id}
                    onClick={() => {
                      setSelectedRecipeId(rec.id);
                      setSelectedVersionId('');
                    }}
                    className={`w-full text-left p-3 rounded-lg border transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-500/10 border-amber-500 text-stone-950 ring-1 ring-amber-500'
                        : 'bg-stone-50 border-stone-200 hover:bg-stone-100/70 text-stone-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-stone-900 truncate">
                        {rec.name}
                      </span>
                      <span className="font-mono text-[10px] px-1.5 py-0.5 bg-white rounded border text-stone-600 font-semibold">
                        {latestVer?.versionNumber}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-stone-500 mt-2">
                      <span>{rec.category}</span>
                      <span className="font-bold text-amber-900 font-mono">
                        HPP {formatRupiah(latestVer?.totalHppPerUnit)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Version History Card */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-stone-100">
              <div className="flex items-center space-x-1.5">
                <History className="w-4 h-4 text-stone-600" />
                <h3 className="font-bold text-xs text-stone-800 uppercase tracking-wider">
                  Histori Versi Resep
                </h3>
              </div>
              <button
                onClick={handleOpenNewVersion}
                className="text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center space-x-1"
              >
                <Plus className="w-3 h-3" />
                <span>Buat Versi Baru</span>
              </button>
            </div>

            <div className="space-y-2">
              {recipeVersions.map((ver) => {
                const isActive = ver.id === activeVersion.id;
                const isCurrentLive = ver.id === currentRecipe.currentVersionId;

                return (
                  <button
                    key={ver.id}
                    onClick={() => setSelectedVersionId(ver.id)}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition ${
                      isActive
                        ? 'bg-stone-900 text-white border-stone-900 shadow-xs'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold">{ver.versionNumber}</span>
                      <div className="flex items-center space-x-1">
                        {isCurrentLive && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-emerald-500 text-white rounded font-bold">
                            Live Aktif
                          </span>
                        )}
                        <span className="text-[10px] opacity-70">
                          {formatDateIndo(ver.createdAt)}
                        </span>
                      </div>
                    </div>
                    <p className={`text-[11px] mt-1 line-clamp-2 ${isActive ? 'text-stone-300' : 'text-stone-500'}`}>
                      {ver.changeLog || 'Formulasi standar'}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col (8 cols): Detailed BOM Breakdown & HPP Summary */}
        <div className="lg:col-span-8 space-y-4">
          {/* Main Recipe Info Banner */}
          <div className="bg-stone-900 text-white rounded-xl p-5 border border-stone-800 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="px-2 py-0.5 bg-amber-400 text-stone-950 font-mono font-bold text-xs rounded">
                    {activeVersion.versionNumber}
                  </span>
                  <span className="text-xs text-stone-400">{currentRecipe.category}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-white mt-1">
                  {currentRecipe.name}
                </h3>
                <p className="text-xs text-stone-300 mt-0.5">
                  {activeVersion.notes || currentRecipe.description}
                </p>
              </div>

              {/* Specs pill */}
              <div className="flex sm:flex-col items-end justify-between sm:justify-center bg-stone-800/80 px-3.5 py-2.5 rounded-lg border border-stone-700 text-right">
                <span className="text-[11px] text-stone-400">Total HPP per Pcs</span>
                <span className="text-xl font-extrabold text-amber-400 font-mono">
                  {formatRupiah(activeVersion.totalHppPerUnit)}
                </span>
              </div>
            </div>

            {/* Target Weights & Specs Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4 pt-3 border-t border-stone-800 text-xs">
              <div>
                <span className="text-stone-400 text-[10px] block">Target Adonan</span>
                <span className="font-bold text-white">± {activeVersion.targetBatterWeightGram} gram</span>
              </div>
              <div>
                <span className="text-stone-400 text-[10px] block">Target Matang</span>
                <span className="font-bold text-white">± {activeVersion.targetBakedWeightGram} gram</span>
              </div>
              <div>
                <span className="text-stone-400 text-[10px] block">Yield Output</span>
                <span className="font-bold text-white">{activeVersion.yieldQty} Pcs / Batch</span>
              </div>
              <div>
                <span className="text-stone-400 text-[10px] block">Dibuat Oleh</span>
                <span className="font-bold text-white">{activeVersion.createdBy || 'Head Baker'}</span>
              </div>
            </div>
          </div>

          {/* BOM Ingredients Breakdown Table */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-stone-50/80 border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-amber-700" />
                <h4 className="font-bold text-xs text-stone-900 uppercase tracking-wider">
                  1. Rincian Komposisi Bahan Baku (BOM)
                </h4>
              </div>
              <span className="text-xs font-bold text-stone-900 font-mono">
                Subtotal: {formatRupiah(activeVersion.totalRawCost)}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-100 text-stone-600 font-bold uppercase tracking-wider text-[10px] border-b border-stone-200">
                  <tr>
                    <th className="p-3">Bahan Baku</th>
                    <th className="p-3 text-right">Takaran Resep</th>
                    <th className="p-3 text-right">Harga Satuan Bahan</th>
                    <th className="p-3 text-right">Biaya Modal (Rp)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {(activeVersion.items || []).map((item, idx) => (
                    <tr key={idx} className="hover:bg-stone-50">
                      <td className="p-3 font-semibold text-stone-800">{item.ingredientName}</td>
                      <td className="p-3 text-right font-bold text-stone-900 font-mono">
                        {item.quantity} {item.recipeUnit}
                      </td>
                      <td className="p-3 text-right text-stone-500 text-[11px]">
                        {formatRupiah(item.unitCostSnapshot)}/{item.recipeUnit}
                      </td>
                      <td className="p-3 text-right font-bold text-stone-900 font-mono">
                        {formatRupiah(item.cost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Packaging & Direct Costs Sub-grids */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Packaging Card */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <h4 className="font-bold text-xs text-stone-900 uppercase tracking-wider">
                  2. Kemasan & Packaging
                </h4>
                <span className="font-bold text-xs text-stone-900 font-mono">
                  {formatRupiah(activeVersion.totalPackagingCost)}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {(activeVersion.packaging || []).map((pkg, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-stone-700">
                      • {pkg.name} (x{pkg.quantity})
                    </span>
                    <span className="font-mono font-bold text-stone-900">
                      {formatRupiah(pkg.totalCost)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Direct Costs Card */}
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                <h4 className="font-bold text-xs text-stone-900 uppercase tracking-wider">
                  3. Gas, Listrik & Tenaga Kerja
                </h4>
                <span className="font-bold text-xs text-stone-900 font-mono">
                  {formatRupiah(activeVersion.totalDirectCost)}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {(activeVersion.directCosts || []).map((dc, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-stone-700">• {dc.name}</span>
                    <span className="font-mono font-bold text-stone-900">
                      {formatRupiah(dc.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Simulation Trigger Banner */}
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-amber-700" />
              <div>
                <h5 className="font-bold text-xs text-amber-950">
                  Ingin menghitung rekomendasi harga jual bolu ini?
                </h5>
                <p className="text-[11px] text-amber-800">
                  Lihat simulasi margin 30%, 40%, 50%, dan estimasi laba kotor per box.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsSimulatorOpen(true)}
              className="px-3.5 py-1.5 bg-stone-900 hover:bg-stone-800 text-amber-400 font-bold text-xs rounded-lg transition whitespace-nowrap"
            >
              Buka Simulasi →
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <RecipeEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        recipeToEdit={currentRecipe}
        mode={editorMode}
      />

      <HppSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        recipe={currentRecipe}
        version={activeVersion}
      />
    </div>
  );
};
