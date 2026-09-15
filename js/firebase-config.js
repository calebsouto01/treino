import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBbQpSFxGgDGVQd4yXlAcMkW3LII0FDFkM",
  authDomain: "assistente-67362.firebaseapp.com",
  projectId: "assistente-67362",
  storageBucket: "assistente-67362.firebasestorage.app",
  messagingSenderId: "1045168583420",
  appId: "1:1045168583420:web:1e76ada760ac2ff8915d79",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
