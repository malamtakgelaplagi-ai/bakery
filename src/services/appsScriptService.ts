import {
  Order,
  Ingredient,
  Recipe,
  Product,
  Customer,
  WasteRecord,
  ProductionRun,
  BusinessProfile,
  Supplier,
  Purchase,
  Expense,
} from '../types';

export interface AppsScriptStatePayload {
  businessProfile?: BusinessProfile;
  ingredients: Ingredient[];
  recipes?: Recipe[];
  products: Product[];
  orders: Order[];
  productions: ProductionRun[];
  customers?: Customer[];
  wasteRecords?: WasteRecord[];
  suppliers?: Supplier[];
  purchases?: Purchase[];
  expenses?: Expense[];
}

export interface AppsScriptConfig {
  webAppUrl: string;
  autoSyncOrders: boolean;
  lastSyncedAt?: string;
  spreadsheetTitle?: string;
  spreadsheetUrl?: string;
}

const STORAGE_KEY_APPSSCRIPT_CONFIG = 'pusaka_appscript_config';

export const getAppsScriptConfig = (): AppsScriptConfig => {
  if (typeof window === 'undefined') return { webAppUrl: '', autoSyncOrders: true };
  try {
    const raw = localStorage.getItem(STORAGE_KEY_APPSSCRIPT_CONFIG);
    if (!raw) return { webAppUrl: '', autoSyncOrders: true };
    return JSON.parse(raw);
  } catch {
    return { webAppUrl: '', autoSyncOrders: true };
  }
};

export const saveAppsScriptConfig = (config: Partial<AppsScriptConfig>): AppsScriptConfig => {
  const current = getAppsScriptConfig();
  const updated = { ...current, ...config };
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY_APPSSCRIPT_CONFIG, JSON.stringify(updated));
  }
  return updated;
};

/**
 * Send full state synchronization to Google Apps Script Web App
 */
export async function syncAllToAppsScript(
  webAppUrl: string,
  state: AppsScriptStatePayload
): Promise<{ success: boolean; message: string; spreadsheetUrl?: string }> {
  if (!webAppUrl || !webAppUrl.startsWith('https://script.google.com/macros/s/')) {
    throw new Error('URL Web App Google Apps Script tidak valid. Format harus: https://script.google.com/macros/s/.../exec');
  }

  try {
    const payload = {
      action: 'syncAll',
      timestamp: new Date().toISOString(),
      data: state,
    };

    const response = await fetch(webAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Use text/plain to prevent CORS preflight issues with GAS
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    if (result && result.status === 'success') {
      return {
        success: true,
        message: result.message || 'Data berhasil disinkronkan ke Google Sheets!',
        spreadsheetUrl: result.spreadsheetUrl,
      };
    } else {
      throw new Error(result?.message || 'Gagal sinkronisasi data ke Apps Script.');
    }
  } catch (error: any) {
    console.error('Apps Script Sync Error:', error);
    throw new Error(error.message || 'Koneksi ke Google Apps Script gagal. Periksa URL Web App dan izin deployment (Anyone).');
  }
}

/**
 * Read / pull all data from Google Apps Script Web App
 */
export async function fetchAllFromAppsScript(
  webAppUrl: string
): Promise<{ success: boolean; data?: any; message: string; spreadsheetUrl?: string }> {
  if (!webAppUrl || !webAppUrl.startsWith('https://script.google.com/macros/s/')) {
    throw new Error('URL Web App Google Apps Script tidak valid.');
  }

  try {
    const url = new URL(webAppUrl);
    url.searchParams.set('action', 'getAll');
    url.searchParams.set('t', Date.now().toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
    });

    const result = await response.json();
    if (result && result.status === 'success') {
      return {
        success: true,
        data: result.data,
        message: 'Data berhasil dimuat dari Google Sheets!',
        spreadsheetUrl: result.spreadsheetUrl,
      };
    } else {
      throw new Error(result?.message || 'Gagal membaca data dari Apps Script.');
    }
  } catch (error: any) {
    console.error('Apps Script Fetch Error:', error);
    throw new Error(error.message || 'Gagal membaca data dari Google Sheets. Pastikan Web App disetel "Anyone".');
  }
}

/**
 * Test connectivity with Apps Script Web App
 */
export async function testAppsScriptConnection(
  webAppUrl: string
): Promise<{ success: boolean; message: string; spreadsheetUrl?: string; spreadsheetTitle?: string }> {
  if (!webAppUrl || !webAppUrl.startsWith('https://script.google.com/macros/s/')) {
    throw new Error('URL Web App tidak valid. Format: https://script.google.com/macros/s/.../exec');
  }

  try {
    const url = new URL(webAppUrl);
    url.searchParams.set('action', 'ping');
    url.searchParams.set('t', Date.now().toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
    });

    const result = await response.json();
    if (result && (result.status === 'success' || result.status === 'ok')) {
      return {
        success: true,
        message: result.message || 'Koneksi ke Google Sheets berhasil terhubung!',
        spreadsheetUrl: result.spreadsheetUrl,
        spreadsheetTitle: result.spreadsheetTitle,
      };
    } else {
      throw new Error(result?.message || 'Respon dari Apps Script tidak dikenali.');
    }
  } catch (error: any) {
    console.error('Apps Script Ping Error:', error);
    throw new Error(error.message || 'Gagal terhubung ke Apps Script. Pastikan Web App di-deploy dengan akses "Anyone".');
  }
}

/**
 * Append a single order to Google Apps Script Web App
 */
export async function appendOrderToAppsScript(
  webAppUrl: string,
  order: Order
): Promise<{ success: boolean; message: string }> {
  if (!webAppUrl) return { success: false, message: 'URL belum dikonfigurasi' };

  try {
    const payload = {
      action: 'addOrder',
      order: {
        ...order,
        discountAmount: Number(order.discountAmount) || 0,
        shippingFee: Number(order.shippingFee) || 0,
        subtotal: Number(order.subtotal) || (order.items || []).reduce((acc, i) => acc + (i.subtotal || 0), 0),
        totalAmount: Number(order.totalAmount) || 0,
        paidAmount: Number(order.paidAmount) || 0,
        fulfillmentStatus: order.fulfillmentStatus || order.orderStatus || 'MENUNGGU',
        orderStatus: order.orderStatus || 'PENDING',
      },
    };

    const response = await fetch(webAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    return {
      success: result?.status === 'success',
      message: result?.message || 'Order berhasil dikirim ke Google Sheets',
    };
  } catch (error: any) {
    console.error('Failed to append order to Apps Script:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Update order status or payment status in Google Apps Script Web App
 */
export async function updateOrderStatusToAppsScript(
  webAppUrl: string,
  orderId: string,
  invoiceNumber: string,
  status: string,
  paymentStatus?: string,
  paidAmount?: number
): Promise<{ success: boolean; message: string }> {
  if (!webAppUrl) return { success: false, message: 'URL belum dikonfigurasi' };

  try {
    const payload = {
      action: 'updateOrderStatus',
      orderId,
      invoiceNumber,
      status,
      paymentStatus,
      paidAmount,
    };

    const response = await fetch(webAppUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    const result = await response.json();
    return {
      success: result?.status === 'success',
      message: result?.message || 'Status pesanan berhasil diperbarui di Google Sheets',
    };
  } catch (error: any) {
    console.error('Failed to update order status in Apps Script:', error);
    return { success: false, message: error.message };
  }
}

/**
 * The standard, ready-to-use Google Apps Script Code that the user can copy into their Google Sheets
 */
export const APPS_SCRIPT_TEMPLATE_CODE = `/**
 * =========================================================================
 * PUSAKA Bakery OS - Google Apps Script Bridge
 * =========================================================================
 * Petunjuk Pasang (Hanya 1 Menit):
 * 1. Buat Spreadsheet baru di https://sheets.new (Beri judul: PUSAKA Bakery DB)
 * 2. Klik menu 'Extensions' (Ekstensi) > 'Apps Script'
 * 3. Hapus semua kode yang ada di editor, lalu TEMPEL seluruh kode ini.
 * 4. Klik tombol 'Deploy' (Terapkan) di kanan atas > 'New deployment' (Penerapan baru)
 * 5. Pilih jenis (ikon roda gigi): 'Web app' (Aplikasi web)
 * 6. Set 'Execute as' (Jalankan sebagai): 'Me' (Saya)
 * 7. Set 'Who has access' (Siapa yang memiliki akses): 'Anyone' (Siapa saja)  <-- PENTING!
 * 8. Klik 'Deploy' > Izinkan Akses (Authorize access) > Salin 'Web App URL'
 * 9. Tempelkan URL tersebut ke aplikasi PUSAKA Bakery. Selesai!
 * =========================================================================
 */

function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'ping';
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  if (action === 'ping') {
    return createJsonResponse({
      status: 'success',
      message: 'Koneksi ke Google Apps Script berhasil terhubung!',
      spreadsheetTitle: ss.getName(),
      spreadsheetUrl: ss.getUrl()
    });
  }
  
  if (action === 'getAll') {
    return createJsonResponse({
      status: 'success',
      spreadsheetTitle: ss.getName(),
      spreadsheetUrl: ss.getUrl(),
      data: getAllSheetData(ss)
    });
  }
  
  return createJsonResponse({ status: 'error', message: 'Action doGet tidak dikenal' });
}

function doPost(e) {
  try {
    var raw = e.postData.contents;
    var payload = JSON.parse(raw);
    var action = payload.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'syncAll') {
      syncAllDataToSheets(ss, payload.data);
      return createJsonResponse({
        status: 'success',
        message: 'Semua data PUSAKA Bakery berhasil disinkronkan ke Google Sheets!',
        spreadsheetUrl: ss.getUrl()
      });
    }

    if (action === 'addOrder') {
      appendSingleOrder(ss, payload.order);
      return createJsonResponse({
        status: 'success',
        message: 'Order berhasil ditambahkan ke Sheet Orders_Penjualan'
      });
    }

    if (action === 'updateOrderStatus') {
      updateOrderInSheet(ss, payload.orderId, payload.invoiceNumber, payload.status, payload.paymentStatus, payload.paidAmount);
      return createJsonResponse({
        status: 'success',
        message: 'Status pesanan berhasil diperbarui di Sheet Orders_Penjualan'
      });
    }

    return createJsonResponse({ status: 'error', message: 'Action doPost tidak dikenal' });
  } catch (err) {
    return createJsonResponse({
      status: 'error',
      message: 'Terjadi kesalahan di Apps Script: ' + err.toString()
    });
  }
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// -------------------------------------------------------------
// SINKRONISASI DATA KE SHEET
// -------------------------------------------------------------
function syncAllDataToSheets(ss, data) {
  if (!data) return;

  // 1. Sheet Orders
  if (data.orders && data.orders.length >= 0) {
    var sheet = getOrCreateSheet(ss, '🧾 Orders_Penjualan', [
      'Order ID', 'No Faktur', 'Tanggal Order', 'Nama Pelanggan', 'No HP/WA',
      'Tipe Layanan', 'Status Pembayaran', 'Metode Pembayaran', 'Status Pesanan',
      'Total Item (Qty)', 'Subtotal (Rp)', 'Diskon (Rp)', 'Ongkos Kirim (Rp)',
      'Total Akhir (Rp)', 'Jumlah Bayar (Rp)', 'Kembalian/Sisa (Rp)', 'Item Detail'
    ]);
    var rows = data.orders.map(function(o) {
      var itemSummary = (o.items || []).map(function(it) {
        return (it.productName || it.name || 'Item') + ' (x' + (it.quantity || it.qty || 1) + ')';
      }).join(', ');

      var disc = (typeof o.discountAmount !== 'undefined') ? Number(o.discountAmount) : ((typeof o.discount !== 'undefined') ? Number(o.discount) : 0);
      var ship = (typeof o.shippingFee !== 'undefined') ? Number(o.shippingFee) : ((typeof o.deliveryFee !== 'undefined') ? Number(o.deliveryFee) : 0);
      var sub = (typeof o.subtotal !== 'undefined') ? Number(o.subtotal) : (Number(o.totalAmount) || 0);
      var tot = (typeof o.totalAmount !== 'undefined') ? Number(o.totalAmount) : (sub - disc + ship);
      var paid = (typeof o.paidAmount !== 'undefined') ? Number(o.paidAmount) : ((typeof o.amountPaid !== 'undefined') ? Number(o.amountPaid) : tot);
      var statusPesanan = o.fulfillmentStatus || o.orderStatus || 'MENUNGGU';

      return [
        o.id || '',
        o.invoiceNumber || o.orderNumber || '',
        o.date || o.createdAt || '',
        o.customerName || (o.customer && o.customer.name) || 'Umum',
        o.customerPhone || (o.customer && o.customer.phone) || '',
        o.deliveryType || 'Dine-In / Toko',
        o.paymentStatus || 'LUNAS',
        o.paymentMethod || 'TUNAI',
        statusPesanan,
        (o.items || []).reduce(function(acc, i){ return acc + (i.quantity || i.qty || 0); }, 0),
        sub,
        disc,
        ship,
        tot,
        paid,
        Math.max(0, paid - tot),
        itemSummary
      ];
    });
    replaceSheetData(sheet, rows);
  }

  // 2. Sheet Bahan Baku Stok
  if (data.ingredients && data.ingredients.length >= 0) {
    var sheet = getOrCreateSheet(ss, '📦 Bahan_Baku_Stok', [
      'ID Bahan', 'Nama Bahan Baku', 'Kategori', 'Stok Saat Ini', 'Satuan',
      'Stok Minimum', 'Harga Beli (Rp)', 'Total Nilai Stok (Rp)', 'Status Stok', 'Update Terakhir'
    ]);
    var rows = data.ingredients.map(function(ing) {
      var totalValue = (ing.currentStock || 0) * (ing.pricePerUnit || 0);
      var status = (ing.currentStock <= (ing.minimumStock || 0)) ? 'MENIPIS / HABIS' : 'AMAN';
      return [
        ing.id || '',
        ing.name || '',
        ing.category || 'Lainnya',
        ing.currentStock || 0,
        ing.unit || 'gram',
        ing.minimumStock || 0,
        ing.pricePerUnit || 0,
        totalValue,
        status,
        new Date().toISOString()
      ];
    });
    replaceSheetData(sheet, rows);
  }

  // 3. Sheet Resep BOM
  if (data.recipes && data.recipes.length >= 0) {
    var sheet = getOrCreateSheet(ss, '🍳 Resep_BOM', [
      'ID Resep', 'Nama Resep / Produk', 'Target Hasil (Yield)', 'Satuan Hasil',
      'Total HPP Bahan (Rp)', 'HPP per Pcs (Rp)', 'Waktu Panggang (menit)', 'Bahan Baku Komposisi'
    ]);
    var rows = data.recipes.map(function(r) {
      var ingSummary = (r.ingredients || []).map(function(i) {
        return (i.name || i.ingredientName || 'Bahan') + ' (' + (i.amount || i.quantity || 0) + (i.unit || '') + ')';
      }).join(', ');
      return [
        r.id || '',
        r.name || '',
        r.yield || r.targetYield || 1,
        r.yieldUnit || 'pcs',
        r.totalCost || 0,
        r.costPerUnit || (r.totalCost ? (r.totalCost / (r.yield || 1)) : 0),
        r.bakeTime || 0,
        ingSummary
      ];
    });
    replaceSheetData(sheet, rows);
  }

  // 4. Sheet Produk Katalog
  if (data.products && data.products.length >= 0) {
    var sheet = getOrCreateSheet(ss, '🍞 Produk_Katalog', [
      'ID Produk', 'Nama Produk', 'Kategori', 'Harga Jual (Rp)', 'HPP Pokok (Rp)',
      'Margin Keuntungan (Rp)', 'Margin (%)', 'Stok Etalase', 'Barcode / SKU'
    ]);
    var rows = data.products.map(function(p) {
      var marginRp = (p.price || 0) - (p.cost || p.hpp || 0);
      var marginPct = (p.price && p.price > 0) ? Math.round((marginRp / p.price) * 100) : 0;
      return [
        p.id || '',
        p.name || '',
        p.category || 'Roti',
        p.price || 0,
        p.cost || p.hpp || 0,
        marginRp,
        marginPct + '%',
        p.currentStock || p.stock || 0,
        p.sku || p.barcode || ''
      ];
    });
    replaceSheetData(sheet, rows);
  }

  // 5. Sheet Pelanggan CRM
  if (data.customers && data.customers.length >= 0) {
    var sheet = getOrCreateSheet(ss, '👥 Pelanggan_CRM', [
      'ID Pelanggan', 'Nama', 'No WhatsApp / Telepon', 'Email', 'Alamat',
      'Total Transaksi', 'Total Nilai Belanja (Rp)', 'Kategori Member'
    ]);
    var rows = data.customers.map(function(c) {
      return [
        c.id || '',
        c.name || '',
        c.phone || '',
        c.email || '',
        c.address || '',
        c.totalOrders || 0,
        c.totalSpent || 0,
        c.tier || c.category || 'Reguler'
      ];
    });
    replaceSheetData(sheet, rows);
  }

  // 6. Sheet Produksi Batch
  if (data.productions && data.productions.length >= 0) {
    var sheet = getOrCreateSheet(ss, '👨‍🍳 Produksi_Batch', [
      'ID Batch', 'No Batch', 'Nama Produk / Resep', 'Rencana Target', 'Hasil Jadi Aktual',
      'Jumlah Gagal / Defect', 'Status Produksi', 'Tanggal Mulai', 'Catatan'
    ]);
    var rows = data.productions.map(function(pr) {
      return [
        pr.id || '',
        pr.batchNumber || '',
        pr.recipeName || pr.productName || '',
        pr.plannedQuantity || pr.targetYield || 0,
        pr.actualQuantity || pr.actualYield || 0,
        pr.defectQuantity || 0,
        pr.status || 'SELESAI',
        pr.createdAt || pr.startDate || '',
        pr.notes || ''
      ];
    });
    replaceSheetData(sheet, rows);
  }

  // 7. Sheet Waste Kerusakan
  if (data.wasteRecords && data.wasteRecords.length >= 0) {
    var sheet = getOrCreateSheet(ss, '🗑️ Waste_Kerusakan', [
      'ID Catatan', 'Tanggal', 'Tipe Item', 'Nama Item', 'Jumlah (Qty/Satuan)',
      'Nilai Kerugian (Rp)', 'Alasan Kerusakan', 'Penanggung Jawab'
    ]);
    var rows = data.wasteRecords.map(function(w) {
      return [
        w.id || '',
        w.date || w.createdAt || '',
        w.itemType || 'Produk Jadi',
        w.itemName || '',
        (w.quantity || 0) + ' ' + (w.unit || ''),
        w.estimatedLoss || w.totalLoss || 0,
        w.reason || 'Basi / Gosong',
        w.reportedBy || 'Staff'
      ];
    });
    replaceSheetData(sheet, rows);
  }
}

// -------------------------------------------------------------
// BACA DATA DARI SHEET (PULL)
// -------------------------------------------------------------
function getAllSheetData(ss) {
  var result = {
    ingredients: [],
    orders: [],
    products: [],
    recipes: [],
    customers: [],
    productions: [],
    wasteRecords: []
  };

  // Baca Bahan Baku
  var ingSheet = ss.getSheetByName('📦 Bahan_Baku_Stok');
  if (ingSheet && ingSheet.getLastRow() > 1) {
    var vals = ingSheet.getRange(2, 1, ingSheet.getLastRow() - 1, ingSheet.getLastColumn()).getValues();
    result.ingredients = vals.map(function(r) {
      return {
        id: String(r[0] || 'ing-' + Date.now()),
        name: String(r[1] || ''),
        category: String(r[2] || 'Lainnya'),
        currentStock: Number(r[3]) || 0,
        unit: String(r[4] || 'gram'),
        minimumStock: Number(r[5]) || 0,
        pricePerUnit: Number(r[6]) || 0,
      };
    }).filter(function(i){ return i.name !== ''; });
  }

  // Baca Produk Katalog
  var prodSheet = ss.getSheetByName('🍞 Produk_Katalog');
  if (prodSheet && prodSheet.getLastRow() > 1) {
    var vals = prodSheet.getRange(2, 1, prodSheet.getLastRow() - 1, prodSheet.getLastColumn()).getValues();
    result.products = vals.map(function(r) {
      return {
        id: String(r[0] || 'prod-' + Date.now()),
        name: String(r[1] || ''),
        category: String(r[2] || 'Roti'),
        price: Number(r[3]) || 0,
        cost: Number(r[4]) || 0,
        currentStock: Number(r[7]) || 0,
        sku: String(r[8] || '')
      };
    }).filter(function(p){ return p.name !== ''; });
  }

  return result;
}

// Append single order row
function appendSingleOrder(ss, order) {
  if (!order) return;
  var sheet = getOrCreateSheet(ss, '🧾 Orders_Penjualan', [
    'Order ID', 'No Faktur', 'Tanggal Order', 'Nama Pelanggan', 'No HP/WA',
    'Tipe Layanan', 'Status Pembayaran', 'Metode Pembayaran', 'Status Pesanan',
    'Total Item (Qty)', 'Subtotal (Rp)', 'Diskon (Rp)', 'Ongkos Kirim (Rp)',
    'Total Akhir (Rp)', 'Jumlah Bayar (Rp)', 'Kembalian/Sisa (Rp)', 'Item Detail'
  ]);

  var itemSummary = (order.items || []).map(function(it) {
    return (it.productName || it.name || 'Item') + ' (x' + (it.quantity || it.qty || 1) + ')';
  }).join(', ');

  var disc = (typeof order.discountAmount !== 'undefined') ? Number(order.discountAmount) : ((typeof order.discount !== 'undefined') ? Number(order.discount) : 0);
  var ship = (typeof order.shippingFee !== 'undefined') ? Number(order.shippingFee) : ((typeof order.deliveryFee !== 'undefined') ? Number(order.deliveryFee) : 0);
  var sub = (typeof order.subtotal !== 'undefined') ? Number(order.subtotal) : (Number(order.totalAmount) || 0);
  var tot = (typeof order.totalAmount !== 'undefined') ? Number(order.totalAmount) : (sub - disc + ship);
  var paid = (typeof order.paidAmount !== 'undefined') ? Number(order.paidAmount) : ((typeof order.amountPaid !== 'undefined') ? Number(order.amountPaid) : tot);
  var statusPesanan = order.fulfillmentStatus || order.orderStatus || 'MENUNGGU';

  var row = [
    order.id || '',
    order.invoiceNumber || order.orderNumber || '',
    order.date || order.createdAt || new Date().toISOString(),
    order.customerName || (order.customer && order.customer.name) || 'Umum',
    order.customerPhone || (order.customer && order.customer.phone) || '',
    order.deliveryType || 'Dine-In / Toko',
    order.paymentStatus || 'LUNAS',
    order.paymentMethod || 'TUNAI',
    statusPesanan,
    (order.items || []).reduce(function(acc, i){ return acc + (i.quantity || i.qty || 0); }, 0),
    sub,
    disc,
    ship,
    tot,
    paid,
    Math.max(0, paid - tot),
    itemSummary
  ];

  sheet.appendRow(row);
}

// Update existing order status in Sheet Orders_Penjualan
function updateOrderInSheet(ss, orderId, invoiceNumber, status, paymentStatus, paidAmount) {
  var sheet = ss.getSheetByName('🧾 Orders_Penjualan');
  if (!sheet) return;
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return;

  for (var i = 1; i < data.length; i++) {
    var rowOrderId = String(data[i][0] || '').trim();
    var rowInvoice = String(data[i][1] || '').trim();

    if ((orderId && rowOrderId === String(orderId).trim()) || (invoiceNumber && rowInvoice === String(invoiceNumber).trim())) {
      // Column 9 (index 8, 1-based index 9) is Status Pesanan
      if (status) {
        sheet.getRange(i + 1, 9).setValue(status);
      }
      // Column 7 (index 6, 1-based index 7) is Status Pembayaran
      if (paymentStatus) {
        sheet.getRange(i + 1, 7).setValue(paymentStatus);
      }
      // Column 15 (index 14, 1-based index 15) is Jumlah Bayar
      if (typeof paidAmount !== 'undefined' && paidAmount !== null && !isNaN(paidAmount)) {
        sheet.getRange(i + 1, 15).setValue(Number(paidAmount));
        var totalAkhir = Number(data[i][13]) || 0;
        sheet.getRange(i + 1, 16).setValue(Math.max(0, Number(paidAmount) - totalAkhir));
      }
      break;
    }
  }
}

// Helper: Get or Create Sheet with Header Styling
function getOrCreateSheet(ss, name, headers) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setBackground('#1e293b')
      .setFontColor('#f8fafc')
      .setFontWeight('bold');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

// Helper: Replace Sheet Data cleanly
function replaceSheetData(sheet, rows) {
  var lastRow = sheet.getLastRow();
  var lastCol = sheet.getLastColumn();
  if (lastRow > 1) {
    sheet.getRange(2, 1, lastRow - 1, lastCol).clearContent();
  }
  if (rows && rows.length > 0) {
    sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }
}
`;
