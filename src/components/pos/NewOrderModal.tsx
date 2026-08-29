import React, { useState } from 'react';
import { useBakery } from '../../context/BakeryContext';
import {
  OrderItem,
  PaymentMethod,
  PaymentStatus,
  DeliveryType,
  OrderStatus,
} from '../../types';
import { formatRupiah } from '../../utils/formatters';
import {
  X,
  ShoppingCart,
  Plus,
  Trash2,
  CheckCircle2,
  User,
  CreditCard,
  Truck,
  Percent,
} from 'lucide-react';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({ isOpen, onClose }) => {
  const { products, customers, createOrder, currentUser } = useBakery();
  const safeProducts = products || [];
  const safeCustomers = customers || [];

  // Customer info
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');

  // Cart items
  const [items, setItems] = useState<
    { productId: string; productName: string; qty: number; unitPrice: number; subtotal: number; hppSnapshot: number }[]
  >([
    {
      productId: safeProducts[0]?.id || '',
      productName: safeProducts[0]?.name || '',
      qty: 1,
      unitPrice: safeProducts[0]?.sellingPrice || 55000,
      subtotal: safeProducts[0]?.sellingPrice || 55000,
      hppSnapshot: safeProducts[0]?.baseHpp || 28000,
    },
  ]);

  // Pricing adjustments
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [shippingFee, setShippingFee] = useState<number>(0);

  // Payment & Delivery
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TRANSFER_BCA');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('LUNAS');
  const [paidAmount, setPaidAmount] = useState<number>(55000);
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('PENDING');
  const [deliveryType, setDeliveryType] = useState<DeliveryType>('DELIVERY');
  const [deliveryDate, setDeliveryDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [deliveryTime, setDeliveryTime] = useState('11:00');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSelectCustomer = (cId: string) => {
    setSelectedCustomerId(cId);
    if (cId === 'NEW') {
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      return;
    }
    const c = customers.find((cust) => cust.id === cId);
    if (c) {
      setCustomerName(c.name);
      setCustomerPhone(c.phone);
      setCustomerAddress(c.address || '');
    }
  };

  const handleAddItem = () => {
    const defaultP = safeProducts[0];
    if (!defaultP) return;

    setItems([
      ...(items || []),
      {
        productId: defaultP.id,
        productName: defaultP.name,
        qty: 1,
        unitPrice: defaultP.sellingPrice,
        subtotal: defaultP.sellingPrice,
        hppSnapshot: defaultP.baseHpp,
      },
    ]);
  };

  const handleItemChange = (idx: number, field: string, val: any) => {
    setItems(
      (items || []).map((item, i) => {
        if (i !== idx) return item;

        if (field === 'productId') {
          const prod = safeProducts.find((p) => p.id === val);
          if (!prod) return item;
          const qty = item.qty || 1;
          return {
            ...item,
            productId: prod.id,
            productName: prod.name,
            unitPrice: prod.sellingPrice,
            subtotal: qty * prod.sellingPrice,
            hppSnapshot: prod.baseHpp,
          };
        }

        if (field === 'qty') {
          const qty = Number(val) || 1;
          return {
            ...item,
            qty,
            subtotal: qty * item.unitPrice,
          };
        }

        if (field === 'unitPrice') {
          const price = Number(val) || 0;
          return {
            ...item,
            unitPrice: price,
            subtotal: (item.qty || 1) * price,
          };
        }

        return item;
      })
    );
  };

  const handleRemoveItem = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
  const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0 || !customerName.trim()) return;

    const calculatedSubtotal = items.reduce((sum, item) => sum + item.subtotal, 0);
    const numDiscount = Number(discountAmount) || 0;
    const numShipping = Number(shippingFee) || 0;
    const calculatedTotal = Math.max(0, calculatedSubtotal - numDiscount + numShipping);
    const finalPaid = paymentStatus === 'LUNAS' ? calculatedTotal : (Number(paidAmount) || 0);

    createOrder({
      customerId: selectedCustomerId && selectedCustomerId !== 'NEW' ? selectedCustomerId : undefined,
      customerName,
      customerPhone,
      customerAddress,
      items: items.map((it, idx) => ({
        id: `oi-${Date.now()}-${idx}`,
        productId: it.productId,
        productName: it.productName,
        qty: it.qty,
        unitPrice: it.unitPrice,
        subtotal: it.subtotal,
        hppSnapshot: it.hppSnapshot,
      })),
      date: deliveryDate || new Date().toISOString().split('T')[0],
      subtotal: calculatedSubtotal,
      discountAmount: numDiscount,
      shippingFee: numShipping,
      totalAmount: calculatedTotal,
      paidAmount: finalPaid,
      paymentMethod,
      paymentStatus,
      orderStatus: orderStatus || 'PENDING',
      fulfillmentStatus: orderStatus === 'PROCESSED' ? 'DIPROSES' : orderStatus === 'SHIPPED' ? 'DIKIRIM' : orderStatus === 'DELIVERED' ? 'SIAP_DIAMBIL' : orderStatus === 'COMPLETED' ? 'SELESAI' : 'MENUNGGU',
      deliveryType,
      deliveryDate,
      deliveryTime,
      notes,
      cashierName: currentUser.name,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="px-5 py-4 bg-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm sm:text-base">Kasir POS & Buat Pesanan Baru</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-stone-400 hover:text-white rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[82vh] overflow-y-auto text-xs">
          {/* Customer Selection Card */}
          <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-900 flex items-center space-x-1.5">
                <User className="w-4 h-4 text-amber-700" />
                <span>1. Data Pelanggan / Pembeli</span>
              </span>
              <select
                value={selectedCustomerId}
                onChange={(e) => handleSelectCustomer(e.target.value)}
                className="px-2.5 py-1 text-xs border border-stone-300 rounded-md bg-white font-medium focus:outline-none"
              >
                <option value="NEW">+ Pelanggan Baru / Tamu</option>
                {(customers || []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phone})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Nama Pelanggan *
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Contoh: Ibu Hj. Nurhayati"
                  required
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Nomor WhatsApp *
                </label>
                <input
                  type="text"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="081234567890"
                  required
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">Alamat Pengiriman</label>
              <input
                type="text"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="Jl. Melati No. 45, Komplek Asri (opsional jika pickup)"
                className="w-full px-3 py-1.5 border border-stone-300 rounded-lg bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Product Items Table */}
          <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-stone-900 flex items-center space-x-1.5">
                <ShoppingCart className="w-4 h-4 text-amber-700" />
                <span>2. Produk Yang Dipesan</span>
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-xs font-bold text-amber-700 hover:text-amber-800 flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Item</span>
              </button>
            </div>

            <div className="space-y-2">
              {(items || []).map((item, idx) => (
                <div
                  key={idx}
                  className="p-2.5 bg-white border border-stone-200 rounded-lg grid grid-cols-1 sm:grid-cols-12 gap-2 items-center"
                >
                  <div className="sm:col-span-6">
                    <select
                      value={item.productId}
                      onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                      className="w-full px-2 py-1.5 border border-stone-300 rounded bg-white text-xs font-medium focus:outline-none"
                    >
                      {safeProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} (Stok: {p.stockFinishedGoods})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-2">
                    <input
                      type="number"
                      min="1"
                      value={item.qty}
                      onChange={(e) => handleItemChange(idx, 'qty', e.target.value)}
                      placeholder="Qty"
                      className="w-full px-2 py-1.5 border border-stone-300 rounded text-center font-bold focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-4 flex items-center justify-between sm:justify-end space-x-2">
                    <span className="font-mono font-bold text-stone-900">
                      {formatRupiah(item.subtotal)}
                    </span>
                    {items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveItem(idx)}
                        className="p-1 text-stone-400 hover:text-rose-600 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Adjustments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Diskon Potongan Harga (Rp)
              </label>
              <input
                type="number"
                step="1000"
                value={discountAmount}
                onChange={(e) => setDiscountAmount(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-stone-300 rounded-lg focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                Ongkos Kirim Kurir (Rp)
              </label>
              <input
                type="number"
                step="1000"
                value={shippingFee}
                onChange={(e) => setShippingFee(Number(e.target.value))}
                className="w-full px-3 py-1.5 border border-stone-300 rounded-lg focus:outline-none"
              />
            </div>
          </div>

          {/* Payment & Delivery Options */}
          <div className="p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Metode Bayar</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white focus:outline-none font-medium"
                >
                  <option value="TRANSFER_BCA">BCA Transfer</option>
                  <option value="TRANSFER_MANDIRI">Mandiri Transfer</option>
                  <option value="TRANSFER_BRI">BRI Transfer</option>
                  <option value="QRIS">QRIS / E-Wallet</option>
                  <option value="CASH">Tunai / Cash Kasir</option>
                  <option value="GOJEK_GRAB">GrabFood / GoFood</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Status Bayar</label>
                <select
                  value={paymentStatus}
                  onChange={(e) => {
                    const status = e.target.value as PaymentStatus;
                    setPaymentStatus(status);
                    if (status === 'LUNAS') setPaidAmount(totalAmount);
                    if (status === 'BELUM_BAYAR') setPaidAmount(0);
                  }}
                  className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white focus:outline-none font-bold text-emerald-700"
                >
                  <option value="LUNAS">LUNAS</option>
                  <option value="DP">UANG MUKA (DP)</option>
                  <option value="BELUM_BAYAR">BELUM BAYAR / COD</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Status Pesanan Awal</label>
                <select
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value as OrderStatus)}
                  className="w-full px-2.5 py-1.5 border border-amber-300 rounded-lg bg-amber-50/60 focus:outline-none font-bold text-amber-900"
                >
                  <option value="PENDING">Menunggu (Baru Masuk)</option>
                  <option value="PROCESSED">Sedang Dikemas / Diproses</option>
                  <option value="SHIPPED">Dalam Pengiriman Kurir</option>
                  <option value="DELIVERED">Siap Diambil / Terkirim</option>
                  <option value="COMPLETED">Selesai</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Metode Ambil</label>
                <select
                  value={deliveryType}
                  onChange={(e) => setDeliveryType(e.target.value as DeliveryType)}
                  className="w-full px-2.5 py-1.5 border border-stone-300 rounded-lg bg-white focus:outline-none font-medium"
                >
                  <option value="DELIVERY">Delivery Kurir</option>
                  <option value="PICKUP">Pickup (Ambil Sendiri)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Tanggal Pesanan / Pengiriman</label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-lg bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Jam Ambil / Estimasi</label>
                <input
                  type="time"
                  value={deliveryTime}
                  onChange={(e) => setDeliveryTime(e.target.value)}
                  className="w-full px-3 py-1.5 border border-stone-300 rounded-lg bg-white focus:outline-none"
                />
              </div>
            </div>

            {paymentStatus === 'DP' && (
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  Nominal DP Masuk (Rp)
                </label>
                <input
                  type="number"
                  value={paidAmount}
                  onChange={(e) => setPaidAmount(Number(e.target.value))}
                  className="w-full px-3 py-1.5 border border-amber-300 rounded-lg bg-amber-50 font-bold focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Grand Total Banner */}
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-amber-950 block">Total Tagihan Pesanan</span>
              <span className="text-[11px] text-amber-800">
                Subtotal {formatRupiah(subtotal)} {discountAmount > 0 && `- Diskon ${formatRupiah(discountAmount)}`}{' '}
                {shippingFee > 0 && `+ Ongkir ${formatRupiah(shippingFee)}`}
              </span>
            </div>
            <span className="text-xl font-extrabold text-amber-950 font-mono">
              {formatRupiah(totalAmount)}
            </span>
          </div>

          <div>
            <label className="block font-semibold text-stone-700 mb-1">
              Catatan Pesanan / Request Khusus
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Contoh: Tambah pita ucapan selamat ulang tahun..."
              className="w-full px-3 py-1.5 border border-stone-300 rounded-lg focus:outline-none"
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
              <span>Simpan & Buat Nota</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
