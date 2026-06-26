Ты прав. Проект должен быть живым, умным и визуально понятным с первого взгляда. Сделаем полноценную систему управления данными, интерактивную карту с анимацией событий, автоматический перевод шифров и умный прогноз.

---

🧠 КОНЦЕПЦИЯ «ЖИВОГО ШТАБА»

Когда пользователь заходит на сайт, он сразу видит:

1. Статус системы — активна, сколько сеансов, какая частота включена
2. Карту — не просто точки, а линии маршрутов, зоны активности, анимированные иконки
3. Прогноз — что будет сегодня, завтра и на неделе с визуальными индикаторами
4. Расшифровку — последние команды переведены на русский язык
5. Частоты — работают как настоящий приёмник (включить, громкость, шумодав)

---

🔄 СИСТЕМА УПРАВЛЕНИЯ ДАННЫМИ

```
[CSV] → [Парсер] → [База в памяти] → [Автообновление]
         ↓
    [Словарь + Коды]
         ↓
    [Автоперевод]
         ↓
    [Визуализация: карта, таблица, прогноз, статистика]
```

Что делает система:

· Сама определяет новые сообщения при загрузке
· Сама обновляет статистику, карту, прогноз
· Сама переводит шифры по словарю и кодам
· Сама рисует маршруты на карте

---

🗺️ КАРТА — СТАНЕТ ПОНЯТНОЙ

Вот что теперь будет на карте:

Элемент Что показывает
🔴 Красные точки Цели (боевые приказы)
🟡 Жёлтые точки Точки смены частоты
🔵 Синие точки Технические сообщения
🟢 Зелёные точки Подтверждения/отбой
➡️ Линии маршрутов Соединяют точки по времени
🌀 Зоны Радиус активности (круг)
📍 Подписи Что за объект, время, команда

Анимация: точки пульсируют, линии рисуются, зоны мерцают.

---

📡 ПЕРЕВОД ШИФРОВ — АВТОМАТИЧЕСКИЙ

Теперь в script.js встроена полная система перевода:

1. Коды операций → 0010 → «Боевой приказ»
2. Слова-действия → ОБЕЗЬЯНКА → «Завершение операции»
3. Цифры → преобразуются в координаты (со сдвигом)
4. Геополитические маркеры → ЛАТВИЯ → «Прибалтика»
5. Неизвестное → помечается как «Требует уточнения»

---

🚀 ПОЛНЫЙ КОД (все файлы обновлены)

config.js — полная конфигурация

```javascript
// ============================================
//  config.js — Ядро системы УВБ-76
// ============================================

const CONFIG = {
    // Сеть частот
    frequencies: [
        { freq: 4625, name: 'Основная', status: 'active', label: 'Жужжалка', active: false, color: '#58a6ff' },
        { freq: 4657, name: 'Резервная', status: 'new', label: 'Обнаружена', active: false, color: '#ffd93d' },
        { freq: 2087, name: 'Резервная', status: 'new', label: 'Обнаружена', active: false, color: '#ffd93d' },
        { freq: 5538, name: 'Скрипучее колесо', status: 'night', label: 'Ночная', active: false, color: '#6bcb77' },
        { freq: 5045, name: 'Капля', status: 'day', label: 'Дневная', active: false, color: '#ffa500' },
        { freq: 9160, name: 'Вторая гармоника', status: 'known', label: 'Известна', active: false, color: '#8b949e' },
        { freq: 8634, name: 'Запасная', status: 'known', label: 'Известна', active: false, color: '#8b949e' }
    ],

    // Сдвиг координат (ключ расшифровки)
    shift: { lat: 2, lon: 5 },

    // Коды операций
    opCodes: {
        '0010': { emoji: '🎯', text: 'Боевой приказ', desc: 'Координаты цели', type: 'target' },
        '0104': { emoji: '📡', text: 'Смена частоты', desc: 'Новая частота в кГц', type: 'freq' },
        '0100': { emoji: '🔒', text: 'Переход в резерв', desc: 'Отбой / смена ключей', type: 'reserve' },
        '0013': { emoji: '📡', text: 'Смена частоты', desc: 'На Каплю или Скрипучее колесо', type: 'freq' },
        '0808': { emoji: '🆔', text: 'ID подразделения', desc: 'Идентификатор части', type: 'id' }
    },

    // Словарь
    dict: {
        'СВОДНИК': { emoji: '🔄', text: 'Ретрансляция', type: 'relay' },
        'ОБЕЗЬЯНКА': { emoji: '✅', text: 'Завершение операции', type: 'done' },
        'МЕРЗЛЫЙ': { emoji: '🛠️', text: 'Техпроверка', type: 'tech' },
        'ДОКОБЛЕФ': { emoji: '🛠️', text: 'Техпроверка', type: 'tech' },
        'ОСТАВЛЕНИЕ': { emoji: '✅', text: 'Подтверждение', type: 'confirm' },
        'ГОЛОСОК': { emoji: '🔊', text: 'Активация сети', type: 'start' },
        'ОКОНЧАНЬЕ': { emoji: '🔇', text: 'Завершение сеанса', type: 'end' },
        'ПРИБЛИЖЕНИЕ': { emoji: '⚠️', text: 'Предупреждение', type: 'warn' },
        'ЗАГРЕБ': { emoji: '🔄', text: 'Отмена', type: 'cancel' },
        'СУПЕРМАТИЗМ': { emoji: '🎯', text: 'Наведение', type: 'target' },
        'НЕРЧИНСКИЙ': { emoji: '🚀', text: 'РВСН', type: 'strategic' },
        'ЛАТВИЯ': { emoji: '🌍', text: 'Прибалтика', type: 'geo' },
        'КАВКАЗ': { emoji: '🌍', text: 'Кавказ', type: 'geo' },
        'КИТАЙСКИЙ': { emoji: '🌍', text: 'Китай', type: 'geo' },
        'СССР': { emoji: '🏛️', text: 'Исторический артефакт', type: 'legacy' }
    },

    // Прогноз
    forecastWeights: {
        0: { weight: 0.3, label: 'Вс' },
        1: { weight: 0.4, label: 'Пн' },
        2: { weight: 0.5, label: 'Вт' },
        3: { weight: 0.6, label: 'Ср' },
        4: { weight: 0.9, label: 'Чт' },
        5: { weight: 0.5, label: 'Пт' },
        6: { weight: 0.3, label: 'Сб' }
    },

    seasonalBoost: {
        1: 0.8, 2: 0.7, 3: 0.8, 4: 0.9,
        5: 1.0, 6: 1.4, 7: 1.5, 8: 1.0,
        9: 0.9, 10: 0.8, 11: 0.8, 12: 1.3
    },

    // Инсайты
    insights: [
        '🧠 Сдвиг координат: +2° широты, +5° долготы — уникальный ключ расшифровки',
        '📊 Пик активности: четверг, 13:00 MSK — время наибольшей вероятности приказов',
        '📅 Сезонные всплески: июнь, июль, декабрь — периоды учений',
        '📡 Иерархия: НЖТИ (центр) → ЦЖАП (регион) → УЛВН ЕФУГ (поле)',
        '🌍 Геополитические маркеры: ЛАТВИЯ, КАВКАЗ, КИТАЙСКИЙ — впервые в 2025–2026'
    ]
};
```

---

`script.js» — полная логика

```javascript
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
                        <div style="flex:1
