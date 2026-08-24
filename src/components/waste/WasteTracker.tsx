import React, { useState } from 'react';
import { useBakery } from '../../context/BakeryContext';
import { WasteRecord } from '../../types';
import { formatRupiah, formatDateIndo } from '../../utils/formatters';
import {
  Trash2,
  Plus,
  AlertTriangle,
  Boxes,
  Package,
  Calendar,
  X,
  CheckCircle2,
} from 'lucide-react';

export const WasteTracker: React.FC = () => {
  const {
    wasteRecords,
    ingredients,
    products,
    recordWaste,
    deleteWasteRecord,
    currentUser,
  } = useBakery();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState<'BAHAN_BAKU' | 'PRODUK_JADI'>('BAHAN_BAKU');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState('Kadaluarsa / Busuk');
  const [notes, setNotes] = useState('');

  const safeWasteRecords = wasteRecords || [];
  const safeIngredients = ingredients || [];
  const safeProducts = products || [];

  const totalLostCost = safeWasteRecords.reduce((sum, w) => sum + (w.lostCost || 0), 0);

  const handleOpenModal = (wasteType: 'BAHAN_BAKU' | 'PRODUK_JADI') => {
    setType(wasteType);
    if (wasteType === 'BAHAN_BAKU') {
      setSelectedItemId(safeIngredients[0]?.id || '');
    } else {
      setSelectedItemId(safeProducts[0]?.id || '');
    }
    setQuantity(1);
    setReason('Kadaluarsa / Busuk');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleSaveWaste = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemId || quantity <= 0) return;

    let itemName = '';
    let unit = '';
    let unitCost = 0;

    if (type === 'BAHAN_BAKU') {
      const ing = safeIngredients.find((i) => i.id === selectedItemId);
      if (ing) {
        itemName = ing.name;
        unit = ing.recipeUnit;
        unitCost = ing.costPerRecipeUnit;
      }
    } else {
      const prod = safeProducts.find((p) => p.id === selectedItemId);
      if (prod) {
        itemName = prod.name;
        unit = 'pcs';
        unitCost = prod.baseHpp;
      }
    }

    const lostCost = quantity * unitCost;

    recordWaste({
      date: new Date().toISOString().split('T')[0],
      type,
      itemId: selectedItemId,
      itemName,
      quantity: Number(quantity),
      unit,
      lostCost,
      reason,
      notes,
      operatorName: currentUser.name,
    });

    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
              Modul Waste & Kerusakan
            </span>
          </div>
          <h2 className="text-xl font-bold text-stone-900 mt-1">
            Pencatatan Bahan Busuk, Rusak & Produk Afkir
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Monitor kebocoran biaya produksi akibat pisang busuk, adonan gagal, bolu bantet, atau retur expired.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => handleOpenModal('BAHAN_BAKU')}
            className="px-3.5 py-2 bg-stone-900 hover:bg-stone-800 text-white font-semibold text-xs rounded-lg transition shadow-sm flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Catat Bahan Busuk / Rusak</span>
          </button>

          <button
            onClick={() => handleOpenModal('PRODUK_JADI')}
            className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-lg transition shadow-sm flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Catat Bolu Afkir / Gagal</span>
          </button>
        </div>
      </div>

      {/* KPI Loss Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
            Total Kerugian Akibat Waste
          </span>
          <div className="text-xl font-extrabold text-rose-700 mt-1 font-mono">
            {formatRupiah(totalLostCost)}
          </div>
          <span className="text-[11px] text-stone-500">Nilai modal pokok yang hilang</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
            Frekuensi Kejadian
          </span>
          <div className="text-xl font-bold text-stone-900 mt-1">
            {wasteRecords.length} Kejadian
          </div>
          <span className="text-[11px] text-stone-500">Bahan baku & produk jadi tercatat</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider block">
            Penyebab Terbanyak
          </span>
          <div className="text-sm font-bold text-amber-900 mt-1">
            Pisang Kelewat Matang / Kadaluarsa
          </div>
          <span className="text-[11px] text-stone-500">Perlu evaluasi estimasi pembelian PO</span>
        </div>
      </div>

      {/* Waste Records Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden text-xs">
        <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
          <h3 className="font-bold text-sm text-stone-900">Riwayat Catatan Waste Gudang & Dapur</h3>
          <span className="text-xs text-stone-500">Otomatis memotong stok inventori</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100 text-stone-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">Tanggal</th>
                <th className="p-3.5">Tipe Waste</th>
                <th className="p-3.5">Nama Item & Jumlah</th>
                <th className="p-3.5 text-right">Nilai Kerugian (Rp)</th>
                <th className="p-3.5">Alasan Kerusakan</th>
                <th className="p-3.5">Operator</th>
                <th className="p-3.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {safeWasteRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-400">
                    Belum ada catatan waste/kerusakan. Bagus!
                  </td>
                </tr>
              ) : (
                safeWasteRecords.map((w) => (
                  <tr key={w.id} className="hover:bg-stone-50">
                    <td className="p-3.5 text-stone-600">{formatDateIndo(w.date)}</td>

                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          w.type === 'BAHAN_BAKU'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {w.type === 'BAHAN_BAKU' ? 'Bahan Baku' : 'Produk Jadi'}
                      </span>
                    </td>

                    <td className="p-3.5 font-bold text-stone-900">
                      {w.itemName} ({w.quantity} {w.unit})
                    </td>

                    <td className="p-3.5 text-right font-mono font-bold text-rose-700">
                      -{formatRupiah(w.lostCost)}
                    </td>

                    <td className="p-3.5">
                      <div className="font-semibold text-stone-800">{w.reason}</div>
                      {w.notes && <div className="text-stone-500 text-[11px]">"{w.notes}"</div>}
                    </td>

                    <td className="p-3.5 text-stone-600">{w.operatorName}</td>

                    <td className="p-3.5 text-center">
                      <button
                        onClick={() => {
                          if (window.confirm('Hapus riwayat pencatatan waste ini?')) {
                            deleteWasteRecord(w.id);
                          }
                        }}
                        className="p-1 text-stone-400 hover:text-rose-600 rounded transition"
                        title="Hapus Record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Waste Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-stone-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {type === 'BAHAN_BAKU'
                  ? 'Catat Bahan Baku Rusak / Busuk'
                  : 'Catat Produk Bolu Afkir / Gagal'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-stone-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveWaste} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Pilih {type === 'BAHAN_BAKU' ? 'Bahan Baku' : 'Produk Jadi'} *
                </label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none bg-white font-medium"
                >
                  {type === 'BAHAN_BAKU'
                    ? ingredients.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.name} (Stok: {i.stockInRecipeUnit} {i.recipeUnit})
                        </option>
                      ))
                    : products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Stok: {p.stockFinishedGoods} pcs)
                        </option>
                      ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Jumlah Yang Rusak / Dibuang *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  required
                  className="w-full px-3 py-2 font-mono font-bold text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Alasan Kerusakan *</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none bg-white"
                >
                  <option value="Kadaluarsa / Busuk">Kadaluarsa / Busuk</option>
                  <option value="Bantet / Gagal Oven">Bantet / Gagal Baking</option>
                  <option value="Jatuh / Hancur / Cacat Fisik">Jatuh / Hancur / Cacat Fisik</option>
                  <option value="Kemasan Rusak / Bocor">Kemasan Rusak / Bocor</option>
                  <option value="Sampel QC / Tasting Tim Dapur">Sampel QC / Tasting Tim</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Keterangan Tambahan</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Pisang terlalu lembek dari pasar..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold text-stone-700 bg-stone-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-lg"
                >
                  Catat & Potong Stok
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
