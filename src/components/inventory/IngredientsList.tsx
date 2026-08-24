import React, { useState } from 'react';
import { useBakery } from '../../context/BakeryContext';
import { Ingredient, Supplier } from '../../types';
import { formatRupiah, formatDateIndo } from '../../utils/formatters';
import { IngredientFormModal } from './IngredientFormModal';
import { PurchaseModal } from './PurchaseModal';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  ShoppingBag,
  Edit2,
  Trash2,
  Truck,
  FileSpreadsheet,
  CheckCircle2,
  Clock,
  X,
} from 'lucide-react';

export const IngredientsList: React.FC = () => {
  const {
    ingredients,
    deleteIngredient,
    suppliers,
    addSupplier,
    updateSupplier,
    deleteSupplier,
    purchases,
  } = useBakery();

  const [activeSubTab, setActiveSubTab] = useState<'ingredients' | 'purchases' | 'suppliers'>('ingredients');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [onlyLowStock, setOnlyLowStock] = useState(false);

  // Modals state
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);

  // Supplier modal
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    address: '',
    notes: '',
  });

  const safeIngredients = ingredients || [];
  const safeSuppliers = suppliers || [];
  const safePurchases = purchases || [];

  const categories = ['ALL', ...Array.from(new Set(safeIngredients.map((i) => i.category)))];

  const filteredIngredients = safeIngredients.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const isLow = item.stockInRecipeUnit <= item.minStockInRecipeUnit;
    const matchesLowStock = onlyLowStock ? isLow : true;

    return matchesSearch && matchesCategory && matchesLowStock;
  });

  const handleOpenEdit = (ing: Ingredient) => {
    setEditingIngredient(ing);
    setIsIngredientModalOpen(true);
  };

  const handleOpenNew = () => {
    setEditingIngredient(null);
    setIsIngredientModalOpen(true);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.name.trim()) return;

    if (editingSupplier) {
      updateSupplier(editingSupplier.id, supplierForm);
    } else {
      addSupplier({
        ...supplierForm,
        suppliedIngredients: [],
      });
    }
    setIsSupplierModalOpen(false);
    setEditingSupplier(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Modul Inventori & Bahan
            </span>
          </div>
          <h2 className="text-xl font-bold text-stone-900 mt-1">
            Master Bahan Baku, Kemasan & Pembelian (PO)
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Kontrol stok bahan, konversi satuan pembelian ke resep, dan update HPP otomatis saat belanja bahan.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsPurchaseModalOpen(true)}
            className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs rounded-lg transition shadow-sm flex items-center space-x-1.5 whitespace-nowrap"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>+ Catat Pembelian (PO)</span>
          </button>

          <button
            onClick={handleOpenNew}
            className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-lg transition flex items-center space-x-1.5 whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Bahan Baku</span>
          </button>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex border-b border-stone-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('ingredients')}
          className={`pb-3 border-b-2 transition flex items-center space-x-2 ${
            activeSubTab === 'ingredients'
              ? 'border-amber-500 text-amber-800'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span>Stok Bahan & Kemasan ({ingredients.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('purchases')}
          className={`pb-3 border-b-2 transition flex items-center space-x-2 ${
            activeSubTab === 'purchases'
              ? 'border-amber-500 text-amber-800'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Riwayat Pembelian PO ({purchases.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('suppliers')}
          className={`pb-3 border-b-2 transition flex items-center space-x-2 ${
            activeSubTab === 'suppliers'
              ? 'border-amber-500 text-amber-800'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Master Supplier ({suppliers.length})</span>
        </button>
      </div>

      {/* TAB 1: INGREDIENTS LIST */}
      {activeSubTab === 'ingredients' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-xl border border-stone-200 shadow-sm text-xs">
            <div className="flex items-center space-x-2 w-full sm:w-80">
              <div className="relative w-full">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari nama bahan, SKU, atau kemasan..."
                  className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c === 'ALL' ? 'Semua Kategori' : c}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setOnlyLowStock(!onlyLowStock)}
                className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition ${
                  onlyLowStock
                    ? 'bg-rose-50 border-rose-300 text-rose-700'
                    : 'bg-white border-stone-300 text-stone-600 hover:bg-stone-50'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Hanya Stok Menipis</span>
              </button>
            </div>
          </div>

          {/* Ingredients Table */}
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3.5">Bahan / SKU</th>
                    <th className="p-3.5">Kategori</th>
                    <th className="p-3.5">Satuan & Konversi</th>
                    <th className="p-3.5 text-right">Harga Beli</th>
                    <th className="p-3.5 text-right">Biaya Satuan Resep</th>
                    <th className="p-3.5 text-right">Stok Gudang</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/70">
                  {filteredIngredients.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-stone-400">
                        Tidak ada bahan baku yang cocok dengan pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredIngredients.map((item) => {
                      const isLow = item.stockInRecipeUnit <= item.minStockInRecipeUnit;
                      const isOutOfStock = item.stockInRecipeUnit <= 0;

                      return (
                        <tr key={item.id} className="hover:bg-stone-50/80 transition">
                          <td className="p-3.5">
                            <div className="font-bold text-stone-900">{item.name}</div>
                            <div className="font-mono text-[10px] text-stone-400">{item.sku}</div>
                            {item.defaultSupplierName && (
                              <div className="text-[10px] text-stone-500 mt-0.5">
                                Supplier: {item.defaultSupplierName}
                              </div>
                            )}
                          </td>

                          <td className="p-3.5">
                            <span className="px-2 py-0.5 bg-stone-100 text-stone-700 rounded-md font-medium text-[11px]">
                              {item.category}
                            </span>
                          </td>

                          <td className="p-3.5">
                            <div className="text-stone-800 font-medium">
                              Beli: <strong>1 {item.buyUnit}</strong>
                            </div>
                            <div className="text-stone-500 text-[11px]">
                              = {item.conversionFactor} {item.recipeUnit}
                            </div>
                          </td>

                          <td className="p-3.5 text-right">
                            <span className="font-bold text-stone-900">
                              {formatRupiah(item.latestBuyPrice)}
                            </span>
                            <span className="text-[10px] text-stone-400 block">
                              /{item.buyUnit}
                            </span>
                          </td>

                          <td className="p-3.5 text-right">
                            <span className="font-mono font-bold text-amber-800">
                              {formatRupiah(item.costPerRecipeUnit)}
                            </span>
                            <span className="text-[10px] text-stone-400 block">
                              /{item.recipeUnit}
                            </span>
                          </td>

                          <td className="p-3.5 text-right">
                            <div
                              className={`font-extrabold ${
                                isOutOfStock
                                  ? 'text-rose-700'
                                  : isLow
                                  ? 'text-amber-700'
                                  : 'text-stone-900'
                              }`}
                            >
                              {item.recipeUnit === 'g' && item.stockInRecipeUnit >= 1000
                                ? `${(item.stockInRecipeUnit / 1000).toFixed(1)} kg (${item.stockInRecipeUnit} g)`
                                : `${item.stockInRecipeUnit} ${item.recipeUnit}`}
                            </div>
                            <div className="text-[10px] text-stone-400">
                              Min: {item.minStockInRecipeUnit} {item.recipeUnit}
                            </div>
                          </td>

                          <td className="p-3.5">
                            {isOutOfStock ? (
                              <span className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded-full font-bold text-[10px]">
                                Habis (0)
                              </span>
                            ) : isLow ? (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full font-bold text-[10px] flex items-center w-fit space-x-1">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Menipis</span>
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[10px]">
                                Aman
                              </span>
                            )}
                          </td>

                          <td className="p-3.5 text-center">
                            <div className="flex items-center justify-center space-x-1.5">
                              <button
                                onClick={() => handleOpenEdit(item)}
                                className="p-1.5 text-stone-500 hover:text-stone-900 hover:bg-stone-100 rounded-md transition"
                                title="Edit Bahan"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Hapus bahan baku "${item.name}"?`)) {
                                    deleteIngredient(item.id);
                                  }
                                }}
                                className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                                title="Hapus Bahan"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PURCHASES (PO) HISTORY */}
      {activeSubTab === 'purchases' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-stone-900">
                  Daftar Transaksi Pembelian Bahan Baku
                </h3>
                <p className="text-xs text-stone-500">
                  Semua pembelian bahan baku secara otomatis menambah stok gudang
                </p>
              </div>
              <button
                onClick={() => setIsPurchaseModalOpen(true)}
                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs rounded-lg shadow-sm flex items-center space-x-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Catat Pembelian Baru</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="p-3.5">No. PO & Tanggal</th>
                    <th className="p-3.5">Supplier</th>
                    <th className="p-3.5">Rincian Bahan</th>
                    <th className="p-3.5 text-right">Total Pembelian</th>
                    <th className="p-3.5">Status Bayar</th>
                    <th className="p-3.5">Dicatat Oleh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-200/70">
                  {safePurchases.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-stone-400">
                        Belum ada riwayat pembelian.
                      </td>
                    </tr>
                  ) : (
                    safePurchases.map((po) => (
                      <tr key={po.id} className="hover:bg-stone-50">
                        <td className="p-3.5">
                          <div className="font-mono font-bold text-stone-900">
                            {po.purchaseNumber}
                          </div>
                          <div className="text-stone-500 text-[11px]">
                            {formatDateIndo(po.date)}
                          </div>
                        </td>

                        <td className="p-3.5">
                          <div className="font-bold text-stone-900">{po.supplierName}</div>
                        </td>

                        <td className="p-3.5">
                          <div className="space-y-1">
                            {(po.items || []).map((item, idx) => (
                              <div key={idx} className="text-[11px] text-stone-700">
                                • {item.ingredientName} ({item.qtyBuyUnit} {item.buyUnit} @{' '}
                                {formatRupiah(item.pricePerBuyUnit)})
                              </div>
                            ))}
                          </div>
                        </td>

                        <td className="p-3.5 text-right font-extrabold text-stone-900 font-mono">
                          {formatRupiah(po.totalAmount)}
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                              po.paymentStatus === 'LUNAS'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {po.paymentStatus}
                          </span>
                        </td>

                        <td className="p-3.5 text-stone-500 text-[11px]">{po.recordedBy}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SUPPLIERS */}
      {activeSubTab === 'suppliers' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
            <div>
              <h3 className="font-bold text-sm text-stone-900">Daftar Supplier Bahan Baku</h3>
              <p className="text-xs text-stone-500">
                Penyedia bahan kue, telur segar, buah pisang, dan percetakan kemasan
              </p>
            </div>
            <button
              onClick={() => {
                setEditingSupplier(null);
                setSupplierForm({
                  name: '',
                  contactPerson: '',
                  phone: '',
                  address: '',
                  notes: '',
                });
                setIsSupplierModalOpen(true);
              }}
              className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-lg transition flex items-center space-x-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Supplier</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {safeSuppliers.map((sup) => (
              <div
                key={sup.id}
                className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-stone-900">{sup.name}</h4>
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => {
                          setEditingSupplier(sup);
                          setSupplierForm({
                            name: sup.name,
                            contactPerson: sup.contactPerson,
                            phone: sup.phone,
                            address: sup.address,
                            notes: sup.notes || '',
                          });
                          setIsSupplierModalOpen(true);
                        }}
                        className="p-1 text-stone-500 hover:text-stone-900 rounded"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Hapus supplier "${sup.name}"?`)) {
                            deleteSupplier(sup.id);
                          }
                        }}
                        className="p-1 text-stone-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="text-xs text-stone-600 mt-2 space-y-1">
                    <div>
                      Kontak: <strong>{sup.contactPerson}</strong> ({sup.phone})
                    </div>
                    <div>Alamat: {sup.address}</div>
                    {sup.notes && (
                      <div className="text-stone-500 italic bg-stone-50 p-2 rounded text-[11px] mt-2">
                        "{sup.notes}"
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <a
                    href={`https://wa.me/${sup.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-700 hover:underline font-semibold flex items-center space-x-1"
                  >
                    <span>Hubungi via WhatsApp →</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODALS */}
      <IngredientFormModal
        isOpen={isIngredientModalOpen}
        onClose={() => setIsIngredientModalOpen(false)}
        initialData={editingIngredient}
      />

      <PurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
      />

      {/* Supplier Modal */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-stone-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingSupplier ? 'Ubah Data Supplier' : 'Tambah Supplier Baru'}
              </h3>
              <button
                onClick={() => setIsSupplierModalOpen(false)}
                className="p-1 text-stone-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Nama Toko / Supplier *</label>
                <input
                  type="text"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                  placeholder="Contoh: Toko Bahan Kue Barokah"
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Nama Kontak Person</label>
                <input
                  type="text"
                  value={supplierForm.contactPerson}
                  onChange={(e) =>
                    setSupplierForm({ ...supplierForm, contactPerson: e.target.value })
                  }
                  placeholder="Pak Kevin"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Nomor WhatsApp / HP</label>
                <input
                  type="text"
                  value={supplierForm.phone}
                  onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                  placeholder="08123456789"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Alamat Supplier</label>
                <input
                  type="text"
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                  placeholder="Jl. Pasar Baru No. 12"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Catatan</label>
                <textarea
                  value={supplierForm.notes}
                  onChange={(e) => setSupplierForm({ ...supplierForm, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2 font-semibold text-stone-700 bg-stone-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-lg"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
