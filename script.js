// ============================================
//  script.js — УВБ-76 Live (Нейросеть + Карта)
// ============================================

import { db, ref, onValue, push, set, get } from './firebase-init.js';

// ----- СОСТОЯНИЕ -----
let isListening = false;
let currentFreq = 4625;
let map = null;
let markers = [];
let recognition = null;
let audioContext = null;

// ----- DOM -----
const statusDot = document.getElementById('statusDot');
const statusText = document.getElementById('statusText');
const liveText = document.getElementById('liveText');
const liveTranslation = document.getElementById('liveTranslation');
const liveMorse = document.getElementById('liveMorse');
const forecastText = document.getElementById('forecastText');
const historyList = document.getElementById('historyList');
const freqGrid = document.getElementById('freqGrid');

// ----- ИНИЦИАЛИЗАЦИЯ -----
async function init() {
    await loadDataFromFirebase();
    renderFrequencies();
    renderInsights();
    initMap();
    initSpeechRecognition();
    initAudioAnalyzer();
    startListening();
    updateClock();
    setInterval(updateClock, 1000);
    generateForecast();
}

// ----- ЗАГРУЗКА ДАННЫХ ИЗ FIREBASE -----
async function loadDataFromFirebase() {
    try {
        // Загружаем словарь
        const dictSnapshot = await get(ref(db, 'dictionary'));
        if (dictSnapshot.exists()) {
            Object.assign(CONFIG.dictionary, dictSnapshot.val());
        }

        // Загружаем коды
        const codesSnapshot = await get(ref(db, 'opCodes'));
        if (codesSnapshot.exists()) {
            Object.assign(CONFIG.opCodes, codesSnapshot.val());
        }

        console.log('✅ Данные из Firebase загружены');
    } catch (e) {
        console.error('❌ Ошибка загрузки данных:', e);
    }
}

// ----- РАСПОЗНАВАНИЕ РЕЧИ -----
function initSpeechRecognition() {
    if (!('webkitSpeechRecognition' in window)) {
        statusText.textContent = '❌ Браузер не поддерживает распознавание речи';
        return;
    }

    recognition = new webkitSpeechRecognition();
    recognition.lang = 'ru-RU';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = function(event) {
        const result = event.results[event.results.length - 1];
        if (result.isFinal) {
            const text = result[0].transcript.trim();
            if (text.length > 2) {
                processText(text);
            }
        }
    };

    recognition.onerror = function(e) {
        console.warn('⚠️ Ошибка распознавания:', e.error);
        // Автоматический перезапуск
        setTimeout(() => {
            if (isListening) recognition.start();
        }, 2000);
    };
}

function startListening() {
    if (!recognition) return;
    isListening = true;
    statusDot.className = 'status-dot active';
    statusText.textContent = '🎤 Слушаю...';
    recognition.start();
}

// ----- АНАЛИЗ МОРЗЕ И ШУМА -----
function initAudioAnalyzer() {
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
        const dataArray = new Uint8Array(analyser.frequencyBinCount);

        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                const source = audioContext.createMediaStreamSource(stream);
                source.connect(analyser);

                function analyze() {
                    analyser.getByteFrequencyData(dataArray);
                    const morse = detectMorse(dataArray);
                    if (morse) {
                        liveMorse.textContent = `📟 ${morse}`;
                        saveMorseToFirebase(morse);
                    }
                    const noise = detectNoise(dataArray);
                    if (noise > 0.7) {
                        console.log(`📊 Шум: ${(noise * 100).toFixed(0)}%`);
                    }
                    requestAnimationFrame(analyze);
                }
                analyze();
            })
            .catch(() => {
                console.warn('⚠️ Нет доступа к микрофону для анализа шума');
            });
    } catch (e) {
        console.warn('⚠️ Audio API не поддерживается');
    }
}

function detectMorse(dataArray) {
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) {
        const freq = i * (audioContext.sampleRate / 2) / dataArray.length;
        if (freq > 800 && freq < 1200) sum += dataArray[i];
    }
    if (sum > 5000) return 'Обнаружен тональный сигнал (возможно Морзе)';
    return null;
}

function detectNoise(dataArray) {
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
    return sum / (dataArray.length * 255);
}

// ----- ОБРАБОТКА ТЕКСТА (ПЕРЕВОД) -----
function processText(text) {
    liveText.textContent = text;

    let translation = findTranslation(text);
    liveTranslation.textContent = translation;

    // Сохраняем в Firebase
    saveToFirebase(text, translation);

    // Добавляем в историю
    addHistory(text, translation);
}

function findTranslation(text) {
    const words = text.split(/\s+/);
    for (const word of words) {
        const clean = word.replace(/[^а-яА-Я0-9]/g, '').toUpperCase();
        if (CONFIG.dictionary[clean]) {
            return `${CONFIG.dictionary[clean].emoji} ${CONFIG.dictionary[clean].text}`;
        }
        if (CONFIG.opCodes[clean]) {
            return `${CONFIG.opCodes[clean].emoji} ${CONFIG.opCodes[clean].text}`;
        }
    }
    if (text.includes('0010')) {
        const coords = extractCoordinates(text);
        if (coords) {
            return `🎯 Боевой приказ → ${coords.lat.toFixed(2)}°N, ${coords.lon.toFixed(2)}°E`;
        }
        return '🎯 Боевой приказ';
    }
    if (text.includes('0104')) {
        const freq = text.match(/\b(\d{4})\b/);
        if (freq) return `📡 Смена частоты → ${freq[1]} кГц`;
        return '📡 Смена частоты';
    }
    return '📻 Неизвестно';
}

function extractCoordinates(text) {
    const numbers = text.match(/\b(\d{4})\b/g);
    if (numbers && numbers.length >= 2) {
        const lat = parseInt(numbers[0].slice(0, 2)) + parseInt(numbers[0].slice(2)) / 100;
        const lon = parseInt(numbers[1].slice(0, 2)) + parseInt(numbers[1].slice(2)) / 100;
        if (!isNaN(lat) && !isNaN(lon)) {
            return {
                lat: lat + CONFIG.shift.lat,
                lon: lon + CONFIG.shift.lon
            };
        }
    }
    return null;
}

// ----- СОХРАНЕНИЕ В FIREBASE -----
async function saveToFirebase(text, translation) {
    try {
        const newRef = push(ref(db, 'messages_live'));
        await set(newRef, {
            text: text,
            translation: translation,
            freq: currentFreq,
            timestamp: Date.now(),
            date: new Date().toISOString(),
            source: 'neural'
        });
    } catch (e) {
        console.error('❌ Ошибка сохранения:', e);
    }
}

async function saveMorseToFirebase(morse) {
    try {
        const newRef = push(ref(db, 'morse_live'));
        await set(newRef, {
            signal: morse,
            freq: currentFreq,
            timestamp: Date.now(),
            date: new Date().toISOString(),
            source: 'neural'
        });
    } catch (e) {
        console.error('❌ Ошибка сохранения Морзе:', e);
    }
}

// ----- ИСТОРИЯ -----
function addHistory(text, translation) {
    const now = new Date();
    const time = now.toTimeString().slice(0, 8);
    const history = JSON.parse(localStorage.getItem('uvb_history') || '[]');
    history.unshift({ time, text, translation });
    if (history.length > 100) history.pop();
    localStorage.setItem('uvb_history', JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    const history = JSON.parse(localStorage.getItem('uvb_history') || '[]');
    if (history.length === 0) {
        historyList.innerHTML = '<div style="color:#5a6a7a;padding:12px;">Нет перехватов</div>';
        return;
    }
    let html = '';
    history.slice(0, 20).forEach(item => {
        html += `
            <div class="history-item">
                <span class="time">${item.time}</span>
                <span class="text">${item.text}</span>
                <span class="trans">→ ${item.translation}</span>
            </div>
        `;
    });
    historyList.innerHTML = html;
}

// ----- КАРТА -----
function initMap() {
    map = L.map('map', {
        center: [55.0, 40.0],
        zoom: 4,
        zoomControl: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap, CartoDB'
    }).addTo(map);

    // Загружаем цели из Firebase
    loadTargetsFromFirebase();
}

async function loadTargetsFromFirebase() {
    try {
        const snapshot = await get(ref(db, 'messages'));
        if (!snapshot.exists()) return;

        const data = snapshot.val();
        Object.values(data).forEach(msg => {
            if (msg.digits && msg.digits.includes('0010')) {
                const coords = extractCoordinates(msg.digits);
                if (coords) {
                    addMarker(coords.lat, coords.lon, msg);
                }
            }
        });
    } catch (e) {
        console.error('❌ Ошибка загрузки целей:', e);
    }

    // Слушаем новые цели в реальном времени
    onValue(ref(db, 'messages_live'), (snapshot) => {
        const data = snapshot.val();
        if (!data) return;
        Object.values(data).forEach(msg => {
            if (msg.text && msg.text.includes('0010')) {
                const coords = extractCoordinates(msg.text);
                if (coords) {
                    addMarker(coords.lat, coords.lon, msg);
                }
            }
        });
    });
}

function addMarker(lat, lon, msg) {
    const popupText = `
        <b>🎯 Цель</b><br>
        ${msg.date || ''} ${msg.time || ''}<br>
        ${msg.text || ''}<br>
        <span style="color:#58a6ff;">${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E</span>
        <br><span style="color:#5a6a7a;font-size:0.75rem;">📍 После сдвига +2°/+5°</span>
    `;

    const marker = L.circleMarker([lat, lon], {
        radius: 8,
        fillColor: '#ff6b6b',
        color: '#ff6b6b',
        weight: 2,
        opacity: 0.8,
        fillOpacity: 0.7
    }).addTo(map)
      .bindPopup(popupText);

    markers.push({ lat, lon, marker, msg });
}

// ----- ПРОГНОЗ -----
function generateForecast() {
    const now = new Date();
    const msk = new Date(now.getTime() + (3 * 60 * 60 * 1000));
    const day = msk.getDay();
    const hour = msk.getHours();
    const month = msk.getMonth() + 1;

    let forecast = '🟢 Спокойный эфир.';

    if (day === CONFIG.forecast.peakDay &&
        hour >= CONFIG.forecast.peakHourStart &&
        hour < CONFIG.forecast.peakHourEnd) {
        forecast = '🔴 ВЫСОКАЯ ВЕРОЯТНОСТЬ ПРИКАЗОВ. Пик активности (ЧТ 13:00 MSK)';
    } else if (CONFIG.forecast.seasonal.includes(month)) {
        forecast = '🟡 СЕЗОННЫЙ ВСПЛЕСК. Вероятны учения (июнь/июль/декабрь)';
    } else if (hour >= 9 && hour <= 22) {
        forecast = '🟢 Активность в рабочем диапазоне. Слушайте 4625 кГц';
    } else {
        forecast = '🌙 Ночной эфир. Голосовых сообщений обычно нет';
    }

    forecastText.textContent = forecast;
}

// ----- ЧАСТОТЫ -----
function renderFrequencies() {
    freqGrid.innerHTML = '';
    CONFIG.frequencies.forEach(freq => {
        const btn = document.createElement('button');
        btn.className = 'freq-btn';
        btn.dataset.freq = freq;
        btn.textContent = freq + ' кГц';
        if (freq === currentFreq) btn.classList.add('active');
        btn.addEventListener('click', () => switchFreq(freq));
        freqGrid.appendChild(btn);
    });
}

function switchFreq(freq) {
    currentFreq = freq;
    document.querySelectorAll('.freq-btn').forEach(b => {
        b.classList.toggle('active', parseInt(b.dataset.freq) === freq);
    });
    statusText.textContent = `📡 Частота ${freq} кГц`;
}

// ----- ИНСАЙТЫ -----
function renderInsights() {
    const container = document.getElementById('insightsGrid');
    if (!container) return;

    const icons = ['🧠', '📊', '🗺️', '📡', '🔮'];
    let html = '';
    CONFIG.insights.forEach((insight, i) => {
        html += `
            <div class="insight-card">
                <div style="display:flex;align-items:center;gap:10px;">
                    <span style="font-size:1.6rem;">${icons[i % icons.length]}</span>
                    <div>
                        <div class="title">${insight.split(':')[0] || 'Вывод'}</div>
                        <div class="desc">${insight}</div>
                    </div>
                </div>
            </div>
        `;
    });
    container.innerHTML = html;
}

// ----- ЧАСЫ -----
function updateClock() {
    const now = new Date();
    const msk = new Date(now.getTime() + (3 * 60 * 60 * 1000));
    document.getElementById('clock').textContent = msk.toISOString().slice(11, 16) + ' MSK';
}

// ----- ЗАПУСК -----
document.addEventListener('DOMContentLoaded', init);
