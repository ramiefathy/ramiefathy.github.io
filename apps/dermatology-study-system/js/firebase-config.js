// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBZT_2iD6wZKMsnuJhZhBOi2IjEdwlYHLs",
    authDomain: "dermai-e69a5.firebaseapp.com",
    projectId: "dermai-e69a5",
    storageBucket: "dermai-e69a5.firebasestorage.app",
    messagingSenderId: "940424189728",
    appId: "1:940424189728:web:8a6769a48b742055046945",
    measurementId: "G-YM5MFVJZBY"
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Export Firebase instances
export { app, db, auth }; 