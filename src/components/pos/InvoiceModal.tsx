import React from 'react';
import { Order } from '../../types';
import { useBakery } from '../../context/BakeryContext';
import {
  formatRupiah,
  formatDateIndo,
  formatDateTimeIndo,
  buildInvoiceWhatsAppMessage,
  generateWhatsAppLink,
} from '../../utils/formatters';
import { X, Printer, Send, CheckCircle2, MessageSquare, Receipt } from 'lucide-react';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, order }) => {
  const { businessProfile } = useBakery();

  if (!isOpen || !order) return null;

  const sisaBayar = order.totalAmount - order.paidAmount;

  const handlePrint = () => {
    window.print();
  };

  const handleSendWhatsApp = () => {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Top Control Bar (Hidden on Print) */}
        <div className="px-5 py-3.5 bg-stone-900 text-white flex items-center justify-between no-print">
          <div className="flex items-center space-x-2">
            <Receipt className="w-5 h-5 text-amber-400" />
            <h3 className="font-bold text-sm">Faktur Penjualan / Invoice</h3>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={handleSendWhatsApp}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded transition flex items-center space-x-1"
              title="Kirim Nota via WhatsApp"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kirim WA</span>
            </button>

            <button
              onClick={handlePrint}
              className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs rounded transition flex items-center space-x-1"
              title="Cetak Faktur"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak</span>
            </button>

            <button
              onClick={onClose}
              className="p-1 text-stone-400 hover:text-white rounded transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE INVOICE BODY */}
        <div className="p-6 text-stone-900 space-y-4 max-h-[80vh] overflow-y-auto font-sans text-xs">
          {/* Header Brand */}
          <div className="text-center border-b border-stone-300 pb-3">
            <h2 className="text-lg font-extrabold tracking-tight uppercase">
              {businessProfile.name}
            </h2>
            <p className="text-[11px] text-stone-600">{businessProfile.tagline}</p>
            <p className="text-[10px] text-stone-500 mt-0.5">
              {businessProfile.address}, {businessProfile.city} • WA: {businessProfile.phone}
            </p>
          </div>

          {/* Invoice Meta */}
          <div className="grid grid-cols-2 gap-2 text-[11px]">
            <div>
              <span className="text-stone-500 block">No. Invoice:</span>
              <strong className="font-mono text-stone-900">#{order.invoiceNumber}</strong>
            </div>
            <div className="text-right">
              <span className="text-stone-500 block">Tanggal:</span>
              <strong>{formatDateIndo(order.date)}</strong>
            </div>
            <div>
              <span className="text-stone-500 block">Pelanggan:</span>
              <strong className="text-stone-900">{order.customerName}</strong>
              <span className="text-stone-500 block">{order.customerPhone}</span>
            </div>
            <div className="text-right">
              <span className="text-stone-500 block">Pengiriman:</span>
              <strong className="text-stone-900">
                {order.deliveryType === 'DELIVERY' ? 'Kurir / Antar' : 'Pickup (Ambil Sendiri)'}
              </strong>
            </div>
          </div>

          {order.customerAddress && (
            <div className="text-[11px] bg-stone-50 p-2 rounded border border-stone-200">
              <span className="text-stone-500 block">Alamat Tujuan:</span>
              <span>{order.customerAddress}</span>
            </div>
          )}

          {/* Products Table */}
          <div className="border-t border-b border-stone-300 py-2">
            <table className="w-full text-left text-xs">
              <thead className="text-[10px] text-stone-500 uppercase border-b border-stone-200">
                <tr>
                  <th className="pb-1">Item Produk</th>
                  <th className="pb-1 text-center">Qty</th>
                  <th className="pb-1 text-right">Harga</th>
                  <th className="pb-1 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-[11px]">
                {(order.items || []).map((item, idx) => (
                  <tr key={idx}>
                    <td className="py-1.5 font-semibold text-stone-800">
                      {item.productName}
                    </td>
                    <td className="py-1.5 text-center font-bold text-stone-700">
                      {item.qty}
                    </td>
                    <td className="py-1.5 text-right font-mono text-stone-600">
                      {formatRupiah(item.unitPrice)}
                    </td>
                    <td className="py-1.5 text-right font-mono font-bold text-stone-900">
                      {formatRupiah(item.subtotal)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculation Breakdown */}
          <div className="space-y-1 text-[11px] text-stone-700">
            <div className="flex justify-between">
              <span>Subtotal Produk:</span>
              <span className="font-mono">{formatRupiah(order.subtotal)}</span>
            </div>

            {order.discountAmount > 0 && (
              <div className="flex justify-between text-rose-600 font-medium">
                <span>Diskon:</span>
                <span className="font-mono">-{formatRupiah(order.discountAmount)}</span>
              </div>
            )}

            {order.shippingFee > 0 && (
              <div className="flex justify-between">
                <span>Ongkos Kirim:</span>
                <span className="font-mono">{formatRupiah(order.shippingFee)}</span>
              </div>
            )}

            <div className="flex justify-between pt-1.5 border-t border-stone-300 text-sm font-extrabold text-stone-950">
              <span>TOTAL TAGIHAN:</span>
              <span className="font-mono">{formatRupiah(order.totalAmount)}</span>
            </div>

            <div className="flex justify-between pt-1 text-[11px]">
              <span>Metode Pembayaran:</span>
              <span className="font-semibold">{order.paymentMethod.replace('_', ' ')}</span>
            </div>

            <div className="flex justify-between text-[11px]">
              <span>Status Pembayaran:</span>
              <span
                className={`font-bold px-1.5 py-0.5 rounded text-[10px] ${
                  order.paymentStatus === 'LUNAS'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {order.paymentStatus} (Dibayar: {formatRupiah(order.paidAmount)})
              </span>
            </div>

            {sisaBayar > 0 && (
              <div className="flex justify-between font-bold text-rose-700 text-xs pt-1 border-t border-dashed border-rose-300">
                <span>Sisa Tagihan Belum Dibayar:</span>
                <span className="font-mono">{formatRupiah(sisaBayar)}</span>
              </div>
            )}
          </div>

          {/* Footer Notes */}
          <div className="text-center pt-3 border-t border-stone-200 text-[10px] text-stone-500 space-y-0.5">
            <p>Terima kasih atas pesanan Anda di {businessProfile.name}!</p>
            <p>Freshly baked everyday with premium natural ingredients ❤️</p>
          </div>
        </div>

        {/* Bottom Bar for easy closing */}
        <div className="p-3 bg-stone-100 border-t border-stone-200 flex justify-end space-x-2 no-print">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-50"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
