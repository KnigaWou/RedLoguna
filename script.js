// ===== СЛОВАРЬ =====
const dictionary = {
    '0010': '🎯 Боевой приказ (координаты цели)',
    '0104': '📡 Смена частоты',
    '0100': '🔒 Переход в резерв / Отбой',
    '0013': '📡 Смена частоты на "Каплю" / "Скрипучее колесо"',
    '0808': '🆔 Идентификатор подразделения',
    'СВОДНИК': '🔄 Ретрансляция (повтор команды)',
    'ОБЕЗЬЯНКА': '✅ Завершение операции',
    'МЕРЗЛЫЙ': '🛠️ Техническая проверка',
    'ДОКОБЛЕФ': '🛠️ Техническая проверка',
    'ОСТАВЛЕНИЕ': '✅ Подтверждение выполнения',
    'ГОЛОСОК': '🔊 Активация сети',
    'ОКОНЧАНЬЕ': '🔇 Завершение сеанса',
    'ПРИБЛИЖЕНИЕ': '⚠️ Предупреждение о начале операции',
    'ЗАГРЕБ': '🔄 Отмена операции',
    'СУПЕРМАТИЗМ': '🎯 Наведение / Корректировка',
    'НЕРЧИНСКИЙ': '🚀 Ракетные войска (РВСН)',
    'ЛАТВИЯ': '🌍 Геополитический сигнал (Прибалтика)',
    'КАВКАЗ': '🌍 Геополитический сигнал (Кавказ)',
    'СССР': '🏛️ Исторический сигнал (возможно, ошибка)'
};

// ===== ПРОГНОЗ (расширенный) =====
function generateForecast() {
    const now = new Date();
    const day = now.getDay(); // 0=Вс, 4=Чт
    const hour = now.getHours();
    let forecast = '';

    // Проверка на "шквальный день"
    const isShkval = (day === 3 || day === 4) && hour >= 12 && hour <= 16;

    if (isShkval) {
        forecast = '🔥 ШКВАЛ! Сегодня ожидается 15+ сообщений. Ловите коды 0010 и 0104.';
    } else if (day === 4 && hour >= 12 && hour <= 14) {
        forecast = '🔥 ПИК АКТИВНОСТИ! Сейчас самое время для прослушки.';
    } else if (day === 3) {
        forecast = '⏳ Завтра в 13:00 ожидается шквал. Подготовьте приёмник.';
    } else if (day === 5 || day === 6) {
        forecast = '💤 Выходные. Активность низкая, но возможны технические проверки.';
    } else {
        forecast = '📅 Обычный день. Ждите активности в четверг.';
    }

    // Добавляем прогноз по месяцам (сезонность)
    const month = now.getMonth();
    if (month === 5 || month === 6 || month === 11) {
        forecast += ' 📈 Сезонный пик (июнь, июль, декабрь).';
    }

    document.getElementById('forecast').innerHTML = `<div class="card">${forecast}</div>`;
}

// ===== КАРТА С МАРШРУТАМИ (расширенная) =====
function initMap() {
    const map = L.map('map').setView([60, 60], 3);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    // Маршрут 1: Арктика → Литва → Кавказ
    const route1 = [
        [75.00, 60.00], // Арктика
        [54.22, 24.02], // Литва (центр НАТО)
        [42.00, 45.00]  // Кавказ
    ];
    L.polyline(route1, { color: '#58a6ff', weight: 3, dashArray: '8, 8' }).addTo(map)
        .bindPopup('Маршрут 1: Арктика → Литва → Кавказ');

    // Маршрут 2: Тыва → Баренцево море (из сообщения АКРОФИ)
    const route2 = [
        [47.02, 97.13], // Тыва (после сдвига)
        [57.67, 59.07], // Урал
        [93.48, 12.18], // Арктика
        [99.15, 08.08]  // Северный полюс
    ];
    L.polyline(route2, { color: '#ff6b6b', weight: 3 }).addTo(map)
        .bindPopup('Маршрут 2: Тыва → Арктика (операция АКРОФИ)');

    // Точки-цели (маркеры)
    const targets = [
        { lat: 47.02, lng: 97.13, label: 'Тыва (цель)' },
        { lat: 54.22, lng: 24.02, label: 'Литва (НАТО)' },
        { lat: 42.00, lng: 45.00, label: 'Кавказ' },
        { lat: 75.00, lng: 60.00, label: 'Арктика' }
    ];
    targets.forEach(t => {
        L.marker([t.lat, t.lng])
            .addTo(map)
            .bindPopup(`<b>${t.label}</b><br>Координаты: ${t.lat}, ${t.lng}`);
    });
}

// ===== ЗАГРУЗКА ТАБЛИЦЫ =====
async function loadTable() {
    try {
        const response = await fetch('data/messages.csv');
        const text = await response.text();
        const rows = text.split('\n').slice(1).filter(row => row.trim() !== '');
        const messages = rows.slice(0, 50).map(row => {
            const cols = row.split(',');
            return {
                date: cols[0],
                time: cols[1],
                callsign: cols[2],
                group: cols[3],
                word: cols[4],
                digits: cols[5] || '—',
                word2: cols[6] || '',
                digits2: cols[7] || ''
            };
        });

        let html = '<table><tr><th>Дата</th><th>Время</th><th>Позывной</th><th>Слово</th><th>Цифры</th><th>Расшифровка</th></tr>';
        messages.forEach(m => {
            const decoded = dictionary[m.word] || dictionary[m.digits.slice(0,4)] || '🔍 Неизвестно';
            html += `<tr>
                <td>${m.date}</td>
                <td>${m.time}</td>
                <td><span class="badge">${m.callsign}</span></td>
                <td><strong>${m.word}</strong></td>
                <td><code>${m.digits}</code></td>
                <td>${decoded}</td>
            </tr>`;
        });
        html += '</table>';
        document.getElementById('messages-table').innerHTML = html;
    } catch (e) {
        document.getElementById('messages-table').innerHTML = '<p>⚠️ Не удалось загрузить данные. Убедитесь, что файл data/messages.csv существует.</p>';
        console.error(e);
    }
}

// ===== ЗАПУСК =====
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    generateForecast();
    loadTable();
    document.getElementById('status').textContent = '🟢 Онлайн • Данные за 2023–2026';
});
