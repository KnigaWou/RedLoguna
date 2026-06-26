// ============================================
// server.js — УВБ-76 Сервер (авто-загрузка модели)
// ============================================

const WebSocket = require('ws');
const vosk = require('vosk');
const fs = require('fs');
const admin = require('firebase-admin');
const https = require('https');
const unzipper = require('unzipper');
const path = require('path');

// ----- ПУТЬ К МОДЕЛИ -----
const MODEL_DIR = './vosk-model';
const MODEL_ZIP = 'vosk-model-small-ru-0.22.zip';
const MODEL_URL = 'https://alphacephei.com/vosk/models/' + MODEL_ZIP;

// ----- ФУНКЦИЯ СКАЧИВАНИЯ МОДЕЛИ -----
function downloadModel() {
    return new Promise((resolve, reject) => {
        console.log('📥 Скачиваю модель Vosk (350 МБ)...');
        const file = fs.createWriteStream(MODEL_ZIP);
        https.get(MODEL_URL, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                console.log('✅ Модель скачана, распаковываю...');
                fs.createReadStream(MODEL_ZIP)
                    .pipe(unzipper.Extract({ path: './' }))
                    .on('close', () => {
                        console.log('✅ Модель распакована');
                        // Переименовываем папку
                        if (fs.existsSync('vosk-model-small-ru-0.22')) {
                            fs.renameSync('vosk-model-small-ru-0.22', MODEL_DIR);
                        }
                        fs.unlinkSync(MODEL_ZIP);
                        resolve();
                    });
            });
        }).on('error', reject);
    });
}

// ----- ПРОВЕРКА И ЗАГРУЗКА МОДЕЛИ -----
async function initModel() {
    if (!fs.existsSync(MODEL_DIR)) {
        console.log('⚠️ Модель не найдена, скачиваю...');
        await downloadModel();
    }
    console.log('✅ Модель готова:', MODEL_DIR);
    return new vosk.Model(MODEL_DIR);
}

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

// ----- СЛОВАРЬ -----
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
let model = null;
let recognizer = null;
const WEBSDR_URL = 'wss://websdr.ewi.utwente.nl:8901/audio';
let ws = null;

function connectWebSDR() {
    if (!recognizer) return;
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
async function start() {
    model = await initModel();
    recognizer = new vosk.Recognizer({ model: model, sampleRate: 16000 });
    console.log('🧠 Vosk загружен');
    connectWebSDR();
    console.log('🦇 УВБ-76 Сервер запущен');
}

start();
