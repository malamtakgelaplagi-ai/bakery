import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  BusinessProfile,
  Ingredient,
  Supplier,
  Purchase,
  Recipe,
  RecipeVersion,
  Product,
  ProductionRun,
  ProductionStatus,
  WasteRecord,
  Customer,
  Order,
  OrderStatus,
  FulfillmentStatus,
  PaymentStatus,
  PaymentMethod,
  Expense,
  UserRole,
  UserAccount,
  AuditLog,
  StockMovement,
  Unit,
  Outlet,
  GoogleSheetsConfig
} from '../types';
import {
  initAuth,
  googleSignIn,
  logoutGoogle,
  getAccessToken
} from '../services/googleAuth';
import {
  createBakerySpreadsheet,
  getSpreadsheetDetails,
  syncAllDataToGoogleSheets,
  loadAllDataFromGoogleSheets,
  appendOrderRow,
  appendProductionRow,
  appendIngredientRow,
  appendWasteRow,
} from '../services/googleSheetsService';

// Predefined Units
const INITIAL_UNITS: Unit[] = [
  { id: 'u-1', code: 'g', name: 'Gram', category: 'weight', baseUnit: 'g', multiplierToBase: 1 },
  { id: 'u-2', code: 'kg', name: 'Kilogram', category: 'weight', baseUnit: 'g', multiplierToBase: 1000 },
  { id: 'u-3', code: 'ml', name: 'Mililiter', category: 'volume', baseUnit: 'ml', multiplierToBase: 1 },
  { id: 'u-4', code: 'liter', name: 'Liter', category: 'volume', baseUnit: 'ml', multiplierToBase: 1000 },
  { id: 'u-5', code: 'butir', name: 'Butir', category: 'count', baseUnit: 'butir', multiplierToBase: 1 },
  { id: 'u-6', code: 'pcs', name: 'Pcs / Buah', category: 'count', baseUnit: 'pcs', multiplierToBase: 1 },
  { id: 'u-7', code: 'sdt', name: 'Sendok Teh (±5g)', category: 'kitchen', baseUnit: 'g', multiplierToBase: 5 },
  { id: 'u-8', code: 'sdm', name: 'Sendok Makan (±15g)', category: 'kitchen', baseUnit: 'g', multiplierToBase: 15 },
  { id: 'u-9', code: 'box', name: 'Box / Dus', category: 'count', baseUnit: 'pcs', multiplierToBase: 1 },
  { id: 'u-10', code: 'lembar', name: 'Lembar Sticker', category: 'count', baseUnit: 'pcs', multiplierToBase: 1 },
];

const INITIAL_PROFILE: BusinessProfile = {
  name: 'PUSAKA Bakery & Bolu',
  tagline: 'Artisan Bolu Pisang Premium & Cake Nusantara',
  ownerName: 'H. Suherman & Tim',
  phone: '081234567890',
  email: 'pusaka.bakery@gmail.com',
  address: 'Jl. R.E. Martadinata No. 88, Citarum',
  city: 'Bandung, Jawa Barat',
  operatingHours: '07.00 - 20.00 WIB',
  currency: 'IDR',
  invoicePrefix: 'INV-PSK',
  productionBatchPrefix: 'BATCH-PSK',
  purchasePrefix: 'PO-PSK',
  whatsappGreetingTemplate: 'Halo Kak! Selamat datang di PUSAKA Bakery.',
  whatsappInvoiceTemplate: '',
  whatsappFollowUpTemplate: '',
};

const INITIAL_SUPPLIERS: Supplier[] = [
  {
    id: 'sup-1',
    name: 'Kebun Pisang Raja Pak Jajang',
    contactPerson: 'Pak Jajang',
    phone: '081398765432',
    address: 'Lembang, Bandung Barat',
    notes: 'Pisang raja ambon matang pohon super, aroma harum',
    suppliedIngredients: ['ing-1'],
  },
  {
    id: 'sup-2',
    name: 'Peternakan Telur Segar Berkah',
    contactPerson: 'Ibu Hj. Siti',
    phone: '081223344556',
    address: 'Jl. Raya Soreang No. 45',
    notes: 'Telur ayam negeri fresh harian ukuran besar',
    suppliedIngredients: ['ing-2'],
  },
  {
    id: 'sup-3',
    name: 'Distributor Bahan Kue Barokah Jaya',
    contactPerson: 'Ko Kevin',
    phone: '081778899001',
    address: 'Pasar Baru Trade Center Lt. Basement',
    notes: 'Tepung Segitiga Biru, Gula Pasir Gulaku, Margarin, Vanilla, Cinnamon',
    suppliedIngredients: ['ing-3', 'ing-4', 'ing-5', 'ing-6', 'ing-7', 'ing-8', 'ing-9'],
  },
  {
    id: 'sup-4',
    name: 'Percetakan & Packaging Mandiri Grafika',
    contactPerson: 'Mas Dodi',
    phone: '085612347890',
    address: 'Jl. Pagarsih No. 112, Bandung',
    notes: 'Box ivory foodgrade 20x20 + window, sticker vinyl laminasi doff, paperbag',
    suppliedIngredients: ['ing-10', 'ing-11', 'ing-12', 'ing-13'],
  },
];

const INITIAL_INGREDIENTS: Ingredient[] = [
  {
    id: 'ing-1',
    sku: 'RAW-PIS-01',
    name: 'Pisang Raja / Ambon Matang',
    category: 'Bahan Utama',
    buyUnit: 'kg',
    recipeUnit: 'g',
    conversionFactor: 1000,
    latestBuyPrice: 20000, // Rp 20.000 / kg
    costPerRecipeUnit: 20, // Rp 20 / g
    stockInRecipeUnit: 12500, // 12.5 kg
    minStockInRecipeUnit: 3000, // 3 kg
    defaultSupplierId: 'sup-1',
    defaultSupplierName: 'Kebun Pisang Raja Pak Jajang',
    status: 'active',
    notes: 'Kondisi matang berbintik hitam manis alami',
    updatedAt: '2026-08-23',
  },
  {
    id: 'ing-2',
    sku: 'RAW-TLR-01',
    name: 'Telur Ayam Segar',
    category: 'Bahan Utama',
    buyUnit: 'kg',
    recipeUnit: 'g',
    conversionFactor: 1000,
    latestBuyPrice: 28000, // Rp 28.000 / kg (± 16 butir)
    costPerRecipeUnit: 28, // Rp 28 / g (1 btr ± 55-60g)
    stockInRecipeUnit: 9800, // 9.8 kg
    minStockInRecipeUnit: 2000, // 2 kg
    defaultSupplierId: 'sup-2',
    defaultSupplierName: 'Peternakan Telur Segar Berkah',
    status: 'active',
    notes: 'Grade A, bersih dan fresh',
    updatedAt: '2026-08-23',
  },
  {
    id: 'ing-3',
    sku: 'RAW-GLA-01',
    name: 'Gula Pasir Kristal Putih',
    category: 'Pemanis & Gula',
    buyUnit: 'kg',
    recipeUnit: 'g',
    conversionFactor: 1000,
    latestBuyPrice: 17500,
    costPerRecipeUnit: 17.5,
    stockInRecipeUnit: 25000, // 25 kg
    minStockInRecipeUnit: 5000,
    defaultSupplierId: 'sup-3',
    defaultSupplierName: 'Distributor Bahan Kue Barokah Jaya',
    status: 'active',
    updatedAt: '2026-08-23',
  },
  {
    id: 'ing-4',
    sku: 'RAW-TPG-01',
    name: 'Tepung Terigu Protein Sedang (Segitiga Biru)',
    category: 'Bahan Utama',
    buyUnit: 'kg',
    recipeUnit: 'g',
    conversionFactor: 1000,
    latestBuyPrice: 14000,
    costPerRecipeUnit: 14,
    stockInRecipeUnit: 35000, // 35 kg
    minStockInRecipeUnit: 6000,
    defaultSupplierId: 'sup-3',
    defaultSupplierName: 'Distributor Bahan Kue Barokah Jaya',
    status: 'active',
    updatedAt: '2026-08-23',
  },
  {
    id: 'ing-5',
    sku: 'RAW-MNY-01',
    name: 'Minyak Goreng Nabati / Kelapa Sawit Super',
    category: 'Dairy & Lemak',
    buyUnit: 'liter',
    recipeUnit: 'g',
    conversionFactor: 900, // 1 liter ± 900g
    latestBuyPrice: 19000,
    costPerRecipeUnit: 21.11,
    stockInRecipeUnit: 18000, // 18 kg / 20 liter
    minStockInRecipeUnit: 4000,
    defaultSupplierId: 'sup-3',
    defaultSupplierName: 'Distributor Bahan Kue Barokah Jaya',
    status: 'active',
    updatedAt: '2026-08-23',
  },
  {
    id: 'ing-6',
    sku: 'RAW-BKS-01',
    name: 'Baking Soda (Sodium Bikarbonat)',
    category: 'Bahan Pengembang & Ragi',
    buyUnit: 'pack (500g)',
    recipeUnit: 'g',
    conversionFactor: 500,
    latestBuyPrice: 15000,
    costPerRecipeUnit: 30,
    stockInRecipeUnit: 1200,
    minStockInRecipeUnit: 300,
    defaultSupplierId: 'sup-3',
    defaultSupplierName: 'Distributor Bahan Kue Barokah Jaya',
    status: 'active',
    updatedAt: '2026-08-23',
  },
  {
    id: 'ing-7',
    sku: 'RAW-CIN-01',
    name: 'Bubuk Kayu Manis (Cinnamon Powder)',
    category: 'Perasa, Pewarna & Rempah',
    buyUnit: 'pack (250g)',
    recipeUnit: 'g',
    conversionFactor: 250,
    latestBuyPrice: 22000,
    costPerRecipeUnit: 88,
    stockInRecipeUnit: 850,
    minStockInRecipeUnit: 100,
    defaultSupplierId: 'sup-3',
    defaultSupplierName: 'Distributor Bahan Kue Barokah Jaya',
    status: 'active',
    updatedAt: '2026-08-23',
  },
  {
    id: 'ing-8',
    sku: 'RAW-VAN-01',
    name: 'Ekstrak Vanilla Cair Premium',
    category: 'Perasa, Pewarna & Rempah',
    buyUnit: 'botol (100ml)',
    recipeUnit: 'g',
    conversionFactor: 100,
    latestBuyPrice: 35000,
    costPerRecipeUnit: 350,
    stockInRecipeUnit: 450,
    minStockInRecipeUnit: 50,
    defaultSupplierId: 'sup-3',
    defaultSupplierName: 'Distributor Bahan Kue Barokah Jaya',
    status: 'active',
    updatedAt: '2026-08-23',
  },
  {
    id: 'ing-9',
    sku: 'RAW-GRM-01',
    name: 'Garam Halus Beryodium',
    category: 'Bahan Utama',
    buyUnit: 'pack (500g)',
    recipeUnit: 'g',
    conversionFactor: 500,
    latestBuyPrice: 5000,
    costPerRecipeUnit: 10,
    stockInRecipeUnit: 2500,
    minStockInRecipeUnit: 500,
    defaultSupplierId: 'sup-3',
    defaultSupplierName: 'Distributor Bahan Kue Barokah Jaya',
    status: 'active',
    updatedAt: '2026-08-23',
  },
  // Packaging Materials
  {
    id: 'ing-10',
    sku: 'PKG-BOX-20',
    name: 'Box Bolu Premium Ivory 20x20 Window',
    category: 'Kemasan & Packaging',
    buyUnit: 'pack (50 pcs)',
    recipeUnit: 'pcs',
    conversionFactor: 50,
    latestBuyPrice: 125000,
    costPerRecipeUnit: 2500, // Rp 2.500 / pcs
    stockInRecipeUnit: 180,
    minStockInRecipeUnit: 30,
    defaultSupplierId: 'sup-4',
    defaultSupplierName: 'Percetakan & Packaging Mandiri Grafika',
    status: 'active',
    updatedAt: '2026-08-23',
  },
  {
    id: 'ing-11',
    sku: 'PKG-STK-01',
    name: 'Sticker Segel Logo PUSAKA Gold Foil',
    category: 'Kemasan & Packaging',
    buyUnit: 'pack (100 lembar)',
    recipeUnit: 'pcs',
    conversionFactor: 100,
    latestBuyPrice: 35000,
    costPerRecipeUnit: 350,
    stockInRecipeUnit: 420,
    minStockInRecipeUnit: 50,
    defaultSupplierId: 'sup-4',
    defaultSupplierName: 'Percetakan & Packaging Mandiri Grafika',
    status: 'active',
    updatedAt: '2026-08-23',
  },
  {
    id: 'ing-12',
    sku: 'PKG-PLS-20',
    name: 'Alas Baking Paper / Plastik OPP Foodgrade',
    category: 'Kemasan & Packaging',
    buyUnit: 'pack (100 pcs)',
    recipeUnit: 'pcs',
    conversionFactor: 100,
    latestBuyPrice: 20000,
    costPerRecipeUnit: 200,
    stockInRecipeUnit: 350,
    minStockInRecipeUnit: 50,
    defaultSupplierId: 'sup-4',
    defaultSupplierName: 'Percetakan & Packaging Mandiri Grafika',
    status: 'active',
    updatedAt: '2026-08-23',
  },
  {
    id: 'ing-13',
    sku: 'PKG-PBG-01',
    name: 'Paper Bag Kraft Handle PUSAKA',
    category: 'Kemasan & Packaging',
    buyUnit: 'pack (50 pcs)',
    recipeUnit: 'pcs',
    conversionFactor: 50,
    latestBuyPrice: 75000,
    costPerRecipeUnit: 1500,
    stockInRecipeUnit: 95,
    minStockInRecipeUnit: 25,
    defaultSupplierId: 'sup-4',
    defaultSupplierName: 'Percetakan & Packaging Mandiri Grafika',
    status: 'active',
    updatedAt: '2026-08-23',
  },
  {
    id: 'ing-14',
    sku: 'RAW-CHOC-01',
    name: 'Dark Cooking Chocolate (DCC Colatta)',
    category: 'Bahan Utama',
    buyUnit: 'kg',
    recipeUnit: 'g',
    conversionFactor: 1000,
    latestBuyPrice: 65000,
    costPerRecipeUnit: 65,
    stockInRecipeUnit: 4500,
    minStockInRecipeUnit: 1500,
    defaultSupplierId: 'sup-3',
    defaultSupplierName: 'Distributor Bahan Kue Barokah Jaya',
    status: 'active',
    updatedAt: '2026-08-23',
  },
  {
    id: 'ing-15',
    sku: 'RAW-CHS-01',
    name: 'Keju Cheddar Olahan Parut (Kraft/Prochiz)',
    category: 'Topping & Isian',
    buyUnit: 'block (2kg)',
    recipeUnit: 'g',
    conversionFactor: 2000,
    latestBuyPrice: 130000,
    costPerRecipeUnit: 65,
    stockInRecipeUnit: 3000,
    minStockInRecipeUnit: 1000,
    defaultSupplierId: 'sup-3',
    defaultSupplierName: 'Distributor Bahan Kue Barokah Jaya',
    status: 'active',
    updatedAt: '2026-08-23',
  }
];

// Initial Recipes with precise requested Bolu Pisang Medium composition
const INITIAL_RECIPES: Recipe[] = [
  {
    id: 'rec-1',
    name: 'Bolu Pisang Medium (Ø20 cm)',
    category: 'Bolu Tradisional',
    description: 'Resep andalan Bolu Pisang moist beraroma harum rempah cinnamon alami',
    currentVersionId: 'ver-1-1',
    createdAt: '2026-08-01',
    updatedAt: '2026-08-20',
    versions: [
      {
        id: 'ver-1-0',
        versionNumber: 'v1.0',
        changeLog: 'Resep awal formulasi standar',
        targetBatterWeightGram: 925,
        targetBakedWeightGram: 900,
        yieldQty: 1,
        items: [
          { id: 'b-1', ingredientId: 'ing-2', ingredientName: 'Telur Ayam Segar', quantity: 160, recipeUnit: 'g', unitCostSnapshot: 28, cost: 4480 },
          { id: 'b-2', ingredientId: 'ing-3', ingredientName: 'Gula Pasir Kristal Putih', quantity: 135, recipeUnit: 'g', unitCostSnapshot: 17.5, cost: 2362.5 },
          { id: 'b-3', ingredientId: 'ing-1', ingredientName: 'Pisang Raja / Ambon Matang', quantity: 300, recipeUnit: 'g', unitCostSnapshot: 20, cost: 6000 },
          { id: 'b-4', ingredientId: 'ing-9', ingredientName: 'Garam Halus Beryodium', quantity: 1.5, recipeUnit: 'g', unitCostSnapshot: 10, cost: 15 },
          { id: 'b-5', ingredientId: 'ing-8', ingredientName: 'Ekstrak Vanilla Cair Premium', quantity: 2.5, recipeUnit: 'g', unitCostSnapshot: 350, cost: 875 },
          { id: 'b-6', ingredientId: 'ing-4', ingredientName: 'Tepung Terigu Protein Sedang (Segitiga Biru)', quantity: 186, recipeUnit: 'g', unitCostSnapshot: 14, cost: 2604 },
          { id: 'b-7', ingredientId: 'ing-6', ingredientName: 'Baking Soda (Sodium Bikarbonat)', quantity: 7, recipeUnit: 'g', unitCostSnapshot: 30, cost: 210 },
          { id: 'b-8', ingredientId: 'ing-7', ingredientName: 'Bubuk Kayu Manis (Cinnamon Powder)', quantity: 1.5, recipeUnit: 'g', unitCostSnapshot: 88, cost: 132 },
          { id: 'b-9', ingredientId: 'ing-5', ingredientName: 'Minyak Goreng Nabati / Kelapa Sawit Super', quantity: 135, recipeUnit: 'g', unitCostSnapshot: 21.11, cost: 2850 },
        ],
        packaging: [
          { id: 'pkg-1', ingredientId: 'ing-10', name: 'Box Bolu Premium Ivory 20x20 Window', quantity: 1, unitCost: 2500, totalCost: 2500 },
          { id: 'pkg-2', ingredientId: 'ing-11', name: 'Sticker Segel Logo PUSAKA Gold Foil', quantity: 1, unitCost: 350, totalCost: 350 },
          { id: 'pkg-3', ingredientId: 'ing-12', name: 'Alas Baking Paper / Plastik OPP Foodgrade', quantity: 1, unitCost: 200, totalCost: 200 },
        ],
        directCosts: [
          { id: 'dc-1', name: 'Gas Elpiji Oven (per loyang)', costType: 'per_unit', amount: 1500 },
          { id: 'dc-2', name: 'Listrik Mixer & Lampu Oven', costType: 'per_unit', amount: 800 },
          { id: 'dc-3', name: 'Upah Baker & Asisten Produksi', costType: 'per_unit', amount: 3500 },
        ],
        totalRawCost: 19528.5,
        totalPackagingCost: 3050,
        totalDirectCost: 5800,
        totalHppPerUnit: 28378.5,
        notes: 'Uji coba batch pertama',
        createdAt: '2026-08-01',
        createdBy: 'Chef Rendy',
      },
      {
        id: 'ver-1-1',
        versionNumber: 'v1.1',
        changeLog: 'Optimasi takaran gula 135g & cinnamon 1.5g agar rasa karamel pisang lebih keluar maksimal.',
        targetBatterWeightGram: 925,
        targetBakedWeightGram: 900,
        yieldQty: 1,
        items: [
          { id: 'b-1', ingredientId: 'ing-2', ingredientName: 'Telur Ayam Segar', quantity: 160, recipeUnit: 'g', unitCostSnapshot: 28, cost: 4480 },
          { id: 'b-2', ingredientId: 'ing-3', ingredientName: 'Gula Pasir Kristal Putih', quantity: 135, recipeUnit: 'g', unitCostSnapshot: 17.5, cost: 2362.5 },
          { id: 'b-3', ingredientId: 'ing-1', ingredientName: 'Pisang Raja / Ambon Matang', quantity: 300, recipeUnit: 'g', unitCostSnapshot: 20, cost: 6000 },
          { id: 'b-4', ingredientId: 'ing-9', ingredientName: 'Garam Halus Beryodium', quantity: 1.5, recipeUnit: 'g', unitCostSnapshot: 10, cost: 15 },
          { id: 'b-5', ingredientId: 'ing-8', ingredientName: 'Ekstrak Vanilla Cair Premium', quantity: 2.5, recipeUnit: 'g', unitCostSnapshot: 350, cost: 875 },
          { id: 'b-6', ingredientId: 'ing-4', ingredientName: 'Tepung Terigu Protein Sedang (Segitiga Biru)', quantity: 186, recipeUnit: 'g', unitCostSnapshot: 14, cost: 2604 },
          { id: 'b-7', ingredientId: 'ing-6', ingredientName: 'Baking Soda (Sodium Bikarbonat)', quantity: 7, recipeUnit: 'g', unitCostSnapshot: 30, cost: 210 },
          { id: 'b-8', ingredientId: 'ing-7', ingredientName: 'Bubuk Kayu Manis (Cinnamon Powder)', quantity: 1.5, recipeUnit: 'g', unitCostSnapshot: 88, cost: 132 },
          { id: 'b-9', ingredientId: 'ing-5', ingredientName: 'Minyak Goreng Nabati / Kelapa Sawit Super', quantity: 135, recipeUnit: 'g', unitCostSnapshot: 21.11, cost: 2850 },
        ],
        packaging: [
          { id: 'pkg-1', ingredientId: 'ing-10', name: 'Box Bolu Premium Ivory 20x20 Window', quantity: 1, unitCost: 2500, totalCost: 2500 },
          { id: 'pkg-2', ingredientId: 'ing-11', name: 'Sticker Segel Logo PUSAKA Gold Foil', quantity: 1, unitCost: 350, totalCost: 350 },
          { id: 'pkg-3', ingredientId: 'ing-12', name: 'Alas Baking Paper / Plastik OPP Foodgrade', quantity: 1, unitCost: 200, totalCost: 200 },
        ],
        directCosts: [
          { id: 'dc-1', name: 'Gas Elpiji Oven (per loyang)', costType: 'per_unit', amount: 1500 },
          { id: 'dc-2', name: 'Listrik Mixer & Lampu Oven', costType: 'per_unit', amount: 800 },
          { id: 'dc-3', name: 'Upah Baker & Asisten Produksi', costType: 'per_unit', amount: 3500 },
        ],
        totalRawCost: 19528.5,
        totalPackagingCost: 3050,
        totalDirectCost: 5800,
        totalHppPerUnit: 28378.5,
        notes: 'Versi aktif komersial, tekstur empuk berserat lembut tahan 4 hari di suhu ruang',
        createdAt: '2026-08-20',
        createdBy: 'Chef Rendy & Tim',
      },
    ],
  },
  {
    id: 'rec-2',
    name: 'Bolu Pisang Keju Premium (Ø20 cm)',
    category: 'Bolu Tradisional',
    description: 'Bolu pisang dengan topping keju cheddar parut melimpah dan gurih',
    currentVersionId: 'ver-2-0',
    createdAt: '2026-08-10',
    updatedAt: '2026-08-10',
    versions: [
      {
        id: 'ver-2-0',
        versionNumber: 'v1.0',
        changeLog: 'Resep dasar dengan taburan keju 75g',
        targetBatterWeightGram: 1000,
        targetBakedWeightGram: 975,
        yieldQty: 1,
        items: [
          { id: 'b-1', ingredientId: 'ing-2', ingredientName: 'Telur Ayam Segar', quantity: 160, recipeUnit: 'g', unitCostSnapshot: 28, cost: 4480 },
          { id: 'b-2', ingredientId: 'ing-3', ingredientName: 'Gula Pasir Kristal Putih', quantity: 135, recipeUnit: 'g', unitCostSnapshot: 17.5, cost: 2362.5 },
          { id: 'b-3', ingredientId: 'ing-1', ingredientName: 'Pisang Raja / Ambon Matang', quantity: 300, recipeUnit: 'g', unitCostSnapshot: 20, cost: 6000 },
          { id: 'b-4', ingredientId: 'ing-9', ingredientName: 'Garam Halus Beryodium', quantity: 1.5, recipeUnit: 'g', unitCostSnapshot: 10, cost: 15 },
          { id: 'b-5', ingredientId: 'ing-8', ingredientName: 'Ekstrak Vanilla Cair Premium', quantity: 2.5, recipeUnit: 'g', unitCostSnapshot: 350, cost: 875 },
          { id: 'b-6', ingredientId: 'ing-4', ingredientName: 'Tepung Terigu Protein Sedang', quantity: 186, recipeUnit: 'g', unitCostSnapshot: 14, cost: 2604 },
          { id: 'b-7', ingredientId: 'ing-6', ingredientName: 'Baking Soda', quantity: 7, recipeUnit: 'g', unitCostSnapshot: 30, cost: 210 },
          { id: 'b-8', ingredientId: 'ing-5', ingredientName: 'Minyak Goreng Nabati', quantity: 135, recipeUnit: 'g', unitCostSnapshot: 21.11, cost: 2850 },
          { id: 'b-9', ingredientId: 'ing-15', ingredientName: 'Keju Cheddar Olahan Parut', quantity: 75, recipeUnit: 'g', unitCostSnapshot: 65, cost: 4875 },
        ],
        packaging: [
          { id: 'pkg-1', ingredientId: 'ing-10', name: 'Box Bolu Premium Ivory 20x20 Window', quantity: 1, unitCost: 2500, totalCost: 2500 },
          { id: 'pkg-2', ingredientId: 'ing-11', name: 'Sticker Segel Logo PUSAKA Gold Foil', quantity: 1, unitCost: 350, totalCost: 350 },
        ],
        directCosts: [
          { id: 'dc-1', name: 'Biaya Energi & Tenaga Kerja', costType: 'per_unit', amount: 5800 },
        ],
        totalRawCost: 24271.5,
        totalPackagingCost: 2850,
        totalDirectCost: 5800,
        totalHppPerUnit: 32921.5,
        createdAt: '2026-08-10',
        createdBy: 'Chef Rendy',
      }
    ]
  },
  {
    id: 'rec-3',
    name: 'Bolu Pisang Choco Melt (Ø20 cm)',
    category: 'Bolu Tradisional',
    description: 'Kombinasi pisang karamel dengan lelehan cokelat dark compound belgian style',
    currentVersionId: 'ver-3-0',
    createdAt: '2026-08-15',
    updatedAt: '2026-08-15',
    versions: [
      {
        id: 'ver-3-0',
        versionNumber: 'v1.0',
        changeLog: 'Resep varian coklat pisang',
        targetBatterWeightGram: 1000,
        targetBakedWeightGram: 975,
        yieldQty: 1,
        items: [
          { id: 'b-1', ingredientId: 'ing-2', ingredientName: 'Telur Ayam Segar', quantity: 160, recipeUnit: 'g', unitCostSnapshot: 28, cost: 4480 },
          { id: 'b-2', ingredientId: 'ing-3', ingredientName: 'Gula Pasir Kristal Putih', quantity: 135, recipeUnit: 'g', unitCostSnapshot: 17.5, cost: 2362.5 },
          { id: 'b-3', ingredientId: 'ing-1', ingredientName: 'Pisang Raja / Ambon Matang', quantity: 300, recipeUnit: 'g', unitCostSnapshot: 20, cost: 6000 },
          { id: 'b-4', ingredientId: 'ing-4', ingredientName: 'Tepung Terigu Protein Sedang', quantity: 186, recipeUnit: 'g', unitCostSnapshot: 14, cost: 2604 },
          { id: 'b-5', ingredientId: 'ing-5', ingredientName: 'Minyak Goreng Nabati', quantity: 135, recipeUnit: 'g', unitCostSnapshot: 21.11, cost: 2850 },
          { id: 'b-6', ingredientId: 'ing-14', ingredientName: 'Dark Cooking Chocolate (DCC)', quantity: 80, recipeUnit: 'g', unitCostSnapshot: 65, cost: 5200 },
          { id: 'b-7', ingredientId: 'ing-6', ingredientName: 'Baking Soda', quantity: 7, recipeUnit: 'g', unitCostSnapshot: 30, cost: 210 },
        ],
        packaging: [
          { id: 'pkg-1', ingredientId: 'ing-10', name: 'Box Bolu Premium Ivory 20x20 Window', quantity: 1, unitCost: 2500, totalCost: 2500 },
          { id: 'pkg-2', ingredientId: 'ing-11', name: 'Sticker Segel Logo PUSAKA Gold Foil', quantity: 1, unitCost: 350, totalCost: 350 },
        ],
        directCosts: [
          { id: 'dc-1', name: 'Biaya Energi & Tenaga Kerja', costType: 'per_unit', amount: 5800 },
        ],
        totalRawCost: 23706.5,
        totalPackagingCost: 2850,
        totalDirectCost: 5800,
        totalHppPerUnit: 32356.5,
        createdAt: '2026-08-15',
        createdBy: 'Chef Rendy',
      }
    ]
  }
];

// Initial Finished Products Catalog
const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    sku: 'BP-M',
    name: 'Bolu Pisang Medium Original',
    category: 'Bolu Pisang',
    sizeSpec: 'Ø20 cm (Medium)',
    bakedWeightGram: 900,
    recipeId: 'rec-1',
    recipeVersionId: 'ver-1-1',
    sellingPrice: 55000,
    baseHpp: 28378.5,
    grossMarginPercent: 48.4, // (55000 - 28378.5) / 55000 = 48.4%
    stockFinishedGoods: 8,
    minStockFinishedGoods: 5,
    status: 'active',
    description: 'Bolu pisang klasik lembut dengan aroma rempah kayu manis dan pisang raja ambon segar.',
    shelfLifeDays: 4,
  },
  {
    id: 'prod-2',
    sku: 'BP-KEJU',
    name: 'Bolu Pisang Keju Spesial',
    category: 'Bolu Pisang',
    sizeSpec: 'Ø20 cm (Medium)',
    bakedWeightGram: 975,
    recipeId: 'rec-2',
    recipeVersionId: 'ver-2-0',
    sellingPrice: 65000,
    baseHpp: 32921.5,
    grossMarginPercent: 49.3,
    stockFinishedGoods: 6,
    minStockFinishedGoods: 4,
    status: 'active',
    description: 'Kombinasi manis legit pisang dan gurihnya limpahan keju cheddar parut emas.',
    shelfLifeDays: 4,
  },
  {
    id: 'prod-3',
    sku: 'BP-COK',
    name: 'Bolu Pisang Choco Melt',
    category: 'Bolu Pisang',
    sizeSpec: 'Ø20 cm (Medium)',
    bakedWeightGram: 975,
    recipeId: 'rec-3',
    recipeVersionId: 'ver-3-0',
    sellingPrice: 65000,
    baseHpp: 32356.5,
    grossMarginPercent: 50.2,
    stockFinishedGoods: 5,
    minStockFinishedGoods: 4,
    status: 'active',
    description: 'Sensasi lelehan cokelat dark premium di setiap gigitan bolu pisang lembut.',
    shelfLifeDays: 4,
  },
];

const INITIAL_CUSTOMERS: Customer[] = [
  {
    id: 'cust-1',
    name: 'Ibu Ratna Kumalasari',
    phone: '081234889911',
    email: 'ratna.k@gmail.com',
    address: 'Komplek Dago Asri No. 14B',
    city: 'Bandung',
    tier: 'LOYAL',
    totalOrders: 6,
    totalSpend: 540000,
    lastOrderDate: '2026-08-22',
    notes: 'Sering pesan untuk arisan & oleh-oleh kantor. Suka Bolu Pisang Keju.',
    favoriteProducts: ['Bolu Pisang Keju Spesial', 'Bolu Pisang Medium Original'],
    createdAt: '2026-07-10',
  },
  {
    id: 'cust-2',
    name: 'Pak Budi Santoso',
    phone: '081399887766',
    address: 'Jl. Riau No. 102, Cibeunying',
    city: 'Bandung',
    tier: 'AKTIF',
    totalOrders: 3,
    totalSpend: 245000,
    lastOrderDate: '2026-08-20',
    notes: 'Pesan via WhatsApp untuk konsumsi keluarga akhir pekan.',
    favoriteProducts: ['Bolu Pisang Medium Original'],
    createdAt: '2026-07-25',
  },
  {
    id: 'cust-3',
    name: 'dr. Anita Wijaya',
    phone: '085711223344',
    address: 'Klinik Medika Pasteur, Jl. Pasteur No. 34',
    city: 'Bandung',
    tier: 'LOYAL',
    totalOrders: 4,
    totalSpend: 420000,
    lastOrderDate: '2026-08-18',
    notes: 'Suka hampers bolu untuk bingkisan dokter sejawat.',
    favoriteProducts: ['Bolu Pisang Choco Melt', 'Bolu Pisang Medium Original'],
    createdAt: '2026-07-15',
  },
  {
    id: 'cust-4',
    name: 'Ibu Maya Septiani',
    phone: '081900112233',
    address: 'Jl. Buah Batu No. 210',
    city: 'Bandung',
    tier: 'PASIF',
    totalOrders: 1,
    totalSpend: 55000,
    lastOrderDate: '2026-08-05',
    notes: 'Belum order lagi > 2 minggu, cocok di-follow-up dengan promo repeat order!',
    favoriteProducts: ['Bolu Pisang Medium Original'],
    createdAt: '2026-08-05',
  },
  {
    id: 'cust-5',
    name: 'Mas Hendra Prasetyo (Reseller)',
    phone: '081288990022',
    address: 'Kantin Karyawan Gedung Sate',
    city: 'Bandung',
    tier: 'LOYAL',
    totalOrders: 8,
    totalSpend: 1100000,
    lastOrderDate: '2026-08-23',
    notes: 'Reseller rutin tiap Senin & Kamis pagi ambil 5-10 box.',
    favoriteProducts: ['Bolu Pisang Medium Original', 'Bolu Pisang Keju Spesial'],
    createdAt: '2026-07-01',
  },
];

const INITIAL_ORDERS: Order[] = [
  {
    id: 'ord-101',
    invoiceNumber: 'INV-PSK-20260823-001',
    date: '2026-08-23',
    customerId: 'cust-5',
    customerName: 'Mas Hendra Prasetyo (Reseller)',
    customerPhone: '081288990022',
    customerAddress: 'Kantin Karyawan Gedung Sate, Bandung',
    source: 'RESELLER',
    items: [
      {
        productId: 'prod-1',
        productName: 'Bolu Pisang Medium Original',
        sku: 'BP-M',
        qty: 4,
        unitPrice: 50000, // Reseller price
        hppSnapshot: 28378.5,
        subtotal: 200000,
      },
      {
        productId: 'prod-2',
        productName: 'Bolu Pisang Keju Spesial',
        sku: 'BP-KEJU',
        qty: 2,
        unitPrice: 60000,
        hppSnapshot: 32921.5,
        subtotal: 120000,
      },
    ],
    subtotal: 320000,
    discountType: 'NOMINAL',
    discountValue: 10000,
    discountAmount: 10000,
    shippingFee: 0,
    totalAmount: 310000,
    totalHpp: 179357, // (4 * 28378.5) + (2 * 32921.5)
    grossProfit: 130643,
    paymentStatus: 'LUNAS',
    paidAmount: 310000,
    paymentMethod: 'TRANSFER_BCA',
    fulfillmentStatus: 'SELESAI',
    deliveryType: 'PICKUP',
    notes: 'Diambil jam 08.30 pagi untuk jualan sarapan di kantin.',
    createdBy: 'Kasir Sinta',
    createdAt: '2026-08-23T08:15:00',
  },
  {
    id: 'ord-102',
    invoiceNumber: 'INV-PSK-20260823-002',
    date: '2026-08-23',
    customerId: 'cust-1',
    customerName: 'Ibu Ratna Kumalasari',
    customerPhone: '081234889911',
    customerAddress: 'Komplek Dago Asri No. 14B, Bandung',
    source: 'WHATSAPP',
    items: [
      {
        productId: 'prod-2',
        productName: 'Bolu Pisang Keju Spesial',
        sku: 'BP-KEJU',
        qty: 2,
        unitPrice: 65000,
        hppSnapshot: 32921.5,
        subtotal: 130000,
      },
      {
        productId: 'prod-3',
        productName: 'Bolu Pisang Choco Melt',
        sku: 'BP-COK',
        qty: 1,
        unitPrice: 65000,
        hppSnapshot: 32356.5,
        subtotal: 65000,
      },
    ],
    subtotal: 195000,
    discountType: 'NOMINAL',
    discountValue: 0,
    discountAmount: 0,
    shippingFee: 15000,
    totalAmount: 210000,
    totalHpp: 98199.5,
    grossProfit: 96800.5,
    paymentStatus: 'LUNAS',
    paidAmount: 210000,
    paymentMethod: 'QRIS',
    fulfillmentStatus: 'DIKIRIM',
    deliveryType: 'DELIVERY',
    courierName: 'Gosend Instant',
    trackingNumber: 'GK-8823199',
    notes: 'Kirim sore jam 15.00 hangat untuk pengajian keluarga',
    createdBy: 'Kasir Sinta',
    createdAt: '2026-08-23T11:20:00',
  },
  {
    id: 'ord-103',
    invoiceNumber: 'INV-PSK-20260823-003',
    date: '2026-08-23',
    customerId: 'cust-2',
    customerName: 'Pak Budi Santoso',
    customerPhone: '081399887766',
    customerAddress: 'Jl. Riau No. 102, Bandung',
    source: 'INSTAGRAM',
    items: [
      {
        productId: 'prod-1',
        productName: 'Bolu Pisang Medium Original',
        sku: 'BP-M',
        qty: 2,
        unitPrice: 55000,
        hppSnapshot: 28378.5,
        subtotal: 110000,
      },
    ],
    subtotal: 110000,
    discountType: 'NOMINAL',
    discountValue: 0,
    discountAmount: 0,
    shippingFee: 0,
    totalAmount: 110000,
    totalHpp: 56757,
    grossProfit: 53243,
    paymentStatus: 'DP',
    paidAmount: 50000,
    paymentMethod: 'TRANSFER_MANDIRI',
    fulfillmentStatus: 'DIPROSES',
    deliveryType: 'PICKUP',
    notes: 'Ambil jam 17.00 sepulang kantor. Sisa Rp 60.000 bayar tunai di kasir.',
    createdBy: 'Admin Putri',
    createdAt: '2026-08-23T13:45:00',
  },
];

const INITIAL_PRODUCTIONS: ProductionRun[] = [
  {
    id: 'prod-run-01',
    batchNumber: 'BATCH-PSK-20260823-01',
    date: '2026-08-23',
    productId: 'prod-1',
    productName: 'Bolu Pisang Medium Original',
    recipeId: 'rec-1',
    recipeVersionNumber: 'v1.1',
    targetQty: 5,
    actualYieldQty: 5,
    rejectedQty: 0,
    status: 'SELESAI',
    ingredients: [
      { ingredientId: 'ing-2', ingredientName: 'Telur Ayam Segar', requiredQty: 800, unit: 'g', availableStock: 9800, isSufficient: true, cost: 22400 },
      { ingredientId: 'ing-3', ingredientName: 'Gula Pasir Kristal', requiredQty: 675, unit: 'g', availableStock: 25000, isSufficient: true, cost: 11812.5 },
      { ingredientId: 'ing-1', ingredientName: 'Pisang Raja Matang', requiredQty: 1500, unit: 'g', availableStock: 12500, isSufficient: true, cost: 30000 },
      { ingredientId: 'ing-4', ingredientName: 'Tepung Terigu Segitiga', requiredQty: 930, unit: 'g', availableStock: 35000, isSufficient: true, cost: 13020 },
      { ingredientId: 'ing-5', ingredientName: 'Minyak Goreng Nabati', requiredQty: 675, unit: 'g', availableStock: 18000, isSufficient: true, cost: 14250 },
      { ingredientId: 'ing-6', ingredientName: 'Baking Soda', requiredQty: 35, unit: 'g', availableStock: 1200, isSufficient: true, cost: 1050 },
      { ingredientId: 'ing-7', ingredientName: 'Cinnamon Powder', requiredQty: 7.5, unit: 'g', availableStock: 850, isSufficient: true, cost: 660 },
      { ingredientId: 'ing-8', ingredientName: 'Vanilla Extract', requiredQty: 12.5, unit: 'g', availableStock: 450, isSufficient: true, cost: 4375 },
      { ingredientId: 'ing-9', ingredientName: 'Garam Halus', requiredQty: 7.5, unit: 'g', availableStock: 2500, isSufficient: true, cost: 75 },
    ],
    packagingUsed: [
      { packagingId: 'ing-10', name: 'Box Bolu Premium Ivory 20x20', qty: 5, unitCost: 2500, totalCost: 12500 },
      { packagingId: 'ing-11', name: 'Sticker Segel Gold Foil', qty: 5, unitCost: 350, totalCost: 1750 },
      { packagingId: 'ing-12', name: 'Alas Baking Paper Foodgrade', qty: 5, unitCost: 200, totalCost: 1000 },
    ],
    directCosts: [
      { name: 'Gas Elpiji & Energi Oven', amount: 7500 },
      { name: 'Upah Tenaga Kerja Produksi Batch', amount: 17500 },
    ],
    totalProductionCost: 137842.5,
    unitProductionCost: 27568.5,
    isStockDeducted: true,
    isFinishedStockAdded: true,
    operatorName: 'Chef Rendy',
    notes: 'Batch pagi 5 pcs matang sempurna, warna golden brown merata.',
    timeline: [
      { status: 'DRAFT', timestamp: '2026-08-23T06:00:00', note: 'Rencana produksi dibuat' },
      { status: 'DIRACIK', timestamp: '2026-08-23T06:15:00', note: 'Bahan ditimbang & dikocok' },
      { status: 'DIPANGGANG', timestamp: '2026-08-23T06:45:00', note: 'Suhu oven 175°C selama 45 menit' },
      { status: 'PENDINGINAN', timestamp: '2026-08-23T07:30:00', note: 'Cooling rack 30 menit' },
      { status: 'QC', timestamp: '2026-08-23T08:00:00', note: 'Lolos uji tekstur, aroma, dan berat' },
      { status: 'SELESAI', timestamp: '2026-08-23T08:10:00', note: 'Kemas box & masuk etalase' },
    ],
    startedAt: '2026-08-23T06:15:00',
    finishedAt: '2026-08-23T08:10:00',
  },
  {
    id: 'prod-run-02',
    batchNumber: 'BATCH-PSK-20260823-02',
    date: '2026-08-23',
    productId: 'prod-2',
    productName: 'Bolu Pisang Keju Spesial',
    recipeId: 'rec-2',
    recipeVersionNumber: 'v1.0',
    targetQty: 4,
    actualYieldQty: 0,
    rejectedQty: 0,
    status: 'DIPANGGANG',
    ingredients: [
      { ingredientId: 'ing-2', ingredientName: 'Telur Ayam Segar', requiredQty: 640, unit: 'g', availableStock: 9160, isSufficient: true, cost: 17920 },
      { ingredientId: 'ing-1', ingredientName: 'Pisang Raja Matang', requiredQty: 1200, unit: 'g', availableStock: 11000, isSufficient: true, cost: 24000 },
      { ingredientId: 'ing-4', ingredientName: 'Tepung Terigu Segitiga', requiredQty: 744, unit: 'g', availableStock: 34070, isSufficient: true, cost: 10416 },
      { ingredientId: 'ing-15', ingredientName: 'Keju Cheddar Parut', requiredQty: 300, unit: 'g', availableStock: 3000, isSufficient: true, cost: 19500 },
    ],
    packagingUsed: [
      { packagingId: 'ing-10', name: 'Box Bolu Premium Ivory 20x20', qty: 4, unitCost: 2500, totalCost: 10000 },
    ],
    directCosts: [
      { name: 'Energi & Tenaga Kerja', amount: 23200 },
    ],
    totalProductionCost: 131686,
    unitProductionCost: 32921.5,
    isStockDeducted: true,
    isFinishedStockAdded: false,
    operatorName: 'Agus Baking',
    notes: 'Sedang di oven 2, estimasi matang 15 menit lagi.',
    timeline: [
      { status: 'DRAFT', timestamp: '2026-08-23T13:00:00' },
      { status: 'DIRACIK', timestamp: '2026-08-23T13:20:00' },
      { status: 'DIPANGGANG', timestamp: '2026-08-23T13:50:00', note: 'Masuk oven 175°C' },
    ],
    startedAt: '2026-08-23T13:20:00',
  }
];

const INITIAL_PURCHASES: Purchase[] = [
  {
    id: 'po-1',
    purchaseNumber: 'PO-PSK-20260822-001',
    date: '2026-08-22',
    supplierId: 'sup-1',
    supplierName: 'Kebun Pisang Raja Pak Jajang',
    items: [
      {
        ingredientId: 'ing-1',
        ingredientName: 'Pisang Raja / Ambon Matang',
        buyUnit: 'kg',
        recipeUnit: 'g',
        conversionFactor: 1000,
        qtyBuyUnit: 15,
        pricePerBuyUnit: 20000,
        subtotal: 300000,
      }
    ],
    totalAmount: 300000,
    paymentStatus: 'LUNAS',
    notes: 'Pisang fresh baru petik, kualitas super legit',
    recordedBy: 'Admin Putri',
    createdAt: '2026-08-22T09:00:00',
  },
  {
    id: 'po-2',
    purchaseNumber: 'PO-PSK-20260822-002',
    date: '2026-08-22',
    supplierId: 'sup-2',
    supplierName: 'Peternakan Telur Segar Berkah',
    items: [
      {
        ingredientId: 'ing-2',
        ingredientName: 'Telur Ayam Segar',
        buyUnit: 'kg',
        recipeUnit: 'g',
        conversionFactor: 1000,
        qtyBuyUnit: 10,
        pricePerBuyUnit: 28000,
        subtotal: 280000,
      }
    ],
    totalAmount: 280000,
    paymentStatus: 'LUNAS',
    notes: 'Pengiriman pagi jam 07.00',
    recordedBy: 'Admin Putri',
    createdAt: '2026-08-22T09:30:00',
  },
];

const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    date: '2026-08-20',
    category: 'Listrik, Gas & Air',
    description: 'Isi ulang Gas Elpiji 12kg (2 tabung untuk oven gas)',
    amount: 440000,
    paymentMethod: 'CASH',
    receiptNumber: 'NOTA-GAS-88',
    recordedBy: 'Admin Putri',
    createdAt: '2026-08-20T10:00:00',
  },
  {
    id: 'exp-2',
    date: '2026-08-18',
    category: 'Marketing, Iklan & Promosi',
    description: 'Instagram Ads & TikTok Boost Video Bolu Pisang Hangat',
    amount: 350000,
    paymentMethod: 'TRANSFER_BCA',
    receiptNumber: 'FB-META-9921',
    recordedBy: 'Owner Suherman',
    createdAt: '2026-08-18T14:30:00',
  },
  {
    id: 'exp-3',
    date: '2026-08-15',
    category: 'Administrasi, Internet & ATK',
    description: 'Langganan Wi-Fi Toko & Kertas Kasir Thermal',
    amount: 320000,
    paymentMethod: 'TRANSFER_BCA',
    receiptNumber: 'INDI-8821',
    recordedBy: 'Admin Putri',
    createdAt: '2026-08-15T09:00:00',
  },
];

const INITIAL_WASTES: WasteRecord[] = [
  {
    id: 'wst-1',
    date: '2026-08-21',
    type: 'INGREDIENT',
    itemId: 'ing-1',
    itemName: 'Pisang Raja / Ambon Matang',
    qty: 500,
    unit: 'g',
    reason: 'Pisang terlalu benyek busuk karena tertindih',
    estimatedLossRp: 10000,
    loggedBy: 'Agus Baking',
  },
  {
    id: 'wst-2',
    date: '2026-08-19',
    type: 'PRODUCTION_DEFECT',
    itemId: 'prod-1',
    itemName: 'Bolu Pisang Medium Original',
    qty: 1,
    unit: 'pcs',
    reason: 'Bagian atas bolu sedikit gosong akibat suhu oven tidak stabil',
    estimatedLossRp: 28378.5,
    loggedBy: 'Chef Rendy',
  },
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'log-1',
    timestamp: '2026-08-23T08:10:00',
    userId: 'u-rendy',
    userName: 'Chef Rendy',
    role: 'PRODUKSI',
    action: 'PRODUKSI SELESAI',
    details: 'Menyelesaikan Batch BATCH-PSK-20260823-01 (+5 Bolu Pisang Medium)',
    module: 'PRODUKSI',
  },
  {
    id: 'log-2',
    timestamp: '2026-08-23T08:15:00',
    userId: 'u-sinta',
    userName: 'Kasir Sinta',
    role: 'KASIR',
    action: 'ORDER SELESAI & LUNAS',
    details: 'Menerbitkan Invoice #INV-PSK-20260823-001 senilai Rp 310.000',
    module: 'PESANAN',
  },
];

const INITIAL_OUTLETS: Outlet[] = [
  {
    id: 'out-1',
    name: 'PUSAKA Central Kitchen & Store (R.E. Martadinata)',
    code: 'PSK-01',
    address: 'Jl. R.E. Martadinata No. 88, Bandung',
    city: 'Bandung',
    phone: '081234567890',
    isMain: true,
  },
  {
    id: 'out-2',
    name: 'PUSAKA Pop-up Booth (Stasiun Bandung Hall)',
    code: 'PSK-02',
    address: 'Area Keberangkatan Kereta Cepat, Stasiun Hall',
    city: 'Bandung',
    phone: '081299887700',
    isMain: false,
  },
];

export const INITIAL_USERS: UserAccount[] = [
  { id: 'user-owner', name: 'H. Suherman (Owner)', email: 'owner@pusakabakery.id', role: 'OWNER' },
  { id: 'user-admin', name: 'Putri Rahayu (Admin)', email: 'admin@pusakabakery.id', role: 'ADMIN' },
  { id: 'user-produksi', name: 'Chef Rendy (Head Baker)', email: 'produksi@pusakabakery.id', role: 'PRODUKSI' },
  { id: 'user-kasir', name: 'Sinta Dewi (Kasir)', email: 'kasir@pusakabakery.id', role: 'KASIR' },
  { id: 'user-supervisor', name: 'Agus Supervisor', email: 'supervisor@pusakabakery.id', role: 'SUPERVISOR' },
];

interface BakeryContextType {
  // Master & Business State
  businessProfile: BusinessProfile;
  updateBusinessProfile: (profile: Partial<BusinessProfile>) => void;
  units: Unit[];
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  currentUser: UserAccount;
  setCurrentUser: (user: UserAccount) => void;
  users: UserAccount[];
  outlets: Outlet[];
  currentOutlet: Outlet;
  setCurrentOutlet: (outlet: Outlet) => void;

  // Raw Materials & Suppliers
  ingredients: Ingredient[];
  suppliers: Supplier[];
  purchases: Purchase[];
  addIngredient: (ingredient: Omit<Ingredient, 'id' | 'updatedAt' | 'costPerRecipeUnit'>) => void;
  updateIngredient: (id: string, ingredient: Partial<Ingredient>) => void;
  deleteIngredient: (id: string) => void;
  addSupplier: (supplier: Omit<Supplier, 'id'>) => void;
  updateSupplier: (id: string, supplier: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;
  recordPurchase: (purchase: Omit<Purchase, 'id' | 'purchaseNumber' | 'createdAt'>) => void;

  // Recipes & Products
  recipes: Recipe[];
  products: Product[];
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateRecipe: (id: string, recipe: Partial<Recipe>) => void;
  addRecipeVersion: (recipeId: string, versionData: Omit<RecipeVersion, 'id' | 'createdAt'>) => void;
  addProduct: (product: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, product: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Production Engine
  productions: ProductionRun[];
  createProductionRun: (runData: {
    productId: string;
    targetQty: number;
    notes?: string;
    operatorName?: string;
  }) => { success: boolean; message: string; missingIngredients?: { name: string; needed: number; available: number; unit: string }[] };
  advanceProductionStatus: (productionId: string, nextStatus: ProductionStatus, note?: string) => void;
  cancelProductionRun: (productionId: string, reason?: string) => void;

  // Waste Management
  wastes: WasteRecord[];
  wasteRecords: WasteRecord[];
  recordWaste: (waste: Omit<WasteRecord, 'id'>) => void;
  deleteWasteRecord: (id: string) => void;

  // Sales & Orders (POS)
  orders: Order[];
  customers: Customer[];
  createOrder: (orderData: Omit<Order, 'id' | 'invoiceNumber' | 'createdAt'>) => Order;
  updateOrderStatus: (orderId: string, status: OrderStatus | string) => void;
  updatePaymentStatus: (orderId: string, paymentStatus: Order['paymentStatus'], paidAmount?: number, method?: Order['paymentMethod']) => void;
  updateOrderPayment: (orderId: string, paymentStatus: Order['paymentStatus'], paidAmount: number, method: Order['paymentMethod']) => void;
  updateOrderFulfillment: (orderId: string, fulfillmentStatus: Order['fulfillmentStatus'], courierInfo?: { name?: string; tracking?: string }) => void;
  cancelOrder: (orderId: string, reason?: string) => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'totalOrders' | 'totalSpend' | 'createdAt'>) => void;
  updateCustomer: (id: string, customer: Partial<Customer>) => void;
  deleteCustomer: (id: string) => void;

  // Expenses & Finance
  expenses: Expense[];
  addExpense: (expense: Omit<Expense, 'id' | 'createdAt'>) => void;
  deleteExpense: (id: string) => void;

  // Logs & Audit Trail
  auditLogs: AuditLog[];
  logAction: (module: AuditLog['module'], action: string, details: string) => void;

  // Data Persistence & Management
  resetDemoData: () => void;
  exportDataJson: () => string;
  importDataJson: (jsonStr: string) => boolean;

  // Low stock and pending production statistics
  lowStockIngredients: Ingredient[];
  lowStockProducts: Product[];
  activeProductionsCount: number;
  pendingOrdersCount: number;

  // Google Sheets Integration
  googleUser: User | null;
  googleAccessToken: string | null;
  googleSheetsConfig: GoogleSheetsConfig;
  isGoogleLoading: boolean;
  isGoogleSyncing: boolean;
  signInWithGoogle: () => Promise<{ success: boolean; message?: string }>;
  signOutFromGoogle: () => Promise<void>;
  createBakeryGoogleSheet: (title?: string) => Promise<{ success: boolean; spreadsheetUrl?: string; message?: string }>;
  connectGoogleSheetById: (spreadsheetId: string) => Promise<{ success: boolean; message?: string }>;
  syncNowToGoogleSheets: () => Promise<{ success: boolean; message?: string }>;
  loadDataFromGoogleSheets: () => Promise<{ success: boolean; message?: string; count?: { ingredients: number; orders: number; productions: number } }>;
  disconnectGoogleSheet: () => void;
  updateGoogleSheetsConfig: (patch: Partial<GoogleSheetsConfig>) => void;
}

const BakeryContext = createContext<BakeryContextType | null>(null);

const STORAGE_KEY = 'PUSAKA_BAKERY_SAAS_STATE_V1';

const safeParseJson = <T,>(key: string, fallback: T): T => {
  try {
    const saved = localStorage.getItem(key);
    if (!saved) return fallback;
    const parsed = JSON.parse(saved);
    return parsed !== null && parsed !== undefined ? parsed : fallback;
  } catch (e) {
    console.warn(`Failed to parse localStorage for ${key}`, e);
    return fallback;
  }
};

export const BakeryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial state from LocalStorage if available with normalization
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile>(() => {
    const data = safeParseJson<BusinessProfile>(`${STORAGE_KEY}_PROFILE`, INITIAL_PROFILE);
    return { ...INITIAL_PROFILE, ...data };
  });

  const [ingredients, setIngredients] = useState<Ingredient[]>(() => {
    const list = safeParseJson<Ingredient[]>(`${STORAGE_KEY}_INGREDIENTS`, INITIAL_INGREDIENTS);
    return Array.isArray(list) ? list : INITIAL_INGREDIENTS;
  });

  const [suppliers, setSuppliers] = useState<Supplier[]>(() => {
    const list = safeParseJson<Supplier[]>(`${STORAGE_KEY}_SUPPLIERS`, INITIAL_SUPPLIERS);
    return Array.isArray(list) ? list : INITIAL_SUPPLIERS;
  });

  const [purchases, setPurchases] = useState<Purchase[]>(() => {
    const list = safeParseJson<Purchase[]>(`${STORAGE_KEY}_PURCHASES`, INITIAL_PURCHASES);
    if (!Array.isArray(list)) return INITIAL_PURCHASES;
    return list.map(p => ({ ...p, items: Array.isArray(p.items) ? p.items : [] }));
  });

  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const list = safeParseJson<Recipe[]>(`${STORAGE_KEY}_RECIPES`, INITIAL_RECIPES);
    if (!Array.isArray(list) || list.length === 0) return INITIAL_RECIPES;
    return list.map(r => ({
      ...r,
      versions: Array.isArray(r.versions) && r.versions.length > 0
        ? r.versions.map(v => ({
            ...v,
            items: Array.isArray(v.items) ? v.items : [],
            packaging: Array.isArray(v.packaging) ? v.packaging : [],
            directCosts: Array.isArray(v.directCosts) ? v.directCosts : [],
          }))
        : (INITIAL_RECIPES.find(initR => initR.id === r.id)?.versions || []),
    }));
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const list = safeParseJson<Product[]>(`${STORAGE_KEY}_PRODUCTS`, INITIAL_PRODUCTS);
    return Array.isArray(list) ? list : INITIAL_PRODUCTS;
  });

  const [productions, setProductions] = useState<ProductionRun[]>(() => {
    const list = safeParseJson<ProductionRun[]>(`${STORAGE_KEY}_PRODUCTIONS`, INITIAL_PRODUCTIONS);
    if (!Array.isArray(list)) return INITIAL_PRODUCTIONS;
    return list.map(p => ({
      ...p,
      ingredients: Array.isArray(p.ingredients) ? p.ingredients : [],
      timeline: Array.isArray(p.timeline) ? p.timeline : [],
    }));
  });

  const [customers, setCustomers] = useState<Customer[]>(() => {
    const list = safeParseJson<Customer[]>(`${STORAGE_KEY}_CUSTOMERS`, INITIAL_CUSTOMERS);
    if (!Array.isArray(list)) return INITIAL_CUSTOMERS;
    return list.map(c => ({
      ...c,
      tags: Array.isArray(c.tags) ? c.tags : [],
    }));
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const list = safeParseJson<Order[]>(`${STORAGE_KEY}_ORDERS`, INITIAL_ORDERS);
    if (!Array.isArray(list)) return INITIAL_ORDERS;
    return list.map(o => ({
      ...o,
      items: Array.isArray(o.items) ? o.items : [],
    }));
  });

  const [expenses, setExpenses] = useState<Expense[]>(() => {
    const list = safeParseJson<Expense[]>(`${STORAGE_KEY}_EXPENSES`, INITIAL_EXPENSES);
    return Array.isArray(list) ? list : INITIAL_EXPENSES;
  });

  const [wastes, setWastes] = useState<WasteRecord[]>(() => {
    const list = safeParseJson<WasteRecord[]>(`${STORAGE_KEY}_WASTES`, INITIAL_WASTES);
    return Array.isArray(list) ? list : INITIAL_WASTES;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const list = safeParseJson<AuditLog[]>(`${STORAGE_KEY}_LOGS`, INITIAL_AUDIT_LOGS);
    return Array.isArray(list) ? list : INITIAL_AUDIT_LOGS;
  });

  const [currentRole, setCurrentRole] = useState<UserRole>('OWNER');
  const [currentOutlet, setCurrentOutlet] = useState<Outlet>(INITIAL_OUTLETS[0]);

  // Google Sheets state
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [googleAccessToken, setGoogleAccessToken] = useState<string | null>(null);
  const [isGoogleLoading, setIsGoogleLoading] = useState<boolean>(true);
  const [isGoogleSyncing, setIsGoogleSyncing] = useState<boolean>(false);
  const [googleSheetsConfig, setGoogleSheetsConfig] = useState<GoogleSheetsConfig>(() => {
    const saved = localStorage.getItem(`${STORAGE_KEY}_GSHEETS_CONFIG`);
    return saved
      ? JSON.parse(saved)
      : {
          spreadsheetId: null,
          spreadsheetTitle: null,
          spreadsheetUrl: null,
          autoSyncOrders: true,
          lastSyncedAt: null,
        };
  });

  // Listen to Google Auth State on Mount
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleAccessToken(token);
        setIsGoogleLoading(false);
      },
      () => {
        setGoogleUser(null);
        setGoogleAccessToken(null);
        setIsGoogleLoading(false);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  // Save googleSheetsConfig to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_GSHEETS_CONFIG`, JSON.stringify(googleSheetsConfig));
  }, [googleSheetsConfig]);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(`${STORAGE_KEY}_PROFILE`, JSON.stringify(businessProfile));
    localStorage.setItem(`${STORAGE_KEY}_INGREDIENTS`, JSON.stringify(ingredients));
    localStorage.setItem(`${STORAGE_KEY}_SUPPLIERS`, JSON.stringify(suppliers));
    localStorage.setItem(`${STORAGE_KEY}_PURCHASES`, JSON.stringify(purchases));
    localStorage.setItem(`${STORAGE_KEY}_RECIPES`, JSON.stringify(recipes));
    localStorage.setItem(`${STORAGE_KEY}_PRODUCTS`, JSON.stringify(products));
    localStorage.setItem(`${STORAGE_KEY}_PRODUCTIONS`, JSON.stringify(productions));
    localStorage.setItem(`${STORAGE_KEY}_CUSTOMERS`, JSON.stringify(customers));
    localStorage.setItem(`${STORAGE_KEY}_ORDERS`, JSON.stringify(orders));
    localStorage.setItem(`${STORAGE_KEY}_EXPENSES`, JSON.stringify(expenses));
    localStorage.setItem(`${STORAGE_KEY}_WASTES`, JSON.stringify(wastes));
    localStorage.setItem(`${STORAGE_KEY}_LOGS`, JSON.stringify(auditLogs));
  }, [businessProfile, ingredients, suppliers, purchases, recipes, products, productions, customers, orders, expenses, wastes, auditLogs]);

  // Current User representation based on role
  const currentUser: UserAccount = {
    id: `user-${currentRole.toLowerCase()}`,
    name:
      currentRole === 'OWNER'
        ? 'H. Suherman (Owner)'
        : currentRole === 'ADMIN'
        ? 'Putri Rahayu (Admin)'
        : currentRole === 'PRODUKSI'
        ? 'Chef Rendy (Head Baker)'
        : currentRole === 'KASIR'
        ? 'Sinta Dewi (Kasir)'
        : 'Agus Supervisor',
    email: `${currentRole.toLowerCase()}@pusakabakery.id`,
    role: currentRole,
  };

  // Helper to log audit actions
  const logAction = (module: AuditLog['module'], action: string, details: string) => {
    const newLog: AuditLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      timestamp: new Date().toISOString(),
      userId: currentUser.id,
      userName: currentUser.name,
      role: currentRole,
      action,
      details,
      module,
    };
    setAuditLogs(prev => [newLog, ...prev.slice(0, 99)]); // Keep last 100 logs
  };

  // Update Business Profile
  const updateBusinessProfile = (profile: Partial<BusinessProfile>) => {
    setBusinessProfile(prev => {
      const updated = { ...prev, ...profile };
      logAction('PENGATURAN', 'UPDATE PROFIL USAHA', `Mengubah informasi bisnis ${updated.name}`);
      return updated;
    });
  };

  // Ingredients CRUD
  const addIngredient = (ingData: Omit<Ingredient, 'id' | 'updatedAt' | 'costPerRecipeUnit'>) => {
    const costPerRecipeUnit = ingData.latestBuyPrice / (ingData.conversionFactor || 1);
    const newIngredient: Ingredient = {
      ...ingData,
      id: `ing-${Date.now()}`,
      costPerRecipeUnit,
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setIngredients(prev => [...prev, newIngredient]);
    logAction('BAHAN', 'TAMBAH BAHAN BAKU', `Menambahkan bahan: ${newIngredient.name} (${newIngredient.sku})`);
  };

  const updateIngredient = (id: string, patch: Partial<Ingredient>) => {
    setIngredients(prev =>
      prev.map(ing => {
        if (ing.id === id) {
          const latestPrice = patch.latestBuyPrice !== undefined ? patch.latestBuyPrice : ing.latestBuyPrice;
          const conv = patch.conversionFactor !== undefined ? patch.conversionFactor : ing.conversionFactor;
          const costPerRecipeUnit = latestPrice / (conv || 1);
          const updated = { ...ing, ...patch, costPerRecipeUnit, updatedAt: new Date().toISOString().split('T')[0] };
          logAction('BAHAN', 'UPDATE BAHAN BAKU', `Memperbarui ${updated.name}`);
          return updated;
        }
        return ing;
      })
    );
  };

  const deleteIngredient = (id: string) => {
    const target = ingredients.find(i => i.id === id);
    setIngredients(prev => prev.filter(i => i.id !== id));
    if (target) {
      logAction('BAHAN', 'HAPUS BAHAN BAKU', `Menghapus bahan: ${target.name}`);
    }
  };

  // Suppliers CRUD
  const addSupplier = (supData: Omit<Supplier, 'id'>) => {
    const newSup: Supplier = { ...supData, id: `sup-${Date.now()}` };
    setSuppliers(prev => [...prev, newSup]);
    logAction('BAHAN', 'TAMBAH SUPPLIER', `Menambahkan supplier: ${newSup.name}`);
  };

  const updateSupplier = (id: string, patch: Partial<Supplier>) => {
    setSuppliers(prev => prev.map(s => (s.id === id ? { ...s, ...patch } : s)));
    logAction('BAHAN', 'UPDATE SUPPLIER', `Memperbarui data supplier ID ${id}`);
  };

  const deleteSupplier = (id: string) => {
    setSuppliers(prev => prev.filter(s => s.id !== id));
    logAction('BAHAN', 'HAPUS SUPPLIER', `Menghapus supplier ID ${id}`);
  };

  // Purchase PO: adds stock to ingredient & updates latest purchase price
  const recordPurchase = (purchaseData: Omit<Purchase, 'id' | 'purchaseNumber' | 'createdAt'>) => {
    const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    const purchaseNumber = `${businessProfile.purchasePrefix}-${dateCode}-${rand}`;

    const newPurchase: Purchase = {
      ...purchaseData,
      id: `po-${Date.now()}`,
      purchaseNumber,
      createdAt: new Date().toISOString(),
    };

    // Increment stocks & update buy prices
    setIngredients(prev =>
      prev.map(ing => {
        const item = purchaseData.items.find(pi => pi.ingredientId === ing.id);
        if (item) {
          const additionalStockInRecipeUnit = item.qtyBuyUnit * item.conversionFactor;
          const newStock = ing.stockInRecipeUnit + additionalStockInRecipeUnit;
          const costPerRecipeUnit = item.pricePerBuyUnit / (item.conversionFactor || 1);
          return {
            ...ing,
            stockInRecipeUnit: newStock,
            latestBuyPrice: item.pricePerBuyUnit,
            costPerRecipeUnit,
            updatedAt: new Date().toISOString().split('T')[0],
          };
        }
        return ing;
      })
    );

    setPurchases(prev => [newPurchase, ...prev]);
    logAction(
      'BAHAN',
      'PEMBELIAN BAHAN (PO)',
      `Mencatat pembelian ${purchaseNumber} dari ${purchaseData.supplierName} total Rp ${purchaseData.totalAmount.toLocaleString('id-ID')}`
    );
  };

  // Recipes & Versions CRUD
  const addRecipe = (recipeData: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newRecipe: Recipe = {
      ...recipeData,
      id: `rec-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    setRecipes(prev => [...prev, newRecipe]);
    logAction('RESEP', 'BUAT RESEP BARU', `Membuat resep: ${newRecipe.name}`);
  };

  const updateRecipe = (id: string, patch: Partial<Recipe>) => {
    setRecipes(prev =>
      prev.map(r => (r.id === id ? { ...r, ...patch, updatedAt: new Date().toISOString().split('T')[0] } : r))
    );
    logAction('RESEP', 'UPDATE RESEP', `Memperbarui data resep ID ${id}`);
  };

  const addRecipeVersion = (recipeId: string, versionData: Omit<RecipeVersion, 'id' | 'createdAt'>) => {
    const newVersion: RecipeVersion = {
      ...versionData,
      id: `ver-${Date.now()}`,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setRecipes(prev =>
      prev.map(rec => {
        if (rec.id === recipeId) {
          return {
            ...rec,
            currentVersionId: newVersion.id,
            versions: [...rec.versions, newVersion],
            updatedAt: new Date().toISOString().split('T')[0],
          };
        }
        return rec;
      })
    );

    // Also update any product linked to this recipe
    setProducts(prev =>
      prev.map(p => {
        if (p.recipeId === recipeId) {
          const newHpp = newVersion.totalHppPerUnit;
          const grossMargin = p.sellingPrice > 0 ? ((p.sellingPrice - newHpp) / p.sellingPrice) * 100 : 0;
          return {
            ...p,
            recipeVersionId: newVersion.id,
            baseHpp: newHpp,
            grossMarginPercent: Number(grossMargin.toFixed(1)),
          };
        }
        return p;
      })
    );

    logAction('RESEP', 'TAMBAH VERSI RESEP', `Menambahkan versi ${newVersion.versionNumber} pada resep ID ${recipeId}`);
  };

  // Products CRUD
  const addProduct = (prodData: Omit<Product, 'id'>) => {
    const newProd: Product = { ...prodData, id: `prod-${Date.now()}` };
    setProducts(prev => [...prev, newProd]);
    logAction('PRODUK', 'TAMBAH PRODUK', `Menambahkan produk: ${newProd.name} (${newProd.sku})`);
  };

  const updateProduct = (id: string, patch: Partial<Product>) => {
    setProducts(prev =>
      prev.map(p => {
        if (p.id === id) {
          const updated = { ...p, ...patch };
          if (patch.sellingPrice !== undefined || patch.baseHpp !== undefined) {
            const sp = updated.sellingPrice;
            const hpp = updated.baseHpp;
            updated.grossMarginPercent = sp > 0 ? Number((((sp - hpp) / sp) * 100).toFixed(1)) : 0;
          }
          logAction('PRODUK', 'UPDATE PRODUK', `Memperbarui produk ${updated.name}`);
          return updated;
        }
        return p;
      })
    );
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(p => p.id !== id));
    logAction('PRODUK', 'HAPUS PRODUK', `Menghapus produk ID ${id}`);
  };

  // Production Engine
  const createProductionRun = (runData: {
    productId: string;
    targetQty: number;
    notes?: string;
    operatorName?: string;
  }) => {
    const product = products.find(p => p.id === runData.productId);
    if (!product) return { success: false, message: 'Produk tidak ditemukan' };

    const recipe = recipes.find(r => r.id === product.recipeId);
    if (!recipe) return { success: false, message: 'Resep untuk produk ini tidak ditemukan' };

    const version = recipe.versions.find(v => v.id === product.recipeVersionId) || recipe.versions[recipe.versions.length - 1];
    if (!version) return { success: false, message: 'Versi resep tidak valid' };

    // Calculate scaled ingredient requirements
    const scale = runData.targetQty / (version.yieldQty || 1);
    const missing: { name: string; needed: number; available: number; unit: string }[] = [];

    const requirements = version.items.map(item => {
      const ing = ingredients.find(i => i.id === item.ingredientId);
      const neededQty = item.quantity * scale;
      const availableStock = ing ? ing.stockInRecipeUnit : 0;
      const isSufficient = availableStock >= neededQty;

      if (!isSufficient) {
        missing.push({
          name: item.ingredientName,
          needed: neededQty,
          available: availableStock,
          unit: item.recipeUnit,
        });
      }

      const cost = ing ? neededQty * ing.costPerRecipeUnit : item.cost * scale;
      return {
        ingredientId: item.ingredientId,
        ingredientName: item.ingredientName,
        requiredQty: neededQty,
        unit: item.recipeUnit,
        availableStock,
        isSufficient,
        cost,
      };
    });

    // Check packaging requirements as well
    const packagingUsed = version.packaging.map(pkg => {
      const ing = ingredients.find(i => i.id === pkg.ingredientId);
      const neededQty = pkg.quantity * runData.targetQty;
      const availableStock = ing ? ing.stockInRecipeUnit : 9999;
      if (ing && availableStock < neededQty) {
        missing.push({
          name: pkg.name,
          needed: neededQty,
          available: availableStock,
          unit: 'pcs',
        });
      }
      return {
        packagingId: pkg.ingredientId,
        name: pkg.name,
        qty: neededQty,
        unitCost: pkg.unitCost,
        totalCost: neededQty * pkg.unitCost,
      };
    });

    const directCosts = version.directCosts.map(dc => ({
      name: dc.name,
      amount: dc.costType === 'per_batch' ? dc.amount : dc.amount * runData.targetQty,
    }));

    const totalRawCost = requirements.reduce((acc, r) => acc + r.cost, 0);
    const totalPkgCost = packagingUsed.reduce((acc, p) => acc + p.totalCost, 0);
    const totalDirCost = directCosts.reduce((acc, d) => acc + d.amount, 0);
    const totalCost = totalRawCost + totalPkgCost + totalDirCost;

    const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    const batchNumber = `${businessProfile.productionBatchPrefix}-${dateCode}-${rand}`;

    const newRun: ProductionRun = {
      id: `run-${Date.now()}`,
      batchNumber,
      date: new Date().toISOString().split('T')[0],
      productId: product.id,
      productName: product.name,
      recipeId: recipe.id,
      recipeVersionNumber: version.versionNumber,
      targetQty: runData.targetQty,
      actualYieldQty: 0,
      rejectedQty: 0,
      status: 'DRAFT',
      ingredients: requirements,
      packagingUsed,
      directCosts,
      totalProductionCost: totalCost,
      unitProductionCost: totalCost / runData.targetQty,
      isStockDeducted: false,
      isFinishedStockAdded: false,
      operatorName: runData.operatorName || currentUser.name,
      notes: runData.notes || '',
      timeline: [{ status: 'DRAFT', timestamp: new Date().toISOString(), note: 'Rencana batch dibuat' }],
    };

    setProductions(prev => [newRun, ...prev]);
    logAction(
      'PRODUKSI',
      'BUAT BATCH PRODUKSI',
      `Batch ${batchNumber} (${product.name} x${runData.targetQty}) status DRAFT`
    );

    if (missing.length > 0) {
      return {
        success: true,
        message: `Batch dibuat (DRAFT), namun terdapat ${missing.length} bahan baku dengan stok kurang!`,
        missingIngredients: missing,
      };
    }

    return {
      success: true,
      message: `Batch produksi ${batchNumber} berhasil dibuat dan stok bahan mencukupi.`,
    };
  };

  // Production state transitions & automatic stock deduction/addition
  const advanceProductionStatus = (productionId: string, nextStatus: ProductionStatus, note?: string) => {
    setProductions(prev =>
      prev.map(run => {
        if (run.id !== productionId) return run;

        let isStockDeducted = run.isStockDeducted;
        let isFinishedStockAdded = run.isFinishedStockAdded;
        let actualYieldQty = run.actualYieldQty;

        // Auto deduct ingredients when advancing past DRAFT (into DIRACIK, DIPANGGANG, etc.)
        if (!isStockDeducted && nextStatus !== 'DRAFT' && nextStatus !== 'BATAL') {
          // Deduct ingredients from raw inventory
          setIngredients(prevIngs =>
            prevIngs.map(ing => {
              const req = run.ingredients.find(i => i.ingredientId === ing.id);
              const pkgReq = run.packagingUsed.find(p => p.packagingId === ing.id);
              let deductAmount = 0;
              if (req) deductAmount += req.requiredQty;
              if (pkgReq) deductAmount += pkgReq.qty;

              if (deductAmount > 0) {
                return {
                  ...ing,
                  stockInRecipeUnit: Math.max(0, ing.stockInRecipeUnit - deductAmount),
                };
              }
              return ing;
            })
          );
          isStockDeducted = true;
          logAction(
            'BAHAN',
            'PENGURANGAN STOK PRODUKSI',
            `Stok bahan baku otomatis dipotong untuk Batch ${run.batchNumber}`
          );
        }

        // When reaching SELESAI -> add finished goods to finished inventory
        if (nextStatus === 'SELESAI' && !isFinishedStockAdded) {
          actualYieldQty = actualYieldQty || run.targetQty;
          setProducts(prevProds =>
            prevProds.map(p => {
              if (p.id === run.productId) {
                return {
                  ...p,
                  stockFinishedGoods: p.stockFinishedGoods + actualYieldQty,
                };
              }
              return p;
            })
          );
          isFinishedStockAdded = true;
          logAction(
            'PRODUK',
            'STOK PRODUK JADI BERTAMBAH',
            `+${actualYieldQty} pcs ${run.productName} siap dijual dari Batch ${run.batchNumber}`
          );
        }

        const now = new Date().toISOString();
        const updatedTimeline = [
          ...run.timeline,
          { status: nextStatus, timestamp: now, note: note || `Status diperbarui ke ${nextStatus}` },
        ];

        return {
          ...run,
          status: nextStatus,
          isStockDeducted,
          isFinishedStockAdded,
          actualYieldQty,
          finishedAt: nextStatus === 'SELESAI' ? now : run.finishedAt,
          timeline: updatedTimeline,
        };
      })
    );
  };

  const cancelProductionRun = (productionId: string, reason?: string) => {
    setProductions(prev =>
      prev.map(run => {
        if (run.id !== productionId) return run;

        // If stock was already deducted, restore it
        if (run.isStockDeducted && !run.isFinishedStockAdded) {
          setIngredients(prevIngs =>
            prevIngs.map(ing => {
              const req = run.ingredients.find(i => i.ingredientId === ing.id);
              const pkgReq = run.packagingUsed.find(p => p.packagingId === ing.id);
              let restoreAmount = 0;
              if (req) restoreAmount += req.requiredQty;
              if (pkgReq) restoreAmount += pkgReq.qty;

              if (restoreAmount > 0) {
                return {
                  ...ing,
                  stockInRecipeUnit: ing.stockInRecipeUnit + restoreAmount,
                };
              }
              return ing;
            })
          );
          logAction('BAHAN', 'PENGEMBALIAN STOK BAHAN', `Mengembalikan bahan baku dari pembatalan Batch ${run.batchNumber}`);
        }

        return {
          ...run,
          status: 'BATAL',
          timeline: [
            ...run.timeline,
            { status: 'BATAL', timestamp: new Date().toISOString(), note: reason || 'Produksi dibatalkan' },
          ],
        };
      })
    );
  };

  // Waste Recording
  const recordWaste = (wasteData: Omit<WasteRecord, 'id'>) => {
    const newWaste: WasteRecord = {
      ...wasteData,
      id: `wst-${Date.now()}`,
    };

    const wasteQty = wasteData.qty || wasteData.quantity || 0;

    // If it is an ingredient, deduct raw inventory
    if (wasteData.type === 'INGREDIENT' || wasteData.type === 'BAHAN_BAKU') {
      setIngredients(prev =>
        prev.map(ing => (ing.id === wasteData.itemId ? { ...ing, stockInRecipeUnit: Math.max(0, ing.stockInRecipeUnit - wasteQty) } : ing))
      );
    } else {
      // If it is finished goods, deduct finished inventory
      setProducts(prev =>
        prev.map(prod => (prod.id === wasteData.itemId ? { ...prod, stockFinishedGoods: Math.max(0, prod.stockFinishedGoods - wasteQty) } : prod))
      );
    }

    setWastes(prev => [newWaste, ...prev]);
    logAction('SISTEM', 'PENCATATAN WASTE / KERUSAKAN', `Mencatat waste ${wasteData.itemName} (${wasteQty} ${wasteData.unit}) - ${wasteData.reason}`);
  };

  const deleteWasteRecord = (id: string) => {
    setWastes(prev => prev.filter(w => w.id !== id));
    logAction('SISTEM', 'HAPUS RECORD WASTE', `Menghapus catatan waste ID ${id}`);
  };

  // Sales & Orders (POS)
  const createOrder = (orderData: Omit<Order, 'id' | 'invoiceNumber' | 'createdAt'>): Order => {
    const dateCode = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const rand = Math.floor(100 + Math.random() * 900);
    const invoiceNumber = `${businessProfile.invoicePrefix}-${dateCode}-${rand}`;

    const newOrder: Order = {
      ...orderData,
      id: `ord-${Date.now()}`,
      invoiceNumber,
      createdAt: new Date().toISOString(),
    };

    // Deduct finished goods stock
    setProducts(prev =>
      prev.map(prod => {
        const item = orderData.items.find(i => i.productId === prod.id);
        if (item) {
          return {
            ...prod,
            stockFinishedGoods: Math.max(0, prod.stockFinishedGoods - item.qty),
          };
        }
        return prod;
      })
    );

    // Update customer statistics if customer exists
    if (orderData.customerId) {
      setCustomers(prev =>
        prev.map(c => {
          if (c.id === orderData.customerId) {
            const totalOrders = c.totalOrders + 1;
            const totalSpend = c.totalSpend + orderData.totalAmount;
            let tier = c.tier;
            if (totalOrders >= 4 || totalSpend >= 500000) tier = 'LOYAL';
            else if (totalOrders >= 2) tier = 'AKTIF';
            return {
              ...c,
              totalOrders,
              totalSpend,
              tier,
              lastOrderDate: orderData.date,
            };
          }
          return c;
        })
      );
    }

    setOrders(prev => [newOrder, ...prev]);
    logAction(
      'PESANAN',
      'BUAT TRANSAKSI PESANAN',
      `Pesanan ${invoiceNumber} untuk ${orderData.customerName} senilai Rp ${orderData.totalAmount.toLocaleString('id-ID')}`
    );

    // Auto-sync new order to Google Sheets if connected and enabled
    if (googleSheetsConfig.spreadsheetId && googleSheetsConfig.autoSyncOrders && googleAccessToken) {
      appendOrderRow(googleSheetsConfig.spreadsheetId, newOrder).catch(err => {
        console.warn('Google Sheets Order Auto-sync notice:', err);
      });
    }

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus | string) => {
    let fulfillmentStatus: FulfillmentStatus = 'MENUNGGU';
    if (status === 'PENDING' || status === 'MENUNGGU') fulfillmentStatus = 'MENUNGGU';
    else if (status === 'PROCESSED' || status === 'DIPROSES') fulfillmentStatus = 'DIPROSES';
    else if (status === 'SHIPPED' || status === 'DIKIRIM') fulfillmentStatus = 'DIKIRIM';
    else if (status === 'DELIVERED' || status === 'SIAP_DIAMBIL') fulfillmentStatus = 'SIAP_DIAMBIL';
    else if (status === 'COMPLETED' || status === 'SELESAI') fulfillmentStatus = 'SELESAI';
    else if (status === 'CANCELLED' || status === 'BATAL') fulfillmentStatus = 'BATAL';

    setOrders(prev =>
      prev.map(o => {
        if (o.id !== orderId) return o;
        return {
          ...o,
          orderStatus: status as OrderStatus,
          fulfillmentStatus,
        };
      })
    );
    logAction('PESANAN', 'UPDATE STATUS PESANAN', `Pesanan ID ${orderId} diubah status menjadi ${status}`);
  };

  const updatePaymentStatus = (
    orderId: string,
    paymentStatus: Order['paymentStatus'],
    paidAmount?: number,
    method?: Order['paymentMethod']
  ) => {
    setOrders(prev =>
      prev.map(o => {
        if (o.id !== orderId) return o;
        const finalPaid =
          paidAmount !== undefined
            ? paidAmount
            : paymentStatus === 'LUNAS'
            ? o.totalAmount
            : o.paidAmount;
        return {
          ...o,
          paymentStatus,
          paidAmount: finalPaid,
          paymentMethod: method || o.paymentMethod,
        };
      })
    );
    logAction('PESANAN', 'UPDATE STATUS PEMBAYARAN', `Pesanan ID ${orderId} update status bayar ${paymentStatus}`);
  };

  const updateOrderPayment = (orderId: string, paymentStatus: Order['paymentStatus'], paidAmount: number, method: Order['paymentMethod']) => {
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, paymentStatus, paidAmount, paymentMethod: method } : o))
    );
    logAction('PESANAN', 'UPDATE PEMBAYARAN', `Pesanan ID ${orderId} update status bayar ${paymentStatus}`);
  };

  const updateOrderFulfillment = (orderId: string, fulfillmentStatus: Order['fulfillmentStatus'], courierInfo?: { name?: string; tracking?: string }) => {
    setOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, fulfillmentStatus, courierName: courierInfo?.name || o.courierName, trackingNumber: courierInfo?.tracking || o.trackingNumber } : o))
    );
    logAction('PESANAN', 'UPDATE PENGIRIMAN', `Pesanan ID ${orderId} status pengiriman ${fulfillmentStatus}`);
  };

  const cancelOrder = (orderId: string, reason?: string) => {
    setOrders(prev =>
      prev.map(o => {
        if (o.id !== orderId) return o;
        // Restore finished goods stock
        setProducts(prevProds =>
          prevProds.map(prod => {
            const item = o.items.find(i => i.productId === prod.id);
            if (item) {
              return {
                ...prod,
                stockFinishedGoods: prod.stockFinishedGoods + item.qty,
              };
            }
            return prod;
          })
        );
        return {
          ...o,
          fulfillmentStatus: 'BATAL',
          notes: `${o.notes || ''} [BATAL: ${reason || 'Dibatalkan'}]`,
        };
      })
    );
    logAction('PESANAN', 'BATALKAN PESANAN', `Membatalkan order ID ${orderId} dan merestore stok produk`);
  };

  // Customers CRM CRUD
  const addCustomer = (custData: Omit<Customer, 'id' | 'totalOrders' | 'totalSpend' | 'createdAt'>) => {
    const newCust: Customer = {
      ...custData,
      id: `cust-${Date.now()}`,
      totalOrders: 0,
      totalSpend: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setCustomers(prev => [...prev, newCust]);
    logAction('PESANAN', 'TAMBAH PELANGGAN', `Menambahkan pelanggan: ${newCust.name}`);
  };

  const updateCustomer = (id: string, patch: Partial<Customer>) => {
    setCustomers(prev => prev.map(c => (c.id === id ? { ...c, ...patch } : c)));
    logAction('PESANAN', 'UPDATE PELANGGAN', `Memperbarui data pelanggan ID ${id}`);
  };

  const deleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
    logAction('PESANAN', 'HAPUS PELANGGAN', `Menghapus data pelanggan ID ${id}`);
  };

  // Expenses CRUD
  const addExpense = (expData: Omit<Expense, 'id' | 'createdAt'>) => {
    const newExp: Expense = {
      ...expData,
      id: `exp-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setExpenses(prev => [newExp, ...prev]);
    logAction('KEUANGAN', 'CATAT BIAYA OPERASIONAL', `${expData.category}: ${expData.description} (Rp ${expData.amount.toLocaleString('id-ID')})`);
  };

  const deleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    logAction('KEUANGAN', 'HAPUS BIAYA', `Menghapus biaya operasional ID ${id}`);
  };

  // Low stock & pending alerts
  const lowStockIngredients = ingredients.filter(i => i.stockInRecipeUnit <= i.minStockInRecipeUnit);
  const lowStockProducts = products.filter(p => p.stockFinishedGoods <= p.minStockFinishedGoods);
  const activeProductionsCount = productions.filter(p => p.status !== 'SELESAI' && p.status !== 'BATAL').length;
  const pendingOrdersCount = orders.filter(o => o.fulfillmentStatus === 'MENUNGGU' || o.fulfillmentStatus === 'DIPROSES').length;

  // Reset Demo Data
  const resetDemoData = () => {
    localStorage.clear();
    setBusinessProfile(INITIAL_PROFILE);
    setIngredients(INITIAL_INGREDIENTS);
    setSuppliers(INITIAL_SUPPLIERS);
    setPurchases(INITIAL_PURCHASES);
    setRecipes(INITIAL_RECIPES);
    setProducts(INITIAL_PRODUCTS);
    setProductions(INITIAL_PRODUCTIONS);
    setCustomers(INITIAL_CUSTOMERS);
    setOrders(INITIAL_ORDERS);
    setExpenses(INITIAL_EXPENSES);
    setWastes(INITIAL_WASTES);
    setAuditLogs(INITIAL_AUDIT_LOGS);
    logAction('SISTEM', 'RESET DATA DEMO', 'Mengembalikan database ke sampel awal PUSAKA Bakery');
  };

  // Export JSON Backup
  const exportDataJson = () => {
    const backup = {
      businessProfile,
      ingredients,
      suppliers,
      purchases,
      recipes,
      products,
      productions,
      customers,
      orders,
      expenses,
      wastes,
      auditLogs,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    };
    return JSON.stringify(backup, null, 2);
  };

  // Import JSON Backup
  const importDataJson = (jsonStr: string): boolean => {
    try {
      const data = JSON.parse(jsonStr);
      if (data.businessProfile) setBusinessProfile(data.businessProfile);
      if (data.ingredients) setIngredients(data.ingredients);
      if (data.suppliers) setSuppliers(data.suppliers);
      if (data.purchases) setPurchases(data.purchases);
      if (data.recipes) setRecipes(data.recipes);
      if (data.products) setProducts(data.products);
      if (data.productions) setProductions(data.productions);
      if (data.customers) setCustomers(data.customers);
      if (data.orders) setOrders(data.orders);
      if (data.expenses) setExpenses(data.expenses);
      if (data.wastes) setWastes(data.wastes);
      logAction('SISTEM', 'IMPORT DATA JSON', 'Berhasil memulihkan data dari berkas cadangan JSON');
      return true;
    } catch {
      return false;
    }
  };

  // Google Sheets Action Handlers
  const signInWithGoogle = async (): Promise<{ success: boolean; message?: string }> => {
    try {
      setIsGoogleLoading(true);
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleAccessToken(res.accessToken);
        logAction('SISTEM', 'GOOGLE LOGIN', `Berhasil login Google: ${res.user.email}`);
        return { success: true, message: `Berhasil login sebagai ${res.user.displayName || res.user.email}` };
      }
      return { success: false, message: 'Login tidak mengembalikan token akses Google.' };
    } catch (err: any) {
      console.error('Google sign in error:', err);
      const msg = err?.message || 'Gagal melakukan login Google.';
      logAction('SISTEM', 'GOOGLE LOGIN GAGAL', msg);
      return { success: false, message: msg };
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const signOutFromGoogle = async () => {
    try {
      await logoutGoogle();
      setGoogleUser(null);
      setGoogleAccessToken(null);
      logAction('SISTEM', 'GOOGLE LOGOUT', 'Berhasil logout dari akun Google');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const syncNowToGoogleSheets = async (): Promise<{ success: boolean; message?: string }> => {
    if (!googleSheetsConfig.spreadsheetId) {
      return { success: false, message: 'Belum ada Google Spreadsheet yang terhubung.' };
    }
    const token = await getAccessToken();
    if (!token) {
      return { success: false, message: 'Sesi Google telah habis. Silakan Login Google kembali.' };
    }

    try {
      setIsGoogleSyncing(true);
      const exportState = {
        businessProfile,
        ingredients,
        recipes,
        products,
        orders,
        productions,
        customers,
        wasteRecords: wastes,
      };
      await syncAllDataToGoogleSheets(googleSheetsConfig.spreadsheetId, exportState);
      const now = new Date().toLocaleString('id-ID');
      setGoogleSheetsConfig(prev => ({ ...prev, lastSyncedAt: now }));
      logAction('SISTEM', 'SINKRONISASI GOOGLE SHEETS', `Data berhasil disinkronkan ke Spreadsheet`);
      return { success: true, message: 'Semua data berhasil disinkronkan ke Google Sheets!' };
    } catch (err: any) {
      console.error('Sync to sheets error:', err);
      return { success: false, message: err.message || 'Gagal sinkronisasi data ke Google Sheets' };
    } finally {
      setIsGoogleSyncing(false);
    }
  };

  const createBakeryGoogleSheet = async (
    title?: string
  ): Promise<{ success: boolean; spreadsheetUrl?: string; message?: string }> => {
    const token = await getAccessToken();
    if (!token) {
      return { success: false, message: 'Silakan Login dengan Akun Google terlebih dahulu.' };
    }

    try {
      setIsGoogleSyncing(true);
      const sheetTitle = title || `${businessProfile.name} - Database Master (${new Date().getFullYear()})`;
      const created = await createBakerySpreadsheet(sheetTitle);
      
      const newConfig: GoogleSheetsConfig = {
        ...googleSheetsConfig,
        spreadsheetId: created.spreadsheetId,
        spreadsheetTitle: sheetTitle,
        spreadsheetUrl: created.spreadsheetUrl,
        lastSyncedAt: new Date().toLocaleString('id-ID'),
      };
      setGoogleSheetsConfig(newConfig);

      // Perform initial full sync to populate created sheet
      const exportState = {
        businessProfile,
        ingredients,
        recipes,
        products,
        orders,
        productions,
        customers,
        wasteRecords: wastes,
      };
      await syncAllDataToGoogleSheets(created.spreadsheetId, exportState);

      logAction('SISTEM', 'BUAT GOOGLE SPREADSHEET', `Membuat spreadsheet database baru: ${sheetTitle}`);
      return {
        success: true,
        spreadsheetUrl: created.spreadsheetUrl,
        message: 'Google Spreadsheet database berhasil dibuat dan disinkronkan!',
      };
    } catch (err: any) {
      console.error('Create sheet error:', err);
      return { success: false, message: err.message || 'Gagal membuat Google Spreadsheet baru.' };
    } finally {
      setIsGoogleSyncing(false);
    }
  };

  const connectGoogleSheetById = async (
    spreadsheetId: string
  ): Promise<{ success: boolean; message?: string }> => {
    const token = await getAccessToken();
    if (!token) {
      return { success: false, message: 'Silakan Login dengan Akun Google terlebih dahulu.' };
    }

    try {
      setIsGoogleSyncing(true);
      const details = await getSpreadsheetDetails(spreadsheetId.trim());
      const newConfig: GoogleSheetsConfig = {
        ...googleSheetsConfig,
        spreadsheetId: spreadsheetId.trim(),
        spreadsheetTitle: details.title,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId.trim()}/edit`,
        lastSyncedAt: new Date().toLocaleString('id-ID'),
      };
      setGoogleSheetsConfig(newConfig);

      // Run sync to ensure sheets exist and have current data
      const exportState = {
        businessProfile,
        ingredients,
        recipes,
        products,
        orders,
        productions,
        customers,
        wasteRecords: wastes,
      };
      await syncAllDataToGoogleSheets(spreadsheetId.trim(), exportState);

      logAction('SISTEM', 'HUBUNGKAN GOOGLE SPREADSHEET', `Menghubungkan ke sheet: ${details.title}`);
      return {
        success: true,
        message: `Berhasil terhubung ke spreadsheet "${details.title}"!`,
      };
    } catch (err: any) {
      console.error('Connect sheet error:', err);
      return { success: false, message: err.message || 'Gagal menghubungkan ke Spreadsheet ID tersebut.' };
    } finally {
      setIsGoogleSyncing(false);
    }
  };

  const loadDataFromGoogleSheets = async (): Promise<{
    success: boolean;
    message?: string;
    count?: { ingredients: number; orders: number; productions: number };
  }> => {
    if (!googleSheetsConfig.spreadsheetId) {
      return { success: false, message: 'Belum ada Google Spreadsheet yang terhubung.' };
    }
    const token = await getAccessToken();
    if (!token) {
      return { success: false, message: 'Sesi Google telah habis. Silakan Login Google kembali.' };
    }

    try {
      setIsGoogleSyncing(true);
      const imported = await loadAllDataFromGoogleSheets(
        googleSheetsConfig.spreadsheetId,
        ingredients,
        products
      );

      let ingCount = 0;
      let ordCount = 0;
      let prodCount = 0;

      if (imported.ingredients && imported.ingredients.length > 0) {
        setIngredients(imported.ingredients);
        ingCount = imported.ingredients.length;
      }
      if (imported.orders && imported.orders.length > 0) {
        setOrders(imported.orders);
        ordCount = imported.orders.length;
      }
      if (imported.productions && imported.productions.length > 0) {
        setProductions(imported.productions);
        prodCount = imported.productions.length;
      }

      const now = new Date().toLocaleString('id-ID');
      setGoogleSheetsConfig((prev) => ({
        ...prev,
        lastLoadedAt: now,
      }));

      logAction(
        'SISTEM',
        'IMPORT GOOGLE SHEETS',
        `Memuat data dari Google Sheets: ${ingCount} bahan baku, ${ordCount} pesanan, ${prodCount} batch produksi`
      );

      return {
        success: true,
        message: `Berhasil memuat data: ${ingCount} bahan baku, ${ordCount} pesanan, dan ${prodCount} produksi!`,
        count: {
          ingredients: ingCount,
          orders: ordCount,
          productions: prodCount,
        },
      };
    } catch (err: any) {
      console.error('Load from sheets error:', err);
      return {
        success: false,
        message: err.message || 'Gagal membaca data dari Google Sheets',
      };
    } finally {
      setIsGoogleSyncing(false);
    }
  };

  const disconnectGoogleSheet = () => {
    setGoogleSheetsConfig({
      spreadsheetId: null,
      spreadsheetTitle: null,
      spreadsheetUrl: null,
      autoSyncOrders: true,
      autoSyncProduction: true,
      autoSyncInventory: true,
      lastSyncedAt: null,
      lastLoadedAt: null,
    });
    logAction('SISTEM', 'PUTUSKAN GOOGLE SHEETS', 'Memutuskan koneksi dari Google Sheets');
  };

  const updateGoogleSheetsConfig = (patch: Partial<GoogleSheetsConfig>) => {
    setGoogleSheetsConfig(prev => ({ ...prev, ...patch }));
  };

  return (
    <BakeryContext.Provider
      value={{
        businessProfile,
        updateBusinessProfile,
        units: INITIAL_UNITS,
        currentRole,
        setCurrentRole,
        currentUser,
        setCurrentUser: (user: UserAccount) => setCurrentRole(user.role),
        users: INITIAL_USERS,
        outlets: INITIAL_OUTLETS,
        currentOutlet,
        setCurrentOutlet,
        ingredients,
        suppliers,
        purchases,
        addIngredient,
        updateIngredient,
        deleteIngredient,
        addSupplier,
        updateSupplier,
        deleteSupplier,
        recordPurchase,
        recipes,
        products,
        addRecipe,
        updateRecipe,
        addRecipeVersion,
        addProduct,
        updateProduct,
        deleteProduct,
        productions,
        createProductionRun,
        advanceProductionStatus,
        cancelProductionRun,
        wastes,
        wasteRecords: wastes,
        recordWaste,
        deleteWasteRecord,
        orders,
        customers,
        createOrder,
        updateOrderStatus,
        updatePaymentStatus,
        updateOrderPayment,
        updateOrderFulfillment,
        cancelOrder,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        expenses,
        addExpense,
        deleteExpense,
        auditLogs,
        logAction,
        resetDemoData,
        exportDataJson,
        importDataJson,
        lowStockIngredients,
        lowStockProducts,
        activeProductionsCount,
        pendingOrdersCount,
        googleUser,
        googleAccessToken,
        googleSheetsConfig,
        isGoogleLoading,
        isGoogleSyncing,
        signInWithGoogle,
        signOutFromGoogle,
        createBakeryGoogleSheet,
        connectGoogleSheetById,
        syncNowToGoogleSheets,
        loadDataFromGoogleSheets,
        disconnectGoogleSheet,
        updateGoogleSheetsConfig,
      }}
    >
      {children}
    </BakeryContext.Provider>
  );
};

export const useBakery = () => {
  const context = useContext(BakeryContext);
  if (!context) {
    throw new Error('useBakery must be used within a BakeryProvider');
  }
  return context;
};
