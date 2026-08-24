import React, { useState, useEffect } from 'react';
import { useBakery } from '../../context/BakeryContext';
import { Product } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { X, Package, CheckCircle2 } from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
}) => {
  const { recipes, addProduct, updateProduct } = useBakery();
  const safeRecipes = recipes || [];

  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('Bolu Pisang');
  const [sizeSpec, setSizeSpec] = useState('Ø20 cm (Medium)');
  const [bakedWeightGram, setBakedWeightGram] = useState(900);
  const [recipeId, setRecipeId] = useState('');
  const [sellingPrice, setSellingPrice] = useState(55000);
  const [stockFinishedGoods, setStockFinishedGoods] = useState(10);
  const [minStockFinishedGoods, setMinStockFinishedGoods] = useState(5);
  const [shelfLifeDays, setShelfLifeDays] = useState(4);
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (!isOpen) return;

    if (productToEdit) {
      setName(productToEdit.name);
      setSku(productToEdit.sku);
      setCategory(productToEdit.category);
      setSizeSpec(productToEdit.sizeSpec);
      setBakedWeightGram(productToEdit.bakedWeightGram);
      setRecipeId(productToEdit.recipeId);
      setSellingPrice(productToEdit.sellingPrice);
      setStockFinishedGoods(productToEdit.stockFinishedGoods);
      setMinStockFinishedGoods(productToEdit.minStockFinishedGoods);
      setShelfLifeDays(productToEdit.shelfLifeDays || 4);
      setDescription(productToEdit.description || '');
    } else {
      setName('');
      setSku(`BP-${Math.floor(10 + Math.random() * 90)}`);
      setCategory('Bolu Pisang');
      setSizeSpec('Ø20 cm (Medium)');
      setBakedWeightGram(900);
      setRecipeId(recipes[0]?.id || '');
      setSellingPrice(55000);
      setStockFinishedGoods(8);
      setMinStockFinishedGoods(4);
      setShelfLifeDays(4);
      setDescription('');
    }
  }, [isOpen, productToEdit, recipes]);

  if (!isOpen) return null;

  const selectedRecipe = recipes.find((r) => r.id === recipeId) || recipes[0];
  const activeVersion = selectedRecipe
    ? selectedRecipe.versions.find((v) => v.id === selectedRecipe.currentVersionId) ||
      selectedRecipe.versions[selectedRecipe.versions.length - 1]
    : null;

  const baseHpp = activeVersion ? activeVersion.totalHppPerUnit : 28000;
  const grossMarginPercent =
    sellingPrice > 0 ? Number((((sellingPrice - baseHpp) / sellingPrice) * 100).toFixed(1)) : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const prodPayload = {
      sku,
      name,
      category,
      sizeSpec,
      bakedWeightGram: Number(bakedWeightGram),
      recipeId: selectedRecipe?.id || '',
      recipeVersionId: activeVersion?.id || '',
      sellingPrice: Number(sellingPrice),
      baseHpp,
      grossMarginPercent,
      stockFinishedGoods: Number(stockFinishedGoods),
      minStockFinishedGoods: Number(minStockFinishedGoods),
      status: 'active' as const,
      description,
      shelfLifeDays: Number(shelfLifeDays),
    };

    if (productToEdit) {
      updateProduct(productToEdit.id, prodPayload);
    } else {
      addProduct(prodPayload);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Package className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm sm:text-base">
              {productToEdit ? 'Ubah Data Produk Siap Jual' : 'Tambah Produk Baru ke Katalog'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-bold text-stone-800 mb-1">Nama Produk Jadi *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Bolu Pisang Medium Original"
                required
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1">SKU / Kode</label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-3 py-2 font-mono font-bold uppercase border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-800 mb-1">Kategori Produk</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Bolu Pisang / Cake / Brownies"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1">
                Tautkan Resep Produksi (BOM) *
              </label>
              <select
                value={recipeId}
                onChange={(e) => setRecipeId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none bg-white font-medium"
              >
                {safeRecipes.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-stone-800 mb-1">Ukuran / Loyang</label>
              <input
                type="text"
                value={sizeSpec}
                onChange={(e) => setSizeSpec(e.target.value)}
                placeholder="Ø20 cm (Medium)"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1">Berat Matang (g)</label>
              <input
                type="number"
                value={bakedWeightGram}
                onChange={(e) => setBakedWeightGram(Number(e.target.value))}
                placeholder="900"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1">Daya Simpan (Hari)</label>
              <input
                type="number"
                value={shelfLifeDays}
                onChange={(e) => setShelfLifeDays(Number(e.target.value))}
                placeholder="4"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* Pricing & Margin Banner */}
          <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-stone-800 mb-1">
                  Harga Jual Kasir (Rp) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-stone-400 font-bold">Rp</span>
                  <input
                    type="number"
                    step="1000"
                    value={sellingPrice}
                    onChange={(e) => setSellingPrice(Number(e.target.value))}
                    required
                    className="w-full pl-9 pr-3 py-2 font-mono font-bold text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-white p-2.5 rounded-lg border border-stone-200 flex flex-col justify-center text-[11px]">
                <div className="flex justify-between">
                  <span className="text-stone-500">HPP Resep:</span>
                  <span className="font-mono font-bold text-stone-900">{formatRupiah(baseHpp)}</span>
                </div>
                <div className="flex justify-between mt-1 pt-1 border-t border-stone-100 font-bold">
                  <span className="text-stone-700">Gross Margin:</span>
                  <span className="text-emerald-700">{grossMarginPercent}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-800 mb-1">
                Stok Siap Jual Saat Ini (Pcs)
              </label>
              <input
                type="number"
                value={stockFinishedGoods}
                onChange={(e) => setStockFinishedGoods(Number(e.target.value))}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1">
                Batas Minimum Stok (Peringatan)
              </label>
              <input
                type="number"
                value={minStockFinishedGoods}
                onChange={(e) => setMinStockFinishedGoods(Number(e.target.value))}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-stone-800 mb-1">Deskripsi Produk</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Deskripsi singkat produk untuk display dan invoice..."
              className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
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
              className="px-4 py-2 text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition shadow-sm flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan Produk</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
