import React, { useState } from 'react';
import { useBakery } from '../../context/BakeryContext';
import { Customer } from '../../types';
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

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.address && c.address.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesTag =
      selectedTag === 'ALL' || (c.tags && c.tags.includes(selectedTag));

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
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Modul CRM & Pelanggan
            </span>
          </div>
          <h2 className="text-xl font-bold text-stone-900 mt-1">
            Database Pelanggan, Repeat Order & Follow Up WhatsApp
          </h2>
          <p className="text-xs text-stone-500 mt-0.5">
            Kelola data pembeli loyal, nilai transaksi kumulatif (LTV), dan kirim penawaran repeat order via WhatsApp.
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

        <div className="flex items-center space-x-2">
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="px-3 py-2 border border-stone-300 rounded-lg text-xs bg-white focus:outline-none font-medium"
          >
            <option value="ALL">Semua Label / Segment</option>
            <option value="VIP">VIP</option>
            <option value="Reseller">Reseller</option>
            <option value="Langganan">Langganan</option>
            <option value="Corporate">Corporate / Kantor</option>
          </select>
        </div>
      </div>

      {/* Customer Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCustomers.map((cust) => (
          <div
            key={cust.id}
            className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm flex flex-col justify-between space-y-3 hover:border-amber-400/60 transition"
          >
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-sm text-stone-900">{cust.name}</h3>
                  <div className="text-stone-500 font-mono text-xs mt-0.5">{cust.phone}</div>
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
                {(cust.tags || []).map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md text-[10px] font-bold"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Stats & Repeat Order Button */}
            <div className="pt-3 border-t border-stone-100 space-y-2 text-xs">
              <div className="flex justify-between text-stone-500 text-[11px]">
                <span>Total Pesanan: <strong>{cust.totalOrders} Transaksi</strong></span>
                <span className="font-mono font-bold text-stone-900">
                  {formatRupiah(cust.totalSpent)}
                </span>
              </div>

              {cust.lastOrderDate && (
                <div className="text-[10px] text-stone-400">
                  Terakhir Beli: {formatDateIndo(cust.lastOrderDate)}
                </div>
              )}

              <button
                onClick={() => handleBroadcastPromo(cust)}
                className="w-full py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs rounded-lg transition border border-emerald-200 flex items-center justify-center space-x-1.5"
              >
                <Send className="w-3.5 h-3.5 text-emerald-700" />
                <span>Sapa & Follow-up via WhatsApp</span>
              </button>
            </div>
          </div>
        ))}
      </div>

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
                  placeholder="VIP, Langganan, Reseller"
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
