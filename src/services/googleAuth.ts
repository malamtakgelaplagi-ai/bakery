import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

export const SPREADSHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

const provider = new GoogleAuthProvider();
provider.addScope(SPREADSHEETS_SCOPE);
provider.setCustomParameters({
  prompt: 'select_account',
});

let isSigningIn = false;
let cachedAccessToken: string | null = null;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token akses Google. Pastikan Anda mengizinkan hak akses Google Sheets saat diminta.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.error('Google Sign In Error Details:', error);
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Jendela popup login ditutup sebelum selesai. Silakan klik Login lagi dan selesaikan pilihan akun.');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Popup login diblokir browser. Izinkan popup pada bilah URL browser (ikon jendela berpalang merah) lalu klik Login lagi.');
    } else if (error.code === 'auth/cancelled-popup-request') {
      throw new Error('Permintaan login sebelumnya dibatalkan.');
    } else if (error.code === 'auth/unauthorized-domain') {
      throw new Error(`Domain (${window.location.hostname}) belum didaftarkan di Firebase Authorized Domains.`);
    }
    throw new Error(error.message || 'Gagal login dengan Google.');
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const logoutGoogle = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};
