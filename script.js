// ============================================
//  script.js — Основная логика анализатора
// ============================================

// ----- Глобальные переменные -----
let messages = [];
let map = null;
let markers = [];

// ----- Загрузка CSV -----
async function loadCSV() {
    try {
        const response = await fetch('data/messages.csv');
        const text = await response.text();
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());

        messages = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim());
            const obj = {};
            headers.forEach((h, i) => obj[h] = values[i] || '');
            return obj;
        });

        console.log(`✅ Загружено ${messages.length} сообщений`);
        renderAll();
    } catch (e) {
        console.error('❌ Ошибка загрузки CSV:', e);
        document.getElementById('messagesBody').innerHTML =
            '<tr><td colspan="4" style="text-align:center;color:#ff4444;">Ошибка загрузки данных</td></tr>';
    }
}

// ----- Рендеринг -----
function renderAll() {
    updateStats();
    renderTable();
    renderFrequencies();
    renderDict();
    renderInsights();
    initMap();
    updateClock();
}

// ----- Статистика -----
function updateStats() {
    document.getElementById('totalCount').textContent = messages.length;

    const today = new Date().toISOString().slice(0, 10);
    const todayCount = messages.filter(m => m.date === today).length;
    document.getElementById('todayCount').textContent = todayCount;

    if (messages.length > 0) {
        const last = messages[messages.length - 1];
        document.getElementById('lastDate').textContent = last.date || '--';
    }

    const dictSize = Object.keys(CONFIG.dict).length +
                     Object.keys(CONFIG.opCodes).length;
    document.getElementById('dictSize').textContent = dictSize;
}

// ----- Таблица -----
function renderTable() {
    const tbody = document.getElementById('messagesBody');

    if (!messages.length) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#5a6a7a;">Нет данных</td></tr>';
        return;
    }

    // Берём последние 50 для таблицы
    const recent = messages.slice(-50).reverse();

    let html = '';
    recent.forEach(msg => {
        const dateStr = msg.date ? msg.date.slice(5) : '--';
        const timeStr = msg.time || '--';
        const callsign = msg.callsign || '--';
        const word = msg.word_1 || '';

        // Пытаемся перевести
        let translation = word;
        let emoji = '📻';

        if (CONFIG.dict[word]) {
            translation = CONFIG.dict[word].text;
            emoji = CONFIG.dict[word].emoji;
        } else if (CONFIG.opCodes[word]) {
            translation = CONFIG.opCodes[word].text;
            emoji = CONFIG.opCodes[word].emoji;
        }

        const digits = [msg.digits_1, msg.digits_2, msg.digits_3, msg.digits_4]
            .filter(d => d && d.trim())
            .join(' ');

        html += `
            <tr>
                <td>${dateStr} ${timeStr}</td>
                <td><span class="highlight">${callsign}</span></td>
                <td>${emoji} ${translation}</td>
                <td style="font-family:monospace;font-size:0.8rem;color:#8b949e;">${digits || '—'}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// ----- Частоты -----
function renderFrequencies() {
    const container = document.getElementById('freqGrid');
    if (!container) return;

    let html = '';
    CONFIG.frequencies.forEach(f => {
        const statusClass = f.status || 'known';
        html += `
            <button class="freq-btn" data-freq="${f.freq}">
                ${f.freq} кГц
                <span class="badge ${statusClass}">${f.label || f.status}</span>
            </button>
        `;
    });

    container.innerHTML = html;

    // Клик по частоте
    container.querySelectorAll('.freq-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            container.querySelectorAll('.freq-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            const freq = this.dataset.freq;
            showFreqInfo(freq);
        });
    });

    // Активируем первую
    const first = container.querySelector('.freq-btn');
    if (first) first.classList.add('active');
}

function showFreqInfo(freq) {
    const f = CONFIG.frequencies.find(f => f.freq == freq);
    if (!f) return;

    const info = document.getElementById('freqInfo');
    if (info) {
        info.innerHTML = `
            <div style="display:flex;align-items:center;gap:12px;padding:8px 0;">
                <span style="font-size:1.8rem;color:#58a6ff;">📡</span>
                <div>
                    <div style="font-size:1.2rem;font-weight:600;color:#f0e6d0;">${f.freq} кГц</div>
                    <div style="color:#8b949e;font-size:0.85rem;">${f.name} — ${f.desc || ''}</div>
                </div>
            </div>
        `;
    }
}

// ----- Словарь -----
function renderDict() {
    const container = document.getElementById('dictGrid');
    if (!container) return;

    const entries = Object.entries(CONFIG.dict);
    let html = '';
    entries.forEach(([word, data]) => {
        html += `
            <div class="dict-item">
                <span class="emoji">${data.emoji}</span>
                <span class="word">${word}</span>
                <span class="meaning">→ ${data.text}</span>
            </div>
        `;
    });

    container.innerHTML = html;
}

// ----- Инсайты -----
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

// ----- Карта -----
function initMap() {
    if (map) {
        map.remove();
        markers = [];
    }

    map = L.map('map', {
        center: [55.0, 40.0],
        zoom: 4,
        zoomControl: true,
        fadeAnimation: true,
        attributionControl: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; CartoDB'
    }).addTo(map);

    // Добавляем цели из сообщений с координатами
    messages.forEach(msg => {
        const digits = [msg.digits_1, msg.digits_2, msg.digits_3, msg.digits_4]
            .filter(d => d && d.trim());

        // Ищем координаты (4-значные группы)
        digits.forEach(d => {
            const coords = parseCoordinates(d);
            if (coords) {
                const shifted = applyShift(coords.lat, coords.lon);
                addMarker(shifted.lat, shifted.lon, msg);
            }
        });
    });

    // Если маркеров нет — ставим тестовые
    if (markers.length === 0) {
        const testPoints = [
            [50.47, 95.27, 'Тыва (РЛС)'],
            [56.22, 29.02, 'Псковская область (авиабаза)'],
            [60.46, 18.52, 'Финский залив']
        ];
        testPoints.forEach(([lat, lon, name]) => {
            L.marker([lat, lon])
                .addTo(map)
                .bindPopup(`<b>${name}</b><br>Цель после сдвига`);
            markers.push({ lat, lon });
        });
    }
}

function parseCoordinates(str) {
    // Ищем 4-значные числа: 48.47 или 4847
    const clean = str.replace(/\s/g, '');
    if (clean.length === 4) {
        const lat = parseFloat(clean.slice(0, 2) + '.' + clean.slice(2));
        // Вторая группа может быть в другом поле
        return { lat, lon: null };
    }
    return null;
}

function applyShift(lat, lon) {
    return {
        lat: lat + CONFIG.shift.lat,
        lon: lon + CONFIG.shift.lon
    };
}

function addMarker(lat, lon, msg) {
    if (!lat || !lon || isNaN(lat) || isNaN(lon)) return;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) return;

    const popupText = `
        <b>${msg.callsign || '???'}</b><br>
        ${msg.date || ''} ${msg.time || ''}<br>
        Слово: ${msg.word_1 || '—'}<br>
        <span style="color:#58a6ff;">${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E</span>
    `;

    const marker = L.circleMarker([lat, lon], {
        radius: 8,
        fillColor: '#58a6ff',
        color: '#58a6ff',
        weight: 1,
        opacity: 0.8,
        fillOpacity: 0.6
    }).addTo(map)
      .bindPopup(popupText);

    markers.push({ lat, lon, marker });
}

// ----- Часы -----
function updateClock() {
    const now = new Date();
    const msk = new Date(now.getTime() + (3 * 60 * 60 * 1000));
    const timeStr = msk.toISOString().slice(11, 19);
    document.getElementById('clock').textContent = timeStr + ' MSK';
    setTimeout(updateClock, 1000);
}

// ----- Прогноз -----
function generateForecast() {
    const now = new Date();
    const msk = new Date(now.getTime() + (3 * 60 * 60 * 1000));
    const day = msk.getDay();
    const hour = msk.getHours();
    const month = msk.getMonth() + 1;

    let forecast = 'Спокойный эфир.';

    // Проверяем пик активности
    if (day === CONFIG.schedule.peakDay &&
        hour >= CONFIG.schedule.peakHourStart &&
        hour < CONFIG.schedule.peakHourEnd) {
        forecast = '🔴 ВЫСОКАЯ ВЕРОЯТНОСТЬ ПРИКАЗОВ. Пик активности (ЧТ 13:00 MSK)';
    } else if (CONFIG.schedule.seasonal.includes(month)) {
        forecast = '🟡 СЕЗОННЫЙ ВСПЛЕСК. Вероятны учения (июнь/июль/декабрь)';
    } else if (hour >= 9 && hour <= 22) {
        forecast = '🟢 Активность в рабочем диапазоне. Слушайте 4625 кГц';
    } else {
        forecast = '🌙 Ночной эфир. Голосовых сообщений обычно нет';
    }

    document.getElementById('forecastText').textContent = forecast;
}

// ----- Инициализация -----
document.addEventListener('DOMContentLoaded', function() {
    loadCSV();
    setTimeout(generateForecast, 100);

    // Кнопка обновления прогноза
    const refreshBtn = document.getElementById('refreshForecast');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', generateForecast);
    }
});

// Экспортируем для консоли
window.__uvb = { messages, CONFIG, map, markers };
