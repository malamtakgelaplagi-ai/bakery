import React, { useState } from 'react';
import { useBakery } from '../../context/BakeryContext';
import { PurchaseItem } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { X, Plus, Trash2, CheckCircle2, ShoppingBag } from 'lucide-react';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PurchaseModal: React.FC<PurchaseModalProps> = ({ isOpen, onClose }) => {
  const { suppliers, ingredients, recordPurchase, currentUser } = useBakery();

  const safeSuppliers = suppliers || [];
  const safeIngredients = ingredients || [];

  const [supplierId, setSupplierId] = useState(safeSuppliers[0]?.id || '');
  const [date, setDate] = useState('2026-08-23');
  const [paymentStatus, setPaymentStatus] = useState<'LUNAS' | 'HUTANG'>('LUNAS');
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<PurchaseItem[]>([
    {
      ingredientId: safeIngredients[0]?.id || '',
      ingredientName: safeIngredients[0]?.name || '',
      buyUnit: safeIngredients[0]?.buyUnit || 'kg',
      recipeUnit: safeIngredients[0]?.recipeUnit || 'g',
      conversionFactor: safeIngredients[0]?.conversionFactor || 1000,
      qtyBuyUnit: 5,
      pricePerBuyUnit: safeIngredients[0]?.latestBuyPrice || 20000,
      subtotal: 5 * (safeIngredients[0]?.latestBuyPrice || 20000),
    },
  ]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    const defaultIng = safeIngredients[0];
    if (!defaultIng) return;

    setItems([
      ...items,
      {
        ingredientId: defaultIng.id,
        ingredientName: defaultIng.name,
        buyUnit: defaultIng.buyUnit,
        recipeUnit: defaultIng.recipeUnit,
        conversionFactor: defaultIng.conversionFactor,
        qtyBuyUnit: 1,
        pricePerBuyUnit: defaultIng.latestBuyPrice,
        subtotal: defaultIng.latestBuyPrice,
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((items || []).filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index: number, field: keyof PurchaseItem, val: any) => {
    setItems(
      (items || []).map((item, idx) => {
        if (idx !== index) return item;

        if (field === 'ingredientId') {
          const ing = safeIngredients.find((i) => i.id === val);
          if (!ing) return item;
          const qty = item.qtyBuyUnit || 1;
          return {
            ...item,
            ingredientId: ing.id,
            ingredientName: ing.name,
            buyUnit: ing.buyUnit,
            recipeUnit: ing.recipeUnit,
            conversionFactor: ing.conversionFactor,
            pricePerBuyUnit: ing.latestBuyPrice,
            subtotal: qty * ing.latestBuyPrice,
          };
        }

        const updated = { ...item, [field]: val };
        if (field === 'qtyBuyUnit' || field === 'pricePerBuyUnit') {
          updated.subtotal = (Number(updated.qtyBuyUnit) || 0) * (Number(updated.pricePerBuyUnit) || 0);
        }
        return updated;
      })
    );
  };

  const totalAmount = (items || []).reduce((sum, item) => sum + (item.subtotal || 0), 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!items || items.length === 0) return;

    const supplierObj = safeSuppliers.find((s) => s.id === supplierId);

    recordPurchase({
      date,
      supplierId,
      supplierName: supplierObj?.name || 'Supplier Luar',
      items,
      totalAmount,
      paymentStatus,
      notes,
      recordedBy: currentUser.name,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm sm:text-base">
              Catat Pembelian Bahan Baku (Purchase PO)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Tanggal Pembelian *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Pilih Supplier *
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none bg-white"
              >
                {safeSuppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-stone-700 mb-1">
                Status Pembayaran
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as any)}
                className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none bg-white font-bold text-emerald-700"
              >
                <option value="LUNAS">LUNAS</option>
                <option value="HUTANG">HUTANG / TEMPO</option>
              </select>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-stone-800">
                Daftar Bahan Yang Dibeli
              </label>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Baris Bahan</span>
              </button>
            </div>

            <div className="space-y-2">
              {(items || []).map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-stone-50 border border-stone-200 rounded-lg grid grid-cols-1 sm:grid-cols-12 gap-2 items-center text-xs"
                >
                  <div className="sm:col-span-5">
                    <label className="text-[10px] text-stone-500 font-semibold block sm:hidden">
                      Pilih Bahan
                    </label>
                    <select
                      value={item.ingredientId}
                      onChange={(e) => handleItemChange(idx, 'ingredientId', e.target.value)}
                      className="w-full px-2.5 py-1.5 border border-stone-300 rounded bg-white font-medium focus:outline-none"
                    >
                      {safeIngredients.map((ing) => (
                        <option key={ing.id} value={ing.id}>
                          {ing.name} ({ing.buyUnit})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="text-[10px] text-stone-500 font-semibold block sm:hidden">
                      Qty Beli ({item.buyUnit})
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      value={item.qtyBuyUnit}
                      onChange={(e) => handleItemChange(idx, 'qtyBuyUnit', e.target.value)}
                      placeholder="Qty"
                      className="w-full px-2 py-1.5 border border-stone-300 rounded bg-white text-right font-bold focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-3">
                    <label className="text-[10px] text-stone-500 font-semibold block sm:hidden">
                      Harga per {item.buyUnit}
                    </label>
                    <input
                      type="number"
                      value={item.pricePerBuyUnit}
                      onChange={(e) => handleItemChange(idx, 'pricePerBuyUnit', e.target.value)}
                      placeholder="Harga Satuan"
                      className="w-full px-2 py-1.5 border border-stone-300 rounded bg-white text-right font-mono focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2 flex items-center justify-between sm:justify-end space-x-2">
                    <span className="font-bold text-stone-900 font-mono">
                      {formatRupiah(item.subtotal)}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 text-stone-400 hover:text-rose-600 rounded transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 flex items-center justify-between">
            <span className="text-xs font-bold text-amber-950">
              Total Pembelian (Stok otomatis bertambah setelah disimpan)
            </span>
            <span className="text-base font-extrabold text-amber-950">
              {formatRupiah(totalAmount)}
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Catatan Pembelian / No. Resi Faktur
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Faktur No. 89201, dibayar transfer BCA"
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
              className="px-4 py-2 text-xs font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition shadow-sm flex items-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Simpan & Tambah Stok</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
