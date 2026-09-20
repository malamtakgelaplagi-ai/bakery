-- ============================================================================
-- PUSAKA Bakery Database Schema for MySQL / MariaDB (phpMyAdmin Compatible)
-- Charset: utf8mb4, Collation: utf8mb4_unicode_ci
-- ============================================================================

CREATE TABLE IF NOT EXISTS `business_profile` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY DEFAULT 'main',
  `name` VARCHAR(255) NOT NULL DEFAULT 'PUSAKA Bakery & Bolu',
  `tagline` VARCHAR(255) DEFAULT '',
  `owner_name` VARCHAR(255) DEFAULT '',
  `phone` VARCHAR(50) DEFAULT '',
  `email` VARCHAR(100) DEFAULT '',
  `address` TEXT,
  `city` VARCHAR(100) DEFAULT 'Bandung, Jawa Barat',
  `operating_hours` VARCHAR(100) DEFAULT '07.00 - 20.00 WIB',
  `google_maps_url` TEXT,
  `admin_whatsapp` VARCHAR(50) DEFAULT '',
  `invoice_prefix` VARCHAR(30) DEFAULT 'INV-PSK',
  `currency` VARCHAR(10) DEFAULT 'IDR',
  `bank_account_info` TEXT,
  `invoice_footer_notes` TEXT,
  `whatsapp_bot_enabled` BOOLEAN DEFAULT TRUE,
  `raw_data` JSON,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `products` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `sku` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `selling_price` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `base_hpp` DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  `gross_margin_percent` DECIMAL(6, 2) NOT NULL DEFAULT 0.00,
  `stock_finished_goods` INT NOT NULL DEFAULT 0,
  `min_stock_finished_goods` INT NOT NULL DEFAULT 4,
  `shelf_life_days` INT NOT NULL DEFAULT 4,
  `baked_weight_gram` INT NOT NULL DEFAULT 650,
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `size_spec` VARCHAR(150) DEFAULT '',
  `description` TEXT,
  `image` VARCHAR(255) DEFAULT '',
  `raw_data` JSON,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_prod_status` (`status`),
  INDEX `idx_prod_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `customers` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) NOT NULL,
  `email` VARCHAR(100) DEFAULT '',
  `address` TEXT,
  `tier` VARCHAR(30) NOT NULL DEFAULT 'BARU',
  `total_orders` INT NOT NULL DEFAULT 0,
  `total_spend` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  `last_order_date` VARCHAR(50) DEFAULT '',
  `tags` JSON,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_cust_phone` (`phone`),
  INDEX `idx_cust_tier` (`tier`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `orders` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `invoice_number` VARCHAR(100) NOT NULL UNIQUE,
  `date` VARCHAR(30) NOT NULL,
  `customer_id` VARCHAR(50) DEFAULT '',
  `customer_name` VARCHAR(255) NOT NULL,
  `customer_phone` VARCHAR(50) DEFAULT '',
  `customer_address` TEXT,
  `delivery_type` VARCHAR(50) DEFAULT 'TAKE_AWAY',
  `payment_method` VARCHAR(50) DEFAULT 'QRIS',
  `payment_status` VARCHAR(30) NOT NULL DEFAULT 'BELUM_LUNAS',
  `order_status` VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  `fulfillment_status` VARCHAR(30) NOT NULL DEFAULT 'MENUNGGU',
  `subtotal` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  `discount_amount` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  `shipping_fee` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  `total_amount` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  `paid_amount` DECIMAL(14, 2) NOT NULL DEFAULT 0.00,
  `source` VARCHAR(50) DEFAULT 'POS',
  `notes` TEXT,
  `items` JSON NOT NULL,
  `raw_data` JSON,
  `created_at` VARCHAR(50) NOT NULL,
  INDEX `idx_order_date` (`date`),
  INDEX `idx_order_status` (`order_status`),
  INDEX `idx_order_payment` (`payment_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `whatsapp_sessions` (
  `id` VARCHAR(100) NOT NULL PRIMARY KEY,
  `customer_phone` VARCHAR(50) NOT NULL UNIQUE,
  `customer_name` VARCHAR(255) DEFAULT 'Pelanggan WhatsApp',
  `current_step` VARCHAR(50) NOT NULL DEFAULT 'MAIN_MENU',
  `is_human_handled` BOOLEAN NOT NULL DEFAULT FALSE,
  `last_message_time` VARCHAR(50) DEFAULT '',
  `messages` JSON,
  `cart` JSON,
  `temp_data` JSON,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_wa_phone` (`customer_phone`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `audit_logs` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `timestamp` VARCHAR(50) NOT NULL,
  `action` VARCHAR(100) NOT NULL,
  `details` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
