// ============================================
//  firebase-init.js — Инициализация Firebase
// ============================================

import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, push, set, get } from "firebase/database";

const firebaseConfig = CONFIG.firebase;

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

export { db, ref, onValue, push, set, get };
