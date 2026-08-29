export type UnitCategory = 'weight' | 'volume' | 'count' | 'kitchen';

export interface Unit {
  id: string;
  code: string;
  name: string;
  category: UnitCategory;
  baseUnit: string; // e.g. 'g' or 'ml' or 'pcs'
  multiplierToBase: number; // e.g. 1 kg = 1000 g
}

export type IngredientCategory =
  | 'Bahan Utama'
  | 'Bahan Pengembang & Ragi'
  | 'Pemanis & Gula'
  | 'Perasa, Pewarna & Rempah'
  | 'Dairy & Lemak'
  | 'Kemasan & Packaging'
  | 'Topping & Isian'
  | 'Lainnya';

export interface Ingredient {
  id: string;
  sku: string;
  name: string;
  category: IngredientCategory;
  buyUnit: string; // e.g. "kg", "pack (10 btr)", "liter", "box (100 pcs)"
  recipeUnit: string; // e.g. "g", "butir", "ml", "pcs", "sdt"
  conversionFactor: number; // e.g. 1 buyUnit = 1000 recipeUnit (1 kg = 1000 g)
  latestBuyPrice: number; // Price per buyUnit in IDR
  costPerRecipeUnit: number; // Calculated: latestBuyPrice / conversionFactor
  stockInRecipeUnit: number; // Current on-hand quantity in recipeUnit
  minStockInRecipeUnit: number; // Warning threshold in recipeUnit
  defaultSupplierId?: string;
  defaultSupplierName?: string;
  status: 'active' | 'inactive';
  notes?: string;
  updatedAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address: string;
  notes?: string;
  suppliedIngredients: string[]; // Ingredient IDs
}

export interface PurchaseItem {
  ingredientId: string;
  ingredientName: string;
  buyUnit: string;
  recipeUnit: string;
  conversionFactor: number;
  qtyBuyUnit: number;
  pricePerBuyUnit: number;
  subtotal: number;
}

export interface Purchase {
  id: string;
  purchaseNumber: string;
  date: string;
  supplierId: string;
  supplierName: string;
  items: PurchaseItem[];
  totalAmount: number;
  paymentStatus: 'LUNAS' | 'HUTANG';
  notes?: string;
  recordedBy: string;
  createdAt: string;
}

export interface RecipeBOMItem {
  id: string;
  ingredientId: string;
  ingredientName: string;
  quantity: number; // in recipeUnit
  recipeUnit: string;
  unitCostSnapshot: number;
  cost: number;
}

export interface RecipeDirectCost {
  id: string;
  name: string; // e.g. "Gas Elpiji", "Listrik Oven", "Tenaga Kerja Langsung", "Air & Kebersihan"
  costType: 'per_batch' | 'per_unit';
  amount: number;
}

export interface RecipePackagingItem {
  id: string;
  ingredientId: string; // points to ingredient in 'Kemasan & Packaging' category
  name: string;
  quantity: number; // e.g. 1 box, 1 sticker, 1 paper bag
  unitCost: number;
  totalCost: number;
}

export interface RecipeVersion {
  id: string;
  versionNumber: string; // e.g. "v1.0", "v1.1", "v2.0"
  changeLog: string;
  targetBatterWeightGram: number; // e.g. 925g adonan
  targetBakedWeightGram: number; // e.g. 900g bolu matang
  yieldQty: number; // e.g. 1 pcs per recipe definition
  items: RecipeBOMItem[];
  packaging: RecipePackagingItem[];
  directCosts: RecipeDirectCost[];
  totalRawCost: number;
  totalPackagingCost: number;
  totalDirectCost: number;
  totalHppPerUnit: number;
  notes?: string;
  createdAt: string;
  createdBy: string;
}

export interface Recipe {
  id: string;
  name: string;
  category: string;
  description?: string;
  currentVersionId: string;
  versions: RecipeVersion[];
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  sizeSpec: string; // e.g. "Ø20 cm (Medium)"
  bakedWeightGram: number; // e.g. 900
  recipeId: string;
  recipeVersionId: string;
  sellingPrice: number;
  baseHpp: number;
  grossMarginPercent: number; // e.g. 45%
  stockFinishedGoods: number; // Finished products ready to sell
  minStockFinishedGoods: number;
  status: 'active' | 'inactive';
  description?: string;
  shelfLifeDays: number;
  image?: string;
}

export type ProductionStatus =
  | 'DRAFT'
  | 'DIRACIK'
  | 'DIPANGGANG'
  | 'PENDINGINAN'
  | 'QC'
  | 'SELESAI'
  | 'BATAL';

export interface ProductionIngredientRequirement {
  ingredientId: string;
  ingredientName: string;
  requiredQty: number;
  unit: string;
  availableStock: number;
  isSufficient: boolean;
  cost: number;
}

export interface ProductionRun {
  id: string;
  batchNumber: string;
  date: string;
  productId: string;
  productName: string;
  recipeId: string;
  recipeVersionNumber: string;
  targetQty: number;
  actualYieldQty: number;
  rejectedQty: number;
  status: ProductionStatus;
  ingredients: ProductionIngredientRequirement[];
  packagingUsed: { packagingId: string; name: string; qty: number; unitCost: number; totalCost: number }[];
  directCosts: { name: string; amount: number }[];
  totalProductionCost: number;
  unitProductionCost: number;
  isStockDeducted: boolean;
  isFinishedStockAdded: boolean;
  operatorName: string;
  notes?: string;
  timeline: { status: ProductionStatus; timestamp: string; note?: string }[];
  startedAt?: string;
  finishedAt?: string;
}

export type DeliveryType = 'PICKUP' | 'DELIVERY';

export type OrderStatus =
  | 'PENDING'
  | 'PROCESSED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'CANCELLED';

export interface WasteRecord {
  id: string;
  date: string;
  type: 'INGREDIENT' | 'FINISHED_PRODUCT' | 'PRODUCTION_DEFECT' | 'BAHAN_BAKU' | 'PRODUK_JADI';
  itemId: string;
  itemName: string;
  qty?: number;
  quantity?: number;
  unit: string;
  reason: string; // e.g. "Bolu gosong / suhu oven terlalu tinggi", "Pisang terlalu ranum / membusuk", "Telur pecah di gudang"
  estimatedLossRp?: number;
  lostCost?: number;
  loggedBy?: string;
  operatorName?: string;
  notes?: string;
}

export type CustomerTier = 'BARU' | 'AKTIF' | 'LOYAL' | 'PASIF';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  city?: string;
  tier?: CustomerTier;
  totalOrders: number;
  totalSpend?: number;
  totalSpent?: number;
  lastOrderDate?: string;
  tags?: string[];
  notes?: string;
  favoriteProducts?: string[];
  createdAt?: string;
}

export type OrderSource =
  | 'WHATSAPP'
  | 'INSTAGRAM'
  | 'TIKTOK'
  | 'WALK_IN'
  | 'MARKETPLACE'
  | 'RESELLER'
  | 'EVENT';

export type PaymentMethod =
  | 'CASH'
  | 'TRANSFER_BCA'
  | 'TRANSFER_MANDIRI'
  | 'TRANSFER_BRI'
  | 'QRIS'
  | 'E_WALLET'
  | 'GOJEK_GRAB';

export type PaymentStatus = 'BELUM_BAYAR' | 'DP' | 'LUNAS';

export type FulfillmentStatus =
  | 'MENUNGGU'
  | 'DIPROSES'
  | 'SIAP_DIAMBIL'
  | 'DIKIRIM'
  | 'SELESAI'
  | 'BATAL';

export interface OrderItem {
  id?: string;
  productId: string;
  productName: string;
  sku?: string;
  qty: number;
  unitPrice: number;
  hppSnapshot: number;
  subtotal: number;
  notes?: string;
}

export interface Order {
  id: string;
  invoiceNumber: string;
  date: string;
  customerId?: string;
  customerName: string;
  customerPhone: string;
  customerAddress?: string;
  source?: OrderSource;
  items: OrderItem[];
  subtotal: number;
  discountType?: 'NOMINAL' | 'PERCENT';
  discountValue?: number;
  discountAmount: number;
  shippingFee: number;
  totalAmount: number;
  totalHpp?: number;
  grossProfit?: number;
  paymentStatus: PaymentStatus;
  paidAmount: number;
  paymentMethod: PaymentMethod;
  fulfillmentStatus?: FulfillmentStatus;
  orderStatus?: OrderStatus;
  deliveryType: DeliveryType;
  deliveryDate?: string;
  deliveryTime?: string;
  courierName?: string;
  trackingNumber?: string;
  notes?: string;
  cashierName?: string;
  createdBy?: string;
  createdAt?: string;
}


export type ExpenseCategory =
  | 'Sewa Tempat & Bangunan'
  | 'Listrik, Gas & Air'
  | 'Marketing, Iklan & Promosi'
  | 'Gaji & Upah Karyawan'
  | 'Transportasi & Logistik'
  | 'Peralatan & Maintenance'
  | 'Administrasi, Internet & ATK'
  | 'Lain-lain';

export interface Expense {
  id: string;
  date: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  paymentMethod: PaymentMethod;
  receiptNumber?: string;
  recordedBy: string;
  createdAt: string;
}

export type UserRole = 'OWNER' | 'ADMIN' | 'PRODUKSI' | 'KASIR' | 'SUPERVISOR';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  title?: string;
  pin?: string;
  notes?: string;
  status?: 'active' | 'inactive';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  role: UserRole;
  action: string;
  details: string;
  module: 'BAHAN' | 'RESEP' | 'PRODUKSI' | 'PESANAN' | 'KEUANGAN' | 'PENGATURAN' | 'SISTEM' | 'PRODUK';
}

export interface Outlet {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  phone: string;
  isMain: boolean;
}

export interface BusinessProfile {
  name: string;
  tagline: string;
  logoUrl?: string;
  ownerName: string;
  phone: string; // WA format
  email: string;
  address: string;
  city: string;
  operatingHours: string;
  currency: string;
  invoicePrefix: string;
  productionBatchPrefix: string;
  purchasePrefix: string;
  whatsappGreetingTemplate: string;
  whatsappInvoiceTemplate: string;
  whatsappFollowUpTemplate: string;
}

export interface StockMovement {
  id: string;
  date: string;
  itemType: 'INGREDIENT' | 'PRODUCT';
  itemId: string;
  itemName: string;
  movementType: 'IN_PURCHASE' | 'IN_PRODUCTION' | 'OUT_PRODUCTION' | 'OUT_SALE' | 'OUT_WASTE' | 'ADJUSTMENT';
  qtyChange: number;
  unit: string;
  balanceAfter: number;
  referenceDocNumber: string;
  notes?: string;
}

export interface GoogleSheetsConfig {
  spreadsheetId: string | null;
  spreadsheetTitle: string | null;
  spreadsheetUrl: string | null;
  autoSyncOrders: boolean;
  autoSyncProduction?: boolean;
  autoSyncInventory?: boolean;
  lastSyncedAt: string | null;
  lastLoadedAt?: string | null;
}
