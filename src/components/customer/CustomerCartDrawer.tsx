import React, { useState } from 'react';
import { useBakery } from '../../context/BakeryContext';
import { Product, OrderItem } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import {
  X,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Send,
  Store,
  Truck,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CustomerCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
}

export const CustomerCartDrawer: React.FC<CustomerCartDrawerProps> = ({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
}) => {
  const { businessProfile, createOrder } = useBakery();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryType, setDeliveryType] = useState<'PICKUP' | 'DELIVERY'>('PICKUP');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccessMsg, setOrderSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.product.sellingPrice * item.quantity,
    0
  );
  const totalBoxes = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const cleanStorePhone = (businessProfile.phone || '082115181105').replace(/\D/g, '');
  const waStorePhone = cleanStorePhone.startsWith('0')
    ? '62' + cleanStorePhone.slice(1)
    : cleanStorePhone;

  const handleCheckoutViaWhatsApp = () => {
    if (cartItems.length === 0) return;
    if (!customerName.trim()) {
      alert('Silakan masukkan Nama Pemesan.');
      return;
    }
    if (!customerPhone.trim()) {
      alert('Silakan masukkan Nomor WhatsApp Pemesan.');
      return;
    }
    if (deliveryType === 'DELIVERY' && !deliveryAddress.trim()) {
      alert('Silakan masukkan Alamat Pengantaran untuk opsi Delivery.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Also create order record in PUSAKA Bakery Database so staff immediately see it in POS!
      const orderItems: OrderItem[] = cartItems.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        sku: item.product.sku,
        qty: item.quantity,
        unitPrice: item.product.sellingPrice,
        hppSnapshot: item.product.baseHpp,
        subtotal: item.product.sellingPrice * item.quantity,
      }));

      const newOrder = createOrder({
        date: new Date().toISOString().split('T')[0],
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: deliveryType === 'DELIVERY' ? deliveryAddress.trim() : undefined,
        source: 'WHATSAPP',
        items: orderItems,
        subtotal: totalAmount,
        discountType: 'NOMINAL',
        discountValue: 0,
        discountAmount: 0,
        shippingFee: 0,
        totalAmount,
        totalHpp: cartItems.reduce(
          (sum, item) => sum + item.product.baseHpp * item.quantity,
          0
        ),
        grossProfit: totalAmount - cartItems.reduce((sum, i) => sum + i.product.baseHpp * i.quantity, 0),
        paymentStatus: 'BELUM_BAYAR',
        paidAmount: 0,
        paymentMethod: 'TRANSFER_BCA',
        fulfillmentStatus: 'MENUNGGU',
        orderStatus: 'PENDING',
        deliveryType,
        notes: notes.trim() || undefined,
        cashierName: 'Web Storefront Konsumen',
      });

      // 2. Build beautifully formatted WhatsApp Message
      let waMessage = `*PESANAN BARU PUSAKA BAKERY*\n`;
      waMessage += `Halo Admin ${businessProfile.name}, saya ingin memesan:\n\n`;
      waMessage += `*Rincian Menu:*\n`;

      cartItems.forEach((item, idx) => {
        waMessage += `${idx + 1}. *${item.product.name}* (${item.product.sizeSpec})\n`;
        waMessage += `   ${item.quantity} box x ${formatRupiah(item.product.sellingPrice)} = ${formatRupiah(item.product.sellingPrice * item.quantity)}\n`;
      });

      waMessage += `\n*Total Pesanan:* ${formatRupiah(totalAmount)} (${totalBoxes} Box)\n\n`;
      waMessage += `*Data Pemesan:*\n`;
      waMessage += `• Nama: ${customerName.trim()}\n`;
      waMessage += `• No. WA: ${customerPhone.trim()}\n`;
      waMessage += `• Pengambilan: ${deliveryType === 'PICKUP' ? 'Ambil di Toko (Pickup)' : 'Kirim via Kurir/Ojol (Delivery)'}\n`;

      if (deliveryType === 'DELIVERY') {
        waMessage += `• Alamat Kirim: ${deliveryAddress.trim()}\n`;
      }
      if (notes.trim()) {
        waMessage += `• Catatan: ${notes.trim()}\n`;
      }

      waMessage += `• No. Referensi Web: ${newOrder.invoiceNumber}\n\n`;
      waMessage += `Mohon konfirmasi total dan nomor rekening pembayarannya ya min. Terima kasih!`;

      // 3. Open WhatsApp link
      const waUrl = `https://wa.me/${waStorePhone}?text=${encodeURIComponent(waMessage)}`;
      window.open(waUrl, '_blank');

      // 4. Success feedback and clear cart
      setOrderSuccessMsg(
        `Pesanan ${newOrder.invoiceNumber} berhasil diteruskan ke WhatsApp Toko! Tim kami akan segera merespons.`
      );
      onClearCart();
    } catch (err) {
      console.error('Error creating order from storefront cart:', err);
      alert('Terjadi kesalahan saat memproses pesanan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-stone-200">
          {/* Header */}
          <div className="p-4 sm:p-5 bg-stone-900 text-white flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-stone-950 flex items-center justify-center font-bold">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white leading-none">
                  Keranjang Pesanan
                </h2>
                <span className="text-[11px] text-stone-400">
                  {totalBoxes} box bolu pilihan Anda
                </span>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
              aria-label="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Success Message Banner */}
          {orderSuccessMsg && (
            <div className="p-4 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Pesanan Terkirim!</strong>
                <span>{orderSuccessMsg}</span>
              </div>
            </div>
          )}

          {/* Body Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5 divide-y divide-stone-100">
            {/* Cart Items List */}
            <div>
              {cartItems.length === 0 ? (
                <div className="text-center py-12 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-500 mx-auto flex items-center justify-center">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                  <h3 className="font-bold text-stone-700 text-sm">
                    Keranjang Belanja Kosong
                  </h3>
                  <p className="text-xs text-stone-400 max-w-xs mx-auto">
                    Pilih bolu pisang dan aneka cake favorit Anda di menu produk untuk mulai memesan.
                  </p>
                  <button
                    onClick={onClose}
                    className="mt-2 px-4 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 text-xs font-bold rounded-lg transition"
                  >
                    Jelajahi Menu PUSAKA
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-stone-500 mb-1">
                    <span>Item Pesanan</span>
                    <button
                      onClick={onClearCart}
                      className="text-stone-400 hover:text-rose-600 transition text-[11px]"
                    >
                      Kosongkan Keranjang
                    </button>
                  </div>

                  {cartItems.map((item) => (
                    <div
                      key={item.product.id}
                      className="flex items-center space-x-3 p-2.5 bg-stone-50 rounded-xl border border-stone-200/80"
                    >
                      <img
                        src={
                          item.product.image ||
                          '/products/bolu-pisang-original.jpg'
                        }
                        alt={item.product.name}
                        referrerPolicy="no-referrer"
                        className="w-14 h-14 object-cover rounded-lg shrink-0 border border-stone-200"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-xs text-stone-900 truncate">
                          {item.product.name}
                        </h4>
                        <div className="text-[11px] text-stone-500">
                          {formatRupiah(item.product.sellingPrice)}
                        </div>
                        <div className="text-[11px] font-black text-amber-700 mt-0.5">
                          {formatRupiah(item.product.sellingPrice * item.quantity)}
                        </div>
                      </div>

                      {/* Counter Controls */}
                      <div className="flex items-center space-x-1 border border-stone-300 rounded-lg bg-white overflow-hidden shadow-2xs">
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, -1)}
                          className="p-1 text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-stone-900">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(item.product.id, 1)}
                          className="p-1 text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => onRemoveItem(item.product.id)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 transition"
                        title="Hapus"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Customer Details Form (Only when cart has items) */}
            {cartItems.length > 0 && (
              <div className="pt-4 space-y-3.5">
                <h3 className="font-bold text-xs text-stone-900 uppercase tracking-wider">
                  Informasi Pemesan
                </h3>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Nama Lengkap Pemesan *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Contoh: Ibu Rina / Pak Budi"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Nomor WhatsApp Aktif *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Contoh: 08123456789"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>

                {/* Delivery Type Option */}
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1.5">
                    Metode Pengambilan *
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setDeliveryType('PICKUP')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition ${
                        deliveryType === 'PICKUP'
                          ? 'bg-amber-50 border-amber-500 text-amber-950 shadow-xs'
                          : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <Store className="w-4 h-4 text-amber-600" />
                      <span>Ambil di Outlet</span>
                      <span className="text-[10px] font-normal text-stone-500">
                        Jl. Rancabolang Indah II no 15
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDeliveryType('DELIVERY')}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition ${
                        deliveryType === 'DELIVERY'
                          ? 'bg-amber-50 border-amber-500 text-amber-950 shadow-xs'
                          : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                      }`}
                    >
                      <Truck className="w-4 h-4 text-amber-600" />
                      <span>Kirim ke Rumah</span>
                      <span className="text-[10px] font-normal text-stone-500">
                        Ojol Instant / Kurir
                      </span>
                    </button>
                  </div>
                </div>

                {deliveryType === 'DELIVERY' && (
                  <div>
                    <label className="block text-[11px] font-bold text-stone-700 mb-1">
                      Alamat Lengkap Pengantaran *
                    </label>
                    <textarea
                      rows={2}
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Jalan, Nomor Rumah, RT/RW, Kelurahan, Patokan..."
                      className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
                    ></textarea>
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Catatan Khusus (Opsional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Titip ucapan ultah / minta pisau kue"
                    className="w-full px-3 py-2 text-xs border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Drawer Footer with Checkout */}
          {cartItems.length > 0 && (
            <div className="p-4 sm:p-5 bg-stone-50 border-t border-stone-200 space-y-3">
              <div className="space-y-1 text-xs">
                <div className="flex justify-between text-stone-600">
                  <span>Subtotal ({totalBoxes} Box)</span>
                  <span className="font-semibold text-stone-900">
                    {formatRupiah(totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between text-stone-500 text-[11px]">
                  <span>Ongkir (Pengiriman)</span>
                  <span>Dihitung sesuai jarak kurir / Gratis ambil di toko</span>
                </div>
                <div className="flex justify-between text-sm font-black text-stone-950 pt-2 border-t border-stone-200">
                  <span>Estimasi Total</span>
                  <span className="text-amber-700 text-base">
                    {formatRupiah(totalAmount)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckoutViaWhatsApp}
                disabled={isSubmitting}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? 'Menyiapkan Pesanan...'
                    : 'Kirim Pesanan ke WhatsApp Toko'}
                </span>
              </button>

              <div className="text-[10px] text-center text-stone-400">
                🔒 Data pesanan langsung diteruskan ke staf kasir {businessProfile.name}.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
