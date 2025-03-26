import { io } from "socket.io-client";
import { jwtDecode } from "jwt-decode";
import { useAuthenticationStore } from "@/stores/authentication";

const WS_BASE_URL = import.meta.env.VITE_WS_ENDPOINT || "ws://localhost:3001";
let socket = null;


async function renewAuthenticationToken(authStore) {
    const res = await putRequest("/auth/session", { renewToken: authStore.renewToken });
    if (res.status === 200) {
        authStore.setTokens(res.data.jwt, res.data.renewToken);
        return;
    }
    throw new Error("Errore durante il rinnovo della sessione WebSocket.");
}

async function getAuthorizationToken() {
    const authStore = useAuthenticationStore();
    const decoded = jwtDecode(authStore.jwt);

    if (decoded.exp < Math.floor(Date.now() / 1000)) {
        await renewAuthenticationToken(authStore);
    }

    return authStore.jwt;
}

async function connectWebSocket(namespace) {
    const token = await getAuthorizationToken();
    
    if (socket && socket.connected) {
        console.log("WebSocket già connesso!");
        return socket;
    }

    socket = io(`${WS_BASE_URL}${namespace}`, {
        transports: ["websocket"],
        auth: { token: `Bearer ${token}` }
    });

    return new Promise((resolve, reject) => {
        socket.on("connect", () => {
            console.log("WebSocket connesso:", socket.id);
            resolve(socket);
        });

        socket.on("connect_error", (err) => {
            console.error("Errore di connessione WebSocket:", err.message);
            reject(err);
        });
    });
}

async function sendWebSocketMessage(event, data) {
    if (!socket || !socket.connected) {
        console.warn("Tentativo di invio senza connessione WebSocket. Riconnessione...");
        await connectWebSocket();
    }
    socket.emit(event, data);
}


function onWebSocketMessage(event, callback) {
    if (!socket) {
        console.warn("WebSocket non inizializzato. Riconnessione...");
        connectWebSocket();
    }
    socket.on(event, callback);
}


function disconnectWebSocket() {
    if (socket) {
        socket.disconnect();
        console.log("WebSocket disconnesso.");
    }
}

function setupReconnection() {
    if (!socket) return;

    socket.on("disconnect", () => {
        console.warn("WebSocket disconnesso. Tentativo di riconnessione...");
        setTimeout(() => connectWebSocket(), 3000);
    });
}

export default {
    connect: connectWebSocket,
    send: sendWebSocketMessage,
    on: onWebSocketMessage,
    disconnect: disconnectWebSocket
};
