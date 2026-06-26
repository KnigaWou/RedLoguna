// ============================================
//  script.js — Живая система УВБ-76
// ============================================

// ----- СОСТОЯНИЕ -----
let state = {
    messages: [],
    map: null,
    markers: [],
    routes: [],
    currentFreq: 4625,
    volume: 70,
    noiseReduction: 50,
    isInitialized: false
};

// ----- ЗАГРУЗКА ДАННЫХ -----
async function loadData() {
    try {
        const response = await fetch('data/messages.csv');
        const text = await response.text();
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());

        state.messages = lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim());
            const obj = {};
            headers.forEach((h, i) => obj[h] = values[i] || '');
            return obj;
        });

        console.log(`✅ Загружено ${state.messages.length} сообщений`);
        initSystem();
    } catch (e) {
        console.error('❌ Ошибка загрузки:', e);
        document.querySelector('#messagesBody').innerHTML =
            '<tr><td colspan="4" style="text-align:center;color:#ff4444;">Ошибка загрузки данных</td></tr>';
    }
}

// ----- ИНИЦИАЛИЗАЦИЯ СИСТЕМЫ -----
function initSystem() {
    state.isInitialized = true;
    renderAll();
    setInterval(autoUpdate, 60000); // Обновление раз в минуту
}

// ----- АВТООБНОВЛЕНИЕ -----
function autoUpdate() {
    if (!state.isInitialized) return;
    renderStats();
    renderForecast();
    renderLastTwoDays();
    updateMapDescription();
    // Не перерисовываем карту и таблицу полностью, только данные
}

// ----- РЕНДЕРИНГ ВСЕГО -----
function renderAll() {
    renderStats();
    renderAllMessages();
    renderLastTwoDays();
    renderFrequencies();
    renderForecast();
    renderMap();
    renderInsights();
    renderDict();
    updateClock();
    updateMapDescription();
}

// ----- СТАТИСТИКА -----
function renderStats() {
    document.getElementById('totalCount').textContent = state.messages.length;

    const today = new Date().toISOString().slice(0, 10);
    const todayCount = state.messages.filter(m => m.date === today).length;
    document.getElementById('todayCount').textContent = todayCount;

    if (state.messages.length > 0) {
        const last = state.messages[state.messages.length - 1];
        document.getElementById('lastDate').textContent = last.date || '--';
    }

    const dictSize = Object.keys(CONFIG.dict).length +
                     Object.keys(CONFIG.opCodes).length;
    document.getElementById('dictSize').textContent = dictSize;
}

// ----- ПЕРЕВОД (автоматический) -----
function translateMessage(msg) {
    const word = msg.word_1 || '';
    const digits = [msg.digits_1, msg.digits_2, msg.digits_3, msg.digits_4]
        .filter(d => d && d.trim())
        .join(' ');

    // 1. Проверяем коды операций
    if (CONFIG.opCodes[word]) {
        const op = CONFIG.opCodes[word];
        // Если есть цифры — дополняем
        let extra = '';
        if (word === '0104' && digits) {
            extra = ` → ${digits} кГц`;
        }
        if (word === '0010' && digits) {
            const coords = decodeCoordinates(digits);
            if (coords) {
                extra = ` → ${coords.shifted.lat.toFixed(2)}°N, ${coords.shifted.lon.toFixed(2)}°E`;
            }
        }
        return `${op.emoji} ${op.text}${extra}`;
    }

    // 2. Проверяем словарь
    if (CONFIG.dict[word]) {
        const d = CONFIG.dict[word];
        let extra = '';
        if (d.type === 'target' && digits) {
            const coords = decodeCoordinates(digits);
            if (coords) {
                extra = ` → ${coords.shifted.lat.toFixed(2)}°N, ${coords.shifted.lon.toFixed(2)}°E`;
            }
        }
        return `${d.emoji} ${d.text}${extra}`;
    }

    // 3. Если есть код 0010 или 0104 в цифрах
    if (digits.includes('0010')) {
        const coords = decodeCoordinates(digits);
        if (coords) {
            return `🎯 Боевой приказ → ${coords.shifted.lat.toFixed(2)}°N, ${coords.shifted.lon.toFixed(2)}°E`;
        }
        return '🎯 Боевой приказ (координаты не распознаны)';
    }
    if (digits.includes('0104')) {
        const freqMatch = digits.match(/\b(\d{4})\b/);
        if (freqMatch) {
            return `📡 Смена частоты → ${freqMatch[1]} кГц`;
        }
        return '📡 Смена частоты';
    }

    // 4. Неизвестно
    return `📻 ${word || 'Неизвестно'}`;
}

// ----- ДЕКОДИРОВАНИЕ КООРДИНАТ -----
function decodeCoordinates(digits) {
    const parts = digits.split(/\s+/);
    for (let i = 0; i < parts.length - 1; i++) {
        if (parts[i].length === 4 && parts[i + 1].length === 4) {
            const lat = parseFloat(parts[i].slice(0, 2) + '.' + parts[i].slice(2));
            const lon = parseFloat(parts[i + 1].slice(0, 2) + '.' + parts[i + 1].slice(2));
            if (!isNaN(lat) && !isNaN(lon) && lat > -90 && lat < 90 && lon > -180 && lon < 180) {
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

// ----- ВСЕ СООБЩЕНИЯ (таблица) -----
function renderAllMessages() {
    const tbody = document.getElementById('messagesBody');
    if (!state.messages.length) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#5a6a7a;">Нет данных</td></tr>';
        return;
    }

    const all = state.messages.slice().reverse();
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

// ----- ПОСЛЕДНИЕ 2 ДНЯ (расшифровка) -----
function renderLastTwoDays() {
    const container = document.getElementById('lastTwoDays');
    if (!container) return;

    const today = new Date();
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const recent = state.messages.filter(msg => {
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

// ----- ЧАСТОТЫ (с включением) -----
function renderFrequencies() {
    const container = document.getElementById('freqGrid');
    if (!container) return;

    let html = '';
    CONFIG.frequencies.forEach(f => {
        const statusClass = f.status || 'known';
        const activeClass = f.active ? 'active' : '';
        html += `
            <button class="freq-btn ${activeClass}" data-freq="${f.freq}" data-active="${f.active}">
                ${f.freq} кГц
                <span class="badge ${statusClass}">${f.label || f.status}</span>
            </button>
        `;
    });

    container.innerHTML = html;

    // Клик по частоте
    container.querySelectorAll('.freq-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const freq = parseInt(this.dataset.freq);
            toggleFreq(freq);
        });
    });

    // Ползунки
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

    state.currentFreq = freq;
    updateFreqInfo(freq);
    updateStatusBar();
}

function setupSliders() {
    const volumeSlider = document.getElementById('volumeSlider');
    const volumeValue = document.getElementById('volumeValue');
    if (volumeSlider) {
        volumeSlider.value = state.volume;
        volumeSlider.addEventListener('input', function() {
            state.volume = parseInt(this.value);
            if (volumeValue) volumeValue.textContent = state.volume + '%';
            updateStatusBar();
        });
    }

    const noiseSlider = document.getElementById('noiseSlider');
    const noiseValue = document.getElementById('noiseValue');
    if (noiseSlider) {
        noiseSlider.value = state.noiseReduction;
        noiseSlider.addEventListener('input', function() {
            state.noiseReduction = parseInt(this.value);
            if (noiseValue) noiseValue.textContent = state.noiseReduction + '%';
            updateStatusBar();
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
                    <div style="color:#8b949e;font-size:0.85rem;">${f.name} — ${f.desc || ''} <span style="color:${f.active ? '#00ff88' : '#ff6666'};">${status}</span></div>
                </div>
            </div>
        `;
    }
}

function updateStatusBar() {
    const activeFreq = CONFIG.frequencies.find(f => f.active === true);
    const freqText = activeFreq ? `${activeFreq.freq} кГц` : 'нет';
    document.getElementById('statusFreq').textContent = freqText;
    document.getElementById('statusVolume').textContent = state.volume + '%';
    document.getElementById('statusNoise').textContent = state.noiseReduction + '%';
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
                <div style="font-size:0.7rem;color:#5a6a7a;margin-top:4px;">${getPredictionText(todayProb)}</div>
            </div>
            <div style="background:rgba(16,24,40,0.5);border-radius:8px;padding:12px 16px;border:1px solid #1a2a4a;">
                <div style="font-size:0.7rem;color:#8b949e;text-transform:uppercase;letter-spacing:1px;">Завтра</div>
                <div style="font-size:1.6rem;font-weight:600;color:${getColor(tomorrowProb)};">${tomorrowProb}%</div>
                <div style="font-size:0.8rem;color:#5a6a7a;">${getDescription(tomorrowProb)}</div>
                <div style="font-size:0.7rem;color:#5a6a7a;margin-top:4px;">${getPredictionText(tomorrowProb)}</div>
            </div>
            <div style="background:rgba(16,24,40,0.5);border-radius:8px;padding:12px 16px;border:1px solid #1a2a4a;">
                <div style="font-size:0.7rem;color:#8b949e;text-transform:uppercase;letter-spacing:1px;">Неделя</div>
                <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px;">
                    ${weekForecast.map(d => `
                        <div style="flex:1;min-width:28px;text-align:center;">
                            <div style="font-size:0.6rem;color:#5a6a7a;">${d.label}</div>
                            <div style="height:50px;display:flex;align-items:flex-end;justify-content:center;">
                                <div style="width:100%;height:${d.prob}%;background:${getColor(d.prob)};border-radius:3px 3px 0 0;min-height:4px;transition:height 0.5s;box-shadow:0 0 10px ${getColor(d.prob)}33;"></div>
                            </div>
                            <div style="font-size:0.6rem;color:#8b949e;">${d.prob}%</div>
                        </div>
                    `).join('')}
                </div>
                <div style="font-size:0.7rem;color:#5a6a7a;margin-top:8px;text-align:center;">
                    📊 ${getWeekSummary(weekForecast)}
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

    if (hour >= 12 && hour <= 15) prob = prob * 1.3;
    if (hour >= 23 || hour <= 6) prob = prob * 0.5;

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
        const labels = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
        week.push({ label: labels[d.getDay()], prob });
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

function getPredictionText(prob) {
    if (prob >= 80) return 'Вероятны боевые приказы';
    if (prob >= 60) return 'Вероятны техпроверки';
    if (prob >= 40) return 'Обычный эфир';
    return 'Спокойный эфир';
}

function getWeekSummary(week) {
    const high = week.filter(d => d.prob >= 70).length;
    if (high >= 3) return `🔥 ${high} дней высокой активности`;
    if (high >= 1) return `⚡ ${high} день с высокой активностью`;
    return '🌊 Спокойная неделя';
}

// ----- КАРТА (с анимацией) -----
function renderMap() {
    if (state.map) {
        state.map.remove();
        state.markers = [];
        state.routes = [];
    }

    state.map = L.map('map', {
        center: [55.0, 40.0],
        zoom: 4,
        zoomControl: true,
        fadeAnimation: true,
        attributionControl: true
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>, &copy; CartoDB'
    }).addTo(state.map);

    // Собираем точки с координатами
    const points = [];
    state.messages.forEach(msg => {
        const digits = [msg.digits_1, msg.digits_2, msg.digits_3, msg.digits_4]
            .filter(d => d && d.trim())
            .join(' ');

        const decoded = decodeCoordinates(digits);
        if (decoded) {
            const { lat, lon } = decoded.shifted;
            if (!isNaN(lat) && !isNaN(lon) && lat > -90 && lat < 90 && lon > -180 && lon < 180) {
                points.push({ lat, lon, msg });
            }
        }
    });

    // Сортируем по времени
    points.sort((a, b) => {
        const da = a.msg.date || '0000-00-00';
        const db = b.msg.date || '0000-00-00';
        return da.localeCompare(db) || (a.msg.time || '00:00').localeCompare(b.msg.time || '00:00');
    });

    // Рисуем точки
    points.forEach((p, index) => {
        const color = getPointColor(p.msg);
        const marker = L.circleMarker([p.lat, p.lon], {
            radius: 8,
            fillColor: color,
            color: color,
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.7
        }).addTo(state.map);

        const translation = translateMessage(p.msg);
        const popupText = `
            <b>${p.msg.callsign || '???'}</b><br>
            ${p.msg.date || ''} ${p.msg.time || ''}<br>
            ${translation}<br>
            <span style="color:#58a6ff;">${p.lat.toFixed(2)}°N, ${p.lon.toFixed(2)}°E</span>
            <br><span style="color:#5a6a7a;font-size:0.75rem;">📍 После сдвига +2°/+5°</span>
        `;
        marker.bindPopup(popupText);

        state.markers.push({ lat: p.lat, lon: p.lon, marker, msg: p.msg });

        // Рисуем маршруты (соединяем точки по времени)
        if (index > 0 && index < points.length) {
            const prev = points[index - 1];
            const route = L.polyline(
                [[prev.lat, prev.lon], [p.lat, p.lon]],
                { color: '#58a6ff', weight: 1.5, opacity: 0.3, dashArray: '5, 10' }
            ).addTo(state.map);
            state.routes.push(route);
        }
    });

    // Добавляем зоны активности
    if (points.length > 0) {
        const center = getCenter(points);
        const zone = L.circle([center.lat, center.lon], {
            radius: 300000,
            color: '#58a6ff',
            weight: 1,
            opacity: 0.15,
            fillColor: '#58a6ff',
            fillOpacity: 0.05
        }).addTo(state.map);
        state.routes.push(zone);
    }

    // Если нет точек — тестовые
    if (points.length === 0) {
        c
