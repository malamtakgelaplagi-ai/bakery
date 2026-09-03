import React, { useState } from 'react';
import { useBakery } from '../../context/BakeryContext';
import { UserAccount } from '../../types';
import {
  X,
  Lock,
  KeyRound,
  ShieldCheck,
  ChefHat,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface ManagementLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccessLogin: (user: UserAccount) => void;
}

export const ManagementLoginModal: React.FC<ManagementLoginModalProps> = ({
  isOpen,
  onClose,
  onSuccessLogin,
}) => {
  const { users, currentUser, setCurrentUser, businessProfile } = useBakery();

  const [selectedUser, setSelectedUser] = useState<UserAccount>(
    currentUser || users[0]
  );
  const [pin, setPin] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showPinHelp, setShowPinHelp] = useState(false);

  if (!isOpen) return null;

  const handleSelectUser = (user: UserAccount) => {
    setSelectedUser(user);
    setPin('');
    setErrorMessage(null);
  };

  const handlePinInput = (digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      setErrorMessage(null);

      // Auto-submit if 4 digits
      if (newPin.length === 4) {
        verifyPin(newPin, selectedUser);
      }
    }
  };

  const handleDeleteDigit = () => {
    setPin((prev) => prev.slice(0, -1));
    setErrorMessage(null);
  };

  const handleClearPin = () => {
    setPin('');
    setErrorMessage(null);
  };

  const verifyPin = (inputPin: string, user: UserAccount) => {
    const validPin = user.pin || '1234';

    if (inputPin === validPin) {
      setCurrentUser(user);
      onSuccessLogin(user);
      onClose();
    } else {
      setErrorMessage('PIN salah! Silakan periksa kembali atau lihat panduan PIN.');
      setPin('');
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) {
      setErrorMessage('Silakan masukkan PIN 4 digit.');
      return;
    }
    verifyPin(pin, selectedUser);
  };

  const handleQuickDemoLogin = (user: UserAccount) => {
    setCurrentUser(user);
    onSuccessLogin(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden border border-stone-200 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-stone-900 via-stone-850 to-stone-900 text-white flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center font-black shadow-md">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                Portal Manajemen & Staf
              </h2>
              <span className="text-xs text-stone-400">
                {businessProfile.name} Business OS
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Step 1: Select Staff Profile */}
          <div>
            <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider mb-2">
              1. Pilih Akun Pengguna:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {users.map((u) => {
                const isSelected = selectedUser.id === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleSelectUser(u)}
                    className={`p-2.5 text-left rounded-xl border text-xs transition flex flex-col justify-between ${
                      isSelected
                        ? 'bg-amber-50/80 border-amber-500 text-amber-950 ring-2 ring-amber-400/40 shadow-xs'
                        : 'bg-stone-50 border-stone-200 text-stone-700 hover:bg-stone-100 hover:border-stone-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold truncate text-xs">{u.name.split(' ')[0]}</span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          isSelected
                            ? 'bg-amber-500 text-stone-950'
                            : 'bg-stone-200 text-stone-600'
                        }`}
                      >
                        {u.role}
                      </span>
                    </div>
                    <span className="text-[10px] text-stone-500 line-clamp-1">
                      {u.title || u.role}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active User Card */}
          <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-9 h-9 rounded-full bg-stone-800 text-amber-400 flex items-center justify-center font-bold text-xs">
                {selectedUser.name.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-xs text-stone-900">
                  {selectedUser.name}
                </div>
                <div className="text-[11px] text-stone-500">
                  Hak Akses: <strong className="text-amber-700 font-semibold">{selectedUser.role}</strong> ({selectedUser.title})
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleQuickDemoLogin(selectedUser)}
              className="px-2.5 py-1 text-[11px] font-bold bg-amber-400 hover:bg-amber-300 text-stone-950 rounded-lg transition shadow-2xs flex items-center space-x-1"
              title="Langsung masuk tanpa mengetik PIN (Mode Cepat)"
            >
              <Sparkles className="w-3 h-3" />
              <span>Masuk Cepat</span>
            </button>
          </div>

          {/* Step 2: PIN Input */}
          <form onSubmit={handleManualSubmit} className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-stone-700 uppercase tracking-wider">
                  2. Masukkan PIN Akses (4 Digit):
                </label>
                <button
                  type="button"
                  onClick={() => setShowPinHelp(!showPinHelp)}
                  className="text-[11px] text-amber-700 hover:text-amber-800 hover:underline flex items-center space-x-1 font-semibold"
                >
                  <HelpCircle className="w-3 h-3" />
                  <span>Lihat PIN Default</span>
                </button>
              </div>

              {/* PIN Bubbles Display */}
              <div className="flex items-center justify-center space-x-3 py-2">
                {[0, 1, 2, 3].map((idx) => {
                  const filled = pin.length > idx;
                  return (
                    <div
                      key={idx}
                      className={`w-4 h-4 rounded-full border-2 transition-all ${
                        filled
                          ? 'bg-amber-500 border-amber-600 scale-110 shadow-xs'
                          : 'bg-stone-100 border-stone-300'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Error Notification */}
              {errorMessage && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center space-x-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </div>

            {/* Numeric Keypad for Touch / Quick Input */}
            <div className="max-w-[280px] mx-auto grid grid-cols-3 gap-2 text-stone-900 font-bold">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => handlePinInput(num.toString())}
                  className="h-12 rounded-xl bg-stone-100 hover:bg-stone-200 active:bg-amber-200 text-base font-bold transition shadow-2xs focus:outline-none"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={handleClearPin}
                className="h-12 rounded-xl bg-stone-100 hover:bg-stone-200 text-xs font-semibold text-stone-600 transition shadow-2xs"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => handlePinInput('0')}
                className="h-12 rounded-xl bg-stone-100 hover:bg-stone-200 active:bg-amber-200 text-base font-bold transition shadow-2xs focus:outline-none"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleDeleteDigit}
                className="h-12 rounded-xl bg-stone-100 hover:bg-rose-100 text-xs font-bold text-rose-700 transition shadow-2xs"
              >
                ⌫ Hapus
              </button>
            </div>

            {/* PIN Help Box */}
            {showPinHelp && (
              <div className="p-3 bg-amber-50/90 border border-amber-200 rounded-xl text-xs text-stone-700 space-y-1.5 animate-in fade-in">
                <div className="font-bold text-amber-950 flex items-center space-x-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-amber-700" />
                  <span>Daftar PIN Pengguna Bawaan:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] font-mono">
                  {users.map((u) => (
                    <div key={u.id}>
                      • {u.name} ({u.role}): <strong>{u.pin || '1234'}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 text-xs font-semibold text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-200 transition"
          >
            ← Kembali ke Web Konsumen
          </button>

          <button
            type="button"
            onClick={() => handleQuickDemoLogin(selectedUser)}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shadow-sm"
          >
            <span>Buka Dashboard ({selectedUser.name.split(' ')[0]})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
