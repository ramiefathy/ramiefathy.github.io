import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaEnterpriseProvider } from 'firebase/app-check';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
  arrayUnion,
  arrayRemove,
  increment
} from 'firebase/firestore';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';

const firebaseConfig = {
  apiKey: 'AIzaSyAjc_1u8c90BTo7LKr2gQEbqLGtRpAirYw',
  authDomain: 'clinic-scheduler-pro-2025.firebaseapp.com',
  projectId: 'clinic-scheduler-pro-2025',
  storageBucket: 'clinic-scheduler-pro-2025.firebasestorage.app',
  messagingSenderId: '639544487868',
  appId: '1:639544487868:web:9cb610869424e858c8c5b9'
};

let appInstance;
let authInstance;
let dbInstance;
let functionsInstance;
let initialized = false;

function initFirebase() {
  if (initialized) {
    return { appInstance, authInstance, dbInstance, functionsInstance };
  }

  appInstance = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  authInstance = getAuth(appInstance);

  try {
    dbInstance = initializeFirestore(appInstance, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
  } catch (error) {
    console.warn('Falling back to in-memory Firestore cache', error);
    dbInstance = getFirestore(appInstance);
  }

  functionsInstance = getFunctions(appInstance);
  // Optional App Check (requires site key set via Vite env or process env)
  const appCheckSiteKey =
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_APP_CHECK_KEY) ||
    process.env.FIREBASE_APP_CHECK_KEY;

  if (typeof window !== 'undefined' && appCheckSiteKey) {
    try {
      initializeAppCheck(appInstance, {
        provider: new ReCaptchaEnterpriseProvider(appCheckSiteKey),
        isTokenAutoRefreshEnabled: true
      });
      console.info('App Check initialized');
    } catch (error) {
      console.warn('App Check initialization failed', error);
    }
  }

  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    connectFunctionsEmulator(functionsInstance, 'localhost', 5001);
  }

  initialized = true;
  return { appInstance, authInstance, dbInstance, functionsInstance };
}

const firebaseExports = initFirebase();

export const firebaseApp = firebaseExports.appInstance;
export const firebaseAuth = firebaseExports.authInstance;
export const firebaseDb = firebaseExports.dbInstance;
export const firebaseFunctions = firebaseExports.functionsInstance;

export function attachFirebaseGlobals(scope = typeof window !== 'undefined' ? window : globalThis) {
  scope.firebaseApp = firebaseApp;
  scope.firebaseAuth = firebaseAuth;
  scope.firebaseDb = firebaseDb;
  scope.firebase = {
    auth: {
      signInWithEmailAndPassword,
      createUserWithEmailAndPassword,
      signOut,
      onAuthStateChanged,
      sendPasswordResetEmail
    },
    firestore: {
      doc,
      setDoc,
      getDoc,
      getDocs,
      collection,
      query,
      where,
      orderBy,
      limit,
      onSnapshot,
      addDoc,
      updateDoc,
      deleteDoc,
      serverTimestamp,
      writeBatch,
      arrayUnion,
      arrayRemove,
      increment
    },
    functions: {
      httpsCallable: (name) => httpsCallable(firebaseFunctions, name)
    }
  };
}

export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendPasswordResetEmail,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  writeBatch,
  arrayUnion,
  arrayRemove,
  increment,
  httpsCallable
};
