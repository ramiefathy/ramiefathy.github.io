import { initializeApp, getApps, getApp } from 'firebase/app';
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
  apiKey: 'AIzaSyC-f7H_RLTbwaKOhwDiYPfF3knzPMKWVeQ',
  authDomain: 'autoclinicscheduler.firebaseapp.com',
  projectId: 'autoclinicscheduler',
  storageBucket: 'autoclinicscheduler.firebasestorage.app',
  messagingSenderId: '1032685115214',
  appId: '1:1032685115214:web:fec2c2ed4999a8eb84701f',
  measurementId: 'G-JHWKCQNPNR'
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
