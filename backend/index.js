const express = require('express');
const WebSocket = require('ws');

const app = express();
const port = 3000;

// Servir archivos estáticos (aunque en este caso el frontend está separado)
app.use(express.static('public'));

// Crear servidor HTTP
const server = app.listen(port, () => {
    console.log(`Servidor backend corriendo en http://localhost:${port}`);
});

// Crear servidor WebSocket
const wss = new WebSocket.Server({ server });

// Almacenar conexiones activas
const clients = new Set();

wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('Cliente conectado. Total:', clients.size);

    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);

            // Validar que el mensaje tenga la estructura esperada
            if (!message.username || !message.text) {
                console.warn('Mensaje con formato incorrecto:', message);
                return;
            }

            // Reenviar mensaje a todos los clientes conectados
            const broadcastMessage = {
                username: message.username,
                text: message.text,
                timestamp: new Date().toLocaleTimeString()
            };

            clients.forEach((client) => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(JSON.stringify(broadcastMessage));
                }
            });
        } catch (error) {
            console.error('Error procesando mensaje:', error);
        }
    });

    ws.on('close', () => {
        clients.delete(ws);
        console.log('Cliente desconectado. Total:', clients.size);
    });

    ws.on('error', (error) => {
        console.error('Error WebSocket:', error);
        clients.delete(ws);
    });
});