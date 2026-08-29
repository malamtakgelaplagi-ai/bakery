import React, { useState } from 'react';
import { useBakery } from '../../context/BakeryContext';
import { UserAccount, UserRole } from '../../types';
import {
  Users,
  UserPlus,
  Edit3,
  Trash2,
  Check,
  Shield,
  ShieldCheck,
  Phone,
  Mail,
  Briefcase,
  Key,
  FileText,
  X,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Lock,
} from 'lucide-react';

interface StaffFormState {
  id?: string;
  name: string;
  role: UserRole;
  title: string;
  email: string;
  phone: string;
  pin: string;
  notes: string;
  status: 'active' | 'inactive';
}

const ROLE_DEFINITIONS: Record<
  UserRole,
  {
    label: string;
    description: string;
    badgeBg: string;
    badgeText: string;
    avatarBg: string;
    borderAccent: string;
  }
> = {
  OWNER: {
    label: 'Owner / Pemilik Usaha',
    description: 'Akses penuh ke seluruh modul, pembukuan laba rugi, kontrol staff, dan integrasi cloud.',
    badgeBg: 'bg-amber-500/10 text-amber-600 border-amber-500/30',
    badgeText: 'text-amber-500',
    avatarBg: 'bg-gradient-to-br from-amber-500 to-amber-700 text-white',
    borderAccent: 'border-amber-500',
  },
  ADMIN: {
    label: 'Admin Operasional',
    description: 'Manajemen pembelian bahan baku, database resep HPP, data pelanggan, dan pencatatan.',
    badgeBg: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/30',
    badgeText: 'text-indigo-500',
    avatarBg: 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white',
    borderAccent: 'border-indigo-500',
  },
  PRODUKSI: {
    label: 'Head Baker / Produksi',
    description: 'SPK Batch Produksi dapur, kalkulasi timbangan bahan resep, dan kontrol mutu adonan.',
    badgeBg: 'bg-orange-500/10 text-orange-600 border-orange-500/30',
    badgeText: 'text-orange-500',
    avatarBg: 'bg-gradient-to-br from-orange-500 to-amber-600 text-white',
    borderAccent: 'border-orange-500',
  },
  KASIR: {
    label: 'Kasir & Frontliner',
    description: 'Point of Sale (POS), penerimaan pesanan, cetak nota struk kasir, dan invoice WhatsApp.',
    badgeBg: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/30',
    badgeText: 'text-emerald-500',
    avatarBg: 'bg-gradient-to-br from-emerald-500 to-teal-700 text-white',
    borderAccent: 'border-emerald-500',
  },
  SUPERVISOR: {
    label: 'Supervisor & QC',
    description: 'Supervisi persediaan gudang, audit waste kerusakan bahan/produk, dan operasional shift.',
    badgeBg: 'bg-blue-500/10 text-blue-600 border-blue-500/30',
    badgeText: 'text-blue-500',
    avatarBg: 'bg-gradient-to-br from-blue-500 to-cyan-700 text-white',
    borderAccent: 'border-blue-500',
  },
};

export const StaffManager: React.FC = () => {
  const { users, currentUser, setCurrentUser, updateUser, addUser, deleteUser, resetUsersToDefault } =
    useBakery();

  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );
  const [showPinState, setShowPinState] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState<StaffFormState>({
    name: '',
    role: 'KASIR',
    title: '',
    email: '',
    phone: '',
    pin: '',
    notes: '',
    status: 'active',
  });

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 3500);
  };

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      role: 'KASIR',
      title: 'Kasir Outlet',
      email: '',
      phone: '',
      pin: '1234',
      notes: '',
      status: 'active',
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (user: UserAccount) => {
    setEditingUser(user);
    setFormData({
      id: user.id,
      name: user.name,
      role: user.role,
      title: user.title || (ROLE_DEFINITIONS[user.role]?.label ?? user.role),
      email: user.email || '',
      phone: user.phone || '',
      pin: user.pin || '',
      notes: user.notes || '',
      status: user.status || 'active',
    });
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingUser(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast('error', 'Nama staff wajib diisi.');
      return;
    }

    if (editingUser) {
      // Update existing user
      updateUser(editingUser.id, {
        name: formData.name.trim(),
        role: formData.role,
        title: formData.title.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        pin: formData.pin.trim(),
        notes: formData.notes.trim(),
        status: formData.status,
      });
      showToast('success', `Data staff "${formData.name}" berhasil diperbarui.`);
    } else {
      // Create new user
      const created = addUser({
        name: formData.name.trim(),
        role: formData.role,
        title: formData.title.trim() || ROLE_DEFINITIONS[formData.role].label,
        email: formData.email.trim() || `${formData.name.toLowerCase().replace(/\s+/g, '')}@pusakabakery.id`,
        phone: formData.phone.trim(),
        pin: formData.pin.trim() || '1234',
        notes: formData.notes.trim(),
        status: formData.status,
      });
      showToast('success', `Staff baru "${created.name}" (${created.role}) berhasil ditambahkan.`);
    }

    handleCloseModal();
  };

  const handleDeleteStaff = (user: UserAccount) => {
    if (user.id === currentUser.id && user.role === 'OWNER') {
      const ownerCount = users.filter((u) => u.role === 'OWNER').length;
      if (ownerCount <= 1) {
        showToast('error', 'Tidak dapat menghapus akun Owner yang sedang aktif sebagai pemilik utama.');
        return;
      }
    }

    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus akun staff "${user.name}" (${user.role})? Tindakan ini tidak dapat dibatalkan.`
      )
    ) {
      const res = deleteUser(user.id);
      if (res.success) {
        showToast('success', res.message);
      } else {
        showToast('error', res.message);
      }
    }
  };

  const handleResetDefaultStaff = () => {
    if (
      window.confirm(
        'Kembalikan daftar staff & hak akses pengguna ke setelan default demo (Owner, Admin, Produksi, Kasir, Supervisor)?'
      )
    ) {
      resetUsersToDefault();
      showToast('success', 'Daftar staff berhasil dikembalikan ke standar demo.');
    }
  };

  const filteredUsers = users.filter((u) => {
    if (selectedRoleFilter === 'ALL') return true;
    return u.role === selectedRoleFilter;
  });

  const togglePinVisibility = (userId: string) => {
    setShowPinState((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const activeUserRoleDef = ROLE_DEFINITIONS[currentUser.role] || ROLE_DEFINITIONS.OWNER;

  return (
    <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-5 space-y-5 text-xs">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-3 rounded-lg flex items-center justify-between text-xs font-semibold ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center space-x-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button onClick={() => setNotification(null)} className="text-stone-400 hover:text-stone-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
        <div>
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-amber-600" />
            <h3 className="font-bold text-sm text-stone-900">
              Staff & Multi-Role Pengguna (Kelola Akun & Hak Akses)
            </h3>
          </div>
          <p className="text-stone-500 text-[11px] mt-0.5">
            Ubah nama staff, kontak WhatsApp, nomor PIN kasir, atau tambah staff baru untuk simulasi operasional multi-role.
          </p>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaultStaff}
            className="px-2.5 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-medium rounded-lg transition flex items-center space-x-1"
            title="Reset daftar staff ke bawaan"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset Default</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold rounded-lg transition flex items-center space-x-1.5 shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Staff Baru</span>
          </button>
        </div>
      </div>

      {/* Active User Card Banner */}
      <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-50 to-stone-50 border border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shadow-sm ${activeUserRoleDef.avatarBg}`}
          >
            {currentUser.name.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-stone-900 text-xs sm:text-sm">{currentUser.name}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${activeUserRoleDef.badgeBg}`}>
                {currentUser.role}
              </span>
              <span className="px-1.5 py-0.2 text-[10px] bg-emerald-100 text-emerald-800 font-bold rounded">
                Sedang Aktif
              </span>
            </div>
            <p className="text-stone-600 text-[11px] mt-0.5">
              {currentUser.title || activeUserRoleDef.label} • {currentUser.email || 'Tanpa email'}
            </p>
          </div>
        </div>

        <div className="text-[11px] text-stone-500 sm:text-right">
          <span className="block font-medium text-stone-700">Hak Akses Sistem:</span>
          <span className="text-[10px] text-stone-500 max-w-xs block">{activeUserRoleDef.description}</span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-1.5 overflow-x-auto pb-1">
        {['ALL', 'OWNER', 'ADMIN', 'PRODUKSI', 'KASIR', 'SUPERVISOR'].map((roleKey) => {
          const count =
            roleKey === 'ALL' ? users.length : users.filter((u) => u.role === roleKey).length;
          const isSelected = selectedRoleFilter === roleKey;

          return (
            <button
              key={roleKey}
              type="button"
              onClick={() => setSelectedRoleFilter(roleKey)}
              className={`px-2.5 py-1 rounded-lg font-semibold text-[11px] transition whitespace-nowrap flex items-center space-x-1.5 ${
                isSelected
                  ? 'bg-stone-900 text-white shadow-sm'
                  : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              <span>{roleKey === 'ALL' ? 'Semua Staff' : roleKey}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-[9px] ${
                  isSelected ? 'bg-stone-700 text-amber-300' : 'bg-stone-200 text-stone-700'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {filteredUsers.map((user) => {
          const isCurrent = user.id === currentUser.id;
          const roleDef = ROLE_DEFINITIONS[user.role] || ROLE_DEFINITIONS.OWNER;
          const isPinVisible = showPinState[user.id] || false;

          return (
            <div
              key={user.id}
              className={`p-4 rounded-xl border transition flex flex-col justify-between relative ${
                isCurrent
                  ? 'bg-amber-500/5 border-amber-500 ring-1 ring-amber-400/50 shadow-sm'
                  : 'bg-stone-50/70 border-stone-200 hover:border-stone-300 hover:bg-white'
              }`}
            >
              {/* Card Top Info */}
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 shadow-sm ${roleDef.avatarBg}`}
                    >
                      {user.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center space-x-1.5 flex-wrap">
                        <span className="font-bold text-stone-900 text-xs sm:text-sm">{user.name}</span>
                        {isCurrent && (
                          <span className="px-1.5 py-0.5 bg-amber-400 text-stone-950 rounded text-[9px] font-bold">
                            Akun Aktif
                          </span>
                        )}
                        {user.status === 'inactive' && (
                          <span className="px-1.5 py-0.5 bg-stone-200 text-stone-600 rounded text-[9px] font-medium">
                            Nonaktif
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-stone-500 flex items-center space-x-1 mt-0.5">
                        <Briefcase className="w-3 h-3 text-stone-400 shrink-0" />
                        <span>{user.title || roleDef.label}</span>
                      </div>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${roleDef.badgeBg}`}>
                    {user.role}
                  </span>
                </div>

                {/* Details List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-stone-600 pt-2 border-t border-stone-200/60">
                  <div className="flex items-center space-x-1.5 truncate">
                    <Mail className="w-3 h-3 text-stone-400 shrink-0" />
                    <span className="truncate" title={user.email}>
                      {user.email || '-'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1.5 truncate">
                    <Phone className="w-3 h-3 text-stone-400 shrink-0" />
                    <span>{user.phone || '-'}</span>
                  </div>

                  {user.pin && (
                    <div className="flex items-center space-x-1.5 col-span-1 sm:col-span-2">
                      <Key className="w-3 h-3 text-amber-500 shrink-0" />
                      <span className="font-mono text-stone-700">
                        PIN Kasir: {isPinVisible ? user.pin : '••••'}
                      </span>
                      <button
                        type="button"
                        onClick={() => togglePinVisibility(user.id)}
                        className="text-[10px] text-amber-700 hover:underline ml-1"
                      >
                        {isPinVisible ? 'Sembunyikan' : 'Lihat'}
                      </button>
                    </div>
                  )}

                  {user.notes && (
                    <div className="col-span-1 sm:col-span-2 text-[10px] text-stone-500 bg-stone-100/80 p-1.5 rounded italic">
                      "{user.notes}"
                    </div>
                  )}
                </div>
              </div>

              {/* Card Action Buttons */}
              <div className="flex items-center justify-between pt-3 mt-3 border-t border-stone-200/60">
                <div>
                  {!isCurrent ? (
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentUser(user);
                        showToast('success', `Berhasil beralih ke profil "${user.name}" (${user.role})`);
                      }}
                      className="px-2.5 py-1 bg-stone-100 hover:bg-amber-400 hover:text-stone-950 text-stone-700 font-semibold rounded-md transition text-[11px] flex items-center space-x-1"
                    >
                      <Check className="w-3 h-3" />
                      <span>Jadikan Akun Aktif</span>
                    </button>
                  ) : (
                    <span className="text-[11px] font-semibold text-amber-700 flex items-center space-x-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                      <span>Sedang Digunakan</span>
                    </span>
                  )}
                </div>

                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(user)}
                    className="p-1.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-md transition"
                    title={`Edit data ${user.name}`}
                  >
                    <Edit3 className="w-3.5 h-3.5 text-stone-600" />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteStaff(user)}
                    disabled={user.role === 'OWNER' && users.filter((u) => u.role === 'OWNER').length <= 1}
                    className={`p-1.5 rounded-md transition ${
                      user.role === 'OWNER' && users.filter((u) => u.role === 'OWNER').length <= 1
                        ? 'bg-stone-100 text-stone-300 cursor-not-allowed'
                        : 'bg-stone-100 hover:bg-rose-50 text-stone-600 hover:text-rose-600'
                    }`}
                    title={
                      user.role === 'OWNER' && users.filter((u) => u.role === 'OWNER').length <= 1
                        ? 'Akun Owner utama tidak dapat dihapus'
                        : `Hapus akun ${user.name}`
                    }
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Staff Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-lg w-full overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 bg-stone-900 text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-amber-400" />
                <h4 className="font-bold text-sm">
                  {editingUser ? `Edit Data Staff: ${editingUser.name}` : 'Tambah Staff / Pengguna Baru'}
                </h4>
              </div>
              <button
                type="button"
                onClick={handleCloseModal}
                className="text-stone-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleFormSubmit} className="p-5 space-y-4 text-xs max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Nama Lengkap */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-stone-800 mb-1">Nama Lengkap Staff *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Contoh: H. Suherman, Putri Rahayu, Chef Rendy"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none font-medium"
                  />
                </div>

                {/* Peran / Hak Akses */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-stone-800 mb-1">
                    Peran / Hak Akses (Role Sistem) *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => {
                      const newRole = e.target.value as UserRole;
                      setFormData({
                        ...formData,
                        role: newRole,
                        title: formData.title || ROLE_DEFINITIONS[newRole].label,
                      });
                    }}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none bg-white font-medium"
                  >
                    <option value="OWNER">OWNER - Pemilik Usaha (Akses Lengkap Seluruh Modul)</option>
                    <option value="ADMIN">ADMIN - Operasional & Pembelian Bahan Baku</option>
                    <option value="PRODUKSI">PRODUKSI - Head Baker & SPK Dapur</option>
                    <option value="KASIR">KASIR - Point of Sale (POS) & Penjualan</option>
                    <option value="SUPERVISOR">SUPERVISOR - Pengawasan Stok & Kontrol Kualitas</option>
                  </select>
                  <p className="text-[11px] text-stone-500 mt-1 bg-stone-50 p-2 rounded border border-stone-200">
                    <strong>Keterangan Hak Akses:</strong> {ROLE_DEFINITIONS[formData.role].description}
                  </p>
                </div>

                {/* Jabatan / Pekerjaan */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-stone-800 mb-1">Jabatan / Penugasan</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Contoh: Owner & Direktur, Head Baker Dapur, Kasir POS Shift 1"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block font-bold text-stone-800 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="nama@pusakabakery.id"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>

                {/* No. Telepon / WhatsApp */}
                <div>
                  <label className="block font-bold text-stone-800 mb-1">Nomor WhatsApp / HP</label>
                  <input
                    type="text"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="081234567890"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none font-mono"
                  />
                </div>

                {/* PIN Kasir / Cepat */}
                <div>
                  <label className="block font-bold text-stone-800 mb-1">PIN Masuk / Kasir (4-6 Digit)</label>
                  <input
                    type="password"
                    maxLength={6}
                    value={formData.pin}
                    onChange={(e) => setFormData({ ...formData, pin: e.target.value })}
                    placeholder="1234"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none font-mono"
                  />
                </div>

                {/* Status Akun */}
                <div>
                  <label className="block font-bold text-stone-800 mb-1">Status Keaktifan</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as 'active' | 'inactive' })
                    }
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none bg-white"
                  >
                    <option value="active">Aktif (Dapat digunakan)</option>
                    <option value="inactive">Nonaktif (Cuti / Diberhentikan)</option>
                  </select>
                </div>

                {/* Catatan / Shift */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-stone-800 mb-1">Catatan Tugas / Jam Kerja</label>
                  <textarea
                    rows={2}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Contoh: Bertanggung jawab atas shift pagi pukul 06.00 - 14.00"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg focus:ring-2 focus:ring-amber-400 focus:outline-none"
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-stone-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-semibold rounded-lg transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold rounded-lg transition shadow-sm flex items-center space-x-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{editingUser ? 'Simpan Perubahan' : 'Tambahkan Staff'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
