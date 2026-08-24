import React, { useState } from 'react';
import { useBakery } from '../../context/BakeryContext';
import { Product } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { ProductFormModal } from './ProductFormModal';
import {
  Package,
  Plus,
  Search,
  Edit2,
  Trash2,
  AlertTriangle,
  Sparkles,
  TrendingUp,
  Scale,
  Clock,
  Layers,
} from 'lucide-react';

export const ProductCatalog: React.FC = () => {
  const { products, deleteProduct, recipes } = useBakery();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleOpenEdit = (prod: Product) => {
    setEditingProduct(prod);
    setIsModalOpen(true);
  };

  const handleOpenNew = () => {
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Katalog Produk Jadi
            </span>
          </div>
          <h2 className="text-xl font-bold text-stone-900 mt-1">
            Master Produk, Harga Jual & Stok Etalase
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Daftar bolu dan aneka cake siap jual yang terhubung langsung dengan formula resep dan HPP.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs rounded-lg transition shadow-sm flex items-center space-x-1.5 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tambah Produk Baru</span>
        </button>
      </div>

      {/* Search & Stats Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-xl border border-stone-200 shadow-sm text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari bolu, cake, SKU..."
            className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
          />
        </div>

        <div className="text-stone-500 text-xs">
          Total <strong>{products.length}</strong> SKU Produk Terdaftar
        </div>
      </div>

      {/* Product Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProducts.map((prod) => {
          const isLow = prod.stockFinishedGoods <= prod.minStockFinishedGoods;
          const recipe = (recipes || []).find((r) => r.id === prod.recipeId);
          const recVers = recipe?.versions || [];
          const activeVer = recVers.find((v) => v.id === prod.recipeVersionId) || recVers[0];

          return (
            <div
              key={prod.id}
              className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden flex flex-col justify-between hover:border-amber-400/60 transition group"
            >
              <div className="p-5 space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-stone-100 text-stone-600 rounded">
                        {prod.sku}
                      </span>
                      <span className="text-[11px] text-stone-400">{prod.category}</span>
                    </div>
                    <h3 className="font-bold text-base text-stone-900 mt-1">{prod.name}</h3>
                  </div>

                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleOpenEdit(prod)}
                      className="p-1.5 text-stone-400 hover:text-stone-900 hover:bg-stone-100 rounded-md transition"
                      title="Edit Produk"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm(`Hapus produk "${prod.name}"?`)) {
                          deleteProduct(prod.id);
                        }
                      }}
                      className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                      title="Hapus Produk"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {prod.description && (
                  <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                    {prod.description}
                  </p>
                )}

                {/* Specs Tag Row */}
                <div className="grid grid-cols-3 gap-2 text-center text-[11px]">
                  <div className="bg-stone-50 p-2 rounded border border-stone-100">
                    <span className="text-stone-400 block text-[10px]">Ukuran</span>
                    <span className="font-semibold text-stone-800">{prod.sizeSpec}</span>
                  </div>
                  <div className="bg-stone-50 p-2 rounded border border-stone-100">
                    <span className="text-stone-400 block text-[10px]">Berat Matang</span>
                    <span className="font-semibold text-stone-800">±{prod.bakedWeightGram}g</span>
                  </div>
                  <div className="bg-stone-50 p-2 rounded border border-stone-100">
                    <span className="text-stone-400 block text-[10px]">Daya Simpan</span>
                    <span className="font-semibold text-stone-800">{prod.shelfLifeDays} Hari</span>
                  </div>
                </div>

                {/* HPP & Margin Financial Breakdown */}
                <div className="p-3 bg-stone-50/80 rounded-lg border border-stone-200/80 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 text-[11px]">HPP Pokok:</span>
                    <span className="font-mono font-bold text-stone-900">
                      {formatRupiah(prod.baseHpp)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-stone-500 text-[11px]">Harga Jual:</span>
                    <span className="font-mono font-extrabold text-stone-950 text-sm">
                      {formatRupiah(prod.sellingPrice)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1.5 border-t border-stone-200 text-[11px]">
                    <span className="text-stone-600 font-medium">Laba / Margin:</span>
                    <span className="font-bold text-emerald-700">
                      +{formatRupiah(prod.sellingPrice - prod.baseHpp)} ({prod.grossMarginPercent}%)
                    </span>
                  </div>
                </div>
              </div>

              {/* Bottom Stock Status */}
              <div className="px-5 py-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs">
                <div>
                  <span className="text-stone-400 text-[11px] block">Stok Siap Jual:</span>
                  <span
                    className={`font-extrabold text-sm ${
                      isLow ? 'text-rose-700' : 'text-stone-900'
                    }`}
                  >
                    {prod.stockFinishedGoods} Loyang / Pcs
                  </span>
                </div>

                <div>
                  {isLow ? (
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-bold text-[10px] flex items-center space-x-1">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Stok Kritis</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                      Stok Tersedia
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        productToEdit={editingProduct}
      />
    </div>
  );
};
