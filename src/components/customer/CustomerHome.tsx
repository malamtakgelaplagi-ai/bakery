import React, { useState } from 'react';
import { useBakery } from '../../context/BakeryContext';
import { Product } from '../../types';
import { formatRupiah } from '../../utils/formatters';
import { CustomerHeader } from './CustomerHeader';
import { ProductDetailModal } from './ProductDetailModal';
import { CustomerCartDrawer, CartItem } from './CustomerCartDrawer';
import { ManagementLoginModal } from './ManagementLoginModal';
import {
  Sparkles,
  ShoppingBag,
  ArrowRight,
  Phone,
  Clock,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  Star,
  Search,
  Store,
  Layers,
  Heart,
  Send,
  Lock,
  ChevronRight,
  ExternalLink,
  Award,
} from 'lucide-react';

interface CustomerHomeProps {
  onOpenLogin: () => void;
  onNavigateToDashboard: () => void;
  isManagementAuthenticated: boolean;
}

export const CustomerHome: React.FC<CustomerHomeProps> = ({
  onOpenLogin,
  onNavigateToDashboard,
  isManagementAuthenticated,
}) => {
  const { products, businessProfile } = useBakery();

  // Storefront interactive state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [notificationToast, setNotificationToast] = useState<string | null>(null);

  // Filter products by active status and user search/category
  const activeProducts = products.filter((p) => p.status === 'active');

  const categories = [
    'Semua',
    ...Array.from(new Set(activeProducts.map((p) => p.category))),
  ];

  const filteredProducts = activeProducts.filter((p) => {
    const matchCategory =
      selectedCategory === 'Semua' || p.category === selectedCategory;
    const matchSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.description || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  const showToast = (message: string) => {
    setNotificationToast(message);
    setTimeout(() => {
      setNotificationToast(null);
    }, 3000);
  };

  // Cart operations
  const handleAddToCart = (product: Product, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });
    showToast(`✓ ${quantity} box "${product.name}" dimasukkan ke keranjang!`);
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const totalCartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  const cleanStorePhone = (businessProfile.phone || '082115181105').replace(/\D/g, '');
  const waStorePhone = cleanStorePhone.startsWith('0')
    ? '62' + cleanStorePhone.slice(1)
    : cleanStorePhone;

  const handleQuickOrderWa = (product: Product, quantity = 1) => {
    const text = `Halo Admin ${businessProfile.name}, saya ingin memesan:\n• *${product.name}* (${product.sizeSpec})\n• Jumlah: ${quantity} box\n• Total: ${formatRupiah(product.sellingPrice * quantity)}\n\nApakah stok siap kirim hari ini? Terima kasih!`;
    window.open(
      `https://wa.me/${waStorePhone}?text=${encodeURIComponent(text)}`,
      '_blank'
    );
  };

  const handleOpenDetail = (prod: Product) => {
    setSelectedProduct(prod);
    setIsDetailOpen(true);
  };

  return (
    <div className="min-h-screen bg-stone-50 font-sans text-stone-900 selection:bg-amber-200 selection:text-amber-950 flex flex-col">
      {/* Customer Header */}
      <CustomerHeader
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenLogin={onOpenLogin}
        onNavigateToDashboard={onNavigateToDashboard}
        isManagementAuthenticated={isManagementAuthenticated}
      />

      {/* Floating Notification Toast */}
      {notificationToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-stone-900 text-white text-xs font-bold px-4 py-3 rounded-xl shadow-xl border border-amber-500/50 flex items-center space-x-2 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{notificationToast}</span>
        </div>
      )}

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* HERO SECTION */}
        <section id="hero" className="relative overflow-hidden bg-gradient-to-b from-amber-50/70 via-stone-50 to-white pt-8 pb-16 lg:py-20 border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Headline & Action */}
              <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
                <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-amber-100/90 border border-amber-300 text-amber-900 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-700" />
                  <span>Resep Otentik Warisan Nusantara • 100% Halal</span>
                </div>

                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-stone-950 tracking-tight leading-[1.15]">
                  Kelembutan Bolu Pisang Raja Pilihan & Cake Istimewa{' '}
                  <span className="text-amber-600 block sm:inline">
                    Fresh Dari Oven.
                  </span>
                </h1>

                <p className="text-base sm:text-lg text-stone-600 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
                  Dibuat setiap subuh dengan buah pisang matang pohon alami, rempah kayu manis wangi, dan margarin butter premium. Tanpa bahan pengawet berbahaya—sangat cocok untuk oleh-oleh, arisan, hantaran, dan cemilan keluarga.
                </p>

                {/* Hero CTAs */}
                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3.5 pt-2">
                  <a
                    href="#produk"
                    className="w-full sm:w-auto px-6 py-3.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-black text-sm rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Lihat Menu Bolu & Harga</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>

                  <a
                    href={`https://wa.me/${waStorePhone}?text=Halo%20Admin%20${encodeURIComponent(businessProfile.name)}%2C%20saya%20ingin%20pesan%20bolu%20pisang.`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-5 py-3.5 bg-white hover:bg-stone-100 text-stone-800 font-bold text-sm rounded-xl border border-stone-300 shadow-xs transition flex items-center justify-center space-x-2"
                  >
                    <Phone className="w-4 h-4 text-emerald-600" />
                    <span>Konsultasi / Pesan Khusus WA</span>
                  </a>
                </div>

                {/* Trust Badges Row */}
                <div className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left border-t border-stone-200/80">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-xs font-semibold text-stone-700">Pisang Alami Asli</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-xs font-semibold text-stone-700">Panggang Tiap Pagi</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-xs font-semibold text-stone-700">Box Mewah Ivory</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
                    <span className="text-xs font-semibold text-stone-700">Kirim Instant / Pickup</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Hero Visual Card */}
              <div className="lg:col-span-5 relative">
                <div className="relative mx-auto max-w-md lg:max-w-none">
                  {/* Decorative Background Glow */}
                  <div className="absolute -inset-2 bg-gradient-to-r from-amber-400 to-amber-600 rounded-3xl blur-xl opacity-30 transform -rotate-1"></div>

                  {/* Main Hero Card */}
                  <div className="relative bg-white rounded-2xl shadow-xl overflow-hidden border border-stone-200/80 p-2">
                    <div className="relative h-72 sm:h-80 rounded-xl overflow-hidden">
                      <img
                        src="/products/bolu-jadul-marmer.jpg"
                        alt="Bolu Jadul Marmer PUSAKA"
                        className="w-full h-full object-cover transform hover:scale-105 transition duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950/80 via-transparent to-transparent"></div>

                      <div className="absolute top-3 left-3 bg-amber-500 text-stone-950 text-xs font-black px-3 py-1 rounded-full shadow-md">
                        ★ BEST SELLER NOMOR 1
                      </div>

                      <div className="absolute bottom-4 left-4 right-4 text-white">
                        <span className="text-xs font-medium text-amber-300">
                          Bolu Pisang & Bolu Jadul PUSAKA
                        </span>
                        <h3 className="text-xl font-bold leading-tight mt-0.5">
                          Tekstur Moist Legit & Lembut di Setiap Gigitan
                        </h3>
                        <p className="text-xs text-stone-200 mt-1 line-clamp-2">
                          Bolu pisang matang pohon alami dan bolu jadoel marmer legendaris resep otentik tempo dulu.
                        </p>
                      </div>
                    </div>

                    <div className="p-4 bg-stone-50 rounded-xl mt-2 flex items-center justify-between">
                      <div>
                        <span className="text-[11px] text-stone-500 block">Harga Mulai</span>
                        <span className="text-base font-black text-amber-700">Rp 55.000 / Box</span>
                      </div>
                      <a
                        href="#produk"
                        className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-lg transition flex items-center space-x-1"
                      >
                        <span>Pesan Bolu</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 1: KATALOG PRODUK ETALASE (#produk) */}
        <section id="produk" className="py-16 bg-stone-100/60 border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Header */}
            <div className="text-center max-w-3xl mx-auto mb-10 space-y-3">
              <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Etalase Produk Jadi Siap Pesan</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                Pilihan Bolu Pisang & Cake PUSAKA
              </h2>
              <p className="text-sm text-stone-600">
                Pilih bolu favorit Anda. Semua dipanggang fresh, menggunakan bahan higienis bermutu tinggi, dan siap dikirim atau diambil langsung di outlet.
              </p>
            </div>

            {/* Filter Pills & Search Bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 bg-white p-3 sm:p-4 rounded-2xl border border-stone-200 shadow-2xs">
              {/* Category Pills */}
              <div className="flex items-center space-x-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                      selectedCategory === cat
                        ? 'bg-amber-500 text-stone-950 shadow-xs'
                        : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-72">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari bolu keju, jadoel..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-amber-400 focus:outline-none bg-stone-50"
                />
              </div>
            </div>

            {/* Product Cards Grid */}
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-2xl border border-stone-200 space-y-3">
                <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-stone-800 text-base">
                  Tidak Ada Produk yang Cocok
                </h3>
                <p className="text-xs text-stone-500">
                  Coba kata kunci pencarian lain atau pilih kategori Semua.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('Semua');
                  }}
                  className="px-4 py-2 bg-amber-400 text-stone-950 text-xs font-bold rounded-lg"
                >
                  Reset Filter
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredProducts.map((prod) => {
                  const fallbackImg = '/products/bolu-pisang-original.jpg';
                  const prodImage = prod.image || fallbackImg;

                  return (
                    <div
                      key={prod.id}
                      className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-2xs hover:shadow-md hover:border-amber-400/80 transition group flex flex-col justify-between"
                    >
                      {/* Product Image */}
                      <div>
                        <div
                          className="relative h-48 w-full bg-stone-100 overflow-hidden cursor-pointer"
                          onClick={() => handleOpenDetail(prod)}
                        >
                          <img
                            src={prodImage}
                            alt={prod.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                          />
                          <div className="absolute top-2.5 left-2.5 flex flex-col gap-1 items-start">
                            <span className="bg-stone-900/80 backdrop-blur-xs text-amber-300 text-[10px] font-bold px-2 py-0.5 rounded-md">
                              {prod.category}
                            </span>
                            {prod.stockFinishedGoods > 0 ? (
                              <span className="bg-emerald-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                                Ready: {prod.stockFinishedGoods} box
                              </span>
                            ) : (
                              <span className="bg-amber-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                Made to Order
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Card Info */}
                        <div className="p-4 space-y-2.5">
                          <div className="flex items-baseline justify-between gap-1">
                            <span className="text-[10px] font-mono text-stone-400 font-semibold">
                              {prod.sku}
                            </span>
                            <span className="text-[11px] text-stone-500 font-medium">
                              Tahan {prod.shelfLifeDays || 4} Hari
                            </span>
                          </div>

                          <h3
                            onClick={() => handleOpenDetail(prod)}
                            className="font-bold text-base text-stone-900 leading-tight group-hover:text-amber-700 transition cursor-pointer"
                          >
                            {prod.name}
                          </h3>

                          <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                            {prod.description ||
                              'Bolu pisang premium lembut kaya rasa pisang alami dan aroma butter harum.'}
                          </p>

                          {/* Mini Specs Pill */}
                          <div className="flex items-center space-x-2 text-[11px] text-stone-600 pt-1">
                            <span className="bg-stone-100 px-2 py-0.5 rounded font-medium">
                              {prod.sizeSpec}
                            </span>
                            <span className="bg-stone-100 px-2 py-0.5 rounded font-medium">
                              ±{prod.bakedWeightGram}g
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Card Footer: Price & Buttons */}
                      <div className="p-4 pt-2 bg-stone-50 border-t border-stone-100 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-stone-400 block">Harga</span>
                            <span className="text-base font-black text-amber-700">
                              {formatRupiah(prod.sellingPrice)}
                            </span>
                          </div>

                          <button
                            onClick={() => handleOpenDetail(prod)}
                            className="text-xs font-bold text-stone-600 hover:text-stone-950 underline"
                          >
                            Detail
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleAddToCart(prod, 1)}
                            className="px-2.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-950 font-bold text-xs rounded-xl border border-amber-300 transition flex items-center justify-center space-x-1"
                            title="Tambah ke Keranjang"
                          >
                            <ShoppingBag className="w-3.5 h-3.5 text-amber-800" />
                            <span>+ Keranjang</span>
                          </button>

                          <button
                            onClick={() => handleQuickOrderWa(prod, 1)}
                            className="px-2.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1 shadow-2xs"
                            title="Pesan Langsung via WhatsApp"
                          >
                            <Send className="w-3.5 h-3.5" />
                            <span>Pesan WA</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* SECTION 2: PROFIL BISNIS PUSAKA (#profil) */}
        <section id="profil" className="py-16 bg-white border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Story & Dedication */}
              <div className="lg:col-span-6 space-y-5">
                <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold">
                  <Award className="w-3.5 h-3.5" />
                  <span>Profil & Filosofi Rasa PUSAKA</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight leading-tight">
                  Warisan Resep Tradisional Nusantara yang Diracik dengan Standar Kebersihan Modern.
                </h2>

                <p className="text-sm text-stone-600 leading-relaxed">
                  <strong>{businessProfile.name}</strong> didirikan dengan satu komitmen sederhana: mengembalikan cita rasa otentik bolu jadoel dan bolu pisang warisan keluarga yang kaya aroma, bertekstur lembut dan lembab (moist), tanpa kompromi bahan kimia pengawet.
                </p>

                <p className="text-sm text-stone-600 leading-relaxed">
                  Setiap loyang dipanggang di dapur produksi kami di <em>{businessProfile.address}</em> oleh tim baker terampil kami di bawah pengawasan Chef Nani Kartini & Lilis Mulyani serta Owner Muhammad Ridla. Dari pemilihan pisang ambon & raja yang matang alami di pohon hingga telur segar peternak lokal, kami menjaga setiap gram bahan baku dengan presisi.
                </p>

                {/* 4 Pillars of Excellence */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                  <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                    <span className="font-bold text-xs text-stone-900 flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                      <span>Pisang Matang Pohon</span>
                    </span>
                    <p className="text-[11px] text-stone-500">
                      Rasa manis karamel alami yang harum, bukan perisa artifisial.
                    </p>
                  </div>

                  <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                    <span className="font-bold text-xs text-stone-900 flex items-center space-x-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                      <span>Higienis & Bersih</span>
                    </span>
                    <p className="text-[11px] text-stone-500">
                      Protokol sanitasi dapur standar pangan dan bahan 100% Halal.
                    </p>
                  </div>

                  <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                    <span className="font-bold text-xs text-stone-900 flex items-center space-x-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      <span>Fresh Baked Daily</span>
                    </span>
                    <p className="text-[11px] text-stone-500">
                      Dipanggang setiap pagi hari, tidak menjual stok kemarin.
                    </p>
                  </div>

                  <div className="p-3.5 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                    <span className="font-bold text-xs text-stone-900 flex items-center space-x-1.5">
                      <Award className="w-3.5 h-3.5 text-amber-600" />
                      <span>Dus Eksklusif Foil Emas</span>
                    </span>
                    <p className="text-[11px] text-stone-500">
                      Packaging elegan dan kokoh, siap jadi buah tangan terindah.
                    </p>
                  </div>
                </div>
              </div>

              {/* Right Column: Profile Gallery Card */}
              <div className="lg:col-span-6">
                <div className="bg-stone-50 rounded-3xl p-6 border border-stone-200 shadow-sm space-y-6">
                  {/* Photo Collage */}
                  <div className="grid grid-cols-2 gap-3">
                    <img
                      src="/products/bolu-jadul-coklat.jpg"
                      alt="Bolu Jadul Coklat PUSAKA"
                      className="w-full h-44 object-cover rounded-2xl shadow-xs"
                    />
                    <img
                      src="/products/bolu-pisang-original.jpg"
                      alt="Bolu Pisang Original PUSAKA"
                      className="w-full h-44 object-cover rounded-2xl shadow-xs"
                    />
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-stone-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-stone-900">
                        Manajemen & Dapur Produksi PUSAKA
                      </span>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        Outlet Utama Bandung
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 leading-relaxed">
                      "Kami percaya bahwa bolu yang lezat bukan hanya soal resep, tapi tentang rasa cinta dan kejujuran bahan. Setiap loyang yang keluar dari oven adalah representasi kehormatan nama PUSAKA."
                    </p>
                    <div className="pt-2 text-xs font-bold text-stone-800">
                      — Muhammad Ridla (Owner PUSAKA Bakery)
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 3: KEUNGGULAN & TESTIMONI (#keunggulan) */}
        <section id="keunggulan" className="py-16 bg-stone-100/50 border-b border-stone-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-12 space-y-2">
              <span className="text-xs font-bold text-amber-700 uppercase tracking-wider">
                Kepuasan Pelanggan
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
                Apa Kata Sahabat & Pelanggan Setia PUSAKA?
              </h2>
              <p className="text-sm text-stone-500">
                Lebih dari ribuan loyang bolu telah menemani momen spesial keluarga, rapat kantor, dan arisan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Review 1 */}
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
                <div className="flex items-center space-x-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic">
                  "Bolu pisang kejunya beneran juara! Lembut banget gak bikin seret di tenggorokan, manisnya pas dan kejunya melimpah. Tiap ada acara arisan keluarga selalu pesan 5 box di sini."
                </p>
                <div className="pt-2 border-t border-stone-100 flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-xs">
                    RK
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-stone-900">
                      Ibu Ratna Kumalasari
                    </span>
                    <span className="block text-[10px] text-stone-400">
                      Pelanggan Tetap Dago Asri
                    </span>
                  </div>
                </div>
              </div>

              {/* Review 2 */}
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
                <div className="flex items-center space-x-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic">
                  "Bolu Jadoel marmernya ngingetin sama kue buatan nenek jaman dulu. Aromanya wangi butter banget pas dusnya dibuka. Packagingnya juga mewah, cocok banget buat oleh-oleh kantor."
                </p>
                <div className="pt-2 border-t border-stone-100 flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-stone-800 text-white font-bold flex items-center justify-center text-xs">
                    BS
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-stone-900">
                      Pak Budi Santoso
                    </span>
                    <span className="block text-[10px] text-stone-400">
                      Karyawan Swasta Bandung
                    </span>
                  </div>
                </div>
              </div>

              {/* Review 3 */}
              <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-2xs space-y-4">
                <div className="flex items-center space-x-1 text-amber-500">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs sm:text-sm text-stone-700 leading-relaxed italic">
                  "Respon pemesanan via WhatsApp-nya super cepat dan ramah! Pengiriman instant nyampe rumah masih anget freshly baked. Bolu Choco Melt-nya favorit anak-anak!"
                </p>
                <div className="pt-2 border-t border-stone-100 flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-full bg-amber-500 text-stone-950 font-bold flex items-center justify-center text-xs">
                    AW
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-stone-900">
                      dr. Anita Wijaya
                    </span>
                    <span className="block text-[10px] text-stone-400">
                      Ibu Rumah Tangga Buah Batu
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 4: LOKASI OUTLET & KONTAK RESMI (#lokasi) */}
        <section id="lokasi" className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-gradient-to-br from-stone-900 to-stone-950 rounded-3xl text-white p-6 sm:p-10 lg:p-12 shadow-xl">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                {/* Left Outlet Info */}
                <div className="lg:col-span-7 space-y-6">
                  <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
                    <Store className="w-3.5 h-3.5" />
                    <span>Kunjungi Dapur & Toko Fisik Kami</span>
                  </div>

                  <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                    Outlet Resmi {businessProfile.name}
                  </h2>

                  <div className="space-y-3.5 text-xs sm:text-sm text-stone-300">
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-white">Alamat Toko:</strong>
                        <span>{businessProfile.address || 'Jl. Rancabolang Indah II no 15'}</span>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Clock className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-white">Jam Operasional Toko:</strong>
                        <span>07.00 - 20.00 WIB (Buka Setiap Hari, Senin s/d Minggu)</span>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <Phone className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="block text-white">Layanan WhatsApp & Konsultasi:</strong>
                        <span>{businessProfile.phone || '082115181105'} (Fast Response)</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-3 pt-2">
                    <a
                      href={businessProfile.googleMapsUrl || 'https://maps.google.com/?q=Jl.+Rancabolang+Indah+II+no+15+Bandung'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow-sm transition flex items-center space-x-1.5"
                    >
                      <MapPin className="w-4 h-4" />
                      <span>Petunjuk Arah di Google Maps</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>

                    <a
                      href={`https://wa.me/${waStorePhone}?text=Halo%20Admin%20${encodeURIComponent(businessProfile.name)}%2C%20saya%20mau%20tanya%20arah%20lokasi%20toko.`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs rounded-xl border border-stone-700 transition flex items-center space-x-1.5"
                    >
                      <Phone className="w-4 h-4 text-emerald-400" />
                      <span>Hubungi Admin Toko</span>
                    </a>
                  </div>
                </div>

                {/* Right Payment & Delivery Info Card */}
                <div className="lg:col-span-5 bg-stone-800/80 backdrop-blur-xs p-6 rounded-2xl border border-stone-700 space-y-4">
                  <h3 className="font-bold text-sm text-white flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>Kemudahan Pembayaran & Pengiriman:</span>
                  </h3>

                  <div className="space-y-2 text-xs text-stone-300">
                    <div className="p-3 bg-stone-900/60 rounded-xl border border-stone-700/60">
                      <strong className="block text-amber-300 mb-1">
                        💳 Metode Pembayaran Resmi
                      </strong>
                      <span>Transfer Bank BCA, Bank Mandiri, QRIS All Payment (GoPay, OVO, ShopeePay, DANA), dan Tunai di Outlet.</span>
                    </div>

                    <div className="p-3 bg-stone-900/60 rounded-xl border border-stone-700/60">
                      <strong className="block text-amber-300 mb-1">
                        🛵 Opsi Pengiriman
                      </strong>
                      <span>Tersedia Gosend / GrabExpress Instant untuk area Bandung Raya, atau Ambil Sendiri (Pickup) di Outlet.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="bg-stone-900 text-stone-400 text-xs border-t border-stone-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-2">
              <span className="text-base font-black text-white block">
                {businessProfile.name}
              </span>
              <p className="text-xs text-stone-400 leading-relaxed">
                {businessProfile.tagline || 'Artisan Bolu Tradisional Nusantara & Cake Pilihan'}
              </p>
              <div className="text-[11px] text-stone-500 pt-2">
                © {new Date().getFullYear()} {businessProfile.name}. Seluruh hak cipta dilindungi.
              </div>
            </div>

            <div>
              <h4 className="font-bold text-stone-200 text-xs mb-2">Navigasi Halaman</h4>
              <ul className="space-y-1.5 text-xs">
                <li><a href="#produk" className="hover:text-amber-400 transition">Katalog Produk Bolu</a></li>
                <li><a href="#profil" className="hover:text-amber-400 transition">Profil & Filosofi Rasa</a></li>
                <li><a href="#keunggulan" className="hover:text-amber-400 transition">Ulasan Konsumen</a></li>
                <li><a href="#lokasi" className="hover:text-amber-400 transition">Lokasi Outlet Bandung</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-stone-200 text-xs mb-2">Layanan Pelanggan</h4>
              <ul className="space-y-1.5 text-xs">
                <li>WhatsApp: {businessProfile.phone}</li>
                <li>Email: {businessProfile.email || 'info@pusakabakery.com'}</li>
                <li>Jam Buka: 07.00 - 20.00 WIB</li>
                <li>Pesanan Acara & Hampers</li>
              </ul>
            </div>

            {/* Management Access Portal in Footer */}
            <div className="space-y-2">
              <h4 className="font-bold text-stone-200 text-xs mb-2">Internal PUSAKA</h4>
              <p className="text-[11px] text-stone-500">
                Akses khusus pengelola usaha, kasir POS, dan staf produksi bakery.
              </p>

              {isManagementAuthenticated ? (
                <button
                  onClick={onNavigateToDashboard}
                  className="w-full px-3 py-2 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl transition flex items-center justify-center space-x-1.5 shadow-sm"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Buka Dashboard Bisnis</span>
                </button>
              ) : (
                <button
                  onClick={onOpenLogin}
                  className="w-full px-3 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs rounded-xl border border-stone-700 transition flex items-center justify-center space-x-1.5"
                >
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Login Pengelola / Manajemen</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </footer>

      {/* Cart Drawer Slide-over */}
      <CustomerCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveItem}
        onClearCart={handleClearCart}
      />

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onAddToCart={handleAddToCart}
        onQuickOrderWa={handleQuickOrderWa}
      />
    </div>
  );
};
