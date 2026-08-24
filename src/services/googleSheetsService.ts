import { getAccessToken } from './googleAuth';
import {
  Order,
  Ingredient,
  IngredientCategory,
  Recipe,
  Product,
  Customer,
  WasteRecord,
  ProductionRun,
  BusinessProfile,
  Supplier,
  Purchase,
  Expense,
  DeliveryType,
  PaymentMethod,
  PaymentStatus,
  FulfillmentStatus,
} from '../types';

export interface BakeryStateExport {
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

export interface BakeryStateImport {
  ingredients?: Ingredient[];
  orders?: Order[];
  productions?: ProductionRun[];
  products?: Product[];
  customers?: Customer[];
  wasteRecords?: WasteRecord[];
}

const SHEETS_API_BASE = 'https://sheets.googleapis.com/v4/spreadsheets';

export const SHEET_NAMES = {
  ORDERS: '🧾 Orders_Penjualan',
  INVENTORY: '📦 Bahan_Baku_Stok',
  RECIPES: '🍳 Resep_BOM',
  PRODUCTS: '🍞 Produk_Katalog',
  CUSTOMERS: '👥 Pelanggan_CRM',
  PRODUCTION: '👨‍🍳 Produksi_Batch',
  WASTE: '🗑️ Waste_Kerusakan',
  PURCHASES: '🛒 Pembelian_PO',
};

async function getAuthHeader(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Sesi Google Sheets telah berakhir. Silakan login kembali dengan Google.');
  }
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Creates a brand new structured Bakery database spreadsheet in the user's Google Drive.
 */
export async function createBakerySpreadsheet(
  title: string = 'PUSAKA BakeryOS - Cloud Database'
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  const headers = await getAuthHeader();

  const body = {
    properties: {
      title,
    },
    sheets: [
      {
        properties: {
          sheetId: 0,
          title: SHEET_NAMES.ORDERS,
          gridProperties: { rowCount: 1000, columnCount: 16 },
        },
      },
      {
        properties: {
          sheetId: 1,
          title: SHEET_NAMES.INVENTORY,
          gridProperties: { rowCount: 500, columnCount: 12 },
        },
      },
      {
        properties: {
          sheetId: 2,
          title: SHEET_NAMES.RECIPES,
          gridProperties: { rowCount: 500, columnCount: 12 },
        },
      },
      {
        properties: {
          sheetId: 3,
          title: SHEET_NAMES.PRODUCTS,
          gridProperties: { rowCount: 200, columnCount: 12 },
        },
      },
      {
        properties: {
          sheetId: 4,
          title: SHEET_NAMES.CUSTOMERS,
          gridProperties: { rowCount: 500, columnCount: 10 },
        },
      },
      {
        properties: {
          sheetId: 5,
          title: SHEET_NAMES.PRODUCTION,
          gridProperties: { rowCount: 500, columnCount: 12 },
        },
      },
      {
        properties: {
          sheetId: 6,
          title: SHEET_NAMES.WASTE,
          gridProperties: { rowCount: 300, columnCount: 10 },
        },
      },
      {
        properties: {
          sheetId: 7,
          title: SHEET_NAMES.PURCHASES,
          gridProperties: { rowCount: 500, columnCount: 10 },
        },
      },
    ],
  };

  const response = await fetch(SHEETS_API_BASE, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gagal membuat spreadsheet (${response.status})`);
  }

  const result = await response.json();
  return {
    spreadsheetId: result.spreadsheetId,
    spreadsheetUrl: result.spreadsheetUrl,
  };
}

/**
 * Validates access to an existing Google Spreadsheet and retrieves sheet meta
 */
export async function getSpreadsheetDetails(
  spreadsheetId: string
): Promise<{ title: string; sheetTitles: string[] }> {
  const headers = await getAuthHeader();
  const response = await fetch(`${SHEETS_API_BASE}/${spreadsheetId}`, {
    headers,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      err.error?.message || `Tidak dapat mengakses Spreadsheet ID ini. Pastikan izin akses tersedia.`
    );
  }

  const data = await response.json();
  const sheetTitles = (data.sheets || []).map((s: any) => s.properties.title);
  return {
    title: data.properties?.title || 'Spreadsheet Bakery',
    sheetTitles,
  };
}

/**
 * Ensures all required sheet tabs exist in the spreadsheet, creating any missing ones.
 */
export async function ensureSheetsExist(spreadsheetId: string): Promise<void> {
  const headers = await getAuthHeader();
  const response = await fetch(`${SHEETS_API_BASE}/${spreadsheetId}?fields=sheets.properties`, {
    headers,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gagal mengakses metadata spreadsheet (${response.status})`);
  }

  const data = await response.json();
  const existingTitles = new Set(
    (data.sheets || []).map((s: any) => s.properties?.title)
  );

  const requiredSheets = Object.values(SHEET_NAMES);
  const missing = requiredSheets.filter((title) => !existingTitles.has(title));

  if (missing.length > 0) {
    const addSheetRequests = missing.map((title) => ({
      addSheet: {
        properties: {
          title,
          gridProperties: { rowCount: 500, columnCount: 16 },
        },
      },
    }));

    const updateRes = await fetch(`${SHEETS_API_BASE}/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ requests: addSheetRequests }),
    });

    if (!updateRes.ok) {
      console.warn('Notice: Some sheet tabs could not be auto-created in batch.');
    }
  }
}

// -------------------------------------------------------------
// READ / IMPORT METHODS FROM GOOGLE SHEETS
// -------------------------------------------------------------

/**
 * Reads data from a specific range or sheet tab in Google Sheets
 */
export async function readSheetRange(
  spreadsheetId: string,
  range: string
): Promise<any[][]> {
  const headers = await getAuthHeader();
  const encodedRange = encodeURIComponent(range);
  const response = await fetch(
    `${SHEETS_API_BASE}/${spreadsheetId}/values/${encodedRange}?valueRenderOption=UNFORMATTED_VALUE`,
    {
      method: 'GET',
      headers,
    }
  );

  if (!response.ok) {
    // If sheet range or tab is not found or empty, return empty array
    return [];
  }

  const data = await response.json();
  return data.values || [];
}

const VALID_CATEGORIES: IngredientCategory[] = [
  'Bahan Utama',
  'Bahan Pengembang & Ragi',
  'Pemanis & Gula',
  'Perasa, Pewarna & Rempah',
  'Dairy & Lemak',
  'Kemasan & Packaging',
  'Topping & Isian',
  'Lainnya',
];

/**
 * Reads all core modules (Inventory, Orders, Production, Products, CRM) from Google Sheets
 */
export async function loadAllDataFromGoogleSheets(
  spreadsheetId: string,
  currentIngredients: Ingredient[] = [],
  currentProducts: Product[] = []
): Promise<BakeryStateImport> {
  const result: BakeryStateImport = {};

  try {
    // 1. Read Inventory / Bahan Baku
    const invRows = await readSheetRange(spreadsheetId, `'${SHEET_NAMES.INVENTORY}'!A2:K`);
    if (invRows && invRows.length > 0) {
      result.ingredients = invRows
        .filter((r) => r[1] && String(r[1]).trim() !== '')
        .map((r, idx) => {
          const sku = String(r[0] || `ING-${idx + 1}`);
          const name = String(r[1] || 'Bahan');
          const rawCat = String(r[2] || 'Bahan Utama');
          const category: IngredientCategory = VALID_CATEGORIES.includes(rawCat as any)
            ? (rawCat as IngredientCategory)
            : 'Bahan Utama';
          const stock = Number(r[3]) || 0;
          const recipeUnit = String(r[4] || 'g');
          const minStock = Number(r[5]) || 0;
          const costPerRecipeUnit = Number(r[6]) || 0;
          const buyUnit = String(r[7] || 'kg');
          const latestBuyPrice = Number(r[8]) || (costPerRecipeUnit * 1000);
          const defaultSupplierName = r[9] ? String(r[9]) : undefined;

          const existing = currentIngredients.find(
            (i) => i.sku === sku || i.name.toLowerCase() === name.toLowerCase()
          );

          return {
            id: existing ? existing.id : `ing-sheet-${idx + 1}`,
            sku,
            name,
            category,
            stockInRecipeUnit: stock,
            recipeUnit,
            minStockInRecipeUnit: minStock,
            costPerRecipeUnit,
            buyUnit,
            conversionFactor:
              existing?.conversionFactor ||
              (costPerRecipeUnit > 0 ? latestBuyPrice / costPerRecipeUnit : 1000),
            latestBuyPrice,
            defaultSupplierId: existing?.defaultSupplierId,
            defaultSupplierName: defaultSupplierName || existing?.defaultSupplierName,
            status: existing?.status || 'active',
            notes: existing?.notes || 'Disinkronkan dari Google Sheets',
            updatedAt: new Date().toISOString().split('T')[0],
          };
        });
    }
  } catch (e) {
    console.warn('Gagal membaca sheet Bahan Baku:', e);
  }

  try {
    // 2. Read Orders / Penjualan
    const orderRows = await readSheetRange(spreadsheetId, `'${SHEET_NAMES.ORDERS}'!A2:O`);
    if (orderRows && orderRows.length > 0) {
      result.orders = orderRows
        .filter((r) => r[0] && String(r[0]).trim() !== '')
        .map((r, idx) => {
          const invoiceNumber = String(r[0]);
          const date = String(r[1] || new Date().toISOString().split('T')[0]);
          const customerName = String(r[2] || 'Pelanggan Walk-in');
          const customerPhone = String(r[3] || '');
          const customerAddress = r[4] ? String(r[4]) : undefined;
          const itemsText = String(r[5] || '');
          const subtotal = Number(r[6]) || 0;
          const discountAmount = Number(r[7]) || 0;
          const shippingFee = Number(r[8]) || 0;
          const totalAmount = Number(r[9]) || (subtotal - discountAmount + shippingFee);
          const paymentStatus: PaymentStatus =
            r[10] === 'LUNAS' || r[10] === 'DP' || r[10] === 'BELUM_BAYAR' ? r[10] : 'LUNAS';
          const paymentMethod: PaymentMethod = (r[11] as any) || 'CASH';
          const fulfillmentStatus: FulfillmentStatus = (r[12] as any) || 'SELESAI';
          const cashierName = String(r[13] || 'Kasir');
          const notes = r[14] ? String(r[14]) : undefined;

          // Parse simple items from summary text e.g. "Bolu Pisang Original (2x), Bolu Keju (1x)"
          const parsedItems: any[] = [];
          if (itemsText) {
            const parts = itemsText.split(',');
            parts.forEach((p, pIdx) => {
              const match = p.match(/(.*?)\s*\((\d+)x\)/);
              if (match) {
                const pName = match[1].trim();
                const qty = parseInt(match[2], 10) || 1;
                parsedItems.push({
                  productId: `prod-sync-${pIdx}`,
                  productName: pName,
                  qty,
                  unitPrice: subtotal / (qty || 1),
                  hppSnapshot: 0,
                  subtotal: (subtotal / (qty || 1)) * qty,
                });
              } else if (p.trim()) {
                parsedItems.push({
                  productId: `prod-sync-${pIdx}`,
                  productName: p.trim(),
                  qty: 1,
                  unitPrice: subtotal,
                  hppSnapshot: 0,
                  subtotal,
                });
              }
            });
          }

          const deliveryType: DeliveryType = customerAddress && customerAddress !== '-' ? 'DELIVERY' : 'PICKUP';

          return {
            id: `ord-sheet-${invoiceNumber || idx + 1}`,
            invoiceNumber,
            date,
            source: 'WALK_IN' as const,
            customerName,
            customerPhone,
            customerAddress,
            deliveryType,
            items:
              parsedItems.length > 0
                ? parsedItems
                : [
                    {
                      productId: 'prod-gen',
                      productName: 'Produk Bakery',
                      qty: 1,
                      unitPrice: subtotal,
                      hppSnapshot: 0,
                      subtotal,
                    },
                  ],
            subtotal,
            discountAmount,
            shippingFee,
            totalAmount,
            paidAmount: paymentStatus === 'LUNAS' ? totalAmount : 0,
            paymentStatus,
            paymentMethod,
            fulfillmentStatus,
            cashierName,
            notes,
            createdAt: `${date}T10:00:00.000Z`,
            totalHpp: Math.round(subtotal * 0.4),
            grossProfit: Math.round(subtotal * 0.6),
          };
        });
    }
  } catch (e) {
    console.warn('Gagal membaca sheet Orders:', e);
  }

  try {
    // 3. Read Production Batch
    const prodRows = await readSheetRange(spreadsheetId, `'${SHEET_NAMES.PRODUCTION}'!A2:I`);
    if (prodRows && prodRows.length > 0) {
      result.productions = prodRows
        .filter((r) => r[0] && String(r[0]).trim() !== '')
        .map((r, idx) => {
          const batchNumber = String(r[0]);
          const productName = String(r[1] || 'Bolu');
          const date = String(r[2] || new Date().toISOString().split('T')[0]);
          const targetQty = Number(r[3]) || 1;
          const actualYieldQty = Number(r[4]) || targetQty;
          const status = (r[5] || 'SELESAI') as any;
          const totalProductionCost = Number(r[6]) || 0;
          const operatorName = String(r[7] || 'Head Baker');
          const notes = r[8] ? String(r[8]) : undefined;

          const matchedProd = currentProducts.find(
            (p) => p.name.toLowerCase() === productName.toLowerCase()
          );

          return {
            id: `prodrun-sheet-${batchNumber || idx + 1}`,
            batchNumber,
            productId: matchedProd ? matchedProd.id : 'prod-1',
            productName,
            recipeId: matchedProd?.recipeId || 'rec-1',
            recipeVersionNumber: 'v1.0',
            date,
            targetQty,
            actualYieldQty,
            rejectedQty: 0,
            status,
            operatorName,
            notes,
            ingredients: [],
            packagingUsed: [],
            directCosts: [],
            totalProductionCost,
            unitProductionCost: targetQty > 0 ? totalProductionCost / targetQty : 0,
            isStockDeducted: true,
            isFinishedStockAdded: status === 'SELESAI',
            createdAt: `${date}T07:00:00.000Z`,
            timeline: [
              { status: 'DRAFT', timestamp: `${date}T07:00:00.000Z`, note: 'Batch direncanakan' },
              { status, timestamp: `${date}T10:00:00.000Z`, note: 'Diambil dari Google Sheets' },
            ],
          };
        });
    }
  } catch (e) {
    console.warn('Gagal membaca sheet Produksi:', e);
  }

  return result;
}

// -------------------------------------------------------------
// WRITE & BATCH SYNC METHODS
// -------------------------------------------------------------

/**
 * Full Sync / Export all local Bakery data into Google Sheets
 */
export async function syncAllDataToGoogleSheets(
  spreadsheetId: string,
  data: BakeryStateExport
): Promise<void> {
  const headers = await getAuthHeader();

  // Ensure all sheet tabs exist before batch updating ranges
  await ensureSheetsExist(spreadsheetId);

  // 1. Orders Sheet
  const orderHeaders = [
    'No. Invoice',
    'Tanggal',
    'Nama Pelanggan',
    'No. WhatsApp',
    'Alamat Pengiriman',
    'Item Pesanan',
    'Subtotal (Rp)',
    'Diskon (Rp)',
    'Ongkir (Rp)',
    'Total Tagihan (Rp)',
    'Status Bayar',
    'Metode Bayar',
    'Status Pengiriman',
    'Kasir',
    'Catatan',
  ];
  const orderRows = (data.orders || []).map((o) => [
    o.invoiceNumber,
    o.date,
    o.customerName,
    o.customerPhone,
    o.customerAddress || '-',
    (o.items || []).map((it) => `${it.productName} (${it.qty}x)`).join(', '),
    o.subtotal,
    o.discountAmount,
    o.shippingFee,
    o.totalAmount,
    o.paymentStatus,
    o.paymentMethod,
    o.orderStatus || o.fulfillmentStatus || 'PENDING',
    o.cashierName || o.createdBy || 'Kasir',
    o.notes || '-',
  ]);

  // 2. Ingredients Sheet
  const ingredientHeaders = [
    'Kode / SKU',
    'Nama Bahan Baku',
    'Kategori',
    'Sisa Stok Resep',
    'Satuan Resep',
    'Stok Minimal',
    'Harga per Satuan Resep (Rp)',
    'Satuan Beli',
    'Harga Beli Terakhir (Rp)',
    'Supplier Default',
    'Status Stok',
  ];
  const ingredientRows = (data.ingredients || []).map((ing) => [
    ing.sku || ing.id,
    ing.name,
    ing.category,
    ing.stockInRecipeUnit,
    ing.recipeUnit,
    ing.minStockInRecipeUnit,
    ing.costPerRecipeUnit,
    ing.buyUnit,
    ing.latestBuyPrice,
    ing.defaultSupplierName || '-',
    ing.stockInRecipeUnit <= ing.minStockInRecipeUnit ? 'MENIPIS' : 'AMAN',
  ]);

  // 3. Recipes BOM Sheet
  const recipeHeaders = [
    'ID Resep',
    'Nama Resep Bolu',
    'Versi',
    'Yield (Loyang)',
    'Target Berat Adonan (g)',
    'Biaya Bahan (Rp)',
    'Biaya Kemasan (Rp)',
    'Biaya Energi & Tenaga (Rp)',
    'Total HPP per Pcs (Rp)',
    'Kategori',
  ];
  const recipeRows = (data.recipes || []).map((r) => {
    const vers = r.versions || [];
    const currVer =
      vers.find((v) => v.id === r.currentVersionId) ||
      vers[vers.length - 1];
    return [
      r.id,
      r.name,
      currVer ? currVer.versionNumber : 'v1.0',
      currVer ? currVer.yieldQty : 1,
      currVer ? currVer.targetBatterWeightGram : 0,
      currVer ? currVer.totalRawCost : 0,
      currVer ? currVer.totalPackagingCost : 0,
      currVer ? currVer.totalDirectCost : 0,
      currVer ? currVer.totalHppPerUnit : 0,
      r.category,
    ];
  });

  // 4. Products Sheet
  const productHeaders = [
    'ID Produk',
    'SKU',
    'Nama Menu Bolu',
    'Kategori',
    'HPP Pokok (Rp)',
    'Harga Jual (Rp)',
    'Margin (%)',
    'Stok Etalase (Pcs)',
    'Daya Simpan (Hari)',
  ];
  const productRows = (data.products || []).map((p) => {
    const margin = p.sellingPrice > 0 ? ((p.sellingPrice - p.baseHpp) / p.sellingPrice) * 100 : 0;
    return [
      p.id,
      p.sku,
      p.name,
      p.category,
      p.baseHpp,
      p.sellingPrice,
      `${margin.toFixed(1)}%`,
      p.stockFinishedGoods,
      p.shelfLifeDays,
    ];
  });

  // 5. Customers Sheet
  const customerHeaders = [
    'ID Pelanggan',
    'Nama Lengkap',
    'WhatsApp / HP',
    'Alamat',
    'Total Order',
    'Total Belanja (Rp)',
    'Label / Segmentasi',
    'Catatan',
  ];
  const customerRows = (data.customers || []).map((c) => [
    c.id,
    c.name,
    c.phone,
    c.address || '-',
    c.totalOrders,
    c.totalSpend || 0,
    (c.tags || []).join(', '),
    c.notes || '-',
  ]);

  // 6. Production Batch Sheet
  const productionHeaders = [
    'No. Batch',
    'Nama Produk',
    'Tanggal Produksi',
    'Rencana (Loyang)',
    'Hasil Bagus (Loyang)',
    'Status Tahapan',
    'Total HPP Batch (Rp)',
    'Baker / Operator',
    'Catatan Dapur',
  ];
  const productionRows = (data.productions || []).map((pb) => [
    pb.batchNumber,
    pb.productName,
    pb.date,
    pb.targetQty,
    pb.actualYieldQty || pb.targetQty,
    pb.status,
    pb.totalProductionCost,
    pb.operatorName || 'Head Baker',
    pb.notes || '-',
  ]);

  // 7. Waste Sheet
  const wasteHeaders = [
    'Tanggal',
    'Tipe Kerusakan',
    'Nama Item',
    'Jumlah',
    'Satuan',
    'Nilai Kerugian (Rp)',
    'Alasan',
    'Operator',
    'Keterangan',
  ];
  const wasteRows = (data.wasteRecords || []).map((w) => [
    w.date,
    w.type,
    w.itemName,
    w.quantity || w.qty || 1,
    w.unit,
    w.lostCost || w.estimatedLossRp || 0,
    w.reason,
    w.operatorName || w.loggedBy || 'Staff',
    w.notes || '-',
  ]);

  // 8. Purchases PO Sheet
  const purchaseHeaders = [
    'No. PO',
    'Tanggal',
    'Nama Supplier',
    'Total Nominal (Rp)',
    'Status Bayar',
    'Jumlah Item',
    'Catatan',
  ];
  const purchaseRows = (data.purchases || []).map((po) => [
    po.purchaseNumber,
    po.date,
    po.supplierName,
    po.totalAmount,
    po.paymentStatus,
    (po.items || []).length,
    po.notes || '-',
  ]);

  const payload = {
    valueInputOption: 'USER_ENTERED',
    data: [
      {
        range: `'${SHEET_NAMES.ORDERS}'!A1`,
        values: [orderHeaders, ...orderRows],
      },
      {
        range: `'${SHEET_NAMES.INVENTORY}'!A1`,
        values: [ingredientHeaders, ...ingredientRows],
      },
      {
        range: `'${SHEET_NAMES.RECIPES}'!A1`,
        values: [recipeHeaders, ...recipeRows],
      },
      {
        range: `'${SHEET_NAMES.PRODUCTS}'!A1`,
        values: [productHeaders, ...productRows],
      },
      {
        range: `'${SHEET_NAMES.CUSTOMERS}'!A1`,
        values: [customerHeaders, ...customerRows],
      },
      {
        range: `'${SHEET_NAMES.PRODUCTION}'!A1`,
        values: [productionHeaders, ...productionRows],
      },
      {
        range: `'${SHEET_NAMES.WASTE}'!A1`,
        values: [wasteHeaders, ...wasteRows],
      },
      {
        range: `'${SHEET_NAMES.PURCHASES}'!A1`,
        values: [purchaseHeaders, ...purchaseRows],
      },
    ],
  };

  const response = await fetch(`${SHEETS_API_BASE}/${spreadsheetId}/values:batchUpdate`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gagal menyinkronkan data ke Google Sheets.`);
  }
}

// -------------------------------------------------------------
// INCREMENTAL SINGLE-ROW APENDS
// -------------------------------------------------------------

/**
 * Appends a single newly created Order directly into the Orders Sheet
 */
export async function appendOrderRow(spreadsheetId: string, order: Order): Promise<void> {
  const headers = await getAuthHeader();
  const row = [
    order.invoiceNumber,
    order.date,
    order.customerName,
    order.customerPhone,
    order.customerAddress || '-',
    (order.items || []).map((it) => `${it.productName} (${it.qty}x)`).join(', '),
    order.subtotal,
    order.discountAmount,
    order.shippingFee,
    order.totalAmount,
    order.paymentStatus,
    order.paymentMethod,
    order.orderStatus || order.fulfillmentStatus || 'PROCESSED',
    order.cashierName || 'Kasir',
    order.notes || '-',
  ];

  await fetch(
    `${SHEETS_API_BASE}/${spreadsheetId}/values/'${SHEET_NAMES.ORDERS}'!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ values: [row] }),
    }
  );
}

/**
 * Appends a single newly recorded Production run directly into the Production Sheet
 */
export async function appendProductionRow(spreadsheetId: string, run: ProductionRun): Promise<void> {
  const headers = await getAuthHeader();
  const row = [
    run.batchNumber,
    run.productName,
    run.date,
    run.targetQty,
    run.actualYieldQty || run.targetQty,
    run.status,
    run.totalProductionCost,
    run.operatorName || 'Head Baker',
    run.notes || '-',
  ];

  await fetch(
    `${SHEETS_API_BASE}/${spreadsheetId}/values/'${SHEET_NAMES.PRODUCTION}'!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ values: [row] }),
    }
  );
}

/**
 * Appends or updates an ingredient inventory record in the Inventory Sheet
 */
export async function appendIngredientRow(spreadsheetId: string, ing: Ingredient): Promise<void> {
  const headers = await getAuthHeader();
  const row = [
    ing.sku || ing.id,
    ing.name,
    ing.category,
    ing.stockInRecipeUnit,
    ing.recipeUnit,
    ing.minStockInRecipeUnit,
    ing.costPerRecipeUnit,
    ing.buyUnit,
    ing.latestBuyPrice,
    ing.defaultSupplierName || '-',
    ing.stockInRecipeUnit <= ing.minStockInRecipeUnit ? 'MENIPIS' : 'AMAN',
  ];

  await fetch(
    `${SHEETS_API_BASE}/${spreadsheetId}/values/'${SHEET_NAMES.INVENTORY}'!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ values: [row] }),
    }
  );
}

/**
 * Appends a single Waste record to the Waste Sheet
 */
export async function appendWasteRow(spreadsheetId: string, w: WasteRecord): Promise<void> {
  const headers = await getAuthHeader();
  const row = [
    w.date,
    w.type,
    w.itemName,
    w.quantity || w.qty || 1,
    w.unit,
    w.lostCost || w.estimatedLossRp || 0,
    w.reason,
    w.operatorName || w.loggedBy || 'Staff',
    w.notes || '-',
  ];

  await fetch(
    `${SHEETS_API_BASE}/${spreadsheetId}/values/'${SHEET_NAMES.WASTE}'!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ values: [row] }),
    }
  );
}
