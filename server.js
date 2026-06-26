// ============================================
// server.js — УВБ-76 Прокси (без Firebase Admin)
// ============================================

const WebSocket = require('ws');
const http = require('http');
const fetch = require('node-fetch');

const PORT = process.env.PORT || 3000;
const WEBSDR_URL = 'wss://websdr.ewi.utwente.nl:8901/audio';

// Firebase REST API (замена admin SDK)
const FIREBASE_URL = 'https://redloguna-default-rtdb.europe-west1.firebasedatabase.app';

let clients = [];
let ws = null;

// ----- СОХРАНЕНИЕ В FIREBASE ЧЕРЕЗ REST -----
async function saveToFirebase(data) {
    try {
        const response = await fetch(`${FIREBASE_URL}/messages_live.json`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            console.error('❌ Ошибка сохранения в Firebase:', response.status);
        }
    } catch (e) {
        console.error('❌ Ошибка сохранения:', e.message);
    }
}

// ----- ПЕРЕВОД (словарь) -----
const DICT = {
    "ОБЕЗЬЯНКА": "✅ Завершение операции",
    "МЕРЗЛЫЙ": "🛠️ Техпроверка",
    "ГОЛОСОК": "🔊 Активация сети",
    "ОКОНЧАНЬЕ": "🔇 Завершение сеанса",
    "НЕРЧИНСКИЙ": "🚀 РВСН",
    "СУПЕРМАТИЗМ": "🎯 Наведение",
    "ЛАТВИЯ": "🌍 Прибалтика",
    "КАВКАЗ": "🌍 Кавказ",
    "КИТАЙСКИЙ": "🌍 Китай",
    "0010": "🎯 Боевой приказ",
    "0104": "📡 Смена частоты",
    "0100": "🔒 Переход в резерв",
    "0808": "🆔 ID подразделения"
};

function translate(text) {
    for (const [key, value] of Object.entries(DICT)) {
        if (text.toUpperCase().includes(key)) {
            return value;
        }
    }
    return '📻 Неизвестно';
}

// ----- ПОДКЛЮЧЕНИЕ К WEBSDR -----
function connectWebSDR() {
    if (ws && ws.readyState === WebSocket.OPEN) return;
    console.log('📡 Подключение к WebSDR...');
    ws = new WebSocket(WEBSDR_URL);
    ws.on('open', () => {
        console.log('✅ WebSDR подключен');
        try { ws.send(JSON.stringify({ command: 'tune', freq: 4625 })); } catch (e) {}
    });
    ws.on('message', (data) => {
        // Передаём звук клиентам
        clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                try { client.send(data); } catch (e) {}
            }
        });
    });
    ws.on('error', () => setTimeout(connectWebSDR, 5000));
    ws.on('close', () => setTimeout(connectWebSDR, 3000));
}

// ----- HTTP-СЕРВЕР -----
const server = http.createServer((req, res) => {
    // Простой ответ для проверки
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('УВБ-76 прокси работает');
});

// ----- WEBSOCKET ДЛЯ КЛИЕНТОВ -----
const wss = new WebSocket.Server({ server });
wss.on('connection', (client) => {
    console.log('🔗 Клиент подключён');
    clients.push(client);
    client.on('close', () => {
        clients = clients.filter(c => c !== client);
    });
});

// ----- ЗАПУСК -----
server.listen(PORT, () => {
    console.log(`🦇 Прокси запущен на порту ${PORT}`);
    connectWebSDR();
});

// Сохраняем перевод в Firebase (пример, можно расширить)
setInterval(() => {
    saveToFirebase({
        type: 'ping',
        timestamp: Date.now(),
        source: 'proxy'
    });
}, 60000);
