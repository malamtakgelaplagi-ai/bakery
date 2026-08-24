import React, { useState } from 'react';
import { Recipe, RecipeVersion } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { X, Calculator, Percent, TrendingUp, DollarSign, ArrowRight } from 'lucide-react';

interface HppSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe;
  version: RecipeVersion;
}

export const HppSimulatorModal: React.FC<HppSimulatorModalProps> = ({
  isOpen,
  onClose,
  recipe,
  version,
}) => {
  const [customMargin, setCustomMargin] = useState<number>(45);
  const [customSellingPrice, setCustomSellingPrice] = useState<number>(55000);

  if (!isOpen) return null;

  const totalHpp = version.totalHppPerUnit;

  // Standard margin tiers
  const tiers = [30, 40, 50, 60];

  // Calculated price from margin: Price = HPP / (1 - Margin%)
  const calculatePriceFromMargin = (marginPct: number) => {
    if (marginPct >= 100) return 0;
    return totalHpp / (1 - marginPct / 100);
  };

  // Calculated margin from price: Margin% = (Price - HPP) / Price * 100
  const calculatedMarginFromPrice =
    customSellingPrice > 0
      ? ((customSellingPrice - totalHpp) / customSellingPrice) * 100
      : 0;

  const profitPerPcs = Math.max(0, customSellingPrice - totalHpp);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Calculator className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm sm:text-base">
              Simulasi Margin & Penetapan Harga Jual
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto text-xs">
          {/* Target Recipe Header */}
          <div className="bg-stone-50 p-3.5 rounded-lg border border-stone-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-sm text-stone-900">{recipe.name}</h4>
                <p className="text-stone-500 text-[11px]">
                  Versi {version.versionNumber} • Target Adonan: {version.targetBatterWeightGram}g → Matang: ±{version.targetBakedWeightGram}g
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-stone-400 block uppercase font-bold">
                  HPP Modal Pokok
                </span>
                <span className="text-base font-extrabold text-stone-900 font-mono">
                  {formatRupiah(totalHpp)}
                </span>
              </div>
            </div>

            {/* HPP Sub-breakdown */}
            <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-stone-200/80 text-center text-[11px]">
              <div className="bg-white p-2 rounded border border-stone-200">
                <span className="text-stone-400 block text-[10px]">Bahan Baku (BOM)</span>
                <span className="font-bold text-stone-800">
                  {formatRupiah(version.totalRawCost)}
                </span>
              </div>
              <div className="bg-white p-2 rounded border border-stone-200">
                <span className="text-stone-400 block text-[10px]">Kemasan & Box</span>
                <span className="font-bold text-stone-800">
                  {formatRupiah(version.totalPackagingCost)}
                </span>
              </div>
              <div className="bg-white p-2 rounded border border-stone-200">
                <span className="text-stone-400 block text-[10px]">Gas, Listrik & Baker</span>
                <span className="font-bold text-stone-800">
                  {formatRupiah(version.totalDirectCost)}
                </span>
              </div>
            </div>
          </div>

          {/* Standard Margin Tiers */}
          <div>
            <label className="block font-bold text-stone-800 mb-2">
              Rekomendasi Berdasarkan Target Margin Standar Usaha Bakery
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {tiers.map((m) => {
                const recPrice = calculatePriceFromMargin(m);
                const roundedPrice = Math.ceil(recPrice / 1000) * 1000; // Round up to nearest Rp 1.000
                const laba = roundedPrice - totalHpp;

                return (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setCustomSellingPrice(roundedPrice)}
                    className={`p-3 rounded-lg border text-left transition flex flex-col justify-between ${
                      customSellingPrice === roundedPrice
                        ? 'bg-amber-500/10 border-amber-500 text-stone-900 ring-1 ring-amber-500'
                        : 'bg-white border-stone-200 hover:border-stone-400 text-stone-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">Margin {m}%</span>
                        <Percent className="w-3 h-3 text-stone-400" />
                      </div>
                      <div className="text-sm font-extrabold text-stone-900 mt-1 font-mono">
                        {formatRupiah(roundedPrice)}
                      </div>
                    </div>
                    <div className="text-[10px] text-emerald-700 font-semibold mt-2 pt-1 border-t border-stone-100">
                      Laba: +{formatRupiah(laba)}/pcs
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Interactive Pricing Simulator */}
          <div className="p-4 bg-stone-900 text-white rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-amber-400 flex items-center space-x-1">
                <TrendingUp className="w-4 h-4" />
                <span>Simulasi Harga Jual Kustom</span>
              </span>
              <span className="text-[11px] text-stone-400">Real-time Margin Calculator</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] text-stone-300 font-semibold mb-1">
                  Masukkan Rencana Harga Jual (Rp)
                </label>
                <input
                  type="number"
                  step="500"
                  value={customSellingPrice}
                  onChange={(e) => setCustomSellingPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 text-sm font-extrabold text-stone-950 bg-amber-50 border border-amber-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div className="flex flex-col justify-center bg-stone-800/80 p-3 rounded-lg border border-stone-700">
                <div className="flex items-center justify-between">
                  <span className="text-stone-400 text-[11px]">Gross Margin:</span>
                  <span
                    className={`font-extrabold text-sm ${
                      calculatedMarginFromPrice >= 40
                        ? 'text-emerald-400'
                        : calculatedMarginFromPrice >= 25
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {calculatedMarginFromPrice.toFixed(1)}%
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-stone-400 text-[11px]">Laba Kotor / Pcs:</span>
                  <span className="font-bold text-white text-xs">
                    {formatRupiah(profitPerPcs)}
                  </span>
                </div>
              </div>
            </div>

            <div className="text-[11px] text-stone-300 border-t border-stone-800 pt-2 flex items-center justify-between">
              <span>Simulasi 100 Loyang Terjual:</span>
              <span className="font-bold text-amber-400">
                Omzet: {formatRupiah(customSellingPrice * 100)} | Profit: {formatRupiah(profitPerPcs * 100)}
              </span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition"
            >
              Tutup Simulator
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
