import fs from 'fs';
import path from 'path';
import { Product, BusinessProfile, Order, Customer, WhatsAppSession } from '../src/types';

export interface ServerDatabase {
  businessProfile: BusinessProfile;
  products: Product[];
  orders: Order[];
  customers: Customer[];
  whatsappSessions: WhatsAppSession[];
  auditLogs: Array<{
    id: string;
    timestamp: string;
    action: string;
    details: string;
  }>;
}

const DB_FILE_PATH = path.join(process.cwd(), 'data', 'pusaka-db.json');

const INITIAL_PROFILE: BusinessProfile = {
  name: 'PUSAKA Bakery & Bolu',
  tagline: 'Artisan Bolu Pisang Premium & Cake Nusantara',
  ownerName: 'H. Suherman & Tim',
  phone: '081234567890',
  email: 'pusaka.bakery@gmail.com',
  address: 'Jl. R.E. Martadinata No. 88, Citarum',
  city: 'Bandung, Jawa Barat',
  operatingHours: '07.00 - 20.00 WIB',
  googleMapsUrl: 'https://maps.google.com/?q=Jl.+R.E.+Martadinata+No.+88+Bandung',
  latitude: -6.90835,
  longitude: 107.61895,
  adminWhatsapp: '081234567890',
  adminWhatsAppPhone: '081234567890',
  currency: 'IDR',
  invoicePrefix: 'INV-PSK',
  productionBatchPrefix: 'BATCH-PSK',
  purchasePrefix: 'PO-PSK',
  bankAccountInfo: 'BCA: 1234567890 a.n PUSAKA BOLU\nMandiri: 9876543210 a.n PUSAKA BOLU',
  invoiceFooterNotes: 'Terima kasih atas pesanan Anda! Simpan di suhu ruang, habiskan dalam 4 hari.',
  whatsappGreetingTemplate: 'Halo Kak! Selamat datang di PUSAKA Bakery.',
  whatsappInvoiceTemplate: '',
  whatsappFollowUpTemplate: '',
  whatsappBotEnabled: true,
  whatsappGatewayProvider: 'FONNTE',
};

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    sku: 'BL-ORIG-01',
    name: 'Bolu Pisang Raja Original',
    recipeId: 'rec-1',
    recipeVersionId: 'ver-1',
    category: 'Bolu Pisang',
    sellingPrice: 45000,
    baseHpp: 22500,
    grossMarginPercent: 50.0,
    stockFinishedGoods: 24,
    minStockFinishedGoods: 10,
    shelfLifeDays: 4,
    bakedWeightGram: 650,
    status: 'active',
    sizeSpec: 'Loyang 22x10 cm (±650 gr)',
    description: 'Bolu pisang klasik dengan pisang raja matang pohon, tekstur super moist dan aroma wangi harum alami.',
  },
  {
    id: 'prod-2',
    sku: 'BL-KEJU-02',
    name: 'Bolu Pisang Keju Parut Super',
    recipeId: 'rec-2',
    recipeVersionId: 'ver-2',
    category: 'Bolu Pisang',
    sellingPrice: 55000,
    baseHpp: 28000,
    grossMarginPercent: 49.1,
    stockFinishedGoods: 18,
    minStockFinishedGoods: 8,
    shelfLifeDays: 4,
    bakedWeightGram: 700,
    status: 'active',
    sizeSpec: 'Loyang 22x10 cm (±700 gr)',
    description: 'Bolu pisang moist dengan taburan keju cheddar parut melimpah di luar dan gurih di dalam.',
  },
  {
    id: 'prod-3',
    sku: 'BL-COK-03',
    name: 'Bolu Pisang Cokelat Ganache',
    recipeId: 'rec-3',
    recipeVersionId: 'ver-3',
    category: 'Bolu Pisang',
    sellingPrice: 55000,
    baseHpp: 27500,
    grossMarginPercent: 50.0,
    stockFinishedGoods: 15,
    minStockFinishedGoods: 8,
    shelfLifeDays: 4,
    bakedWeightGram: 700,
    status: 'active',
    sizeSpec: 'Loyang 22x10 cm (±700 gr)',
    description: 'Kombinasi pisang raja dan lelehan cokelat pekat premium ganache manis pas tidak enek.',
  },
  {
    id: 'prod-4',
    sku: 'BL-ALM-04',
    name: 'Bolu Pisang Kacang Almond',
    recipeId: 'rec-4',
    recipeVersionId: 'ver-4',
    category: 'Bolu Pisang',
    sellingPrice: 60000,
    baseHpp: 31000,
    grossMarginPercent: 48.3,
    stockFinishedGoods: 12,
    minStockFinishedGoods: 6,
    shelfLifeDays: 4,
    bakedWeightGram: 680,
    status: 'active',
    sizeSpec: 'Loyang 22x10 cm (±680 gr)',
    description: 'Topping irisan kacang almond panggang renyah dengan aroma kayu manis semerbak.',
  },
];

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Ibu Ratna Juwita',
    phone: '081298765432',
    email: 'ratna.juwita@gmail.com',
    address: 'Jl. Dago Asri No. 12, Coblong, Bandung',
    tier: 'LOYAL',
    totalOrders: 6,
    totalSpend: 540000,
    lastOrderDate: '2026-08-30',
    tags: ['VIP', 'Pecinta Keju'],
  },
];

class DataStore {
  private db: ServerDatabase;

  constructor() {
    this.db = this.loadDatabase();
  }

  private loadDatabase(): ServerDatabase {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        return {
          businessProfile: { ...INITIAL_PROFILE, ...(parsed.businessProfile || {}) },
          products: Array.isArray(parsed.products) && parsed.products.length > 0 ? parsed.products : INITIAL_PRODUCTS,
          orders: Array.isArray(parsed.orders) ? parsed.orders : [],
          customers: Array.isArray(parsed.customers) && parsed.customers.length > 0 ? parsed.customers : INITIAL_CUSTOMERS,
          whatsappSessions: Array.isArray(parsed.whatsappSessions) ? parsed.whatsappSessions : [],
          auditLogs: Array.isArray(parsed.auditLogs) ? parsed.auditLogs : [],
        };
      }
    } catch (e) {
      console.warn('Could not read existing database file, initializing fresh:', e);
    }

    const freshDb: ServerDatabase = {
      businessProfile: INITIAL_PROFILE,
      products: INITIAL_PRODUCTS,
      orders: [],
      customers: INITIAL_CUSTOMERS,
      whatsappSessions: [],
      auditLogs: [
        {
          id: `log-${Date.now()}`,
          timestamp: new Date().toISOString(),
          action: 'INIT_SERVER_DATABASE',
          details: 'Database server PUSAKA Bakery diinisialisasi otomatis.',
        },
      ],
    };
    this.saveDatabase(freshDb);
    return freshDb;
  }

  private saveDatabase(data: ServerDatabase): void {
    try {
      const dir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save database file:', e);
    }
  }

  public getBusinessProfile(): BusinessProfile {
    return this.db.businessProfile;
  }

  public updateBusinessProfile(patch: Partial<BusinessProfile>): BusinessProfile {
    this.db.businessProfile = { ...this.db.businessProfile, ...patch };
    this.saveDatabase(this.db);
    return this.db.businessProfile;
  }

  public getProducts(activeOnly = false): Product[] {
    if (activeOnly) {
      return this.db.products.filter((p) => p.status === 'active');
    }
    return this.db.products;
  }

  public getProductById(id: string): Product | undefined {
    return this.db.products.find((p) => p.id === id);
  }

  public updateProduct(id: string, patch: Partial<Product>): Product | null {
    const idx = this.db.products.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    this.db.products[idx] = { ...this.db.products[idx], ...patch };
    this.saveDatabase(this.db);
    return this.db.products[idx];
  }

  public getOrders(): Order[] {
    return this.db.orders;
  }

  public getOrderById(id: string): Order | undefined {
    return this.db.orders.find((o) => o.id === id || o.invoiceNumber === id);
  }

  public createOrder(orderInput: Omit<Order, 'id' | 'invoiceNumber' | 'createdAt'>): Order {
    const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    const invoiceNumber = `${this.db.businessProfile.invoicePrefix || 'INV-PSK'}-${dateCode}-${rand}`;

    const discountAmount = Number(orderInput.discountAmount) || 0;
    const shippingFee = Number(orderInput.shippingFee) || 0;
    const subtotal = Number(orderInput.subtotal) || (orderInput.items || []).reduce((sum, it) => sum + (Number(it.subtotal) || 0), 0);
    const totalAmount = Number(orderInput.totalAmount) || Math.max(0, subtotal - discountAmount + shippingFee);
    const paidAmount = Number(orderInput.paidAmount) || (orderInput.paymentStatus === 'LUNAS' ? totalAmount : 0);

    const newOrder: Order = {
      ...orderInput,
      id: `ord-${Date.now()}`,
      invoiceNumber,
      date: orderInput.date || new Date().toISOString().split('T')[0],
      discountAmount,
      shippingFee,
      subtotal,
      totalAmount,
      paidAmount,
      orderStatus: orderInput.orderStatus || 'PENDING',
      fulfillmentStatus: orderInput.fulfillmentStatus || 'MENUNGGU',
      createdAt: new Date().toISOString(),
    };

    // 1. Deduct finished goods stock for products in this order
    if (Array.isArray(newOrder.items)) {
      newOrder.items.forEach((item) => {
        const prod = this.db.products.find((p) => p.id === item.productId);
        if (prod) {
          prod.stockFinishedGoods = Math.max(0, prod.stockFinishedGoods - item.qty);
        }
      });
    }

    // 2. Find or create customer
    const phone = (newOrder.customerPhone || '').replace(/[^0-9]/g, '');
    if (phone) {
      let cust = this.db.customers.find((c) => (c.phone || '').replace(/[^0-9]/g, '') === phone);
      if (cust) {
        cust.totalOrders += 1;
        cust.totalSpend += totalAmount;
        cust.lastOrderDate = newOrder.date;
        if (cust.totalOrders >= 4 || cust.totalSpend >= 500000) {
          cust.tier = 'LOYAL';
        } else if (cust.totalOrders >= 2) {
          cust.tier = 'AKTIF';
        }
      } else {
        const newCust: Customer = {
          id: `cust-${Date.now()}`,
          name: newOrder.customerName || 'Pelanggan WhatsApp',
          phone: newOrder.customerPhone || '',
          email: '',
          address: newOrder.customerAddress || '',
          tier: 'BARU',
          totalOrders: 1,
          totalSpend: totalAmount,
          lastOrderDate: newOrder.date,
          tags: ['WhatsApp'],
        };
        this.db.customers.push(newCust);
      }
    }

    // 3. Save order
    this.db.orders.unshift(newOrder);

    // 4. Record audit log
    this.db.auditLogs.unshift({
      id: `log-${Date.now()}`,
      timestamp: new Date().toISOString(),
      action: 'PESANAN_BARU',
      details: `Pesanan ${invoiceNumber} senilai Rp ${totalAmount.toLocaleString('id-ID')} dibuat via ${newOrder.source || 'POS'}.`,
    });

    this.saveDatabase(this.db);
    return newOrder;
  }

  public updateOrderStatus(id: string, patch: Partial<Order>): Order | null {
    const idx = this.db.orders.findIndex((o) => o.id === id || o.invoiceNumber === id);
    if (idx === -1) return null;
    this.db.orders[idx] = { ...this.db.orders[idx], ...patch };
    this.saveDatabase(this.db);
    return this.db.orders[idx];
  }

  public getCustomers(): Customer[] {
    return this.db.customers;
  }

  public getWhatsAppSessions(): WhatsAppSession[] {
    return this.db.whatsappSessions;
  }

  public getWhatsAppSessionByPhone(phone: string): WhatsAppSession | undefined {
    const clean = (phone || '').replace(/[^0-9]/g, '');
    return this.db.whatsappSessions.find((s) => (s.customerPhone || '').replace(/[^0-9]/g, '') === clean);
  }

  public saveWhatsAppSession(session: WhatsAppSession): WhatsAppSession {
    const clean = (session.customerPhone || '').replace(/[^0-9]/g, '');
    const idx = this.db.whatsappSessions.findIndex((s) => (s.customerPhone || '').replace(/[^0-9]/g, '') === clean);
    if (idx >= 0) {
      this.db.whatsappSessions[idx] = session;
    } else {
      this.db.whatsappSessions.unshift(session);
    }
    this.saveDatabase(this.db);
    return session;
  }
}

export const serverStore = new DataStore();
