// ============================================
// server.js — УВБ-76 Сервер (упрощённый)
// Передаёт звук с WebSDR на сайт и сохраняет в Firebase
// ============================================

const WebSocket = require('ws');
const admin = require('firebase-admin');

// ----- FIREBASE -----
const firebaseConfig = {
    apiKey: "AIzaSyCxuDhEGBrTdd6rSQ42CtPicmU3Y6Y0ZUo",
    authDomain: "redloguna.firebaseapp.com",
    databaseURL: "https://redloguna-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "redloguna",
    storageBucket: "redloguna.firebasestorage.app",
    messagingSenderId: "254078769465",
    appId: "1:254078769465:web:a7f359734e5c4419bef0e8"
};

admin.initializeApp({
    credential: admin.credential.cert(firebaseConfig),
    databaseURL: firebaseConfig.databaseURL
});
const db = admin.database();

// ----- WEBSDR -----
const WEBSDR_URL = 'wss://websdr.ewi.utwente.nl:8901/audio';
let ws = null;
let clients = [];

// ----- ПОДКЛЮЧЕНИЕ К WEBSDR -----
function connectWebSDR() {
    ws = new WebSocket(WEBSDR_URL);
    ws.on('open', () => console.log('✅ WebSDR подключен'));
    ws.on('message', (data) => {
        // Передаём звук всем клиентам
        clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                try {
                    client.send(data);
                } catch (e) {}
            }
        });
    });
    ws.on('error', () => setTimeout(connectWebSDR, 5000));
    ws.on('close', () => setTimeout(connectWebSDR, 5000));
}

// ----- ВЕБСОКЕТ ДЛЯ КЛИЕНТОВ -----
const wss = new WebSocket.Server({ port: process.env.PORT || 3000 });

wss.on('connection', (client) => {
    clients.push(client);
    console.log('🔗 Клиент подключён');
    client.on('close', () => {
        clients = clients.filter(c => c !== client);
    });
});

// ----- ЗАПУСК -----
connectWebSDR();
console.log('🦇 УВБ-76 Сервер запущен');
console.log('📡 Порт:', process.env.PORT || 3000);
