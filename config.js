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
