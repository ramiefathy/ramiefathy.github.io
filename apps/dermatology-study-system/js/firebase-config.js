import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBBbyHyAxTOwFu4q-Mh0jDuJq5ZPVAy2V0",
    authDomain: "dermai-e69a5.firebaseapp.com",
    projectId: "dermai-e69a5",
    storageBucket: "dermai-e69a5.firebasestorage.app",
    messagingSenderId: "940424189728",
    appId: "1:940424189728:web:8a6769a48b742055046945",
    measurementId: "G-YM5MFVJZBY"
};

// Initialize Firebase
let app, auth, db;

try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    console.log('Firebase initialized successfully');
} catch (error) {
    console.error('Firebase initialization error:', error);
    throw new Error('Failed to initialize Firebase: ' + error.message);
}

// Export Firebase instances
export { app, auth, db }; 