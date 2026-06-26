// ===== ЗАГРУЗКА ДАННЫХ =====
async function loadData() {
    const response = await fetch('data/messages.csv');
    const text = await response.text();
    const rows = text.split('\n').slice(1);
    const messages = rows.map(row => {
        const cols = row.split(',');
        return {
            date: cols[0],
            time: cols[1],
            callsign: cols[2],
            group: cols[3],
            word: cols[4],
            digits: cols[5] || ''
        };
    });
    return messages;
}

// ===== СЛОВАРЬ =====
const dictionary = {
    '0010': '🎯 Боевой приказ (координаты цели)',
    '0104': '📡 Смена частоты',
    '0100': '🔒 Переход в резерв / Отбой',
    'СВОДНИК': '🔄 Ретрансляция (повтор команды)',
    'ОБЕЗЬЯНКА': '✅ Завершение операции',
    'МЕРЗЛЫЙ': '🛠️ Техническая проверка',
    // добавьте остальные слова по вашему усмотрению
};

// ===== КАРТА =====
function initMap() {
    const map = L.map('map').setView([60, 60], 3);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    // Пример маршрута (можно загрузить из CSV)
    const routePoints = [
        [47.02, 97.13], // Тыва (после сдвига)
        [59.22, 24.02], // Литва
        [71.87, 20.65], // Баренцево море
    ];
    L.polyline(routePoints, { color: '#58a6ff', weight: 3 }).addTo(map);
    routePoints.forEach(p => {
        L.marker(p).addTo(map).bindPopup('Цель');
    });
}

// ===== ПРОГНОЗ =====
function generateForecast() {
    const now = new Date();
    const day = now.getDay();
    const hour = now.getHours();
    let forecast = '';

    if (day === 4 && hour >= 12 && hour <= 14) {
        forecast = '🔥 СЕЙЧАС ПИК АКТИВНОСТИ! Ловите 0010 и 0104.';
    } else if (day === 3) {
        forecast = '⏳ Завтра в 13:00 ожидается шквал. Подготовьте приёмник.';
    } else if (day === 5 || day === 6) {
        forecast = '💤 Выходные. Активность низкая, но возможны технические проверки.';
    } else {
        forecast = '📅 Обычный день. Ждите активности в четверг.';
    }
    document.getElementById('forecast').innerHTML = `<div class="card">${forecast}</div>`;
}

// ===== ЗАПУСК =====
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    generateForecast();
    document.getElementById('status').textContent = '🟢 Онлайн';
});
