import { Product, BusinessProfile, Order, WhatsAppSession, WhatsAppMessageItem } from '../types';
import { formatRupiah } from '../utils/formatters';

/**
 * PUSAKA Bakery - WhatsApp 4-Menu Automation Engine
 * 100% Deterministic & Data-Driven from SaaS (0% AI / Zero AI Interference)
 * 
 * Flow State Machine:
 * MAIN_MENU
 *  ├── 1. PESAN BOLU -> ORDER_SELECT_PRODUCT -> ORDER_QUANTITY -> ORDER_FULFILLMENT -> ORDER_ADDRESS -> ORDER_DATE -> ORDER_CONFIRMATION -> POST /api/orders
 *  ├── 2. LOKASI -> showBusinessLocation (address, operating hours, googleMapsUrl, coords)
 *  ├── 3. VARIAN BOLU -> showProductVariants (catalog from SaaS active products)
 *  └── 4. CHAT ADMIN -> isHumanHandled = true -> Bot Stops
 */

export interface ProcessBotMessageResult {
  session: WhatsAppSession;
  replyText: string | null;
  orderToCreate: Omit<Order, 'id' | 'invoiceNumber' | 'createdAt'> | null;
  shouldReply: boolean;
  replyMessage?: WhatsAppMessageItem;
}

/**
 * Helper: Reset only order-specific attributes from session
 */
export function clearOrderSession(session: WhatsAppSession): WhatsAppSession {
  delete session.selectedProduct;
  delete session.cartItem;
  delete session.quantity;
  delete session.deliveryType;
  delete session.customerAddress;
  delete session.deliveryAddress;
  delete session.deliveryDate;
  delete session.deliveryDateText;
  delete session.deliveryTime;
  delete session.shippingFee;
  delete session.notes;
  return session;
}

/**
 * Helper: Generates Google Maps URL from profile
 */
export function getMapsUrl(profile: BusinessProfile): string {
  if (profile.googleMapsUrl && profile.googleMapsUrl.trim().length > 5) {
    return profile.googleMapsUrl.trim();
  }
  const query = encodeURIComponent(`${profile.name} ${profile.address} ${profile.city}`);
  return `https://maps.google.com/?q=${query}`;
}

/**
 * Helper: Format phone number into WhatsApp standard (628xxx)
 */
export function normalizePhoneNumber(phone: string): string {
  let clean = (phone || '').replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.substring(1);
  } else if (clean.startsWith('8')) {
    clean = '62' + clean;
  }
  return clean || '6281234567890';
}

/**
 * Helper: Build numbered product list text
 */
export function buildProductOrderList(products: Product[]): string {
  if (!products || products.length === 0) {
    return 'Belum ada produk aktif yang tersedia.';
  }
  return products
    .map((product, index) => {
      const stockInfo = typeof product.stockFinishedGoods === 'number' ? ` (Stok siap: ${product.stockFinishedGoods} box)` : '';
      const spec = product.sizeSpec ? ` | ${product.sizeSpec}` : '';
      return `${index + 1}. *${product.name}*\n   ${formatRupiah(product.sellingPrice)}${spec}${stockInfo}`;
    })
    .join('\n\n');
}

/**
 * 1. Menu Utama Balasan
 */
export function showMainMenu(session: WhatsAppSession, businessProfile: BusinessProfile): ProcessBotMessageResult {
  session.currentStep = 'MAIN_MENU';

  const replyText =
    `🍌 *${businessProfile.name.toUpperCase()}*\n` +
    `${businessProfile.tagline ? `${businessProfile.tagline}\n\n` : '\n'}` +
    `Selamat datang Kak ${session.customerName || 'Pelanggan'}!\n\n` +
    `Silakan pilih layanan kami:\n\n` +
    `1. 🛒 *Pesan Bolu*\n` +
    `2. 📍 *Lokasi Toko/Pabrik*\n` +
    `3. 🍰 *Jenis Varian Bolu*\n` +
    `4. 👨‍💼 *Chat dengan Admin*\n\n` +
    `💡 *Mode Hybrid:* Anda bisa langsung *tap tombol menu di bawah*, atau balas dengan angka *1–4* / ketik pilihan Anda.\n` +
    `_Ketik *0* kapan saja untuk kembali ke menu ini._`;

  const replyMessage: WhatsAppMessageItem = {
    id: `msg-${Date.now()}`,
    sender: 'bot',
    text: replyText,
    timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    header: `🍌 ${businessProfile.name}`,
    footer: 'Mode Hybrid: Tap Tombol / Ketik 1-4',
    buttons: [
      { id: 'btn-1', label: '1️⃣ 🛒 Pesan Bolu', payload: '1' },
      { id: 'btn-2', label: '2️⃣ 📍 Lokasi Toko', payload: '2' },
      { id: 'btn-3', label: '3️⃣ 🍰 Varian Bolu', payload: '3' },
      { id: 'btn-4', label: '4️⃣ 👨‍💼 Chat Admin', payload: '4' },
    ],
  };

  return {
    session,
    replyText,
    orderToCreate: null,
    shouldReply: true,
    replyMessage,
  };
}

/**
 * 1.1 Tampilkan Pilihan Produk (Pesan Bolu)
 */
export function showOrderProducts(session: WhatsAppSession, products: Product[]): ProcessBotMessageResult {
  session.currentStep = 'ORDER_SELECT_PRODUCT';
  const activeProducts = (products || []).filter((p) => p.status === 'active');

  if (activeProducts.length === 0) {
    const replyText =
      `Mohon maaf Kak, saat ini belum ada produk yang siap dipesan di sistem kami.\n\n` +
      `Ketik *4* untuk chat langsung dengan Admin kami, atau ketik *0* untuk kembali ke Menu Utama.`;
    return {
      session,
      replyText,
      orderToCreate: null,
      shouldReply: true,
      replyMessage: {
        id: `msg-${Date.now()}`,
        sender: 'bot',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        buttons: [
          { id: 'btn-4', label: '👨‍💼 Chat Admin', payload: '4' },
          { id: 'btn-0', label: '🔙 Menu Utama', payload: '0' },
        ],
      },
    };
  }

  const replyText =
    `🛒 *PESAN BOLU PUSAKA*\n\n` +
    buildProductOrderList(activeProducts) +
    `\n\n💡 *Mode Hybrid:* Tap langsung *tombol produk di bawah*, atau balas nomor produk (*1* - *${activeProducts.length}*).\n\n` +
    `0. Kembali ke Menu Utama`;

  const buttons = [
    ...activeProducts.map((p, idx) => ({
      id: `btn-prod-${p.id}`,
      label: `${idx + 1}️⃣ ${p.name.length > 20 ? p.name.substring(0, 18) + '..' : p.name}`,
      payload: `${idx + 1}`,
    })),
    { id: 'btn-0', label: '🔙 0. Kembali ke Menu Utama', payload: '0' },
  ];

  return {
    session,
    replyText,
    orderToCreate: null,
    shouldReply: true,
    replyMessage: {
      id: `msg-${Date.now()}`,
      sender: 'bot',
      text: replyText,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      header: '🛒 Pilih Varian Bolu',
      footer: 'Tap Produk atau Ketik Nomor',
      buttons,
    },
  };
}

/**
 * 2. Tampilkan Lokasi Toko / Pabrik (Dari SaaS Business Profile)
 */
export function showBusinessLocation(session: WhatsAppSession, profile: BusinessProfile): ProcessBotMessageResult {
  session.currentStep = 'MAIN_MENU';
  const mapsUrl = profile.googleMapsUrl && profile.googleMapsUrl.trim().length > 5
    ? profile.googleMapsUrl.trim()
    : getMapsUrl(profile);
  const maps = `\n\n🗺️ *Google Maps / Petunjuk Arah:*\n${mapsUrl}`;

  const coords = profile.latitude && profile.longitude ? `\n📌 Koordinat: ${profile.latitude}, ${profile.longitude}` : '';

  const replyText =
    `📍 *LOKASI ${profile.name.toUpperCase()}*\n\n` +
    `🏠 *Alamat:*\n${profile.address}\n${profile.city}\n\n` +
    `🕐 *Jam Operasional:*\n${profile.operatingHours || '07.00 - 20.00 WIB'}\n\n` +
    `📞 *Hotline / Kontak:*\n${profile.phone || profile.adminWhatsAppPhone || '-'}` +
    coords +
    maps +
    `\n\n💡 *Mode Hybrid:* Tap tombol di bawah atau balas *1* untuk Pesan Bolu / *0* untuk Menu Utama.`;

  const replyMessage: WhatsAppMessageItem = {
    id: `msg-${Date.now()}`,
    sender: 'bot',
    text: replyText,
    timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    header: `📍 Lokasi ${profile.name}`,
    footer: 'PUSAKA Bakery & Bolu',
    buttons: [
      { id: 'btn-1', label: '1️⃣ 🛒 Pesan Bolu Sekarang', payload: '1' },
      { id: 'btn-maps', label: '🗺️ Buka Google Maps', payload: 'maps' },
      { id: 'btn-0', label: '🔙 Kembali ke Menu Utama', payload: '0' },
    ],
  };

  return {
    session,
    replyText,
    orderToCreate: null,
    shouldReply: true,
    replyMessage,
  };
}

/**
 * 3. Tampilkan Katalog & Jenis Varian Bolu (Informasi dari SaaS Produk)
 */
export function showProductVariants(session: WhatsAppSession, products: Product[]): ProcessBotMessageResult {
  session.currentStep = 'MAIN_MENU';
  const activeProducts = (products || []).filter((p) => p.status === 'active');

  let content = '';
  if (activeProducts.length === 0) {
    content = 'Belum ada data varian bolu.';
  } else {
    content = activeProducts
      .map((p, index) => {
        const description = p.description || 'Bolu pisang pilihan istimewa PUSAKA dengan tekstur moist & wangi harum alami.';
        const spec = p.sizeSpec ? ` (${p.sizeSpec})` : '';
        const shelf = p.shelfLifeDays ? `\n   ⏳ Daya Tahan: ±${p.shelfLifeDays} hari (suhu ruang)` : '';
        return (
          `${index + 1}. 🍰 *${p.name}*${spec}\n` +
          `   📝 ${description}\n` +
          `   💰 *${formatRupiah(p.sellingPrice)}*` +
          shelf
        );
      })
      .join('\n\n');
  }

  const replyText =
    `🍰 *JENIS VARIAN BOLU PUSAKA*\n\n` +
    content +
    `\n\n💡 *Mode Hybrid:* Tap tombol *Pesan Bolu Sekarang* di bawah, atau balas angka *1* untuk mulai memesan.\n` +
    `_Ketik *0* untuk kembali ke Menu Utama._`;

  const replyMessage: WhatsAppMessageItem = {
    id: `msg-${Date.now()}`,
    sender: 'bot',
    text: replyText,
    timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    header: '🍰 Varian Bolu PUSAKA',
    footer: 'Bahan Alami Pilihan & Fresh Baked',
    buttons: [
      { id: 'btn-1', label: '1️⃣ 🛒 Pesan Bolu Sekarang', payload: '1' },
      { id: 'btn-0', label: '🔙 Kembali ke Menu Utama', payload: '0' },
    ],
  };

  return {
    session,
    replyText,
    orderToCreate: null,
    shouldReply: true,
    replyMessage,
  };
}

/**
 * Helper: Pertanyaan Tanggal & Waktu Pengambilan
 */
export function askDeliveryDate(session: WhatsAppSession): ProcessBotMessageResult {
  const isPickup = session.deliveryType === 'PICKUP';
  const replyText = isPickup
    ? `🏪 *Jadwal Pengambilan di Toko*\n\n` +
      `Kapan perkiraan pesanan akan diambil di toko (Jl. Rancabolang Indah II no 15)?\n\n` +
      `💡 *Mode Hybrid:* Tap tombol jadwal instan di bawah, atau ketik waktu yang Anda inginkan (contoh: *Hari ini jam 15.00* atau *Besok pagi jam 09.00*).\n\n` +
      `Ketik *0* untuk kembali ke Menu Utama.`
    : `🚚 *Jadwal Pengiriman Kurir*\n\n` +
      `Kapan pesanan ingin diantarkan ke alamat tujuan?\n\n` +
      `💡 *Mode Hybrid:* Tap tombol jadwal instan di bawah, atau ketik waktu pengantaran Anda (contoh: *Hari ini jam 14.00* atau *Besok jam 10.00*).\n\n` +
      `Ketik *0* untuk kembali ke Menu Utama.`;

  return {
    session,
    replyText,
    orderToCreate: null,
    shouldReply: true,
    replyMessage: {
      id: `msg-${Date.now()}`,
      sender: 'bot',
      text: replyText,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      header: isPickup ? '🏪 Jadwal Pengambilan Toko' : '🚚 Jadwal Pengiriman Kurir',
      footer: 'Pilih Waktu Pengiriman/Pengambilan',
      buttons: [
        { id: 'time-1', label: '⚡ Hari ini secepatnya', payload: 'Hari ini secepatnya' },
        { id: 'time-2', label: '🌅 Besok Pagi (09.00 WIB)', payload: 'Besok pagi jam 09.00 WIB' },
        { id: 'time-3', label: '🌇 Besok Sore (15.00 WIB)', payload: 'Besok sore jam 15.00 WIB' },
        { id: 'btn-0', label: '🔙 Menu Utama', payload: '0' },
      ],
    },
  };
}

/**
 * Helper: Tampilkan Konfirmasi Pesanan
 */
export function showOrderConfirmation(session: WhatsAppSession): ProcessBotMessageResult {
  const product = session.selectedProduct;
  const qty = session.quantity || 1;
  const unitPrice = product ? product.sellingPrice : 0;
  const subtotal = unitPrice * qty;
  const shippingFee = Number(session.shippingFee || 0);
  const total = subtotal + shippingFee;

  const deliveryLabel = session.deliveryType === 'PICKUP' ? '🏪 Ambil di Toko/Pabrik' : '🚚 Diantar Kurir';

  const replyText =
    `📝 *KONFIRMASI PESANAN ANDA*\n\n` +
    `👤 *Nama:* ${session.customerName}\n` +
    `📱 *WhatsApp:* ${session.customerPhone}\n\n` +
    `🍰 *Produk:* ${product ? product.name : '-'}\n` +
    `📦 *Jumlah:* ${qty} box\n` +
    `💰 *Harga Satuan:* ${formatRupiah(unitPrice)}\n` +
    `💵 *Subtotal:* ${formatRupiah(subtotal)}\n` +
    (shippingFee > 0 ? `🛵 *Ongkir:* ${formatRupiah(shippingFee)}\n` : '') +
    `🏷️ *Total Tagihan:* *${formatRupiah(total)}*\n\n` +
    `🚚 *Metode:* ${deliveryLabel}\n` +
    `📍 *Alamat/Tujuan:* ${session.customerAddress || session.deliveryAddress || '-'}\n` +
    `⏰ *Waktu:* ${session.deliveryDateText || 'Sesuai jam operasional'}\n\n` +
    `Apakah data pesanan di atas sudah benar?\n\n` +
    `💡 *Mode Hybrid:* Tap tombol konfirmasi di bawah atau balas *1* (YA) / *2* (BATAL).`;

  const replyMessage: WhatsAppMessageItem = {
    id: `msg-${Date.now()}`,
    sender: 'bot',
    text: replyText,
    timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    header: '📝 Konfirmasi Pesanan',
    footer: 'Pesanan akan langsung tercatat di sistem kasir',
    buttons: [
      { id: 'btn-conf-1', label: '✅ 1. Ya, Konfirmasi Pesanan', payload: '1' },
      { id: 'btn-conf-2', label: '❌ 2. Batalkan Pesanan', payload: '2' },
    ],
  };

  return {
    session,
    replyText,
    orderToCreate: null,
    shouldReply: true,
    replyMessage,
  };
}

/**
 * Helper: Bangun Objek Order PUSAKA yang Sesuai dengan Schema POS & Backend
 */
export function buildWhatsAppOrder(session: WhatsAppSession): Omit<Order, 'id' | 'invoiceNumber' | 'createdAt'> {
  const product = session.selectedProduct!;
  const qty = session.quantity || 1;
  const unitPrice = Number(product.sellingPrice);
  const subtotal = unitPrice * qty;
  const shippingFee = Number(session.shippingFee || 0);
  const totalAmount = subtotal + shippingFee;

  return {
    date: new Date().toISOString().slice(0, 10),
    customerName: session.customerName || 'Konsumen WhatsApp',
    customerPhone: session.customerPhone,
    customerAddress: session.customerAddress || session.deliveryAddress || '-',
    source: 'WHATSAPP',
    items: [
      {
        productId: product.id,
        productName: product.name,
        sku: product.sku || '',
        qty,
        unitPrice,
        hppSnapshot: product.baseHpp || 0,
        subtotal,
      },
    ],
    subtotal,
    discountType: 'NOMINAL',
    discountValue: 0,
    discountAmount: 0,
    shippingFee,
    totalAmount,
    totalHpp: (product.baseHpp || 0) * qty,
    grossProfit: totalAmount - (product.baseHpp || 0) * qty,
    paymentStatus: 'BELUM_BAYAR',
    paidAmount: 0,
    paymentMethod: 'TRANSFER_BCA',
    fulfillmentStatus: 'MENUNGGU',
    orderStatus: 'PENDING',
    deliveryType: session.deliveryType || 'DELIVERY',
    deliveryDate: session.deliveryDate || new Date().toISOString().slice(0, 10),
    deliveryTime: session.deliveryDateText || '11:00',
    notes: `[Order Otomatis WhatsApp] ${session.deliveryDateText ? `Jadwal: ${session.deliveryDateText} | ` : ''}${session.customerAddress || ''}`,
    cashierName: 'WhatsApp Bot (Auto)',
  };
}

/**
 * ============================================================================
 * processBotMessage: 100% Deterministic State Machine (Zero AI)
 * ============================================================================
 */
export function processBotMessage(
  session: WhatsAppSession,
  message: string,
  buttonPayload: string | null,
  products: Product[],
  businessProfile: BusinessProfile
): ProcessBotMessageResult {
  const activeProducts = (products || []).filter((p) => p.status === 'active');
  let rawInput = String(buttonPayload || message || '')
    .trim()
    .toLowerCase();

  // Normalize interactive button payloads so tap and text behave identically
  if (rawInput === 'btn-1') rawInput = '1';
  if (rawInput === 'btn-2') rawInput = '2';
  if (rawInput === 'btn-3') rawInput = '3';
  if (rawInput === 'btn-4') rawInput = '4';
  if (rawInput === 'btn-0' || rawInput === 'btn-back-0') rawInput = '0';
  if (rawInput.startsWith('qty-')) rawInput = rawInput.replace('qty-', '');
  if (rawInput.startsWith('del-')) rawInput = rawInput.replace('del-', '');
  if (rawInput === 'btn-conf-1') rawInput = '1';
  if (rawInput === 'btn-conf-2') rawInput = '2';

  const input = rawInput;

  // ==========================================
  // 1. ADMIN SEDANG MENANGANI (HUMAN HANDOFF)
  // ==========================================
  if (session.isHumanHandled) {
    // Check if user specifically types 0 or menu to return to bot
    if (input === '0' || input === 'menu' || input === 'kembali' || input === 'menu utama') {
      session.isHumanHandled = false;
      session.currentStep = 'MAIN_MENU';
      clearOrderSession(session);
      return showMainMenu(session, businessProfile);
    }

    return {
      session,
      replyText: null,
      orderToCreate: null,
      shouldReply: false,
    };
  }

  // ==========================================
  // 2. GLOBAL COMMAND: KEMBALI KE MENU UTAMA
  // ==========================================
  if (input === 'menu' || input === '0' || input === 'kembali' || input === 'menu utama' || input === 'home') {
    session.currentStep = 'MAIN_MENU';
    clearOrderSession(session);
    return showMainMenu(session, businessProfile);
  }

  // ==========================================
  // 3. STATE: MAIN_MENU
  // ==========================================
  if (session.currentStep === 'MAIN_MENU' || !session.currentStep) {
    if (input === '1' || input === 'pesan bolu' || input === 'pesan' || input === 'beli' || input === 'order' || input === 'menu_order' || input === 'menu_1_pesan') {
      return showOrderProducts(session, activeProducts);
    }

    if (
      input === '2' ||
      input === 'lokasi' ||
      input === 'lokasi toko' ||
      input === 'lokasi toko/pabrik' ||
      input === 'alamat' ||
      input === 'maps' ||
      input === 'menu_2_lokasi'
    ) {
      return showBusinessLocation(session, businessProfile);
    }

    if (
      input === '3' ||
      input === 'varian' ||
      input === 'jenis varian' ||
      input === 'jenis varian bolu' ||
      input === 'katalog' ||
      input === 'menu_3_varian'
    ) {
      return showProductVariants(session, activeProducts);
    }

    if (
      input === '4' ||
      input === 'admin' ||
      input === 'chat admin' ||
      input === 'cs' ||
      input === 'hubungi admin' ||
      input === 'menu_4_admin' ||
      input === 'wa_admin_link' ||
      input === 'btn-wa-link'
    ) {
      session.isHumanHandled = true;
      session.currentStep = 'HUMAN_HANDOFF';

      // Sesuai mandat: pada menu WhatsApp apabila konsumen memilih no 4 gunakan no admin : 081297767814, selain itu tidak ada
      const adminRawPhone = '081297767814';
      const adminPhone = normalizePhoneNumber(adminRawPhone);
      const directWaLink = `https://wa.me/${adminPhone}?text=${encodeURIComponent(`Halo Admin ${businessProfile.name} (Lilis Mulyani), saya ${session.customerName || 'Pelanggan'} ingin bertanya langsung.`)}`;

      const replyText =
        `👨‍💼 *CHAT DENGAN ADMIN (Lilis Mulyani)*\n\n` +
        `Baik Kak ${session.customerName || ''}, percakapan ini dialihkan langsung ke Admin *${businessProfile.name}* (tanpa bot).\n\n` +
        `📱 *Nomor WhatsApp Admin:* 081297767814\n\n` +
        `💡 *Mode Hybrid:* Anda bisa langsung menuliskan pesan di sini, tap tombol chat admin di bawah, atau tap kembali ke menu otomatis.\n\n` +
        `👉 Link WA: ${directWaLink}\n\n` +
        `_Ketik *0* kapan saja jika ingin kembali ke menu otomatis._`;

      const replyMessage: WhatsAppMessageItem = {
        id: `msg-${Date.now()}`,
        sender: 'bot',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        header: `👨‍💼 Handoff Admin (081297767814)`,
        footer: 'Admin: Lilis Mulyani',
        buttons: [
          { id: 'btn-wa-link', label: '💬 Buka Chat WA Admin', payload: 'wa_admin_link' },
          { id: 'btn-0', label: '🔙 Kembali ke Menu Otomatis', payload: '0' },
        ],
      };

      return {
        session,
        replyText,
        orderToCreate: null,
        shouldReply: true,
        replyMessage,
      };
    }

    return showMainMenu(session, businessProfile);
  }

  // ==========================================
  // 4. STATE: ORDER_SELECT_PRODUCT (Pilih Produk)
  // ==========================================
  if (session.currentStep === 'ORDER_SELECT_PRODUCT' || session.currentStep === 'SELECTING_PRODUCT') {
    let productIndex = -1;

    // Check payload format: PRODUCT_<ID> or SELECT_PROD_<ID>
    if (buttonPayload && (buttonPayload.startsWith('PRODUCT_') || buttonPayload.startsWith('SELECT_PROD_'))) {
      const prodId = buttonPayload.replace('PRODUCT_', '').replace('SELECT_PROD_', '');
      productIndex = activeProducts.findIndex((p) => p.id === prodId);
    } else {
      // Check numeric index: 1, 2, 3...
      const parsedNumber = parseInt(input, 10);
      if (!Number.isNaN(parsedNumber) && parsedNumber >= 1 && parsedNumber <= activeProducts.length) {
        productIndex = parsedNumber - 1;
      } else {
        // Match by product name substring
        productIndex = activeProducts.findIndex((p) => input.includes(p.name.toLowerCase()) || p.name.toLowerCase().includes(input));
      }
    }

    if (productIndex < 0 || !activeProducts[productIndex]) {
      const replyText =
        `Pilihan produk tidak ditemukan.\n\n` +
        buildProductOrderList(activeProducts) +
        `\n\nSilakan balas *nomor produk* (1-${activeProducts.length}) atau ketik *0* untuk kembali ke Menu Utama.`;

      return {
        session,
        replyText,
        orderToCreate: null,
        shouldReply: true,
        replyMessage: {
          id: `msg-${Date.now()}`,
          sender: 'bot',
          text: replyText,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        },
      };
    }

    const product = activeProducts[productIndex];
    session.selectedProduct = {
      id: product.id,
      name: product.name,
      sku: product.sku,
      sellingPrice: product.sellingPrice,
      baseHpp: product.baseHpp || 0,
      stockFinishedGoods: product.stockFinishedGoods,
    };
    session.cartItem = {
      productId: product.id,
      productName: product.name,
      unitPrice: product.sellingPrice,
      qty: 1,
      hppSnapshot: product.baseHpp || 0,
    };
    session.currentStep = 'ORDER_QUANTITY';

    const stockMsg = typeof product.stockFinishedGoods === 'number' ? `\n📦 Stok Siap Jual: *${product.stockFinishedGoods} box*` : '';

    const replyText =
      `🍰 *${product.name}*\n` +
      `💰 Harga: *${formatRupiah(product.sellingPrice)}* / box${stockMsg}\n\n` +
      `Berapa box yang ingin dipesan?\n\n` +
      `💡 *Mode Hybrid:* Tap tombol jumlah instan di bawah, atau ketik langsung angka jumlah box (contoh: *1*, *2*, *5*, dst).\n\n` +
      `0. Kembali ke Menu Utama`;

    const replyMessage: WhatsAppMessageItem = {
      id: `msg-${Date.now()}`,
      sender: 'bot',
      text: replyText,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      header: `🍰 ${product.name}`,
      footer: 'Pilih Jumlah Box',
      buttons: [
        { id: 'qty-1', label: '1️⃣ 1 Box', payload: '1' },
        { id: 'qty-2', label: '2️⃣ 2 Box', payload: '2' },
        { id: 'qty-3', label: '3️⃣ 3 Box', payload: '3' },
        { id: 'qty-5', label: '5️⃣ 5 Box', payload: '5' },
        { id: 'btn-0', label: '🔙 Menu Utama', payload: '0' },
      ],
    };

    return {
      session,
      replyText,
      orderToCreate: null,
      shouldReply: true,
      replyMessage,
    };
  }

  // ==========================================
  // 5. STATE: ORDER_QUANTITY (Input Jumlah Box)
  // ==========================================
  if (session.currentStep === 'ORDER_QUANTITY' || session.currentStep === 'INPUT_QTY') {
    let cleanInput = input.replace('qty_', '');
    const qty = parseInt(cleanInput, 10);

    if (Number.isNaN(qty) || !Number.isInteger(qty) || qty < 1 || qty > 200) {
      const replyText =
        `Jumlah belum benar.\n\n` +
        `Silakan masukkan jumlah berupa angka yang valid (1 - 200).\n` +
        `Contoh: *2*\n\n` +
        `Ketik *0* untuk kembali ke Menu Utama.`;

      return {
        session,
        replyText,
        orderToCreate: null,
        shouldReply: true,
        replyMessage: {
          id: `msg-${Date.now()}`,
          sender: 'bot',
          text: replyText,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        },
      };
    }

    session.quantity = qty;
    if (session.cartItem) {
      session.cartItem.qty = qty;
    }

    const product = session.selectedProduct;
    if (product && typeof product.stockFinishedGoods === 'number' && product.stockFinishedGoods < qty) {
      const replyText =
        `⚠️ Stok siap jual *${product.name}* saat ini tersedia *${product.stockFinishedGoods} box*.\n\n` +
        `Silakan masukkan jumlah lain (maksimal ${product.stockFinishedGoods}), atau ketik *0* untuk kembali ke Menu Utama.`;

      return {
        session,
        replyText,
        orderToCreate: null,
        shouldReply: true,
        replyMessage: {
          id: `msg-${Date.now()}`,
          sender: 'bot',
          text: replyText,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        },
      };
    }

    session.currentStep = 'ORDER_FULFILLMENT';

    const subtotal = product ? product.sellingPrice * qty : 0;

    const replyText =
      `📦 *Rincian Pesanan:*\n` +
      `• ${product ? product.name : 'Bolu'} (${qty} box)\n` +
      `• Subtotal: *${formatRupiah(subtotal)}*\n\n` +
      `Bagaimana pesanan ingin diterima?\n\n` +
      `1. 🚚 *Diantar Kurir (Delivery)*\n` +
      `2. 🏪 *Ambil Sendiri di Toko/Pabrik (Pickup)*\n\n` +
      `💡 *Mode Hybrid:* Tap pilihan di bawah atau balas dengan angka *1* / *2*.\n` +
      `_Ketik *0* untuk kembali ke Menu Utama._`;

    const replyMessage: WhatsAppMessageItem = {
      id: `msg-${Date.now()}`,
      sender: 'bot',
      text: replyText,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      header: '🚚 Metode Pengiriman',
      footer: 'Pilih Kurir atau Ambil Sendiri',
      buttons: [
        { id: 'del-1', label: '1️⃣ 🚚 Diantar Kurir', payload: '1' },
        { id: 'del-2', label: '2️⃣ 🏪 Ambil di Toko', payload: '2' },
        { id: 'btn-0', label: '🔙 Menu Utama', payload: '0' },
      ],
    };

    return {
      session,
      replyText,
      orderToCreate: null,
      shouldReply: true,
      replyMessage,
    };
  }

  // ==========================================
  // 6. STATE: ORDER_FULFILLMENT (Delivery / Pickup)
  // ==========================================
  if (session.currentStep === 'ORDER_FULFILLMENT' || session.currentStep === 'SELECTING_DELIVERY') {
    if (input === '1' || input === 'diantar' || input === 'delivery' || input === 'antar' || input === 'kirim' || input === 'delivery_delivery') {
      session.deliveryType = 'DELIVERY';
      session.currentStep = 'ORDER_ADDRESS';

      const replyText =
        `🚚 *Pesanan Diantar Kurir*\n\n` +
        `Silakan kirimkan *alamat lengkap tujuan pengantaran* beserta patokan lokasi dan nomor kontak penerima:\n\n` +
        `_Contoh: Jl. Diponegoro No. 15, samping Bank BCA, Citarum, Bandung._`;

      return {
        session,
        replyText,
        orderToCreate: null,
        shouldReply: true,
        replyMessage: {
          id: `msg-${Date.now()}`,
          sender: 'bot',
          text: replyText,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        },
      };
    }

    if (
      input === '2' ||
      input === 'pickup' ||
      input === 'ambil' ||
      input === 'ambil sendiri' ||
      input === 'toko' ||
      input === 'delivery_pickup'
    ) {
      session.deliveryType = 'PICKUP';
      session.customerAddress = `${businessProfile.address}, ${businessProfile.city}`;
      session.deliveryAddress = session.customerAddress;
      session.shippingFee = 0;
      session.currentStep = 'ORDER_DATE';

      return askDeliveryDate(session);
    }

    const replyText =
      `Pilihan belum valid.\n\n` +
      `Silakan balas:\n` +
      `1. 🚚 *Diantar Kurir*\n` +
      `2. 🏪 *Ambil Sendiri di Toko*\n\n` +
      `Ketik *0* untuk kembali ke Menu Utama.`;

    return {
      session,
      replyText,
      orderToCreate: null,
      shouldReply: true,
      replyMessage: {
        id: `msg-${Date.now()}`,
        sender: 'bot',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      },
    };
  }

  // ==========================================
  // 7. STATE: ORDER_ADDRESS (Alamat Pengantaran)
  // ==========================================
  if (session.currentStep === 'ORDER_ADDRESS' || session.currentStep === 'INPUT_ADDRESS') {
    if (message.trim().length < 6) {
      const replyText =
        `Alamat terlihat terlalu singkat.\n\n` +
        `Mohon tuliskan alamat lengkap tujuan pengiriman Anda:\n` +
        `_Contoh: Jl. Dago No. 45, Coblong, Bandung (Penerima: Ibu Ratna)_`;

      return {
        session,
        replyText,
        orderToCreate: null,
        shouldReply: true,
        replyMessage: {
          id: `msg-${Date.now()}`,
          sender: 'bot',
          text: replyText,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        },
      };
    }

    session.customerAddress = message.trim();
    session.deliveryAddress = message.trim();
    session.shippingFee = 0;
    session.currentStep = 'ORDER_DATE';

    return askDeliveryDate(session);
  }

  // ==========================================
  // 8. STATE: ORDER_DATE (Tanggal & Waktu)
  // ==========================================
  if (session.currentStep === 'ORDER_DATE') {
    session.deliveryDateText = message.trim();
    session.deliveryDate = new Date().toISOString().slice(0, 10);
    session.currentStep = 'ORDER_CONFIRMATION';

    return showOrderConfirmation(session);
  }

  // ==========================================
  // 9. STATE: ORDER_CONFIRMATION (Konfirmasi Order)
  // ==========================================
  if (session.currentStep === 'ORDER_CONFIRMATION' || session.currentStep === 'CONFIRMING_ORDER') {
    if (
      input === 'ya' ||
      input === '1' ||
      input === 'konfirmasi' ||
      input === 'yes' ||
      input === 'ok' ||
      input === 'oke' ||
      input === 'confirm_order_yes'
    ) {
      if (!session.selectedProduct && !session.cartItem) {
        session.currentStep = 'MAIN_MENU';
        return showMainMenu(session, businessProfile);
      }

      const order = buildWhatsAppOrder(session);
      const itemName = session.selectedProduct?.name || session.cartItem?.productName || 'Bolu';
      const itemPrice = session.selectedProduct?.sellingPrice || session.cartItem?.unitPrice || 0;
      const qty = session.quantity || 1;
      const subtotal = itemPrice * qty;

      session.currentStep = 'MAIN_MENU';
      clearOrderSession(session);

      const replyText =
        `✅ *PESANAN BERHASIL DITERIMA!*\n\n` +
        `Terima kasih Kak *${session.customerName || 'Pelanggan'}*.\n\n` +
        `🍰 *Rincian Pesanan:*\n` +
        `• ${itemName} (${qty} box)\n` +
        `• Total: *${formatRupiah(subtotal)}*\n` +
        `• Status: *Menunggu Konfirmasi Dapur & Kasir*\n\n` +
        `Pesanan Anda sudah masuk ke sistem kasir *${businessProfile.name}*.\n` +
        `Admin kami akan segera memproses pesanan Anda.\n\n` +
        `Ketik *0* jika ingin kembali ke Menu Utama.`;

      const replyMessage: WhatsAppMessageItem = {
        id: `msg-${Date.now()}`,
        sender: 'bot',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        header: '🎉 Pesanan Tercatat di SaaS',
        footer: 'Terima kasih atas pesanan Anda!',
        buttons: [{ id: 'btn-0', label: '🔙 Menu Utama', payload: '0' }],
      };

      return {
        session,
        replyText,
        orderToCreate: order,
        shouldReply: true,
        replyMessage,
      };
    }

    if (
      input === 'tidak' ||
      input === '2' ||
      input === 'batal' ||
      input === 'no' ||
      input === 'batalkan' ||
      input === 'confirm_order_cancel'
    ) {
      clearOrderSession(session);
      session.currentStep = 'MAIN_MENU';

      const replyText =
        `❌ *Pesanan Dibatalkan*\n\n` +
        `Pesanan Anda telah dibatalkan.\n\n` +
        `Ketik *0* untuk kembali ke Menu Utama kapan saja.`;

      const replyMessage: WhatsAppMessageItem = {
        id: `msg-${Date.now()}`,
        sender: 'bot',
        text: replyText,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        buttons: [{ id: 'btn-0', label: '🔙 Menu Utama', payload: '0' }],
      };

      return {
        session,
        replyText,
        orderToCreate: null,
        shouldReply: true,
        replyMessage,
      };
    }

    return showOrderConfirmation(session);
  }

  // Fallback to Main Menu
  return showMainMenu(session, businessProfile);
}

/**
 * Object wrapper for unified imports
 */
export const WhatsAppBotService = {
  normalizePhoneNumber,
  getMapsUrl,
  clearOrderSession,
  buildProductOrderList,
  showMainMenu,
  showOrderProducts,
  showBusinessLocation,
  showProductVariants,
  askDeliveryDate,
  showOrderConfirmation,
  buildWhatsAppOrder,
  processBotMessage,

  // Compatibility helper
  buildMainMenuMessage(profile: BusinessProfile): WhatsAppMessageItem {
    return showMainMenu({ id: 'dummy', customerPhone: '', customerName: '', currentStep: 'MAIN_MENU', isHumanHandled: false, lastMessageTime: '', messages: [] }, profile).replyMessage!;
  },

  processIncomingMessage(
    session: WhatsAppSession,
    inputText: string,
    payload: string | null,
    products: Product[],
    profile: BusinessProfile
  ) {
    const result = processBotMessage(session, inputText, payload, products, profile);
    return {
      session: result.session,
      replyMessage: result.replyMessage || {
        id: `msg-${Date.now()}`,
        sender: 'bot' as const,
        text: result.replyText || '',
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      },
      orderToCreate: result.orderToCreate || undefined,
    };
  },

  /**
   * Generates Complete Node.js / Express Webhook Backend Code for Fonnte / WhatsApp Cloud API
   */
  generateExpressWebhookCode(profile: BusinessProfile, appUrl: string): string {
    return `// =========================================================================
// PUSAKA BAKERY OS - WHATSAPP BOT WEBHOOK SERVER (100% MENU / ZERO AI)
// Terintegrasi langsung dengan SaaS REST API (/api/products, /api/business-profile, /api/orders)
// Mendukung: Fonnte API Gateway (Numerik 1-4 & Interaktif)
// =========================================================================

const express = require('express');
const axios = require('axios');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const PORT = process.env.PORT || 3000;
const SAAS_API_BASE = process.env.SAAS_API_BASE || '${appUrl || 'https://your-pusaka-saas.com'}';
const FONNTE_API_TOKEN = process.env.FONNTE_API_TOKEN || '${profile.whatsappGatewayApiKey || 'YOUR_FONNTE_TOKEN'}';

// Map sesi per nomor WhatsApp (Atau simpan di DB / Redis)
const sessions = new Map();

// Endpoint Webhook Menerima Pesan Masuk WhatsApp dari Fonnte
app.post('/api/webhook/whatsapp', async (req, res) => {
  try {
    const sender = req.body.sender || req.body.from || req.body.phone;
    const message = req.body.message || req.body.text || '';
    const buttonPayload = req.body.button_postback || req.body.payload || null;

    if (!sender) {
      return res.status(200).json({ status: 'ignored_no_sender' });
    }

    // 1. Ambil Session atau Inisialisasi Baru
    let session = sessions.get(sender) || {
      id: 'sess-' + sender,
      customerPhone: sender,
      customerName: req.body.name || 'Pelanggan',
      currentStep: 'MAIN_MENU',
      isHumanHandled: false
    };

    // 2. Jika Sedang Ditangani Admin Manusia -> Bot Stop Menjawab
    if (session.isHumanHandled) {
      const cleanText = String(buttonPayload || message || '').trim().toLowerCase();
      if (cleanText === '0' || cleanText === 'menu') {
        session.isHumanHandled = false;
        session.currentStep = 'MAIN_MENU';
      } else {
        sessions.set(sender, session);
        return res.status(200).json({
          status: 'human_handled',
          message: 'Percakapan sedang ditangani langsung oleh Admin'
        });
      }
    }

    // 3. Ambil Data Real-time dari SaaS API PUSAKA
    const [productsRes, profileRes] = await Promise.all([
      axios.get(\`\${SAAS_API_BASE}/api/products\`),
      axios.get(\`\${SAAS_API_BASE}/api/business-profile\`)
    ]);

    const activeProducts = (productsRes.data || []).filter(p => p.status === 'active');
    const businessProfile = profileRes.data || {};

    // 4. Proses Mesin Status 4 Menu (100% Deterministic State Machine)
    const result = processBotMessage(
      session,
      message,
      buttonPayload,
      activeProducts,
      businessProfile
    );

    // Simpan status session terbaru
    sessions.set(sender, result.session);

    // 5. Jika Order Dikonfirmasi -> Otomatis Buat Pesanan di SaaS API
    let createdOrder = null;
    if (result.orderToCreate) {
      const orderRes = await axios.post(\`\${SAAS_API_BASE}/api/orders\`, result.orderToCreate);
      createdOrder = orderRes.data;
      console.log(\`✅ Order baru dibuat: \${createdOrder?.invoiceNumber || 'INV-WHATSAPP'}\`);
    }

    // 6. Kirim Balasan ke WhatsApp Konsumen via Fonnte Gateway
    if (result.shouldReply !== false && result.replyText && FONNTE_API_TOKEN && FONNTE_API_TOKEN !== 'YOUR_FONNTE_TOKEN') {
      await axios.post(
        'https://api.fonnte.com/send',
        {
          target: sender,
          message: result.replyText,
          countryCode: '62'
        },
        {
          headers: {
            Authorization: FONNTE_API_TOKEN
          }
        }
      );
    }

    return res.status(200).json({
      status: 'success',
      reply: result.replyText,
      order: createdOrder
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(\`PUSAKA WhatsApp Webhook running on port \${PORT}\`);
});
`;
  },
};
