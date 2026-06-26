// ============================================
// server.js — УВБ-76 Прокси (только звук)
// ============================================

const WebSocket = require('ws');
const http = require('http');

const PORT = process.env.PORT || 3000;
const WEBSDR_URL = 'wss://websdr.ewi.utwente.nl:8901/audio';

let clients = [];
let ws = null;

function connectWebSDR() {
    if (ws && ws.readyState === WebSocket.OPEN) return;
    console.log('📡 Подключение к WebSDR...');
    ws = new WebSocket(WEBSDR_URL);
    ws.on('open', () => {
        console.log('✅ WebSDR подключен');
        try { ws.send(JSON.stringify({ command: 'tune', freq: 4625 })); } catch (e) {}
    });
    ws.on('message', (data) => {
        clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                try { client.send(data); } catch (e) {}
            }
        });
    });
    ws.on('error', () => setTimeout(connectWebSDR, 5000));
    ws.on('close', () => setTimeout(connectWebSDR, 3000));
}

const server = http.createServer((req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('УВБ-76 прокси работает');
});

const wss = new WebSocket.Server({ server });
wss.on('connection', (client) => {
    clients.push(client);
    client.on('close', () => clients = clients.filter(c => c !== client));
});

server.listen(PORT, () => {
    console.log(`🦇 Прокси запущен на порту ${PORT}`);
    connectWebSDR();
});
