// ============================================
//  script.js — Умный анализатор УВБ-76 (гибрид)
// ============================================

let messages = [];
let map = null;
let markers = [];
let currentFreq = 4625;
let volume = 70;
let noiseReduction = 50;

// ----- ЗАГРУЗКА CSV ИЛИ ВСТРОЕННЫХ ДАННЫХ -----
async function loadData() {
    let loaded = false;

    // Пытаемся загрузить CSV
    try {
        const response = await fetch('data/messages.csv');
        if (response.ok) {
            const text = await response.text();
            const lines = text.split('\n').filter(line => line.trim());
            if (lines.length > 1) {
                const headers = lines[0].split(',').map(h => h.trim());
                messages = lines.slice(1).map(line => {
                    const values = line.split(',').map(v => v.trim());
                    const obj = {};
                    headers.forEach((h, i) => obj[h] = values[i] || '');
                    return obj;
                });
                console.log(`✅ Загружено ${messages.length} сообщений из CSV`);
                loaded = true;
            }
        }
    } catch (e) {
        console.log('CSV не найден, использую встроенные данные');
    }

    // Если CSV не загрузился — берём из CONFIG
    if (!loaded && CONFIG.messages && CONFIG.messages.length) {
        messages = CONFIG.messages.map(m => ({
            date: m.date,
            time: m.time,
            callsign: m.callsign,
            group: m.code || '',
            word_1: m.word,
            digits_1: m.digits,
            digits_2: '',
            digits_3: '',
            digits_4: '',
        }));
        console.log(`✅ Загружено ${messages.length} сообщений из CONFIG`);
    }

    if (!messages.length) {
        console.warn('⚠️ Нет данных для отображения');
        document.getElementById('messagesBody').innerHTML =
            '<tr><td colspan="4" style="text-align:center;color:#5a6a7a;">Нет данных. Загрузите CSV или добавьте сообщения в CONFIG.messages</td></tr>';
        return;
    }

    renderAll();
}

// ----- РЕНДЕРИНГ ВСЕГО -----
function renderAll() {
    updateStats();
    renderAllMessages();
    renderLastTwoDays();
    renderFrequencies();
    renderForecast();
    renderMap();
    updateClock();
    updateMapDescription();
    renderInsights();
    renderDict();
}

// ----- СТАТИСТИКА -----
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

// ----- ВСЕ СООБЩЕНИЯ -----
function renderAllMessages() {
    const tbody = document.getElementById('messagesBody');

    if (!messages.length) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#5a6a7a;">Нет данных</td></tr>';
        return;
    }

    const all = messages.slice().reverse().slice(0, 100);

    let html = '';
    all.forEach(msg => {
        const translation = translateMessage(msg);
        const digits = [msg.digits_1, msg.digits_2, msg.digits_3, msg.digits_4]
            .filter(d => d && d.trim())
            .join(' ');

        html += `
            <tr>
                <td>${msg.date || '--'} ${msg.time || '--'}</td>
                <td><span class="highlight">${msg.callsign || '--'}</span></td>
                <td>${translation}</td>
                <td style="font-family:monospace;font-size:0.8rem;color:#8b949e;">${digits || '—'}</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

// ----- ПОСЛЕДНИЕ 2 ДНЯ -----
function renderLastTwoDays() {
    const container = document.getElementById('lastTwoDays');
    if (!container) return;

    const today = new Date();
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const recent = messages.filter(msg => {
        if (!msg.date) return false;
        const msgDate = new Date(msg.date + 'T00:00:00');
        return msgDate >= twoDaysAgo && msgDate <= today;
    });

    if (!recent.length) {
        container.innerHTML = '<div style="color:#5a6a7a;text-align:center;padding:20px;">Нет данных за последние 2 дня</div>';
        return;
    }

    const groups = {};
    recent.forEach(msg => {
        if (!groups[msg.date]) groups[msg.date] = [];
        groups[msg.date].push(msg);
    });

    let html = '';
    const sortedDates = Object.keys(groups).sort().reverse();

    sortedDates.forEach(date => {
        const msgs = groups[date];
        html += `
            <div style="margin-bottom:16px;">
                <div style="color:#58a6ff;font-weight:600;font-size:0.9rem;border-bottom:1px solid #1a2a4a;padding-bottom:6px;margin-bottom:8px;">
                    📅 ${date}
                </div>
                <div style="padding-left:8px;">
        `;

        msgs.forEach(msg => {
            const translation = translateMessage(msg);
            const digits = [msg.digits_1, msg.digits_2, msg.digits_3, msg.digits_4]
                .filter(d => d && d.trim())
                .join(' ');

            html += `
                <div style="display:flex;gap:12px;padding:4px 0;font-size:0.85rem;border-bottom:1px solid rgba(26,42,74,0.2);">
                    <span style="color:#8b949e;width:60px;">${msg.time || '--'}</span>
                    <span style="color:#58a6ff;width:70px;">${msg.callsign || '--'}</span>
                    <span style="flex:1;">${translation}</span>
                    <span style="color:#5a6a7a;font-family:monospace;font-size:0.75rem;">${digits || '—'}</span>
                </div>
            `;
        });

        html += `</div></div>`;
    });

    container.innerHTML = html;
}

// ----- ПЕРЕВОД СООБЩЕНИЯ -----
function translateMessage(msg) {
    const word = msg.word_1 || '';

    if (CONFIG.opCodes[word]) {
        return `${CONFIG.opCodes[word].emoji} ${CONFIG.opCodes[word].text}`;
    }

    if (CONFIG.dict[word]) {
        return `${CONFIG.dict[word].emoji} ${CONFIG.dict[word].text}`;
    }

    const digits = [msg.digits_1, msg.digits_2, msg.digits_3, msg.digits_4].join(' ');
    if (digits.includes('0010')) return '🎯 Боевой приказ (координаты)';
    if (digits.includes('0104')) return '📡 Смена частоты';

    return `📻 ${word || 'Неизвестно'}`;
}

// ----- РАСШИФРОВКА КООРДИНАТ -----
function decodeCoordinates(digits) {
    const parts = digits.split(/\s+/);
    for (let i = 0; i < parts.length - 1; i++) {
        if (parts[i].length === 4 && parts[i+1].length === 4) {
            const lat = parseFloat(parts[i].slice(0, 2) + '.' + parts[i].slice(2));
            const lon = parseFloat(parts[i+1].slice(0, 2) + '.' + parts[i+1].slice(2));
            if (!isNaN(lat) && !isNaN(lon)) {
                return {
                    original: { lat, lon },
                    shifted: {
                        lat: lat + CONFIG.shift.lat,
                        lon: lon + CONFIG.shift.lon
                    }
                };
            }
        }
    }
    return null;
}

// ----- ЧАСТОТЫ -----
function renderFrequencies() {
    const container = document.getElementById('freqGrid');
    if (!container) return;

    let html = '';
    CONFIG.frequencies.forEach(f => {
        const statusClass = f.status || 'known';
        html += `
            <button class="freq-btn" data-freq="${f.freq}" data-active="${f.active}">
                ${f.freq} кГц
                <span class="badge ${statusClass}">${f.label || f.status}</span>
            </button>
        `;
    });

    container.innerHTML = html;

    container.querySelectorAll('.freq-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const freq = parseInt(this.dataset.freq);
            toggleFreq(freq);
        });
    });

    setupSliders();
}

function toggleFreq(freq) {
    const btns = document.querySelectorAll('.freq-btn');
    btns.forEach(btn => {
        const f = parseInt(btn.dataset.freq);
        if (f === freq) {
            const isActive = btn.dataset.active === 'true';
            btn.dataset.active = !isActive;
            btn.classList.toggle('active');
            const cfg = CONFIG.frequencies.find(f => f.freq === freq);
            if (cfg) cfg.active = !isActive;
        } else {
            btn.dataset.active = 'false';
            btn.classList.remove('active');
            const cfg = CONFIG.frequencies.find(f => f.freq === parseInt(btn.dataset.freq));
            if (cfg) cfg.active = false;
        }
    });

    currentFreq = freq;
    updateFreqInfo(freq);
}

function setupSliders() {
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeValue = document.getElementById('volumeValue');
    if (volumeSlider) {
        volumeSlider.addEventListener('input', function() {
            volume = parseInt(this.value);
            if (volumeValue) volumeValue.textContent = volume + '%';
        });
    }

    const noiseSlider = document.getElementById('noiseSlider');
    const noiseValue = document.getElementById('noiseValue');
    if (noiseSlider) {
        noiseSlider.addEventListener('input', function() {
            noiseReduction = parseInt(this.value);
            if (noiseValue) noiseValue.textContent = noiseReduction + '%';
        });
    }
}

function updateFreqInfo(freq) {
    const f = CONFIG.frequencies.find(f => f.freq === freq);
    if (!f) return;

    const info = document.getElementById('freqInfo');
    if (info) {
        const status = f.active ? '🟢 ВКЛЮЧЕНА' : '⏸️ ОТКЛЮЧЕНА';
        info.innerHTML = `
            <div style="display:flex;align-items:center;gap:12px;padding:8px 0;">
                <span style="font-size:1.8rem;color:#58a6ff;">📡</span>
                <div>
                    <div style="font-size:1.2rem;font-weight:600;color:#f0e6d0;">${f.freq} кГц</div>
                    <div style="color:#8b949e;font-size:0.85rem;">${f.name} — <span style="color:${f.active ? '#00ff88' : '#ff6666'};">${status}</span></div>
                </div>
            </div>
        `;
    }
}

// ----- ПРОГНОЗ -----
function renderForecast() {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayProb = calculateDayProbability(today);
    const tomorrowProb = calculateDayProbability(tomorrow);
    const weekForecast = calculateWeekForecast();

    const container = document.getElementById('forecastContainer');
    if (!container) return;

    container.innerHTML = `
        <div style="display:grid;grid-template-columns:1fr 1fr 2fr;gap:16px;">
            <div style="background:rgba(16,24,40,0.5);border-radius:8px;padding:12px 16px;border:1px solid #1a2a4a;">
                <div style="font-size:0.7rem;color:#8b949e;text-transform:uppercase;letter-spacing:1px;">Сегодня</div>
                <div style="font-size:1.6rem;font-weight:600;color:${getColor(todayProb)};">${todayProb}%</div>
                <div style="font-size:0.8rem;color:#5a6a7a;">${getDescription(todayProb)}</div>
            </div>
            <div style="background:rgba(16,24,40,0.5);border-radius:8px;padding:12px 16px;border:1px solid #1a2a4a;">
                <div style="font-size:0.7rem;color:#8b949e;text-transform:uppercase;letter-spacing:1px;">Завтра</div>
                <div style="font-size:1.6rem;font-weight:600;color:${getColor(tomorrowProb)};">${tomorrowProb}%</div>
                <div style="font-size:0.8rem;color:#5a6a7a;">${getDescription(tomorrowProb)}</div>
            </div>
            <div style="background:rgba(16,24,40,0.5);border-radius:8px;padding:12px 16px;border:1px solid #1a2a4a;">
                <div style="font-size:0.7rem;color:#8b949e;text-transform:uppercase;letter-spacing:1px;">Неделя</div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;">
                    ${weekForecast.map(d => `
                        <div style="flex:1;min-width:28px;text-align:center;">
                            <div style="font-size:0.6rem;color:#5a6a7a;">${d.label}</div>
                            <div style="height:40px;display:flex;align-items:flex-end;justify-content:center;">
                                <div style="width:100%;height:${d.prob}%;background:${getColor(d.prob)};border-radius:3px 3px 0 0;min-height:4px;transition:height 0.5s;"></div>
                            </div>
                            <div style="font-size:0.6rem;color:#8b949e;">${d.prob}%</div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function calculateDayProbability(date) {
    const day = date.getDay();
    const month = date.getMonth() + 1;
    const hour = date.getHours();

    let prob = CONFIG.forecastWeights[day]?.weight || 0.4;
    const seasonal = CONFIG.seasonalBoost[month] || 1.0;
    prob = prob * seasonal;

    if (hour >= 12 && hour <= 15) {
        prob = prob * 1.3;
    }

    prob = Math.min(95, Math.max(5, Math.round(prob * 100)));
    return prob;
}

function calculateWeekForecast() {
    const today = new Date();
    const week = [];
    for (let i = 0; i < 7; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        const prob = calculateDayProbability(d);
        const label = CONFIG.forecastWeights[d.getDay()]?.label || ['Вс','Пн','Вт','Ср','Чт','Пт','Сб'][d.getDay()];
        week.push({ label, prob });
    }
    return week;
}

function getColor(prob) {
    if (prob >= 70) return '#ff6b6b';
    if (prob >= 40) return '#ffd93d';
    return '#6bcb77';
}

function getDescription(prob) {
    if (prob >= 70) return '🔴 Высокая активность';
    if (prob >= 40) return '🟡 Умеренная активность';
    return '🟢 Низкая активность';
}

// ----- КАРТА -----
function renderMap() {
    if (map) {
        map.remove();
        markers = [];
    }

    map = L.map('map', {
        center: [55.0, 40.0],
        zoom: 4,
        zoomControl: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap, CartoDB'
    }).addTo(map);

    let added = 0;
    messages.forEach(msg => {
        const digits = [msg.digits_1, msg.digits_2, msg.digits_3, msg.digits_4]
            .filter(d => d && d.trim())
            .join(' ');

        const decoded = decodeCoordinates(digits);
        if (decoded) {
            const { lat, lon } = decoded.shifted;
            if (!isNaN(lat) && !isNaN(lon) && lat > -90 && lat < 90 && lon > -180 && lon < 180) {
                addMarker(lat, lon, msg);
                added++;
            }
        }
    });

    if (added === 0) {
        const testPoints = [
            [50.47, 95.27, 'Тыва (РЛС)', 'Из перехвата 15.06.2023'],
            [56.22, 29.02, 'Псковская область (авиабаза)', 'Из перехвата 24.06.2026'],
            [60.46, 18.52, 'Финский залив', 'Из перехвата 21.05.2026']
        ];
        testPoints.forEach(([lat, lon, name, src]) => {
            L.marker([lat, lon])
                .addTo(map)
                .bindPopup(`<b>${name}</b><br>${src}<br><span style="color:#58a6ff;">${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E</span>`);
            markers.push({ lat, lon, name, src });
        });
    }

    updateMapDescription();
    setTimeout(() => map.invalidateSize(), 300);
}

function addMarker(lat, lon, msg) {
    const word = msg.word_1 || 'Неизвестно';
    const translation = translateMessage(msg);
    const popupText = `
        <b>${msg.callsign || '???'}</b><br>
        ${msg.date || ''} ${msg.time || ''}<br>
        Слово: ${word}<br>
        ${translation}<br>
        <span style="color:#58a6ff;">${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E</span>
        <br><span style="color:#5a6a7a;font-size:0.75rem;">📍 После сдвига +2°/+5°</span>
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

    markers.push({ lat, lon, marker, msg });
}

// ----- ОПИСАНИЕ ПОД КАРТОЙ -----
function updateMapDescription() {
    const container = document.getElementById('mapDescription');
    if (!container) return;

    const total = markers.length;
    const active = messages.filter(m => {
        const d = new Date(m.date + 'T' + (m.time || '00:00'));
        const now = new Date();
        const diff = (now - d) / (1000 * 60 * 60 * 24);
        return diff < 2;
    }).length;

    let text = `📍 Всего целей на карте: ${total}. Активных за последние 2 дня: ${active}.`;

    if (active > 0) {
        text += ' 🔴 Обнаружена активность в последние 48 часов.';
    } else {
        text += ' 🟢 За последние 48 часов активность не зафиксирована.';
    }

    container.textContent = text;
}

// ----- ИНСАЙТЫ -----
function renderInsights() {
    const container = document.getElementById('insightsGrid');
    if (!container) return;

    const icons = ['🧠', '📊', '🗺️', '📡', '🔮'];
    let html = '';
    CONFIG.insights.forEach((insight, i) => {
        const parts = insight.split(':');
        const title = parts[0] || 'Вывод';
        const desc = insight;
        html += `
            <div class="insight-card">
                <div style="display:flex;align-items:center;gap:10px;">
                    <span style="font-size:1.6rem;">${icons[i % icons.length]}</span>
                    <div>
                        <div class="title">${title}</div>
                        <div class="desc">${desc}</div>
                    </div>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

// ----- СЛОВАРЬ -----
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

// ----- ЧАСЫ -----
function updateClock() {
    const now = new Date();
    const msk = new Date(now.getTime() + (3 * 60 * 60 * 1000));
    const timeStr = msk.toISOString().slice(11, 19);
    document.getElementById('clock').textContent = timeStr + ' MSK';
    setTimeout(updateClock, 1000);
}

// ----- ЗАПУСК -----
document.addEventListener('DOMContentLoaded', function() {
    loadData();

    const refreshBtn = document.getElementById('refreshForecast');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', renderForecast);
    }
});

window.__uvb = { messages, CONFIG, map, markers };
