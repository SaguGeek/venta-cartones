import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyDuDgUKBvCS2ydM1qL4-aKd3c6h_SeXu2I",
    authDomain: "miproyecto-a1543.firebaseapp.com",
    projectId: "miproyecto-a1543",
    storageBucket: "miproyecto-a1543.firebasestorage.app",
    messagingSenderId: "290353843094",
    appId: "1:290353843094:web:0d5c6c81778533e0eb6bb7",
    measurementId: "G-DRR74Q8GQN"
  };

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);