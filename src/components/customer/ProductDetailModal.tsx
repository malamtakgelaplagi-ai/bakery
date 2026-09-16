import React, { useState, useEffect } from 'react';
import { Product } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { normalizeImageUrl } from '../../utils/imageUrl';
import { useBakery } from '../../context/BakeryContext';
import {
  X,
  ShoppingBag,
  Clock,
  Scale,
  Sparkles,
  Heart,
  CheckCircle2,
  ShieldCheck,
  Send,
  Plus,
  Minus,
} from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onQuickOrderWa: (product: Product, quantity: number) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  isOpen,
  onClose,
  onAddToCart,
  onQuickOrderWa,
}) => {
  const { products } = useBakery();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(product);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    setSelectedProduct(product);
    setQuantity(1);
  }, [product]);

  if (!isOpen || !selectedProduct) return null;

  const isBeverage =
    selectedProduct.category.toLowerCase().includes('kopi') ||
    selectedProduct.category.toLowerCase().includes('minuman');

  const coffeeVariants = selectedProduct.sku.startsWith('KSH-')
    ? (products || []).filter((p) => p.sku.startsWith('KSH-'))
    : [];

  const fallbackImage = isBeverage
    ? '/products/kopi-susu-hazelnut.jpg'
    : '/products/bolu-pisang-original.jpg';
  const displayImage = normalizeImageUrl(selectedProduct.image) || fallbackImage;

  const handleIncrement = () => setQuantity((prev) => prev + 1);
  const handleDecrement = () => setQuantity((prev) => (prev > 1 ? prev - 1 : 1));

  const subtotal = selectedProduct.sellingPrice * quantity;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-stone-200 max-h-[90vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-2 rounded-full bg-stone-900/60 hover:bg-stone-900 text-white backdrop-blur-xs transition"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="overflow-y-auto p-0 flex-1 divide-y divide-stone-100">
          {/* Image Banner */}
          <div className="relative h-64 sm:h-72 w-full bg-stone-100 overflow-hidden">
            <img
              src={displayImage}
              alt={selectedProduct.name}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent"></div>

            {/* Badges on Top of Image */}
            <div className="absolute top-4 left-4 flex flex-wrap gap-2">
              <span className="bg-amber-500 text-stone-950 font-black text-xs px-2.5 py-1 rounded-full shadow-md uppercase tracking-wider">
                {selectedProduct.category}
              </span>
              <span className="bg-emerald-500/90 text-white font-bold text-xs px-2.5 py-1 rounded-full shadow-md flex items-center space-x-1">
                <Sparkles className="w-3 h-3" />
                <span>{isBeverage ? 'Ready Fresh Ice' : 'Ready Fresh Baked'}</span>
              </span>
            </div>

            {/* Title & Price overlay on Image */}
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <div className="text-[11px] font-mono text-amber-300 font-semibold">
                SKU: {selectedProduct.sku}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white drop-shadow-sm leading-tight">
                {selectedProduct.name}
              </h2>
              <div className="text-2xl font-black text-amber-400 mt-0.5">
                {formatRupiah(selectedProduct.sellingPrice)}
                <span className="text-xs font-normal text-stone-200 ml-1.5">
                  / {isBeverage ? 'cup' : 'box'}
                </span>
              </div>
            </div>
          </div>

          {/* Body Content */}
          <div className="p-5 sm:p-6 space-y-5">
            {/* Coffee Variant Switcher */}
            {coffeeVariants.length > 1 && (
              <div className="bg-amber-50/70 border border-amber-300/80 rounded-xl p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-amber-950 flex items-center space-x-1.5">
                    <span>Pilihan Level & Ukuran:</span>
                  </span>
                  <span className="text-[11px] text-amber-800 font-medium">Tersedia 3 tingkat</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {coffeeVariants.map((v) => {
                    const isSelected = selectedProduct.id === v.id;
                    const tierName =
                      v.sku === 'KSH-REG'
                        ? '1. Ekonomis'
                        : v.sku === 'KSH-LUM'
                        ? '2. Standar ⭐'
                        : '3. Premium';

                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedProduct(v)}
                        className={`p-2 rounded-lg border text-left transition ${
                          isSelected
                            ? 'bg-stone-900 text-white border-stone-900 shadow-sm ring-1 ring-stone-900'
                            : 'bg-white hover:bg-stone-50 border-stone-200 text-stone-800'
                        }`}
                      >
                        <div className="text-[11px] font-bold truncate">
                          {tierName}
                        </div>
                        <div
                          className={`text-xs font-extrabold font-mono mt-0.5 ${
                            isSelected ? 'text-amber-400' : 'text-stone-900'
                          }`}
                        >
                          {formatRupiah(v.sellingPrice)}
                        </div>
                        <div
                          className={`text-[9px] truncate mt-0.5 ${
                            isSelected ? 'text-stone-300' : 'text-stone-400'
                          }`}
                        >
                          {v.sizeSpec}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Description */}
            <div>
              <h3 className="text-xs font-bold text-stone-400 uppercase tracking-wider mb-1">
                Deskripsi Rasa & Keistimewaan
              </h3>
              <p className="text-sm text-stone-700 leading-relaxed">
                {selectedProduct.description ||
                  'Menu istimewa khas PUSAKA dengan formulasi resep otentik dan bahan berkualitas tinggi.'}
              </p>
            </div>

            {/* Product Specifications Grid */}
            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-3">
                <span className="block text-[11px] text-stone-500">
                  {isBeverage ? 'Ukuran Cup' : 'Ukuran Loyang'}
                </span>
                <span className="block text-xs font-bold text-stone-900 mt-0.5">
                  {selectedProduct.sizeSpec}
                </span>
              </div>
              <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-3">
                <span className="block text-[11px] text-stone-500">
                  {isBeverage ? 'Porsi Bersih' : 'Berat Bersih'}
                </span>
                <span className="block text-xs font-bold text-stone-900 mt-0.5">
                  ±{selectedProduct.bakedWeightGram} {isBeverage ? 'ml / gr' : 'Gram'}
                </span>
              </div>
              <div className="bg-stone-50 border border-stone-200/80 rounded-xl p-3">
                <span className="block text-[11px] text-stone-500">
                  {isBeverage ? 'Penyajian' : 'Daya Simpan'}
                </span>
                <span className="block text-xs font-bold text-emerald-700 mt-0.5">
                  {isBeverage ? 'Ice Cold Fresh (1 Hari)' : `${selectedProduct.shelfLifeDays || 4} Hari Suhu Ruang`}
                </span>
              </div>
            </div>

            {/* Quality Checklist */}
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 text-xs space-y-2">
              <div className="font-bold text-amber-950 flex items-center space-x-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>Jaminan Kualitas PUSAKA:</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-stone-700">
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{isBeverage ? '100% Nescafé Classic Pilihan' : '100% Halal & Bahan Bersih'}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{isBeverage ? 'Ultra Milk Full Cream Segar' : 'Tanpa Pengawet Buatan Kimia'}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{isBeverage ? 'Sirup Hazelnut Legit Harum' : 'Kemasan Box Ivory Mewah'}</span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{isBeverage ? 'Cup Higienis + Lid & Sedotan' : 'Tekstur Moist & Lembut'}</span>
                </div>
              </div>
            </div>

            {/* Serving Tips */}
            <div className="text-xs text-stone-500 bg-stone-50 p-3 rounded-lg border border-stone-200/60">
              {isBeverage ? (
                <>💡 <strong>Rekomendasi Paduan:</strong> Kopi Susu Hazelnut dingin ini sangat lezat dinikmati bersama sepotong Bolu Pisang Original hangat atau Bolu Jadul Marmer khas PUSAKA.</>
              ) : (
                <>💡 <strong>Tips Menikmati:</strong> Sangat nikmat disajikan bersama secangkir Kopi Susu Hazelnut dingin atau teh melati. Simpan di wadah tertutup atau kulkas untuk sensasi padat legit.</>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          {/* Quantity Selector & Total */}
          <div className="flex items-center justify-between w-full sm:w-auto space-x-4">
            <div className="flex items-center border border-stone-300 rounded-xl bg-white shadow-2xs overflow-hidden">
              <button
                onClick={handleDecrement}
                className="p-2 text-stone-600 hover:text-stone-950 hover:bg-stone-100 transition"
                aria-label="Kurang"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center font-bold text-sm text-stone-900">
                {quantity}
              </span>
              <button
                onClick={handleIncrement}
                className="p-2 text-stone-600 hover:text-stone-950 hover:bg-stone-100 transition"
                aria-label="Tambah"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="text-right sm:text-left">
              <span className="text-[10px] text-stone-400 block uppercase tracking-wider">
                Total ({quantity} {isBeverage ? 'Cup' : 'Box'})
              </span>
              <span className="text-base font-black text-stone-900">
                {formatRupiah(subtotal)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button
              onClick={() => {
                onAddToCart(selectedProduct, quantity);
                onClose();
              }}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-xs rounded-xl border border-amber-300 transition flex items-center justify-center space-x-1.5 shadow-2xs whitespace-nowrap"
            >
              <ShoppingBag className="w-4 h-4 text-amber-800" />
              <span>+ Masukkan Keranjang</span>
            </button>

            <button
              onClick={() => {
                onQuickOrderWa(selectedProduct, quantity);
                onClose();
              }}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-1.5 whitespace-nowrap"
            >
              <Send className="w-4 h-4" />
              <span>Order via WA</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
