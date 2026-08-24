import React, { useState, useEffect } from 'react';
import { Ingredient, IngredientCategory } from '../../types';
import { useBakery } from '../../context/BakeryContext';
import { formatRupiah } from '../../utils/formatters';
import { X, Calculator, HelpCircle } from 'lucide-react';

interface IngredientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Ingredient | null;
}

const CATEGORIES: IngredientCategory[] = [
  'Bahan Utama',
  'Bahan Pengembang & Ragi',
  'Pemanis & Gula',
  'Perasa, Pewarna & Rempah',
  'Dairy & Lemak',
  'Kemasan & Packaging',
  'Topping & Isian',
  'Lainnya',
];

export const IngredientFormModal: React.FC<IngredientFormModalProps> = ({
  isOpen,
  onClose,
  initialData,
}) => {
  const { suppliers, addIngredient, updateIngredient } = useBakery();

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState<IngredientCategory>('Bahan Utama');
  const [buyUnit, setBuyUnit] = useState('kg');
  const [recipeUnit, setRecipeUnit] = useState('g');
  const [conversionFactor, setConversionFactor] = useState(1000);
  const [latestBuyPrice, setLatestBuyPrice] = useState<number>(20000);
  const [stockInRecipeUnit, setStockInRecipeUnit] = useState<number>(5000);
  const [minStockInRecipeUnit, setMinStockInRecipeUnit] = useState<number>(2000);
  const [defaultSupplierId, setDefaultSupplierId] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialData) {
      setName(initialData.name);
      setSku(initialData.sku);
      setCategory(initialData.category);
      setBuyUnit(initialData.buyUnit);
      setRecipeUnit(initialData.recipeUnit);
      setConversionFactor(initialData.conversionFactor || 1000);
      setLatestBuyPrice(initialData.latestBuyPrice);
      setStockInRecipeUnit(initialData.stockInRecipeUnit);
      setMinStockInRecipeUnit(initialData.minStockInRecipeUnit);
      setDefaultSupplierId(initialData.defaultSupplierId || '');
      setNotes(initialData.notes || '');
    } else {
      setName('');
      setSku(`RAW-${Math.floor(100 + Math.random() * 900)}`);
      setCategory('Bahan Utama');
      setBuyUnit('kg');
      setRecipeUnit('g');
      setConversionFactor(1000);
      setLatestBuyPrice(20000);
      setStockInRecipeUnit(5000);
      setMinStockInRecipeUnit(2000);
      setDefaultSupplierId(suppliers[0]?.id || '');
      setNotes('');
    }
  }, [initialData, isOpen, suppliers]);

  if (!isOpen) return null;

  const costPerRecipeUnit = latestBuyPrice / (conversionFactor || 1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const supplierObj = suppliers.find((s) => s.id === defaultSupplierId);

    if (initialData) {
      updateIngredient(initialData.id, {
        name,
        sku,
        category,
        buyUnit,
        recipeUnit,
        conversionFactor: Number(conversionFactor),
        latestBuyPrice: Number(latestBuyPrice),
        stockInRecipeUnit: Number(stockInRecipeUnit),
        minStockInRecipeUnit: Number(minStockInRecipeUnit),
        defaultSupplierId,
        defaultSupplierName: supplierObj?.name,
        notes,
      });
    } else {
      addIngredient({
        name,
        sku,
        category,
        buyUnit,
        recipeUnit,
        conversionFactor: Number(conversionFactor),
        latestBuyPrice: Number(latestBuyPrice),
        stockInRecipeUnit: Number(stockInRecipeUnit),
        minStockInRecipeUnit: Number(minStockInRecipeUnit),
        defaultSupplierId,
        defaultSupplierName: supplierObj?.name,
        status: 'active',
        notes,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 bg-stone-900 text-white flex items-center justify-between">
          <h3 className="font-bold text-sm sm:text-base flex items-center space-x-2">
            <span>{initialData ? 'Ubah Data Bahan Baku' : 'Tambah Master Bahan Baku Baru'}</span>
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Nama Bahan Baku / Kemasan *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Pisang Raja Matang / Box Bolu 20x20"
                required
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Kode / SKU</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none uppercase"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as IngredientCategory)}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none bg-white"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Supplier Default
              </label>
              <select
                value={defaultSupplierId}
                onChange={(e) => setDefaultSupplierId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none bg-white"
              >
                <option value="">-- Pilih Supplier --</option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Unit Conversion Formula Card */}
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-amber-900">
              <span className="flex items-center space-x-1.5">
                <Calculator className="w-4 h-4 text-amber-700" />
                <span>Konversi Satuan Pembelian → Satuan Resep</span>
              </span>
              <span className="text-[11px] font-normal text-amber-800">
                Otomatis hitung HPP per gram/pcs
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">
                  Satuan Beli
                </label>
                <input
                  type="text"
                  value={buyUnit}
                  onChange={(e) => setBuyUnit(e.target.value)}
                  placeholder="kg / pack"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-300 rounded focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">
                  Isi (Multiplier)
                </label>
                <input
                  type="number"
                  value={conversionFactor}
                  onChange={(e) => setConversionFactor(Number(e.target.value))}
                  placeholder="1000"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-300 rounded focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-stone-600 mb-0.5">
                  Satuan Resep
                </label>
                <input
                  type="text"
                  value={recipeUnit}
                  onChange={(e) => setRecipeUnit(e.target.value)}
                  placeholder="g / butir / pcs"
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-amber-300 rounded focus:outline-none"
                />
              </div>
            </div>

            <div className="text-[11px] text-amber-900 bg-white/80 p-2 rounded border border-amber-200/80">
              Contoh: 1 <strong>{buyUnit || 'kg'}</strong> = <strong>{conversionFactor}</strong>{' '}
              <strong>{recipeUnit || 'g'}</strong>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Harga Beli Terbaru (per {buyUnit || 'satuan'}) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-xs text-stone-400 font-semibold">
                  Rp
                </span>
                <input
                  type="number"
                  value={latestBuyPrice}
                  onChange={(e) => setLatestBuyPrice(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 text-xs font-bold border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>
              <p className="text-[11px] text-stone-500 mt-1">
                Biaya modal resep = <strong>{formatRupiah(costPerRecipeUnit)}</strong> per{' '}
                {recipeUnit}
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Stok Awal ({recipeUnit})
              </label>
              <input
                type="number"
                value={stockInRecipeUnit}
                onChange={(e) => setStockInRecipeUnit(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Batas Minimum Stok ({recipeUnit}) — Peringatan Menipis
            </label>
            <input
              type="number"
              value={minStockInRecipeUnit}
              onChange={(e) => setMinStockInRecipeUnit(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Catatan / Spesifikasi Bahan
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Contoh: Pisang ambon masak pohon, tekstur lembut aroma manis harum..."
              className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-stone-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg transition"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition shadow-sm"
            >
              {initialData ? 'Simpan Perubahan' : 'Tambah Bahan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
