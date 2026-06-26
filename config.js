// ============================================
//  config.js — Конфигурация УВБ-76 Live
// ============================================

const CONFIG = {
    // Firebase
    firebase: {
        apiKey: "AIzaSyCxuDhEGBrTdd6rSQ42CtPicmU3Y6Y0ZUo",
        authDomain: "redloguna.firebaseapp.com",
        databaseURL: "https://redloguna-default-rtdb.europe-west1.firebasedatabase.app",
        projectId: "redloguna",
        storageBucket: "redloguna.firebasestorage.app",
        messagingSenderId: "254078769465",
        appId: "1:254078769465:web:a7f359734e5c4419bef0e8"
    },

    // Частоты для сканирования
    frequencies: [4625, 4657, 2087, 5538, 5045, 9160, 8634, 4350, 5487],

    // Сдвиг координат
    shift: { lat: 2, lon: 5 },

    // Словарь (из базы знаний)
    dictionary: {
        "ОБЕЗЬЯНКА": { emoji: "✅", text: "Завершение операции" },
        "МЕРЗЛЫЙ": { emoji: "🛠️", text: "Техпроверка" },
        "ГОЛОСОК": { emoji: "🔊", text: "Активация сети" },
        "ОКОНЧАНЬЕ": { emoji: "🔇", text: "Завершение сеанса" },
        "НЕРЧИНСКИЙ": { emoji: "🚀", text: "РВСН" },
        "СУПЕРМАТИЗМ": { emoji: "🎯", text: "Наведение" },
        "ЛАТВИЯ": { emoji: "🌍", text: "Прибалтика" },
        "КАВКАЗ": { emoji: "🌍", text: "Кавказ" },
        "КИТАЙСКИЙ": { emoji: "🌍", text: "Китай" },
        "БЕРЛИН": { emoji: "🌍", text: "Германия" }
    },

    // Коды операций
    opCodes: {
        "0010": { emoji: "🎯", text: "Боевой приказ" },
        "0104": { emoji: "📡", text: "Смена частоты" },
        "0100": { emoji: "🔒", text: "Переход в резерв" },
        "0013": { emoji: "📡", text: "Смена частоты" },
        "0808": { emoji: "🆔", text: "ID подразделения" },
        "0101": { emoji: "🏴‍☠️", text: "Пиратская активность" }
    },

    // Инсайты
    insights: [
        "🧠 Сдвиг координат: +2° широты, +5° долготы",
        "📊 Пик активности: четверг, 13:00 MSK",
        "📅 Сезонные всплески: июнь, июль, декабрь",
        "📡 Иерархия: НЖТИ → ЦЖАП → УЛВН ЕФУГ",
        "🔴 «СБОЙ СБОЙ СБОЙ» — инструкция для оператора"
    ],

    // Прогноз
    forecast: {
        peakDay: 4,        // Четверг
        peakHourStart: 13,
        peakHourEnd: 14,
        seasonal: [6, 7, 12]
    }
};
