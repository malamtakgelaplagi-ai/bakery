import React, { useState, useEffect } from 'react';
import { useBakery } from '../../context/BakeryContext';
import {
  Recipe,
  RecipeVersion,
  RecipeBOMItem,
  RecipePackagingItem,
  RecipeDirectCost,
} from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { X, Plus, Trash2, BookOpen, Layers, CheckCircle2 } from 'lucide-react';

interface RecipeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipeToEdit?: Recipe | null;
  mode: 'NEW_RECIPE' | 'NEW_VERSION';
}

export const RecipeEditorModal: React.FC<RecipeEditorModalProps> = ({
  isOpen,
  onClose,
  recipeToEdit,
  mode,
}) => {
  const { ingredients, addRecipe, addRecipeVersion, currentUser } = useBakery();

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Bolu Tradisional');
  const [versionNumber, setVersionNumber] = useState('v1.0');
  const [changeLog, setChangeLog] = useState('');
  const [targetBatterWeightGram, setTargetBatterWeightGram] = useState(925);
  const [targetBakedWeightGram, setTargetBakedWeightGram] = useState(900);
  const [yieldQty, setYieldQty] = useState(1);
  const [notes, setNotes] = useState('');

  // BOM items
  const [bomItems, setBomItems] = useState<
    { ingredientId: string; ingredientName: string; quantity: number; recipeUnit: string; unitCost: number; cost: number }[]
  >([]);

  // Packaging items
  const [packagingItems, setPackagingItems] = useState<
    { ingredientId: string; name: string; quantity: number; unitCost: number; totalCost: number }[]
  >([]);

  // Direct costs
  const [directCosts, setDirectCosts] = useState<
    { id: string; name: string; costType: 'per_batch' | 'per_unit'; amount: number }[]
  >([
    { id: 'dc-1', name: 'Gas Elpiji Oven (per loyang)', costType: 'per_unit', amount: 1500 },
    { id: 'dc-2', name: 'Listrik Mixer & Oven', costType: 'per_unit', amount: 800 },
    { id: 'dc-3', name: 'Upah Baker Produksi', costType: 'per_unit', amount: 3500 },
  ]);

  useEffect(() => {
    if (!isOpen) return;

    if (mode === 'NEW_VERSION' && recipeToEdit) {
      const latestVersion =
        recipeToEdit.versions.find((v) => v.id === recipeToEdit.currentVersionId) ||
        recipeToEdit.versions[recipeToEdit.versions.length - 1];

      setName(recipeToEdit.name);
      setCategory(recipeToEdit.category);

      // Increment version guess
      const lastVerNum = latestVersion ? latestVersion.versionNumber : 'v1.0';
      const nextVer = lastVerNum.includes('.')
        ? `v${(parseFloat(lastVerNum.replace('v', '')) + 0.1).toFixed(1)}`
        : 'v2.0';

      setVersionNumber(nextVer);
      setChangeLog('');
      setTargetBatterWeightGram(latestVersion ? latestVersion.targetBatterWeightGram : 925);
      setTargetBakedWeightGram(latestVersion ? latestVersion.targetBakedWeightGram : 900);
      setYieldQty(latestVersion ? latestVersion.yieldQty : 1);
      setNotes(latestVersion ? latestVersion.notes || '' : '');

      if (latestVersion) {
        setBomItems(
          (latestVersion.items || []).map((i) => {
            const currentIng = (ingredients || []).find((ing) => ing.id === i.ingredientId);
            const unitCost = currentIng ? currentIng.costPerRecipeUnit : (i.unitCostSnapshot || 0);
            return {
              ingredientId: i.ingredientId,
              ingredientName: i.ingredientName,
              quantity: i.quantity,
              recipeUnit: i.recipeUnit,
              unitCost,
              cost: i.quantity * unitCost,
            };
          })
        );
        setPackagingItems(
          (latestVersion.packaging || []).map((p) => {
            const currentPkg = (ingredients || []).find((ing) => ing.id === p.ingredientId);
            const unitCost = currentPkg ? currentPkg.costPerRecipeUnit : (p.unitCost || 0);
            return {
              ingredientId: p.ingredientId,
              name: p.name,
              quantity: p.quantity,
              unitCost,
              totalCost: p.quantity * unitCost,
            };
          })
        );
        setDirectCosts([...(latestVersion.directCosts || [])]);
      }
    } else if (mode === 'NEW_RECIPE') {
      setName('');
      setCategory('Bolu Tradisional');
      setVersionNumber('v1.0');
      setChangeLog('Resep awal');
      setTargetBatterWeightGram(925);
      setTargetBakedWeightGram(900);
      setYieldQty(1);
      setNotes('');

      // Default with standard raw items for rapid setup
      const initialRaw = ingredients.filter((i) => i.category !== 'Kemasan & Packaging').slice(0, 5);
      setBomItems(
        initialRaw.map((ing) => ({
          ingredientId: ing.id,
          ingredientName: ing.name,
          quantity: 100,
          recipeUnit: ing.recipeUnit,
          unitCost: ing.costPerRecipeUnit,
          cost: 100 * ing.costPerRecipeUnit,
        }))
      );

      const initialPkg = ingredients.filter((i) => i.category === 'Kemasan & Packaging').slice(0, 2);
      setPackagingItems(
        initialPkg.map((pkg) => ({
          ingredientId: pkg.id,
          name: pkg.name,
          quantity: 1,
          unitCost: pkg.costPerRecipeUnit,
          totalCost: 1 * pkg.costPerRecipeUnit,
        }))
      );
    }
  }, [isOpen, mode, recipeToEdit]);

  if (!isOpen) return null;

  // Add BOM row
  const handleAddBomItem = () => {
    const rawIngs = ingredients.filter((i) => i.category !== 'Kemasan & Packaging');
    const first = rawIngs[0] || ingredients[0];
    if (!first) return;
    setBomItems([
      ...bomItems,
      {
        ingredientId: first.id,
        ingredientName: first.name,
        quantity: 50,
        recipeUnit: first.recipeUnit,
        unitCost: first.costPerRecipeUnit,
        cost: 50 * first.costPerRecipeUnit,
      },
    ]);
  };

  const handleBomChange = (idx: number, field: string, val: any) => {
    setBomItems(
      bomItems.map((item, i) => {
        if (i !== idx) return item;
        if (field === 'ingredientId') {
          const ing = ingredients.find((x) => x.id === val);
          if (!ing) return item;
          const cost = item.quantity * ing.costPerRecipeUnit;
          return {
            ...item,
            ingredientId: ing.id,
            ingredientName: ing.name,
            recipeUnit: ing.recipeUnit,
            unitCost: ing.costPerRecipeUnit,
            cost,
          };
        }
        if (field === 'quantity') {
          const qty = Number(val) || 0;
          return {
            ...item,
            quantity: qty,
            cost: qty * item.unitCost,
          };
        }
        return item;
      })
    );
  };

  const handleRemoveBomItem = (idx: number) => {
    setBomItems(bomItems.filter((_, i) => i !== idx));
  };

  // Add Packaging row
  const handleAddPkgItem = () => {
    const pkgs = ingredients.filter((i) => i.category === 'Kemasan & Packaging');
    const first = pkgs[0] || ingredients[0];
    if (!first) return;
    setPackagingItems([
      ...packagingItems,
      {
        ingredientId: first.id,
        name: first.name,
        quantity: 1,
        unitCost: first.costPerRecipeUnit,
        totalCost: 1 * first.costPerRecipeUnit,
      },
    ]);
  };

  const handlePkgChange = (idx: number, field: string, val: any) => {
    setPackagingItems(
      packagingItems.map((item, i) => {
        if (i !== idx) return item;
        if (field === 'ingredientId') {
          const ing = ingredients.find((x) => x.id === val);
          if (!ing) return item;
          return {
            ...item,
            ingredientId: ing.id,
            name: ing.name,
            unitCost: ing.costPerRecipeUnit,
            totalCost: item.quantity * ing.costPerRecipeUnit,
          };
        }
        if (field === 'quantity') {
          const qty = Number(val) || 0;
          return {
            ...item,
            quantity: qty,
            totalCost: qty * item.unitCost,
          };
        }
        return item;
      })
    );
  };

  const handleRemovePkgItem = (idx: number) => {
    setPackagingItems(packagingItems.filter((_, i) => i !== idx));
  };

  // Add Direct Cost
  const handleAddDirectCost = () => {
    setDirectCosts([
      ...directCosts,
      {
        id: `dc-${Date.now()}`,
        name: 'Biaya Tambahan Lainnya',
        costType: 'per_unit',
        amount: 1000,
      },
    ]);
  };

  const handleDirectCostChange = (idx: number, field: string, val: any) => {
    setDirectCosts(
      directCosts.map((d, i) => {
        if (i !== idx) return d;
        return {
          ...d,
          [field]: field === 'amount' ? Number(val) || 0 : val,
        };
      })
    );
  };

  const handleRemoveDirectCost = (idx: number) => {
    setDirectCosts(directCosts.filter((_, i) => i !== idx));
  };

  // Cost Aggregations
  const totalRawCost = bomItems.reduce((sum, item) => sum + item.cost, 0);
  const totalPackagingCost = packagingItems.reduce((sum, item) => sum + item.totalCost, 0);
  const totalDirectCost = directCosts.reduce((sum, item) => sum + item.amount, 0);
  const totalHppPerUnit = totalRawCost + totalPackagingCost + totalDirectCost;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const versionData: Omit<RecipeVersion, 'id' | 'createdAt'> = {
      versionNumber,
      changeLog: changeLog || 'Penyesuaian formulasi resep',
      targetBatterWeightGram,
      targetBakedWeightGram,
      yieldQty,
      items: bomItems.map((b) => ({
        id: `bom-${Date.now()}-${Math.random()}`,
        ingredientId: b.ingredientId,
        ingredientName: b.ingredientName,
        quantity: b.quantity,
        recipeUnit: b.recipeUnit,
        unitCostSnapshot: b.unitCost,
        cost: b.cost,
      })),
      packaging: packagingItems.map((p) => ({
        id: `pkg-${Date.now()}-${Math.random()}`,
        ingredientId: p.ingredientId,
        name: p.name,
        quantity: p.quantity,
        unitCost: p.unitCost,
        totalCost: p.totalCost,
      })),
      directCosts,
      totalRawCost,
      totalPackagingCost,
      totalDirectCost,
      totalHppPerUnit,
      notes,
      createdBy: currentUser.name,
    };

    if (mode === 'NEW_VERSION' && recipeToEdit) {
      addRecipeVersion(recipeToEdit.id, versionData);
    } else {
      const newVersionId = `ver-${Date.now()}`;
      addRecipe({
        name,
        category,
        description: notes,
        currentVersionId: newVersionId,
        versions: [
          {
            ...versionData,
            id: newVersionId,
            createdAt: new Date().toISOString().split('T')[0],
          },
        ],
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm sm:text-base">
              {mode === 'NEW_VERSION'
                ? `Buat Versi Baru untuk ${recipeToEdit?.name}`
                : 'Buat Resep Baru & Formula BOM'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5 max-h-[82vh] overflow-y-auto text-xs">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-bold text-stone-800 mb-1">Nama Resep Produk *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={mode === 'NEW_VERSION'}
                placeholder="Contoh: Bolu Pisang Medium (Ø20 cm)"
                required
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none disabled:bg-stone-100"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1">Versi Resep *</label>
              <input
                type="text"
                value={versionNumber}
                onChange={(e) => setVersionNumber(e.target.value)}
                placeholder="v1.1"
                required
                className="w-full px-3 py-2 font-mono font-bold text-amber-900 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-stone-800 mb-1">
                Target Berat Adonan (Gram)
              </label>
              <input
                type="number"
                value={targetBatterWeightGram}
                onChange={(e) => setTargetBatterWeightGram(Number(e.target.value))}
                placeholder="925"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1">
                Target Berat Matang (Gram)
              </label>
              <input
                type="number"
                value={targetBakedWeightGram}
                onChange={(e) => setTargetBakedWeightGram(Number(e.target.value))}
                placeholder="900"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-stone-800 mb-1">
                Catatan Perubahan Versi
              </label>
              <input
                type="text"
                value={changeLog}
                onChange={(e) => setChangeLog(e.target.value)}
                placeholder="Contoh: Kurangi gula 10g, tambah kayu manis..."
                className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
              />
            </div>
          </div>

          {/* BOM INGREDIENTS SECTION */}
          <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-stone-900 flex items-center space-x-1.5">
                <Layers className="w-4 h-4 text-amber-600" />
                <span>1. Komposisi Bahan Baku (BOM / Bill of Materials)</span>
              </span>
              <button
                type="button"
                onClick={handleAddBomItem}
                className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Bahan</span>
              </button>
            </div>

            <div className="space-y-2">
              {bomItems.map((b, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-white border border-stone-200 rounded-lg grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                >
                  <div className="sm:col-span-6">
                    <select
                      value={b.ingredientId}
                      onChange={(e) => handleBomChange(idx, 'ingredientId', e.target.value)}
                      className="w-full px-2 py-1.5 border border-stone-300 rounded bg-white text-xs font-medium focus:outline-none"
                    >
                      {ingredients
                        .filter((i) => i.category !== 'Kemasan & Packaging')
                        .map((ing) => (
                          <option key={ing.id} value={ing.id}>
                            {ing.name} ({formatRupiah(ing.costPerRecipeUnit)}/{ing.recipeUnit})
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3 flex items-center space-x-1">
                    <input
                      type="number"
                      step="any"
                      min="0.1"
                      value={b.quantity}
                      onChange={(e) => handleBomChange(idx, 'quantity', e.target.value)}
                      placeholder="Qty"
                      className="w-full px-2 py-1.5 border border-stone-300 rounded text-right font-bold text-xs focus:outline-none"
                    />
                    <span className="text-stone-500 font-semibold text-[11px] w-8">
                      {b.recipeUnit}
                    </span>
                  </div>

                  <div className="sm:col-span-3 flex items-center justify-between sm:justify-end space-x-2">
                    <span className="font-bold text-stone-900 font-mono text-xs">
                      {formatRupiah(b.cost)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBomItem(idx)}
                      className="p-1 text-stone-400 hover:text-rose-600 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-xs font-bold text-stone-800 pt-1">
              <span>Subtotal Biaya Bahan Baku:</span>
              <span className="font-mono text-amber-900 font-bold">{formatRupiah(totalRawCost)}</span>
            </div>
          </div>

          {/* PACKAGING SECTION */}
          <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-stone-900">
                2. Kemasan, Box & Label (Packaging)
              </span>
              <button
                type="button"
                onClick={handleAddPkgItem}
                className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Kemasan</span>
              </button>
            </div>

            <div className="space-y-2">
              {packagingItems.map((p, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-white border border-stone-200 rounded-lg grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                >
                  <div className="sm:col-span-6">
                    <select
                      value={p.ingredientId}
                      onChange={(e) => handlePkgChange(idx, 'ingredientId', e.target.value)}
                      className="w-full px-2 py-1.5 border border-stone-300 rounded bg-white text-xs font-medium focus:outline-none"
                    >
                      {ingredients
                        .filter((i) => i.category === 'Kemasan & Packaging')
                        .map((pkg) => (
                          <option key={pkg.id} value={pkg.id}>
                            {pkg.name} ({formatRupiah(pkg.costPerRecipeUnit)}/pcs)
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="sm:col-span-3 flex items-center space-x-1">
                    <input
                      type="number"
                      step="any"
                      min="1"
                      value={p.quantity}
                      onChange={(e) => handlePkgChange(idx, 'quantity', e.target.value)}
                      placeholder="Qty"
                      className="w-full px-2 py-1.5 border border-stone-300 rounded text-right font-bold text-xs focus:outline-none"
                    />
                    <span className="text-stone-500 font-semibold text-[11px] w-8">pcs</span>
                  </div>

                  <div className="sm:col-span-3 flex items-center justify-between sm:justify-end space-x-2">
                    <span className="font-bold text-stone-900 font-mono text-xs">
                      {formatRupiah(p.totalCost)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePkgItem(idx)}
                      className="p-1 text-stone-400 hover:text-rose-600 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-xs font-bold text-stone-800 pt-1">
              <span>Subtotal Biaya Kemasan:</span>
              <span className="font-mono text-amber-900 font-bold">{formatRupiah(totalPackagingCost)}</span>
            </div>
          </div>

          {/* DIRECT UTILITY & LABOR COSTS */}
          <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs text-stone-900">
                3. Biaya Produksi Langsung (Gas, Listrik Oven, Tenaga Kerja)
              </span>
              <button
                type="button"
                onClick={handleAddDirectCost}
                className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Biaya</span>
              </button>
            </div>

            <div className="space-y-2">
              {directCosts.map((d, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-white border border-stone-200 rounded-lg grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                >
                  <div className="sm:col-span-7">
                    <input
                      type="text"
                      value={d.name}
                      onChange={(e) => handleDirectCostChange(idx, 'name', e.target.value)}
                      placeholder="Nama Biaya (contoh: Gas Elpiji Oven)"
                      className="w-full px-2 py-1.5 border border-stone-300 rounded text-xs focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-5 flex items-center justify-between sm:justify-end space-x-2">
                    <div className="relative w-32">
                      <span className="absolute left-2 top-1.5 text-[10px] text-stone-400 font-bold">
                        Rp
                      </span>
                      <input
                        type="number"
                        value={d.amount}
                        onChange={(e) => handleDirectCostChange(idx, 'amount', e.target.value)}
                        placeholder="Jumlah"
                        className="w-full pl-7 pr-2 py-1.5 border border-stone-300 rounded text-right font-mono font-bold text-xs focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveDirectCost(idx)}
                      className="p-1 text-stone-400 hover:text-rose-600 rounded transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center text-xs font-bold text-stone-800 pt-1">
              <span>Subtotal Biaya Produksi:</span>
              <span className="font-mono text-amber-900 font-bold">{formatRupiah(totalDirectCost)}</span>
            </div>
          </div>

          {/* SUMMARY TOTAL HPP BANNER */}
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-amber-950 block">
                Total HPP Modal Pokok Produksi per Pcs
              </span>
              <span className="text-[11px] text-amber-800">
                Bahan ({formatRupiah(totalRawCost)}) + Kemasan ({formatRupiah(totalPackagingCost)}) + Produksi ({formatRupiah(totalDirectCost)})
              </span>
            </div>
            <span className="text-xl font-extrabold text-amber-950 font-mono">
              {formatRupiah(totalHppPerUnit)}
            </span>
          </div>

          {/* Actions */}
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
              <span>Simpan Resep & Perbarui HPP</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
