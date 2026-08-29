import React, { useState } from 'react';
import { useBakery } from '../../context/BakeryContext';
import { Order, OrderStatus, PaymentStatus } from '../../types';
import {
  formatRupiah,
  formatDateIndo,
  generateWhatsAppLink,
  buildInvoiceWhatsAppMessage,
} from '../../utils/formatters';
import { InvoiceModal } from './InvoiceModal';
import { NewOrderModal } from './NewOrderModal';
import {
  Receipt,
  Plus,
  Search,
  Printer,
  Send,
  CheckCircle2,
  Clock,
  Truck,
  CreditCard,
  Filter,
} from 'lucide-react';

export const PosAndOrders: React.FC = () => {
  const { orders, updateOrderStatus, updatePaymentStatus, businessProfile } = useBakery();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPaymentStatus, setSelectedPaymentStatus] = useState<string>('ALL');
  const [selectedOrderStatus, setSelectedOrderStatus] = useState<string>('ALL');

  // Modals
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [selectedOrderForInvoice, setSelectedOrderForInvoice] = useState<Order | null>(null);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerPhone.includes(searchQuery);

    const matchesPayment =
      selectedPaymentStatus === 'ALL' || order.paymentStatus === selectedPaymentStatus;

    const matchesOrder =
      selectedOrderStatus === 'ALL' || order.orderStatus === selectedOrderStatus;

    return matchesSearch && matchesPayment && matchesOrder;
  });

  const handleQuickWhatsApp = (order: Order) => {
    const message = buildInvoiceWhatsAppMessage({
      invoiceNumber: order.invoiceNumber,
      customerName: order.customerName,
      date: order.date,
      items: order.items,
      subtotal: order.subtotal,
      discountAmount: order.discountAmount,
      shippingFee: order.shippingFee,
      totalAmount: order.totalAmount,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      paidAmount: order.paidAmount,
      businessName: businessProfile.name,
      businessPhone: businessProfile.phone,
      deliveryType: order.deliveryType,
      customerAddress: order.customerAddress,
    });

    const url = generateWhatsAppLink(order.customerPhone, message);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Modul Penjualan & Kasir
            </span>
          </div>
          <h2 className="text-xl font-bold text-stone-900 mt-1">
            Kasir POS, Faktur Penjualan & Kirim Nota WhatsApp
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Kelola transaksi kasir toko, status pembayaran transfer/tunai, dan pengiriman invoice instan via WhatsApp.
          </p>
        </div>

        <button
          onClick={() => setIsNewOrderModalOpen(true)}
          className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs rounded-lg transition shadow-sm flex items-center space-x-1.5 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>+ Transaksi Kasir Baru (POS)</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-xl border border-stone-200 shadow-sm text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari no invoice, nama pembeli, no HP..."
            className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-start sm:justify-end">
          <select
            value={selectedPaymentStatus}
            onChange={(e) => setSelectedPaymentStatus(e.target.value)}
            className="px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white focus:outline-none font-medium"
          >
            <option value="ALL">Semua Pembayaran</option>
            <option value="LUNAS">Lunas</option>
            <option value="DP">Uang Muka (DP)</option>
            <option value="BELUM_BAYAR">Belum Bayar</option>
          </select>

          <select
            value={selectedOrderStatus}
            onChange={(e) => setSelectedOrderStatus(e.target.value)}
            className="px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white focus:outline-none font-medium"
          >
            <option value="ALL">Semua Pengiriman</option>
            <option value="PENDING">Menunggu</option>
            <option value="PROCESSED">Sedang Dikemas</option>
            <option value="SHIPPED">Dalam Pengiriman</option>
            <option value="COMPLETED">Selesai / Terkirim</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-600 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5">No. Invoice & Tanggal</th>
                <th className="p-3.5">Pelanggan & WA</th>
                <th className="p-3.5">Pesanan Item</th>
                <th className="p-3.5 text-right">Total Tagihan</th>
                <th className="p-3.5">Status Bayar</th>
                <th className="p-3.5">Status Pengiriman</th>
                <th className="p-3.5 text-center">Aksi / Kirim</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200/70">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-stone-400">
                    Tidak ada data transaksi yang sesuai filter.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  return (
                    <tr key={order.id} className="hover:bg-stone-50 transition">
                      <td className="p-3.5">
                        <div className="font-mono font-bold text-stone-900">
                          #{order.invoiceNumber}
                        </div>
                        <div className="text-stone-500 text-[11px]">
                          {formatDateIndo(order.date)}
                        </div>
                        <div className="text-[10px] text-stone-400 mt-0.5">
                          Kasir: {order.cashierName}
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-stone-900">{order.customerName}</div>
                        <div className="text-stone-500 font-mono text-[11px]">
                          {order.customerPhone}
                        </div>
                        <span className="text-[10px] px-1.5 py-0.2 bg-stone-100 text-stone-600 rounded">
                          {order.deliveryType === 'DELIVERY' ? 'Kurir Antar' : 'Pickup Toko'}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="space-y-0.5">
                          {(order.items || []).map((it, idx) => (
                            <div key={idx} className="text-[11px] text-stone-700">
                              • {it.productName} <strong>x{it.qty}</strong>
                            </div>
                          ))}
                        </div>
                      </td>

                      <td className="p-3.5 text-right font-mono font-extrabold text-stone-900">
                        {formatRupiah(order.totalAmount)}
                      </td>

                      <td className="p-3.5">
                        <select
                          value={order.paymentStatus}
                          onChange={(e) =>
                            updatePaymentStatus(
                              order.id,
                              e.target.value as PaymentStatus,
                              e.target.value === 'LUNAS' ? order.totalAmount : order.paidAmount
                            )
                          }
                          className={`px-2 py-1 rounded text-[10px] font-bold border focus:outline-none cursor-pointer ${
                            order.paymentStatus === 'LUNAS'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : order.paymentStatus === 'DP'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : 'bg-rose-50 text-rose-800 border-rose-200'
                          }`}
                        >
                          <option value="LUNAS">LUNAS</option>
                          <option value="DP">DP ({formatRupiah(order.paidAmount)})</option>
                          <option value="BELUM_BAYAR">BELUM BAYAR</option>
                        </select>
                        <span className="text-[10px] text-stone-400 block mt-1">
                          via {order.paymentMethod.replace('_', ' ')}
                        </span>
                      </td>

                      <td className="p-3.5">
                        {(() => {
                          const currentStatus =
                            order.orderStatus ||
                            (order.fulfillmentStatus === 'SELESAI'
                              ? 'COMPLETED'
                              : order.fulfillmentStatus === 'DIKIRIM'
                              ? 'SHIPPED'
                              : order.fulfillmentStatus === 'DIPROSES'
                              ? 'PROCESSED'
                              : order.fulfillmentStatus === 'SIAP_DIAMBIL'
                              ? 'DELIVERED'
                              : order.fulfillmentStatus === 'BATAL'
                              ? 'CANCELLED'
                              : 'PENDING');
                          return (
                            <select
                              value={currentStatus}
                              onChange={(e) =>
                                updateOrderStatus(order.id, e.target.value as OrderStatus)
                              }
                              className={`px-2 py-1 rounded text-[10px] font-bold border focus:outline-none cursor-pointer transition ${
                                currentStatus === 'PENDING'
                                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                                  : currentStatus === 'PROCESSED'
                                  ? 'bg-blue-50 text-blue-900 border-blue-300'
                                  : currentStatus === 'SHIPPED'
                                  ? 'bg-indigo-50 text-indigo-900 border-indigo-300'
                                  : currentStatus === 'DELIVERED'
                                  ? 'bg-teal-50 text-teal-900 border-teal-300'
                                  : currentStatus === 'COMPLETED'
                                  ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                                  : 'bg-rose-50 text-rose-900 border-rose-300'
                              }`}
                            >
                              <option value="PENDING">Menunggu (Baru)</option>
                              <option value="PROCESSED">Sedang Dikemas</option>
                              <option value="SHIPPED">Dalam Pengiriman</option>
                              <option value="DELIVERED">Siap Diambil / Terkirim</option>
                              <option value="COMPLETED">Selesai</option>
                              <option value="CANCELLED">Batal</option>
                            </select>
                          );
                        })()}
                      </td>

                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            onClick={() => setSelectedOrderForInvoice(order)}
                            className="p-1.5 text-stone-600 hover:text-stone-950 hover:bg-stone-100 rounded-md transition"
                            title="Lihat & Cetak Faktur Nota"
                          >
                            <Receipt className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setSelectedOrderForInvoice(order)}
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition flex items-center gap-1"
                            title="Kirim Gambar Nota ke WhatsApp"
                          >
                            <Send className="w-4 h-4" />
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

      {/* Modals */}
      <NewOrderModal
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
        onOrderCreated={(createdOrder) => setSelectedOrderForInvoice(createdOrder)}
      />

      <InvoiceModal
        isOpen={!!selectedOrderForInvoice}
        onClose={() => setSelectedOrderForInvoice(null)}
        order={selectedOrderForInvoice}
      />
    </div>
  );
};
