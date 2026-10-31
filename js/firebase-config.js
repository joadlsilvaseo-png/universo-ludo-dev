// Configuração Web pública do projeto Firebase CMS Ludo Conecta.
// As permissões dos dados são controladas pelas regras do Firestore, não pela apiKey.
import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/13.1.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyDgCFLFqSKuoloV6iRkwu4Iparz2OhEsQ4",
  authDomain: "cms-ludo-conecta.firebaseapp.com",
  projectId: "cms-ludo-conecta",
  storageBucket: "cms-ludo-conecta.firebasestorage.app",
  messagingSenderId: "439964728578",
  appId: "1:439964728578:web:721467233d4f41f352561b",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
