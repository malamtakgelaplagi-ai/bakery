import React, { useState } from 'react';
import { useBakery } from '../../context/BakeryContext';
import { Customer } from '../../types';
import { GoogleSyncBanner } from '../common/GoogleSyncBanner';
import {
  formatRupiah,
  formatDateIndo,
  generateWhatsAppLink,
  buildRepeatOrderPromoWhatsAppMessage,
} from '../../utils/formatters';
import {
  Users,
  Plus,
  Search,
  MessageSquare,
  Sparkles,
  ShoppingBag,
  Star,
  Tag,
  Edit2,
  Trash2,
  Send,
  X,
  CheckCircle2,
  Crown,
  Zap,
  TrendingUp,
} from 'lucide-react';

export const CustomerList: React.FC = () => {
  const { customers, addCustomer, updateCustomer, deleteCustomer, businessProfile } = useBakery();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('ALL');

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    tags: 'Langganan',
    notes: '',
  });

  // Calculate CRM Metrics
  const totalCustomersCount = customers.length;
  const whatsappCustomersCount = customers.filter(
    (c) => c.tags && c.tags.some((t) => t.toLowerCase() === 'whatsapp')
  ).length;
  const totalLTV = customers.reduce(
    (acc, c) => acc + (Number(c.totalSpend ?? c.totalSpent) || 0),
    0
  );
  const loyalCustomersCount = customers.filter(
    (c) => c.tier === 'LOYAL' || (c.totalOrders && c.totalOrders >= 4)
  ).length;

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.address && c.address.toLowerCase().includes(searchQuery.toLowerCase()));

    let matchesTag = true;
    if (selectedTag === 'ALL') {
      matchesTag = true;
    } else if (selectedTag === 'WhatsApp') {
      matchesTag = Boolean(c.tags && c.tags.some((t) => t.toLowerCase() === 'whatsapp'));
    } else {
      matchesTag = Boolean(c.tags && c.tags.includes(selectedTag));
    }

    return matchesSearch && matchesTag;
  });

  const handleOpenNew = () => {
    setEditingCustomer(null);
    setForm({
      name: '',
      phone: '',
      email: '',
      address: '',
      tags: 'Langganan',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cust: Customer) => {
    setEditingCustomer(cust);
    setForm({
      name: cust.name,
      phone: cust.phone,
      email: cust.email || '',
      address: cust.address || '',
      tags: cust.tags ? cust.tags.join(', ') : 'Langganan',
      notes: cust.notes || '',
    });
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) return;

    const tagsArray = form.tags
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, {
        name: form.name,
        phone: form.phone,
        email: form.email,
        address: form.address,
        tags: tagsArray,
        notes: form.notes,
      });
    } else {
      addCustomer({
        name: form.name,
        phone: form.phone,
        email: form.email,
        address: form.address,
        totalOrders: 0,
        totalSpend: 0,
        totalSpent: 0,
        tags: tagsArray,
        notes: form.notes,
      });
    }

    setIsModalOpen(false);
  };

  const handleBroadcastPromo = (cust: Customer) => {
    const msg = buildRepeatOrderPromoWhatsAppMessage(
      cust.name,
      businessProfile.name,
      'Diskon Spesial 10% untuk pesanan Bolu Pisang Premium Anda minggu ini!'
    );
    const url = generateWhatsAppLink(cust.phone, msg);
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Live Google Sheets Sync Banner */}
      <GoogleSyncBanner
        moduleName="Pelanggan & CRM WhatsApp"
        moduleDescription="Database kontak pelanggan, nomor WhatsApp, akumulasi belanja LTV, dan tier loyalitas terhubung langsung ke sheet 👥 Pelanggan_CRM di Google Spreadsheet."
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Modul CRM & Pelanggan
            </span>
            <span className="text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              Auto-Sync Order WA
            </span>
          </div>
          <h2 className="text-xl font-bold text-stone-900 mt-1">
            Database Pelanggan, Repeat Order & CRM WhatsApp
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Pelanggan yang mengonfirmasi pesanan via bot WhatsApp otomatis terdaftar di sini beserta riwayat transaksi & LTV.
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold text-xs rounded-lg transition shadow-sm flex items-center space-x-1.5 whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>+ Tambah Pelanggan Baru</span>
        </button>
      </div>

      {/* Top Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span>Total Pelanggan</span>
            <Users className="w-4 h-4 text-stone-400" />
          </div>
          <div className="text-2xl font-black text-stone-900">{totalCustomersCount}</div>
          <div className="text-[11px] text-stone-400">Database aktif bakery</div>
        </div>

        <div
          onClick={() => setSelectedTag('WhatsApp')}
          className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 shadow-sm space-y-1 cursor-pointer hover:border-emerald-400 transition"
          title="Klik untuk filter khusus pelanggan WhatsApp"
        >
          <div className="flex items-center justify-between text-emerald-800 text-xs font-semibold">
            <span className="flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600 fill-emerald-100" />
              Dari Bot WhatsApp
            </span>
            <span className="text-[10px] bg-emerald-200/80 text-emerald-900 px-1.5 py-0.5 rounded font-bold">Auto</span>
          </div>
          <div className="text-2xl font-black text-emerald-900">{whatsappCustomersCount}</div>
          <div className="text-[11px] text-emerald-700 font-medium">Klik untuk lihat pelanggan WA</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span>Total Transaksi LTV</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-stone-900 font-mono text-base sm:text-2xl">
            {formatRupiah(totalLTV)}
          </div>
          <div className="text-[11px] text-stone-400">Nilai kumulatif pesanan</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-stone-500 text-xs">
            <span>Pelanggan Loyal</span>
            <Crown className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-700">{loyalCustomersCount}</div>
          <div className="text-[11px] text-stone-400">≥ 4 transaksi pesanan</div>
        </div>
      </div>

      {/* Search & Tags Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-xl border border-stone-200 shadow-sm text-xs">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, WhatsApp, alamat..."
            className="w-full pl-9 pr-3 py-2 border border-stone-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-400 focus:outline-none"
          />
        </div>

        {/* Tag Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedTag('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              selectedTag === 'ALL'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Semua ({customers.length})
          </button>
          <button
            onClick={() => setSelectedTag('WhatsApp')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
              selectedTag === 'WhatsApp'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>WhatsApp ({whatsappCustomersCount})</span>
          </button>
          <button
            onClick={() => setSelectedTag('Langganan')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              selectedTag === 'Langganan'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Langganan
          </button>
          <button
            onClick={() => setSelectedTag('VIP')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              selectedTag === 'VIP'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            VIP
          </button>
          <button
            onClick={() => setSelectedTag('Reseller')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              selectedTag === 'Reseller'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Reseller
          </button>
          <button
            onClick={() => setSelectedTag('Corporate')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
              selectedTag === 'Corporate'
                ? 'bg-stone-900 text-white'
                : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
            }`}
          >
            Corporate
          </button>
        </div>
      </div>

      {/* Customer Grid */}
      {filteredCustomers.length === 0 ? (
        <div className="bg-white rounded-xl border border-stone-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center mx-auto text-stone-400">
            <Users className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-stone-800 text-sm">Tidak ada pelanggan ditemukan</h3>
          <p className="text-xs text-stone-500 max-w-sm mx-auto">
            {searchQuery
              ? `Tidak ada pelanggan yang cocok dengan pencarian "${searchQuery}".`
              : selectedTag === 'WhatsApp'
              ? 'Belum ada pelanggan dari bot WhatsApp. Saat konsumen mengonfirmasi pesanan (1. Ya, Konfirmasi), otomatis muncul di sini.'
              : 'Belum ada pelanggan pada kategori ini.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCustomers.map((cust) => {
            const isWhatsAppCust = Boolean(
              cust.tags && cust.tags.some((t) => t.toLowerCase() === 'whatsapp')
            );
            const spendValue = Number(cust.totalSpend ?? cust.totalSpent) || 0;

            return (
              <div
                key={cust.id}
                className={`bg-white p-4 rounded-xl border shadow-sm flex flex-col justify-between space-y-3 transition ${
                  isWhatsAppCust
                    ? 'border-emerald-200 hover:border-emerald-400 ring-1 ring-emerald-400/20'
                    : 'border-stone-200 hover:border-amber-400/60'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-bold text-sm text-stone-900">{cust.name}</h3>
                        {/* Tier Badge */}
                        {cust.tier === 'VIP' && (
                          <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded border border-purple-200 flex items-center gap-0.5">
                            <Crown className="w-2.5 h-2.5" /> VIP
                          </span>
                        )}
                        {cust.tier === 'LOYAL' && (
                          <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded border border-amber-300 flex items-center gap-0.5">
                            <Star className="w-2.5 h-2.5 fill-amber-500 text-amber-500" /> Loyal
                          </span>
                        )}
                        {cust.tier === 'AKTIF' && (
                          <span className="text-[10px] bg-blue-100 text-blue-900 font-bold px-1.5 py-0.5 rounded border border-blue-200 flex items-center gap-0.5">
                            <Zap className="w-2.5 h-2.5 text-blue-600" /> Aktif
                          </span>
                        )}
                      </div>
                      <div className="text-stone-500 font-mono text-xs mt-0.5 flex items-center gap-1">
                        <span>{cust.phone}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => handleOpenEdit(cust)}
                        className="p-1 text-stone-400 hover:text-stone-900 rounded"
                        title="Edit Data"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Hapus pelanggan "${cust.name}"?`)) {
                            deleteCustomer(cust.id);
                          }
                        }}
                        className="p-1 text-stone-400 hover:text-rose-600 rounded"
                        title="Hapus Pelanggan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {cust.address && (
                    <p className="text-[11px] text-stone-600 mt-2 line-clamp-1">
                      📍 {cust.address}
                    </p>
                  )}

                  {/* Tags */}
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {isWhatsAppCust && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-md text-[10px] font-bold flex items-center gap-1 shadow-xs">
                        <MessageSquare className="w-3 h-3 text-emerald-600 fill-emerald-200" />
                        Order via WhatsApp
                      </span>
                    )}

                    {(cust.tags || [])
                      .filter((t) => t.toLowerCase() !== 'whatsapp')
                      .map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-stone-100 text-stone-700 border border-stone-200 rounded-md text-[10px] font-bold"
                        >
                          {tag}
                        </span>
                      ))}
                  </div>
                </div>

                {/* Stats & Repeat Order Button */}
                <div className="pt-3 border-t border-stone-100 space-y-2 text-xs">
                  <div className="flex justify-between text-stone-500 text-[11px]">
                    <span>
                      Total Pesanan: <strong>{cust.totalOrders || 0} Transaksi</strong>
                    </span>
                    <span className="font-mono font-bold text-stone-900">
                      {formatRupiah(spendValue)}
                    </span>
                  </div>

                  {cust.lastOrderDate && (
                    <div className="text-[10px] text-stone-400">
                      Terakhir Beli: {formatDateIndo(cust.lastOrderDate)}
                    </div>
                  )}

                  <button
                    onClick={() => handleBroadcastPromo(cust)}
                    className="w-full py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-lg transition border border-emerald-200 flex items-center justify-center space-x-1.5 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Sapa & Follow-up via WhatsApp</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Customer Form Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-2xl border border-stone-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 bg-stone-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingCustomer ? 'Ubah Data Pelanggan' : 'Tambah Pelanggan Baru'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-stone-400 hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Ibu Ratna Dewi"
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Nomor WhatsApp *</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="08123456789"
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Alamat Pengiriman</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="Jl. Anggrek No. 18"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  Label / Tags (Pisahkan dengan koma)
                </label>
                <input
                  type="text"
                  value={form.tags}
                  onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  placeholder="WhatsApp, VIP, Langganan, Reseller"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">Catatan Khusus</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  placeholder="Preferensi rasa, langganan arisan bulanan..."
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
                />
              </div>

              <div className="pt-3 border-t border-stone-200 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 font-semibold text-stone-700 bg-stone-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 font-bold text-stone-950 bg-amber-400 hover:bg-amber-300 rounded-lg"
                >
                  Simpan Pelanggan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
