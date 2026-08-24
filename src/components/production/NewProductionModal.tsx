import React, { useState } from 'react';
import { useBakery } from '../../context/BakeryContext';
import { formatRupiah } from '../../utils/formatters';
import { X, ChefHat, AlertTriangle, CheckCircle2, Boxes, Info } from 'lucide-react';

interface NewProductionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewProductionModal: React.FC<NewProductionModalProps> = ({ isOpen, onClose }) => {
  const { products, recipes, ingredients, createProductionRun, currentUser } = useBakery();

  const [productId, setProductId] = useState(products[0]?.id || '');
  const [targetQty, setTargetQty] = useState(5);
  const [operatorName, setOperatorName] = useState(currentUser.name);
  const [notes, setNotes] = useState('');
  const [resultMessage, setResultMessage] = useState<{
    text: string;
    missing?: { name: string; needed: number; available: number; unit: string }[];
  } | null>(null);

  if (!isOpen) return null;

  const selectedProduct = (products || []).find((p) => p.id === productId) || (products || [])[0];
  const recipe = (recipes || []).find((r) => r.id === selectedProduct?.recipeId);
  const recVers = recipe?.versions || [];
  const version = recVers.find((v) => v.id === selectedProduct?.recipeVersionId) || recVers[0];

  // Dynamic ingredient requirement preview
  const scale = version ? targetQty / (version.yieldQty || 1) : 1;
  const versionItems = version?.items || [];
  const previewRequirements = version
    ? versionItems.map((item) => {
        const ing = (ingredients || []).find((i) => i.id === item.ingredientId);
        const needed = item.quantity * scale;
        const available = ing ? ing.stockInRecipeUnit : 0;
        const isSufficient = available >= needed;
        return {
          name: item.ingredientName,
          needed,
          available,
          unit: item.recipeUnit,
          isSufficient,
        };
      })
    : [];

  const allSufficient = previewRequirements.every((r) => r.isSufficient);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || targetQty <= 0) return;

    const result = createProductionRun({
      productId,
      targetQty: Number(targetQty),
      operatorName,
      notes,
    });

    if (result.missingIngredients && result.missingIngredients.length > 0) {
      setResultMessage({
        text: result.message,
        missing: result.missingIngredients,
      });
      // Close after 2 seconds or let user see
      setTimeout(() => {
        onClose();
        setResultMessage(null);
      }, 2500);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ChefHat className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm sm:text-base">Mulai Rencana Batch Produksi Baru</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[82vh] overflow-y-auto text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-800 mb-1">
                Pilih Produk Yang Dibuat *
              </label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                required
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none bg-white font-medium"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.sizeSpec})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1">
                Target Jumlah Produksi (Loyang / Pcs) *
              </label>
              <input
                type="number"
                min="1"
                value={targetQty}
                onChange={(e) => setTargetQty(Number(e.target.value))}
                required
                className="w-full px-3 py-2 font-mono font-bold text-sm border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-stone-800 mb-1">
                Baker / Operator Produksi
              </label>
              <input
                type="text"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1">Catatan Batch / Shift</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Shift Pagi, pesanan arisan jam 11 siang"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* BOM Material Sufficiency Live Check */}
          <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-stone-900 flex items-center space-x-1.5">
                <Boxes className="w-4 h-4 text-amber-700" />
                <span>Pemeriksaan Kecukupan Bahan Baku Gudang</span>
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  allSufficient ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                }`}
              >
                {allSufficient ? 'Semua Bahan Cukup' : 'Stok Ada Yang Kurang!'}
              </span>
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 pt-1">
              {previewRequirements.map((r, idx) => (
                <div
                  key={idx}
                  className="p-2 bg-white rounded border border-stone-200 flex items-center justify-between text-xs"
                >
                  <span className="font-medium text-stone-800">{r.name}</span>
                  <div className="flex items-center space-x-3 text-right">
                    <span className="text-stone-500 text-[11px]">
                      Butuh: <strong>{r.needed} {r.unit}</strong> | Ada:{' '}
                      <span className={r.isSufficient ? 'text-stone-800' : 'text-rose-600 font-bold'}>
                        {r.available} {r.unit}
                      </span>
                    </span>
                    {r.isSufficient ? (
                      <span className="text-emerald-600 font-bold text-[11px]">✓ Cukup</span>
                    ) : (
                      <span className="text-rose-600 font-bold text-[11px]">✗ Kurang</span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <p className="text-[11px] text-stone-500 pt-1">
              * Stok bahan baku akan <strong>otomatis dipotong</strong> ketika status batch dipindahkan dari DRAFT ke DIRACIK/DIPANGGANG.
            </p>
          </div>

          {resultMessage && (
            <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-lg text-xs">
              <div className="font-bold">{resultMessage.text}</div>
            </div>
          )}

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
              <span>Buat Batch Produksi</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
