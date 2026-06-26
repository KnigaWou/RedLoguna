// ============================================
//  server.js — УВБ-76 Сервер
//  Слушает WebSDR, распознаёт голос, переводит
// ============================================

const WebSocket = require('ws');
const vosk = require('vosk');
const fs = require('fs');
const admin = require('firebase-admin');

// ----- ПУТЬ К МОДЕЛИ (ТВОЙ ТЕЛЕФОН) -----
const MODEL_PATH = '/storage/emulated/0/Download/vosk-model';

// ----- ПРОВЕРКА МОДЕЛИ -----
if (!fs.existsSync(MODEL_PATH)) {
    console.error('❌ Модель не найдена по пути:', MODEL_PATH);
    console.log('📥 Убедись, что папка vosk-model лежит в /Download');
    process.exit(1);
}

console.log('✅ Модель найдена:', MODEL_PATH);

// ----- FIREBASE (ТВОЙ КОНФИГ) -----
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

// ----- VOSK -----
const model = new vosk.Model(MODEL_PATH);
const recognizer = new vosk.Recognizer({ model: model, sampleRate: 16000 });

console.log('🧠 Vosk загружен');

// ----- ПЕРЕВОД -----
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

// ----- WEBSDR -----
const WEBSDR_URL = 'wss://websdr.ewi.utwente.nl:8901/audio';
let ws = null;

function connectWebSDR() {
    ws = new WebSocket(WEBSDR_URL);
    ws.on('open', () => console.log('✅ WebSDR подключен'));
    ws.on('message', (data) => {
        if (data instanceof Buffer) {
            const samples = new Int16Array(data.buffer, data.byteOffset, data.byteLength / 2);
            const floatSamples = new Float32Array(samples.length);
            for (let i = 0; i < samples.length; i++) {
                floatSamples[i] = samples[i] / 32768.0;
            }
            const result = recognizer.acceptWaveform(floatSamples);
            if (result) {
                const json = JSON.parse(recognizer.result());
                const text = json.text || '';
                if (text.length > 2) {
                    const translation = translate(text);
                    console.log(`🎤 "${text}" → ${translation}`);
                    const ref = db.ref('messages_live').push();
                    ref.set({
                        text,
                        translation,
                        freq: 4625,
                        timestamp: Date.now(),
                        source: 'server'
                    });
                }
            }
        }
    });
    ws.on('error', () => setTimeout(connectWebSDR, 5000));
    ws.on('close', () => setTimeout(connectWebSDR, 5000));
}

// ----- ЗАПУСК -----
connectWebSDR();
console.log('🦇 УВБ-76 Сервер запущен');
