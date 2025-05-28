document.addEventListener('DOMContentLoaded', () => {
    let ws;
    let currentUsername = '';

    const loginScreen = document.getElementById('loginScreen');
    const chatScreen = document.getElementById('chatScreen');
    const usernameInput = document.getElementById('usernameInput');
    const joinChatBtn = document.getElementById('joinChatBtn');

    const messagesContainer = document.getElementById('messages');
    const messageInput = document.getElementById('messageInput');
    const sendBtn = document.getElementById('sendBtn');
    const statusDisplay = document.getElementById('status');
    const themeToggle = document.getElementById('themeToggle');

    // Cargar preferencia de tema
    const savedTheme = localStorage.getItem('chatTheme') || 'light';
    document.body.setAttribute('data-bs-theme', savedTheme);
    themeToggle.checked = savedTheme === 'dark';

    function connect() {
        if (!currentUsername) {
            console.error("Nombre de usuario no establecido. No se puede conectar.");
            return;
        }

        const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
        //ws = new WebSocket(`${protocol}//${location.host}`);
        ws = new WebSocket(`${protocol}//${location.hostname}:3000`);

        ws.onopen = () => {
            statusDisplay.textContent = 'Conectado';
            statusDisplay.className = 'connected';
            sendBtn.disabled = false;
            messageInput.disabled = false;
            // Opcional: Enviar un mensaje de "se ha unido"
            ws.send(JSON.stringify({ type: 'join', username: currentUsername }));
            console.log('Conectado al servidor WebSocket');
        };

        ws.onmessage = (event) => {
            try {
                const msg = JSON.parse(event.data);
                if (msg.username && msg.text && msg.timestamp) {
                    addMessageToUI(msg.username, msg.text, msg.timestamp, msg.username === currentUsername);
                } else if (msg.type === 'user_list') { 
                    // updateUserList(msg.users);
                } else {
                    console.warn("Mensaje recibido con formato desconocido:", msg);
                }
            } catch (error) {
                console.error('Error al parsear mensaje:', error, event.data);
                
            }
        };

        ws.onclose = () => {
            statusDisplay.textContent = 'Desconectado. Intentando reconectar...';
            statusDisplay.className = 'disconnected';
            sendBtn.disabled = true;
            messageInput.disabled = true;
            setTimeout(connect, 3000); // Se intenta reconectar cada 3 segundos
        };

        ws.onerror = (error) => {
            console.error('Error WebSocket:', error);
            statusDisplay.textContent = 'Error de conexión';
            statusDisplay.className = 'disconnected';
            // No reintentar inmediatamente en error, podría ser un bucle si el servidor no está
            // ws.close(); // Asegurarse que se cierre para que el onclose maneje la reconexión
        };
    }

    function addMessageToUI(username, text, timestamp, isSentByCurrentUser) {
        const msgDiv = document.createElement('div');
        msgDiv.classList.add('message', isSentByCurrentUser ? 'sent' : 'received');

        const userSpan = document.createElement('span');
        userSpan.className = 'username';
        userSpan.textContent = isSentByCurrentUser ? 'Tú' : username;

        const textSpan = document.createElement('span');
        textSpan.className = 'text';
        textSpan.textContent = text; // Cuidado con XSS si el texto puede contener HTML. Escapar si es necesario.

        const timeSpan = document.createElement('span');
        timeSpan.className = 'timestamp';
        timeSpan.textContent = timestamp;

        msgDiv.appendChild(userSpan);
        msgDiv.appendChild(textSpan);
        msgDiv.appendChild(timeSpan);

        messagesContainer.appendChild(msgDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight; // Para el Auto-scroll
    }

    function sendMessage() {
        const text = messageInput.value.trim();
        if (!text) {
            messageInput.focus();
            return;
        }

        if (!currentUsername) {
            alert('Por favor, establece un nombre de usuario primero.');
            // Esto no debería pasar si la UI está bien gestionada
            showLoginScreen();
            return;
        }

        if (ws && ws.readyState === WebSocket.OPEN) {
            const messagePayload = {
                username: currentUsername,
                text: text
                // El timestamp lo añade el servidor
            };
            ws.send(JSON.stringify(messagePayload));
            // Optimistic UI update: Se muestra el mensaje enviado inmediatamente.
            
            messageInput.value = '';
            messageInput.focus();
        } else {
            alert('No hay conexión al servidor de chat.');
        }
    }

    function showChatScreen() {
        loginScreen.classList.add('d-none');
        chatScreen.classList.remove('d-none');
        messageInput.focus();
        connect(); // Conectar al WebSocket una vez que el usuario está en la pantalla de chat
    }

    function showLoginScreen() {
        loginScreen.classList.remove('d-none');
        chatScreen.classList.add('d-none');
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.close();
        }
        usernameInput.focus();
    }

    // Event Listeners
    joinChatBtn.addEventListener('click', () => {
        const username = usernameInput.value.trim();
        if (username) {
            currentUsername = username;
            // Guardar el nombre de usuario si se desea (ej. localStorage)
            // localStorage.setItem('chatUsername', currentUsername);
            showChatScreen();
        } else {
            alert('Por favor, ingresa un nombre de Super Guerrero.');
            usernameInput.focus();
        }
    });

    usernameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            joinChatBtn.click();
        }
    });

    sendBtn.addEventListener('click', sendMessage);

    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { // Enviar con Enter, Shift+Enter para nueva línea (si el input fuera textarea)
            e.preventDefault(); // Prevenir nueva línea en input type text
            sendMessage();
        }
    });

    themeToggle.addEventListener('change', () => {
        if (themeToggle.checked) {
            document.body.setAttribute('data-bs-theme', 'dark');
            localStorage.setItem('chatTheme', 'dark');
        } else {
            document.body.setAttribute('data-bs-theme', 'light');
            localStorage.setItem('chatTheme', 'light');
        }
    });

    
        showLoginScreen();

    // Deshabilitar inputs de chat hasta que se conecte
    sendBtn.disabled = true;
    messageInput.disabled = true;
    statusDisplay.textContent = 'Esperando nombre...';
    statusDisplay.className = 'connecting';
});