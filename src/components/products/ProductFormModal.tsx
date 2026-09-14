import React, { useState, useEffect } from 'react';
import { useBakery } from '../../context/BakeryContext';
import { Product } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { normalizeImageUrl, isGoogleDriveUrl } from '../../utils/imageUrl';
import { X, Package, CheckCircle2, Link2, Sparkles, Image as ImageIcon } from 'lucide-react';

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
  const [image, setImage] = useState('');

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
      setImage(productToEdit.image || '');
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
      setImage('/products/bolu-pisang-original.jpg');
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
      image: normalizeImageUrl(image) || undefined,
    };

    if (productToEdit) {
      updateProduct(productToEdit.id, prodPayload);
    } else {
      addProduct(prodPayload);
    }

    onClose();
  };

  const isGdrive = isGoogleDriveUrl(image);
  const normalizedPreviewUrl = normalizeImageUrl(image);

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
            <div className="flex items-center justify-between mb-1">
              <label className="block font-bold text-stone-800">
                URL Foto Produk (Web, Etalase & Kasir)
              </label>
              {isGdrive && (
                <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  <Sparkles className="w-3 h-3 text-emerald-600" />
                  <span>Google Drive Terdeteksi & Otomatis Aktif</span>
                </span>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <input
                  type="url"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://drive.google.com/file/d/... atau URL gambar"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none text-xs"
                />
              </div>

              {image && (
                <div className="relative w-10 h-10 rounded-lg border border-stone-300 overflow-hidden shrink-0 bg-stone-100 flex items-center justify-center">
                  <img
                    src={normalizedPreviewUrl}
                    alt="Preview"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            {isGdrive && image !== normalizedPreviewUrl && (
              <div className="mt-1.5 p-2 bg-amber-50 rounded-lg border border-amber-200 flex items-center justify-between text-[11px] text-amber-900">
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Link Google Drive akan otomatis dikonversi ke Direct CDN saat disimpan.</span>
                </div>
                <button
                  type="button"
                  onClick={() => setImage(normalizedPreviewUrl)}
                  className="px-2 py-0.5 bg-amber-200 hover:bg-amber-300 text-stone-900 font-bold rounded text-[10px] transition shrink-0 ml-2"
                >
                  Terapkan Sekarang
                </button>
              </div>
            )}

            <span className="text-[10px] text-stone-500 block mt-1">
              Mendukung URL web gambar langsung (.jpg, .png) atau <strong>tautan berbagi Google Drive</strong> (pastikan akses disetel <em>Siapa saja yang memiliki link</em>).
            </span>
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
