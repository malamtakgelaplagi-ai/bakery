import { initializeApp, getApps, getApp, deleteApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
  Auth,
} from 'firebase/auth';
import defaultFirebaseConfig from '../../firebase-applet-config.json';

export const SPREADSHEETS_SCOPE = 'https://www.googleapis.com/auth/spreadsheets';
const TOKEN_STORAGE_KEY = 'pusaka_g_access_token';
const CUSTOM_FIREBASE_CONFIG_KEY = 'pusaka_custom_firebase_config';
const USER_INFO_KEY = 'pusaka_custom_user_info';

// Interface for Firebase Config
export interface FirebaseAppConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
}

export const getCustomFirebaseConfig = (): FirebaseAppConfig | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(CUSTOM_FIREBASE_CONFIG_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
};

export const saveCustomFirebaseConfig = (config: FirebaseAppConfig | null) => {
  if (typeof window === 'undefined') return;
  if (config) {
    localStorage.setItem(CUSTOM_FIREBASE_CONFIG_KEY, JSON.stringify(config));
  } else {
    localStorage.removeItem(CUSTOM_FIREBASE_CONFIG_KEY);
  }
  // Re-initialize app
  initFirebaseApp();
};

export const getEffectiveFirebaseConfig = (): FirebaseAppConfig => {
  const custom = getCustomFirebaseConfig();
  if (custom && custom.apiKey && custom.authDomain && custom.projectId) {
    return custom;
  }
  return defaultFirebaseConfig as FirebaseAppConfig;
};

export const isUsingCustomFirebase = (): boolean => {
  const custom = getCustomFirebaseConfig();
  return Boolean(custom && custom.apiKey && custom.authDomain && custom.projectId);
};

let currentApp: FirebaseApp | null = null;
let currentAuth: Auth | null = null;

const initFirebaseApp = (): { app: FirebaseApp; auth: Auth } => {
  const config = getEffectiveFirebaseConfig();
  const appName = isUsingCustomFirebase() ? 'pusaka-custom-firebase' : '[DEFAULT]';

  try {
    const existingApps = getApps();
    const found = existingApps.find((a) => a.name === appName);
    if (found) {
      currentApp = found;
    } else {
      currentApp = initializeApp(config, appName);
    }
  } catch (e) {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      currentApp = existingApps[0];
    } else {
      currentApp = initializeApp(config);
    }
  }

  try {
    currentAuth = getAuth(currentApp);
  } catch (e) {
    // If auth already exists or in bad state, retrieve
    const existingApps = getApps();
    if (existingApps.length > 0) {
      currentAuth = getAuth(existingApps[0]);
    }
  }

  return { app: currentApp!, auth: currentAuth! };
};

const initial = initFirebaseApp();
export const app = initial.app;
export const auth = initial.auth;

export const getActiveAuth = (): Auth => {
  if (!currentAuth) {
    const res = initFirebaseApp();
    return res.auth;
  }
  return currentAuth;
};

const createProvider = () => {
  const p = new GoogleAuthProvider();
  p.addScope(SPREADSHEETS_SCOPE);
  p.setCustomParameters({
    prompt: 'select_account',
  });
  return p;
};

let isSigningIn = false;
let cachedAccessToken: string | null = typeof window !== 'undefined' ? sessionStorage.getItem(TOKEN_STORAGE_KEY) : null;

export const setStoredToken = (token: string | null) => {
  cachedAccessToken = token;
  if (typeof window !== 'undefined') {
    if (token) {
      sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    } else {
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    }
  }
};

export const initAuth = (
  onAuthSuccess?: (user: User | any, token: string) => void,
  onAuthFailure?: () => void
) => {
  const activeAuth = getActiveAuth();

  // Check if coming back from redirect login (with safe error handling for IndexedDB closing/iframe state)
  if (typeof window !== 'undefined' && activeAuth) {
    try {
      getRedirectResult(activeAuth)
        .then((result) => {
          if (result) {
            const credential = GoogleAuthProvider.credentialFromResult(result);
            if (credential?.accessToken) {
              setStoredToken(credential.accessToken);
              if (onAuthSuccess) {
                onAuthSuccess(result.user, credential.accessToken);
              }
            }
          }
        })
        .catch((err: any) => {
          const msg = err?.message || String(err);
          // Safely ignore benign indexedDB database closing / iframe lifecycle errors
          if (
            msg.includes('Database is closing') ||
            msg.includes('internal-error') ||
            msg.includes('IndexedDB') ||
            msg.includes('null-user')
          ) {
            // Benign IndexedDB shutdown during React StrictMode/re-renders
            return;
          }
          console.warn('Notice from auth redirect result:', msg);
        });
    } catch (e) {
      // Ignore synchronous IndexedDB closure
    }
  }

  return onAuthStateChanged(activeAuth, async (user: User | null) => {
    if (user) {
      const token = cachedAccessToken || (typeof window !== 'undefined' ? sessionStorage.getItem(TOKEN_STORAGE_KEY) : null);
      if (token) {
        setStoredToken(token);
        if (onAuthSuccess) onAuthSuccess(user, token);
      } else if (!isSigningIn) {
        if (onAuthSuccess) {
          onAuthSuccess(user, '');
        }
      }
    } else {
      // Check if custom user token exists
      const token = cachedAccessToken || (typeof window !== 'undefined' ? sessionStorage.getItem(TOKEN_STORAGE_KEY) : null);
      const savedUserStr = typeof window !== 'undefined' ? localStorage.getItem(USER_INFO_KEY) : null;
      if (token && savedUserStr) {
        try {
          const savedUser = JSON.parse(savedUserStr);
          if (onAuthSuccess) onAuthSuccess(savedUser, token);
          return;
        } catch (e) {
          // ignore
        }
      }
      setStoredToken(null);
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  const activeAuth = getActiveAuth();
  const provider = createProvider();
  const isCustom = isUsingCustomFirebase();

  try {
    isSigningIn = true;
    const result = await signInWithPopup(activeAuth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Gagal mendapatkan token akses Google. Pastikan Anda mengizinkan hak akses Google Sheets saat diminta.');
    }

    setStoredToken(credential.accessToken);
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        USER_INFO_KEY,
        JSON.stringify({
          displayName: result.user.displayName,
          email: result.user.email,
          photoURL: result.user.photoURL,
          uid: result.user.uid,
        })
      );
    }
    return { user: result.user, accessToken: credential.accessToken };
  } catch (error: any) {
    console.error('Google Sign In Error Details:', error);
    const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'pusakabakery.vercel.app';

    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Jendela popup login ditutup sebelum selesai. Silakan klik Login lagi dan selesaikan pilihan akun.');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Popup login diblokir browser. Gunakan tombol "Mode Redirect (Tanpa Popup)" atau izinkan pop-up di browser.');
    } else if (error.code === 'auth/cancelled-popup-request') {
      throw new Error('Permintaan login sebelumnya dibatalkan.');
    } else if (error.code === 'auth/unauthorized-domain') {
      if (!isCustom) {
        throw new Error(
          `Domain (${currentDomain}) memerlukan Firebase Config milik akun Anda sendiri. Silakan masukkan Firebase Config pada bagian "Kredensial Firebase Vercel" di bawah.`
        );
      } else {
        throw new Error(
          `Domain (${currentDomain}) belum didaftarkan di Authorized Domains project Firebase Anda. Tambahkan domain ini di Firebase Console Anda.`
        );
      }
    }
    throw new Error(error.message || 'Gagal login dengan Google.');
  } finally {
    isSigningIn = false;
  }
};

export const googleSignInRedirect = async (): Promise<void> => {
  const activeAuth = getActiveAuth();
  const provider = createProvider();
  const isCustom = isUsingCustomFirebase();
  const currentDomain = typeof window !== 'undefined' ? window.location.hostname : 'pusakabakery.vercel.app';

  try {
    isSigningIn = true;
    await signInWithRedirect(activeAuth, provider);
  } catch (error: any) {
    console.error('Google Redirect Sign In Error Details:', error);
    if (error.code === 'auth/unauthorized-domain') {
      if (!isCustom) {
        throw new Error(
          `Domain (${currentDomain}) memerlukan Firebase Config milik akun Anda sendiri. Silakan masukkan Firebase Config pada bagian "Kredensial Firebase Vercel" di bawah.`
        );
      } else {
        throw new Error(
          `Domain (${currentDomain}) belum didaftarkan di Authorized Domains project Firebase Anda.`
        );
      }
    }
    throw new Error(error.message || 'Gagal memulai proses redirect login Google.');
  } finally {
    isSigningIn = false;
  }
};

// Direct OAuth Access Token or Service Account Token Setter
export const setDirectAccessToken = (token: string, userEmail: string = 'Pengguna Terhubung') => {
  setStoredToken(token);
  if (typeof window !== 'undefined') {
    localStorage.setItem(
      USER_INFO_KEY,
      JSON.stringify({
        displayName: userEmail,
        email: userEmail,
        uid: 'direct-token-user',
      })
    );
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken || (typeof window !== 'undefined' ? sessionStorage.getItem(TOKEN_STORAGE_KEY) : null);
};

export const logoutGoogle = async () => {
  try {
    const activeAuth = getActiveAuth();
    await signOut(activeAuth);
  } catch (e) {
    // ignore
  }
  setStoredToken(null);
  if (typeof window !== 'undefined') {
    localStorage.removeItem(USER_INFO_KEY);
  }
};
