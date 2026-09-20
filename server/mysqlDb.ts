import mysql, { Pool, PoolOptions } from 'mysql2/promise';
import { Product, BusinessProfile, Order, Customer, WhatsAppSession } from '../src/types';

let pool: Pool | null = null;
let isConnected = false;
let initAttempted = false;

export function isMySQLConfigured(): boolean {
  return !!(process.env.DB_NAME && process.env.DB_USER);
}

export function getMySQLPool(): Pool | null {
  if (!isMySQLConfigured()) {
    return null;
  }
  if (!pool) {
    try {
      const config: PoolOptions = {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 10000,
      };
      pool = mysql.createPool(config);
    } catch (err) {
      console.warn('[MySQL] Failed to instantiate pool:', err);
      return null;
    }
  }
  return pool;
}

export async function checkMySQLConnection(): Promise<{ connected: boolean; message: string; host?: string; database?: string }> {
  if (!isMySQLConfigured()) {
    return {
      connected: false,
      message: 'MySQL tidak dikonfigurasi di file .env (DB_NAME / DB_USER kosong). Menggunakan JSON local storage.',
    };
  }

  try {
    const p = getMySQLPool();
    if (!p) throw new Error('Pool initialization failed');
    const [rows] = await p.query('SELECT 1 as val');
    isConnected = true;
    return {
      connected: true,
      message: 'Terhubung ke database MySQL / MariaDB.',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME,
    };
  } catch (err: any) {
    isConnected = false;
    return {
      connected: false,
      message: `Gagal terhubung ke MySQL: ${err?.message || err}`,
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME,
    };
  }
}

export async function initMySQLSchema(): Promise<boolean> {
  const p = getMySQLPool();
  if (!p) return false;

  try {
    // 1. Business Profile
    await p.query(`
      CREATE TABLE IF NOT EXISTS \`business_profile\` (
        \`id\` VARCHAR(50) NOT NULL PRIMARY KEY DEFAULT 'main',
        \`name\` VARCHAR(255) NOT NULL DEFAULT 'PUSAKA Bakery & Bolu',
        \`tagline\` VARCHAR(255) DEFAULT '',
        \`owner_name\` VARCHAR(255) DEFAULT '',
        \`phone\` VARCHAR(50) DEFAULT '',
        \`email\` VARCHAR(100) DEFAULT '',
        \`address\` TEXT,
        \`city\` VARCHAR(100) DEFAULT 'Bandung, Jawa Barat',
        \`operating_hours\` VARCHAR(100) DEFAULT '07.00 - 20.00 WIB',
        \`google_maps_url\` TEXT,
        \`admin_whatsapp\` VARCHAR(50) DEFAULT '',
        \`invoice_prefix\` VARCHAR(30) DEFAULT 'INV-PSK',
        \`currency\` VARCHAR(10) DEFAULT 'IDR',
        \`bank_account_info\` TEXT,
        \`invoice_footer_notes\` TEXT,
        \`whatsapp_bot_enabled\` BOOLEAN DEFAULT TRUE,
        \`raw_data\` JSON,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Products
    await p.query(`
      CREATE TABLE IF NOT EXISTS \`products\` (
        \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
        \`sku\` VARCHAR(50) NOT NULL,
        \`name\` VARCHAR(255) NOT NULL,
        \`category\` VARCHAR(100) NOT NULL,
        \`selling_price\` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        \`base_hpp\` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        \`gross_margin_percent\` DECIMAL(6, 2) NOT NULL DEFAULT 0.00,
        \`stock_finished_goods\` INT NOT NULL DEFAULT 0,
        \`min_stock_finished_goods\` INT NOT NULL DEFAULT 4,
        \`shelf_life_days\` INT NOT NULL DEFAULT 4,
        \`baked_weight_gram\` INT NOT NULL DEFAULT 650,
        \`status\` VARCHAR(20) NOT NULL DEFAULT 'active',
        \`size_spec\` VARCHAR(150) DEFAULT '',
        \`description\` TEXT,
        \`image\` VARCHAR(255) DEFAULT '',
        \`raw_data\` JSON,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_prod_status\` (\`status\`),
        INDEX \`idx_prod_category\` (\`category\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 3. Customers
    await p.query(`
      CREATE TABLE IF NOT EXISTS \`customers\` (
        \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
        \`name\` VARCHAR(255) NOT NULL,
        \`phone\` VARCHAR(50) NOT NULL,
        \`email\` VARCHAR(100) DEFAULT '',
        \`address\` TEXT,
        \`tier\` VARCHAR(30) NOT NULL DEFAULT 'BARU',
        \`total_orders\` INT NOT NULL DEFAULT 0,
        \`total_spend\` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
        \`last_order_date\` VARCHAR(50) DEFAULT '',
        \`tags\` JSON,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_cust_phone\` (\`phone\`),
        INDEX \`idx_cust_tier\` (\`tier\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 4. Orders
    await p.query(`
      CREATE TABLE IF NOT EXISTS \`orders\` (
        \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
        \`invoice_number\` VARCHAR(100) NOT NULL UNIQUE,
        \`date\` VARCHAR(30) NOT NULL,
        \`customer_id\` VARCHAR(50) DEFAULT '',
        \`customer_name\` VARCHAR(255) NOT NULL,
        \`customer_phone\` VARCHAR(50) DEFAULT '',
        \`customer_address\` TEXT,
        \`delivery_type\` VARCHAR(50) DEFAULT 'TAKE_AWAY',
        \`payment_method\` VARCHAR(50) DEFAULT 'QRIS',
        \`payment_status\` VARCHAR(30) NOT NULL DEFAULT 'BELUM_LUNAS',
        \`order_status\` VARCHAR(30) NOT NULL DEFAULT 'PENDING',
        \`fulfillment_status\` VARCHAR(30) NOT NULL DEFAULT 'MENUNGGU',
        \`subtotal\` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
        \`discount_amount\` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
        \`shipping_fee\` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
        \`total_amount\` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
        \`paid_amount\` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
        \`source\` VARCHAR(50) DEFAULT 'POS',
        \`notes\` TEXT,
        \`items\` JSON NOT NULL,
        \`raw_data\` JSON,
        \`created_at\` VARCHAR(50) NOT NULL,
        INDEX \`idx_order_date\` (\`date\`),
        INDEX \`idx_order_status\` (\`order_status\`),
        INDEX \`idx_order_payment\` (\`payment_status\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. WhatsApp Sessions
    await p.query(`
      CREATE TABLE IF NOT EXISTS \`whatsapp_sessions\` (
        \`id\` VARCHAR(100) NOT NULL PRIMARY KEY,
        \`customer_phone\` VARCHAR(50) NOT NULL UNIQUE,
        \`customer_name\` VARCHAR(255) DEFAULT 'Pelanggan WhatsApp',
        \`current_step\` VARCHAR(50) NOT NULL DEFAULT 'MAIN_MENU',
        \`is_human_handled\` BOOLEAN NOT NULL DEFAULT FALSE,
        \`last_message_time\` VARCHAR(50) DEFAULT '',
        \`messages\` JSON,
        \`cart\` JSON,
        \`temp_data\` JSON,
        \`updated_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX \`idx_wa_phone\` (\`customer_phone\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. Audit Logs
    await p.query(`
      CREATE TABLE IF NOT EXISTS \`audit_logs\` (
        \`id\` VARCHAR(50) NOT NULL PRIMARY KEY,
        \`timestamp\` VARCHAR(50) NOT NULL,
        \`action\` VARCHAR(100) NOT NULL,
        \`details\` TEXT,
        \`created_at\` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('[MySQL] Schema verification / table creation succeeded.');
    return true;
  } catch (err) {
    console.error('[MySQL] Error initializing schema:', err);
    return false;
  }
}

// ----------------------------------------------------------------------------
// DATA REPOSITORY METHODS (ASYNC MYSQL QUERIES)
// ----------------------------------------------------------------------------

export async function mysqlGetProfile(): Promise<BusinessProfile | null> {
  const p = getMySQLPool();
  if (!p) return null;
  try {
    const [rows]: any = await p.query('SELECT raw_data FROM business_profile WHERE id = ? LIMIT 1', ['main']);
    if (rows && rows.length > 0) {
      return typeof rows[0].raw_data === 'string' ? JSON.parse(rows[0].raw_data) : rows[0].raw_data;
    }
    return null;
  } catch (err) {
    console.warn('[MySQL] Error getting profile:', err);
    return null;
  }
}

export async function mysqlSaveProfile(profile: BusinessProfile): Promise<boolean> {
  const p = getMySQLPool();
  if (!p) return false;
  try {
    await p.query(
      `INSERT INTO business_profile (id, name, tagline, owner_name, phone, email, address, city, operating_hours, google_maps_url, admin_whatsapp, invoice_prefix, currency, bank_account_info, invoice_footer_notes, whatsapp_bot_enabled, raw_data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         tagline = VALUES(tagline),
         owner_name = VALUES(owner_name),
         phone = VALUES(phone),
         email = VALUES(email),
         address = VALUES(address),
         city = VALUES(city),
         operating_hours = VALUES(operating_hours),
         google_maps_url = VALUES(google_maps_url),
         admin_whatsapp = VALUES(admin_whatsapp),
         invoice_prefix = VALUES(invoice_prefix),
         currency = VALUES(currency),
         bank_account_info = VALUES(bank_account_info),
         invoice_footer_notes = VALUES(invoice_footer_notes),
         whatsapp_bot_enabled = VALUES(whatsapp_bot_enabled),
         raw_data = VALUES(raw_data)`,
      [
        'main',
        profile.name || '',
        profile.tagline || '',
        profile.ownerName || '',
        profile.phone || '',
        profile.email || '',
        profile.address || '',
        profile.city || '',
        profile.operatingHours || '',
        profile.googleMapsUrl || '',
        profile.adminWhatsapp || profile.adminWhatsAppPhone || '',
        profile.invoicePrefix || 'INV-PSK',
        profile.currency || 'IDR',
        profile.bankAccountInfo || '',
        profile.invoiceFooterNotes || '',
        profile.whatsappBotEnabled ? 1 : 0,
        JSON.stringify(profile),
      ]
    );
    return true;
  } catch (err) {
    console.warn('[MySQL] Error saving profile:', err);
    return false;
  }
}

export async function mysqlGetProducts(): Promise<Product[] | null> {
  const p = getMySQLPool();
  if (!p) return null;
  try {
    const [rows]: any = await p.query('SELECT raw_data FROM products ORDER BY category ASC, name ASC');
    if (Array.isArray(rows) && rows.length > 0) {
      return rows.map((r: any) => (typeof r.raw_data === 'string' ? JSON.parse(r.raw_data) : r.raw_data));
    }
    return [];
  } catch (err) {
    console.warn('[MySQL] Error getting products:', err);
    return null;
  }
}

export async function mysqlSaveProduct(prod: Product): Promise<boolean> {
  const p = getMySQLPool();
  if (!p) return false;
  try {
    await p.query(
      `INSERT INTO products (id, sku, name, category, selling_price, base_hpp, gross_margin_percent, stock_finished_goods, min_stock_finished_goods, shelf_life_days, baked_weight_gram, status, size_spec, description, image, raw_data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         sku = VALUES(sku),
         name = VALUES(name),
         category = VALUES(category),
         selling_price = VALUES(selling_price),
         base_hpp = VALUES(base_hpp),
         gross_margin_percent = VALUES(gross_margin_percent),
         stock_finished_goods = VALUES(stock_finished_goods),
         min_stock_finished_goods = VALUES(min_stock_finished_goods),
         shelf_life_days = VALUES(shelf_life_days),
         baked_weight_gram = VALUES(baked_weight_gram),
         status = VALUES(status),
         size_spec = VALUES(size_spec),
         description = VALUES(description),
         image = VALUES(image),
         raw_data = VALUES(raw_data)`,
      [
        prod.id,
        prod.sku || '',
        prod.name || '',
        prod.category || '',
        prod.sellingPrice || 0,
        prod.baseHpp || 0,
        prod.grossMarginPercent || 0,
        prod.stockFinishedGoods || 0,
        prod.minStockFinishedGoods || 0,
        prod.shelfLifeDays || 4,
        prod.bakedWeightGram || 0,
        prod.status || 'active',
        prod.sizeSpec || '',
        prod.description || '',
        prod.image || '',
        JSON.stringify(prod),
      ]
    );
    return true;
  } catch (err) {
    console.warn('[MySQL] Error saving product:', err);
    return false;
  }
}

export async function mysqlGetOrders(): Promise<Order[] | null> {
  const p = getMySQLPool();
  if (!p) return null;
  try {
    const [rows]: any = await p.query('SELECT raw_data FROM orders ORDER BY created_at DESC');
    if (Array.isArray(rows)) {
      return rows.map((r: any) => (typeof r.raw_data === 'string' ? JSON.parse(r.raw_data) : r.raw_data));
    }
    return [];
  } catch (err) {
    console.warn('[MySQL] Error getting orders:', err);
    return null;
  }
}

export async function mysqlSaveOrder(order: Order): Promise<boolean> {
  const p = getMySQLPool();
  if (!p) return false;
  try {
    await p.query(
      `INSERT INTO orders (id, invoice_number, date, customer_id, customer_name, customer_phone, customer_address, delivery_type, payment_method, payment_status, order_status, fulfillment_status, subtotal, discount_amount, shipping_fee, total_amount, paid_amount, source, notes, items, raw_data, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         payment_status = VALUES(payment_status),
         order_status = VALUES(order_status),
         fulfillment_status = VALUES(fulfillment_status),
         paid_amount = VALUES(paid_amount),
         notes = VALUES(notes),
         items = VALUES(items),
         raw_data = VALUES(raw_data)`,
      [
        order.id,
        order.invoiceNumber,
        order.date,
        order.customerId || '',
        order.customerName,
        order.customerPhone || '',
        order.customerAddress || '',
        order.deliveryType || 'TAKE_AWAY',
        order.paymentMethod || 'QRIS',
        order.paymentStatus || 'BELUM_LUNAS',
        order.orderStatus || 'PENDING',
        order.fulfillmentStatus || 'MENUNGGU',
        order.subtotal || 0,
        order.discountAmount || 0,
        order.shippingFee || 0,
        order.totalAmount || 0,
        order.paidAmount || 0,
        order.source || 'POS',
        order.notes || '',
        JSON.stringify(order.items || []),
        JSON.stringify(order),
        order.createdAt || new Date().toISOString(),
      ]
    );
    return true;
  } catch (err) {
    console.warn('[MySQL] Error saving order:', err);
    return false;
  }
}

export async function mysqlGetCustomers(): Promise<Customer[] | null> {
  const p = getMySQLPool();
  if (!p) return null;
  try {
    const [rows]: any = await p.query('SELECT * FROM customers ORDER BY total_orders DESC');
    if (Array.isArray(rows)) {
      return rows.map((r: any) => ({
        id: r.id,
        name: r.name,
        phone: r.phone,
        email: r.email || '',
        address: r.address || '',
        tier: r.tier || 'BARU',
        totalOrders: r.total_orders || 0,
        totalSpend: parseFloat(r.total_spend || '0'),
        totalSpent: parseFloat(r.total_spend || '0'),
        lastOrderDate: r.last_order_date || '',
        tags: typeof r.tags === 'string' ? JSON.parse(r.tags) : r.tags || [],
      }));
    }
    return [];
  } catch (err) {
    console.warn('[MySQL] Error getting customers:', err);
    return null;
  }
}

export async function mysqlSaveCustomer(cust: Customer): Promise<boolean> {
  const p = getMySQLPool();
  if (!p) return false;
  try {
    await p.query(
      `INSERT INTO customers (id, name, phone, email, address, tier, total_orders, total_spend, last_order_date, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name = VALUES(name),
         email = VALUES(email),
         address = VALUES(address),
         tier = VALUES(tier),
         total_orders = VALUES(total_orders),
         total_spend = VALUES(total_spend),
         last_order_date = VALUES(last_order_date),
         tags = VALUES(tags)`,
      [
        cust.id,
        cust.name,
        cust.phone,
        cust.email || '',
        cust.address || '',
        cust.tier || 'BARU',
        cust.totalOrders || 0,
        cust.totalSpend ?? (cust as any).totalSpent ?? 0,
        cust.lastOrderDate || '',
        JSON.stringify(cust.tags || []),
      ]
    );
    return true;
  } catch (err) {
    console.warn('[MySQL] Error saving customer:', err);
    return false;
  }
}

export async function mysqlGetWhatsAppSessions(): Promise<WhatsAppSession[] | null> {
  const p = getMySQLPool();
  if (!p) return null;
  try {
    const [rows]: any = await p.query('SELECT * FROM whatsapp_sessions ORDER BY updated_at DESC');
    if (Array.isArray(rows)) {
      return rows.map((r: any) => ({
        id: r.id,
        customerPhone: r.customer_phone,
        customerName: r.customer_name,
        currentStep: r.current_step,
        isHumanHandled: !!r.is_human_handled,
        lastMessageTime: r.last_message_time || '',
        messages: typeof r.messages === 'string' ? JSON.parse(r.messages) : r.messages || [],
        cartItem: typeof r.cart === 'string' ? JSON.parse(r.cart) : r.cart,
      }));
    }
    return [];
  } catch (err) {
    console.warn('[MySQL] Error getting whatsapp sessions:', err);
    return null;
  }
}

export async function mysqlSaveWhatsAppSession(sess: WhatsAppSession): Promise<boolean> {
  const p = getMySQLPool();
  if (!p) return false;
  try {
    const cartData = sess.cartItem || (sess as any).cart || null;
    const tempData = (sess as any).tempData || null;

    await p.query(
      `INSERT INTO whatsapp_sessions (id, customer_phone, customer_name, current_step, is_human_handled, last_message_time, messages, cart, temp_data)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         customer_name = VALUES(customer_name),
         current_step = VALUES(current_step),
         is_human_handled = VALUES(is_human_handled),
         last_message_time = VALUES(last_message_time),
         messages = VALUES(messages),
         cart = VALUES(cart),
         temp_data = VALUES(temp_data)`,
      [
        sess.id,
        sess.customerPhone,
        sess.customerName || 'Pelanggan WhatsApp',
        sess.currentStep || 'MAIN_MENU',
        sess.isHumanHandled ? 1 : 0,
        sess.lastMessageTime || '',
        JSON.stringify(sess.messages || []),
        JSON.stringify(cartData),
        JSON.stringify(tempData),
      ]
    );
    return true;
  } catch (err) {
    console.warn('[MySQL] Error saving whatsapp session:', err);
    return false;
  }
}
