/**
 * Format number to Indonesian Rupiah currency string
 */
export function formatRupiah(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return 'Rp 0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format standard number with Indonesian locale (dot for thousands, comma for decimals)
 */
export function formatNumber(num: number | undefined | null, maxDecimals = 2): string {
  if (num === undefined || num === null || isNaN(num)) return '0';
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: maxDecimals,
  }).format(num);
}

/**
 * Format ISO date string to Indonesian readable format (e.g., 24 Agustus 2026)
 */
export function formatDateIndo(dateStr: string | undefined): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

/**
 * Format datetime to Indonesian readable format with time (e.g., 24 Agu 2026, 14:30 WIB)
 */
export function formatDateTimeIndo(dateStr: string | undefined): string {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    const dateFormatted = new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
    return `${dateFormatted} WIB`;
  } catch {
    return dateStr;
  }
}

/**
 * Clean phone number to WhatsApp format (replace 08xx with 628xx, remove spaces and dashes)
 */
export function cleanWhatsAppPhone(phone: string): string {
  let cleaned = phone.replace(/[^0-9]/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (cleaned.startsWith('+62')) {
    cleaned = '62' + cleaned.substring(3);
  }
  return cleaned;
}

/**
 * Generate WhatsApp Click-to-Chat URL
 */
export function generateWhatsAppLink(phone: string, text: string): string {
  const cleanPhone = cleanWhatsAppPhone(phone);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Generate Invoice WhatsApp message
 */
export function buildInvoiceWhatsAppMessage(order: {
  invoiceNumber: string;
  customerName: string;
  date: string;
  items: { productName: string; qty: number; unitPrice: number; subtotal: number }[];
  subtotal: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  paymentStatus: string;
  paymentMethod: string;
  paidAmount: number;
  businessName: string;
  businessPhone: string;
  deliveryType: string;
  customerAddress?: string;
}): string {
  const itemLines = order.items
    .map(
      (item, idx) =>
        `${idx + 1}. *${item.productName}* x${item.qty} = ${formatRupiah(item.subtotal)}`
    )
    .join('\n');

  const sisaBayar = order.totalAmount - order.paidAmount;

  return `*NOTA PESANAN — ${order.businessName.toUpperCase()}*
===============================
No. Invoice : *#${order.invoiceNumber}*
Tanggal     : ${formatDateIndo(order.date)}
Pelanggan   : *${order.customerName}*
Pengiriman  : ${order.deliveryType === 'DELIVERY' ? 'Kurir / Antar' : 'Ambil Sendiri (Pickup)'}
${order.customerAddress ? `Alamat      : ${order.customerAddress}` : ''}
===============================
*Rincian Produk:*
${itemLines}
-------------------------------
Subtotal    : ${formatRupiah(order.subtotal)}
${order.discountAmount > 0 ? `Diskon      : -${formatRupiah(order.discountAmount)}\n` : ''}${order.shippingFee > 0 ? `Ongkos Kirim: ${formatRupiah(order.shippingFee)}\n` : ''}*TOTAL BAYAR: ${formatRupiah(order.totalAmount)}*
Metode Bayar: ${order.paymentMethod.replace('_', ' ')}
Status Bayar: *${order.paymentStatus}*
${sisaBayar > 0 ? `Sisa Tagihan: *${formatRupiah(sisaBayar)}*\n` : ''}===============================
Terima kasih telah memesan di *${order.businessName}*!
Freshly baked with love ❤️

Konfirmasi transfer/pertanyaan: WA ${order.businessPhone}`;
}

/**
 * Generate Follow-up Repeat Order WhatsApp Message
 */
export function buildRepeatOrderWhatsAppMessage(
  customerName: string,
  businessName: string,
  lastProduct = 'Bolu Pisang Spesial'
): string {
  return `Halo Kak *${customerName}*! Semoga sehat selalu ya 😊

Dari *${businessName}* mau tanya, gimana kemarin rasa *${lastProduct}*-nya? Semoga cocok dan suka ya! 🍌✨

Kebetulan kami hari ini sedang ada batch baru baru matang (Fresh from the oven). Kalau Kak ${customerName} mau pesan untuk stok camilan keluarga atau oleh-oleh, ada promo diskon khusus langganan lho!

Mau kami kirimkan katalog hari ini Kak? 💛`;
}

/**
 * Generate Repeat Order Promo Message with custom offer
 */
export function buildRepeatOrderPromoWhatsAppMessage(
  customerName: string,
  businessName: string,
  promoOffer: string
): string {
  return `Halo Kak *${customerName}*! Salam hangat dari *${businessName}* 😊🍰

Kabar gembira untuk pelanggan setia kami:
✨ *${promoOffer}* ✨

Bolu pisang kami dibuat dari pisang pilihan matang alami, tanpa pengawet & freshly baked everyday! 

Silakan balas pesan ini untuk booking slot pengiriman hari ini ya Kak! Terima kasih 💛`;
}

