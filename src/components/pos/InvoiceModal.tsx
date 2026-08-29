import React, { useRef, useState } from 'react';
import { Order } from '../../types';
import { useBakery } from '../../context/BakeryContext';
import {
  formatRupiah,
  formatDateIndo,
  buildInvoiceWhatsAppMessage,
  generateWhatsAppLink,
} from '../../utils/formatters';
import {
  X,
  Printer,
  Send,
  Download,
  Copy,
  Check,
  Receipt,
  Image as ImageIcon,
  ExternalLink,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { toBlob, toPng } from 'html-to-image';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ isOpen, onClose, order }) => {
  const { businessProfile } = useBakery();
  const invoiceCardRef = useRef<HTMLDivElement>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [showImageGuide, setShowImageGuide] = useState(false);
  const [generatedPreviewUrl, setGeneratedPreviewUrl] = useState<string | null>(null);

  if (!isOpen || !order) return null;

  const sisaBayar = order.totalAmount - order.paidAmount;

  /**
   * Generates a high-quality PNG Blob from the invoice DOM node
   */
  const generateInvoiceImageBlob = async (): Promise<Blob | null> => {
    if (!invoiceCardRef.current) return null;
    try {
      const blob = await toBlob(invoiceCardRef.current, {
        quality: 0.98,
        pixelRatio: 2.5,
        backgroundColor: '#ffffff',
        cacheBust: true,
      });
      return blob;
    } catch (err) {
      console.error('Gagal membuat gambar faktur:', err);
      return null;
    }
  };

  /**
   * Primary action: Kirim Gambar Nota ke WhatsApp
   * - Supports Web Share API (Mobile WhatsApp directly attaches the image)
   * - Copies image to Clipboard for Desktop WhatsApp Web (Ctrl+V / Paste)
   * - Opens WhatsApp chat link
   */
  const handleSendWhatsAppImage = async () => {
    if (!order) return;
    setIsGenerating(true);

    try {
      const blob = await generateInvoiceImageBlob();
      if (!blob) {
        throw new Error('Gagal merender gambar nota');
      }

      // Generate preview URL for immediate display/modal guide
      const previewUrl = URL.createObjectURL(blob);
      setGeneratedPreviewUrl(previewUrl);

      const fileName = `Nota-${order.invoiceNumber}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      let sharedViaNative = false;

      // 1. Check if Mobile / Native Web Share API supports file sharing directly to WhatsApp
      if (typeof navigator !== 'undefined' && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `Nota ${order.invoiceNumber} - ${businessProfile.name}`,
            text: `Halo Kak ${order.customerName}, berikut gambar Faktur Penjualan #${order.invoiceNumber} dari ${businessProfile.name}. Terima kasih! 🙏`,
          });
          sharedViaNative = true;
        } catch (shareErr: any) {
          // If user cancelled native share, don't fallback to error
          if (shareErr.name === 'AbortError') {
            setIsGenerating(false);
            return;
          }
          console.warn('Native share failed or dismissed, fallback to clipboard:', shareErr);
        }
      }

      // 2. If not shared via native share (e.g. Desktop PC / WhatsApp Web), copy image to clipboard & open WA Web
      if (!sharedViaNative) {
        let clipboardCopied = false;
        try {
          if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
            await navigator.clipboard.write([
              new ClipboardItem({
                'image/png': blob,
              }),
            ]);
            clipboardCopied = true;
            setCopiedImage(true);
            setTimeout(() => setCopiedImage(false), 4000);
          }
        } catch (clipErr) {
          console.warn('Clipboard write image not supported or allowed:', clipErr);
        }

        // Open WhatsApp Web/App
        const waText = `Halo Kak *${order.customerName}*, berikut kami lampirkan gambar Faktur Nota Penjualan *#${order.invoiceNumber}* dari *${businessProfile.name}*.\n\n(Gambar nota telah disalin otomatis. Silakan tekan *Ctrl + V* / *Tempel Gambar* untuk melampirkan nota 📸). Terima kasih banyak! 🙏`;
        const waUrl = generateWhatsAppLink(order.customerPhone, waText);
        window.open(waUrl, '_blank');

        // Show guide popup with download button
        setShowImageGuide(true);
      }
    } catch (err: any) {
      console.error('Error saat kirim WA gambar:', err);
      // Fallback: send text format
      handleSendWhatsAppText();
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Salin Gambar Nota ke Clipboard
   */
  const handleCopyImageToClipboard = async () => {
    setIsGenerating(true);
    try {
      const blob = await generateInvoiceImageBlob();
      if (!blob) throw new Error('Gagal merender gambar');

      if (navigator.clipboard && typeof ClipboardItem !== 'undefined') {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob,
          }),
        ]);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 3000);
      } else {
        alert('Browser tidak mendukung salin gambar langsung. Silakan gunakan tombol Unduh Gambar.');
      }
    } catch (err) {
      console.error('Gagal menyalin gambar:', err);
      alert('Gagal menyalin gambar ke clipboard.');
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Download Invoice as PNG
   */
  const handleDownloadImage = async () => {
    if (!invoiceCardRef.current) return;
    setIsGenerating(true);
    try {
      const dataUrl = await toPng(invoiceCardRef.current, {
        quality: 0.98,
        pixelRatio: 2.5,
        backgroundColor: '#ffffff',
      });
      const link = document.createElement('a');
      link.download = `Nota-${order.invoiceNumber}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Gagal mendownload gambar:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  /**
   * Kirim Teks WhatsApp (Opsi Cadangan)
   */
  const handleSendWhatsAppText = () => {
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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 sm:p-4 backdrop-blur-xs overflow-y-auto">
      <div className="bg-stone-900 rounded-2xl shadow-2xl border border-stone-800 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        {/* Top Control Bar */}
        <div className="px-4 py-3 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800 no-print">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              <Receipt className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-stone-100">Faktur Penjualan / Invoice</h3>
              <p className="text-[10px] text-stone-400">Siap dikirim ke WhatsApp dalam bentuk gambar</p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* Main Kirim WA Gambar Button */}
            <button
              onClick={handleSendWhatsAppImage}
              disabled={isGenerating}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs rounded-lg transition flex items-center space-x-1.5 shadow-sm shadow-emerald-900/30 cursor-pointer disabled:opacity-50"
              title="Kirim Gambar Nota ke WhatsApp"
            >
              {isGenerating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              <span>Kirim WA</span>
            </button>

            {/* Cetak Button */}
            <button
              onClick={handlePrint}
              className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 font-semibold text-xs rounded-lg transition flex items-center space-x-1"
              title="Cetak Faktur / Print"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cetak</span>
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-1.5 text-stone-400 hover:text-white rounded-lg transition hover:bg-stone-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Action Sub-Bar: Download Gambar & Copy Gambar */}
        <div className="px-4 py-2 bg-stone-950/80 border-b border-stone-800 flex items-center justify-between text-xs text-stone-300 no-print flex-wrap gap-2">
          <span className="text-[11px] text-stone-400 flex items-center gap-1">
            <ImageIcon className="w-3.5 h-3.5 text-emerald-400" />
            Format Gambar Nota (PNG)
          </span>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyImageToClipboard}
              disabled={isGenerating}
              className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-[11px] font-medium transition flex items-center space-x-1 cursor-pointer"
              title="Salin Gambar ke Clipboard (Bisa di-paste ke chat WA)"
            >
              {copiedImage ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">Tersalin!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Salin Gambar</span>
                </>
              )}
            </button>

            <button
              onClick={handleDownloadImage}
              disabled={isGenerating}
              className="px-2.5 py-1 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded text-[11px] font-medium transition flex items-center space-x-1 cursor-pointer"
              title="Download gambar nota sebagai file PNG"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh PNG</span>
            </button>
          </div>
        </div>

        {/* INVOICE CARD WRAPPER */}
        <div className="p-3 sm:p-4 bg-stone-100 max-h-[75vh] overflow-y-auto">
          {/* THE EXACT INVOICE ELEMENT CAPTURED FOR WHATSAPP IMAGE */}
          <div
            ref={invoiceCardRef}
            id="invoice-printable-card"
            className="bg-white rounded-xl shadow-md border border-stone-200 p-5 sm:p-6 text-stone-900 space-y-4 font-sans text-xs max-w-md mx-auto"
            style={{ minWidth: '320px' }}
          >
            {/* Header Brand */}
            <div className="text-center border-b border-stone-200 pb-3">
              <h2 className="text-base sm:text-lg font-black tracking-tight uppercase text-stone-950">
                {businessProfile.name}
              </h2>
              <p className="text-[11px] text-stone-600 font-medium">{businessProfile.tagline}</p>
              <p className="text-[10px] text-stone-500 mt-0.5">
                {businessProfile.address}, {businessProfile.city} • WA: {businessProfile.phone}
              </p>
            </div>

            {/* Invoice Meta Grid */}
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <span className="text-stone-500 block text-[10px]">No. Invoice:</span>
                <strong className="font-mono text-stone-950 font-bold">#{order.invoiceNumber}</strong>
              </div>
              <div className="text-right">
                <span className="text-stone-500 block text-[10px]">Tanggal:</span>
                <strong className="text-stone-900 font-semibold">{formatDateIndo(order.date)}</strong>
              </div>
              <div>
                <span className="text-stone-500 block text-[10px]">Pelanggan:</span>
                <strong className="text-stone-950 font-bold">{order.customerName}</strong>
                <span className="text-stone-500 block text-[10px]">{order.customerPhone}</span>
              </div>
              <div className="text-right">
                <span className="text-stone-500 block text-[10px]">Pengiriman:</span>
                <strong className="text-stone-900 font-semibold">
                  {order.deliveryType === 'DELIVERY' ? 'Kurir / Antar' : 'Pickup (Ambil Sendiri)'}
                </strong>
              </div>
            </div>

            {/* Alamat Tujuan Box */}
            {order.customerAddress && (
              <div className="text-[11px] bg-stone-50 p-2.5 rounded-lg border border-stone-200">
                <span className="text-stone-500 block text-[10px] font-medium">Alamat Tujuan:</span>
                <span className="text-stone-800 font-medium">{order.customerAddress}</span>
              </div>
            )}

            {/* Products Table */}
            <div className="border-t border-b border-stone-200 py-2">
              <table className="w-full text-left text-xs">
                <thead className="text-[10px] text-stone-500 uppercase border-b border-stone-200">
                  <tr>
                    <th className="pb-1.5 font-bold">ITEM PRODUK</th>
                    <th className="pb-1.5 text-center font-bold">QTY</th>
                    <th className="pb-1.5 text-right font-bold">HARGA</th>
                    <th className="pb-1.5 text-right font-bold">TOTAL</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100 text-[11px]">
                  {(order.items || []).map((item, idx) => (
                    <tr key={idx}>
                      <td className="py-2 font-semibold text-stone-800">
                        {item.productName}
                      </td>
                      <td className="py-2 text-center font-bold text-stone-800">
                        {item.qty}
                      </td>
                      <td className="py-2 text-right font-mono text-stone-600 text-[10px]">
                        {formatRupiah(item.unitPrice)}
                      </td>
                      <td className="py-2 text-right font-mono font-bold text-stone-950">
                        {formatRupiah(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Calculation Breakdown */}
            <div className="space-y-1.5 text-[11px] text-stone-700">
              <div className="flex justify-between">
                <span>Subtotal Produk:</span>
                <span className="font-mono text-stone-900">{formatRupiah(order.subtotal)}</span>
              </div>

              {order.discountAmount > 0 && (
                <div className="flex justify-between text-rose-600 font-semibold">
                  <span>Diskon:</span>
                  <span className="font-mono">-{formatRupiah(order.discountAmount)}</span>
                </div>
              )}

              {order.shippingFee > 0 && (
                <div className="flex justify-between text-stone-700">
                  <span>Ongkos Kirim:</span>
                  <span className="font-mono text-stone-900">{formatRupiah(order.shippingFee)}</span>
                </div>
              )}

              <div className="flex justify-between pt-2 border-t border-stone-300 text-sm font-black text-stone-950">
                <span>TOTAL TAGIHAN:</span>
                <span className="font-mono">{formatRupiah(order.totalAmount)}</span>
              </div>

              <div className="flex justify-between pt-1 text-[11px]">
                <span className="text-stone-600">Metode Pembayaran:</span>
                <span className="font-bold text-stone-800">{order.paymentMethod.replace('_', ' ')}</span>
              </div>

              <div className="flex justify-between items-center text-[11px]">
                <span className="text-stone-600">Status Pembayaran:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                    order.paymentStatus === 'LUNAS'
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : order.paymentStatus === 'DP'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}
                >
                  {order.paymentStatus} (Dibayar: {formatRupiah(order.paidAmount)})
                </span>
              </div>

              {sisaBayar > 0 && (
                <div className="flex justify-between font-bold text-rose-700 text-xs pt-1.5 border-t border-dashed border-rose-300">
                  <span>Sisa Tagihan Belum Dibayar:</span>
                  <span className="font-mono">{formatRupiah(sisaBayar)}</span>
                </div>
              )}
            </div>

            {/* Footer Notes */}
            <div className="text-center pt-3 border-t border-stone-200 text-[10px] text-stone-500 space-y-0.5">
              <p className="font-medium">Terima kasih atas pesanan Anda di {businessProfile.name}!</p>
              <p>Freshly baked everyday with premium natural ingredients ❤️</p>
            </div>
          </div>
        </div>

        {/* Bottom Bar with helper actions */}
        <div className="p-3 bg-stone-900 border-t border-stone-800 flex items-center justify-between no-print">
          <button
            onClick={handleSendWhatsAppText}
            className="text-[11px] text-stone-400 hover:text-stone-200 underline flex items-center gap-1"
            title="Kirim dalam format teks WhatsApp biasa"
          >
            <span>Opsi: Kirim format Teks</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-semibold text-stone-300 bg-stone-800 border border-stone-700 rounded-lg hover:bg-stone-700 transition cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* Pop-up Info Guide when sharing on Desktop WhatsApp */}
      {showImageGuide && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/70 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-stone-200 text-stone-900 space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-stone-900">Gambar Nota Siap Dikirim!</h4>
                  <p className="text-xs text-stone-500">Gambar faktur telah disalin ke clipboard</p>
                </div>
              </div>
              <button
                onClick={() => setShowImageGuide(false)}
                className="text-stone-400 hover:text-stone-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-950 space-y-1.5">
              <p className="font-semibold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                Cara Menempelkan Gambar di WhatsApp Web:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-emerald-900 pl-1">
                <li>Buka jendela chat WhatsApp yang baru terbuka.</li>
                <li>
                  Tekan <kbd className="px-1.5 py-0.5 bg-white border border-emerald-300 rounded font-mono font-bold">Ctrl + V</kbd> (atau Klik Kanan $\rightarrow$ Paste).
                </li>
                <li>Gambar faktur akan langsung terlampir dan siap dikirim! 🚀</li>
              </ol>
            </div>

            {generatedPreviewUrl && (
              <div className="border border-stone-200 rounded-lg overflow-hidden max-h-36 bg-stone-50 flex items-center justify-center p-2">
                <img
                  src={generatedPreviewUrl}
                  alt="Preview Nota"
                  className="max-h-32 object-contain shadow-xs rounded border border-stone-200"
                />
              </div>
            )}

            <div className="flex items-center justify-end space-x-2 pt-1">
              <button
                onClick={handleDownloadImage}
                className="px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download File PNG</span>
              </button>

              <button
                onClick={() => setShowImageGuide(false)}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition"
              >
                Oke, Mengerti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

