import { io } from "socket.io-client";
import { jwtDecode } from "jwt-decode";
import { useAuthenticationStore } from "@/stores/authentication";
import requests from '@/lib/requests'

let socket = null;

async function createSocket(namespace) {
    const authHeader = await requests.authorizationHeader();

    return io(namespace , {
        extraHeaders: {
            'Authorization': authHeader
        }
    });
}

async function connectWebSocket(namespace) {

    if (socket && socket.connected) {
        return socket;
    }

    socket = await createSocket(namespace);

    return new Promise((resolve, reject) => {
        socket.on("connect", () => {
            resolve(socket);
        });

        socket.on("connect_error", (err) => {
            reject(err);
        });
    });
}

async function sendWebSocketMessage(event, ...data) {
    if (!socket || !socket.connected) {
        console.warn("Tentativo di invio senza connessione WebSocket. Riconnessione...");
        await connectWebSocket();
    }
    socket.emit(event, ...data);
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
    create: createSocket,
    connect: connectWebSocket,
    send: sendWebSocketMessage,
    on: onWebSocketMessage,
    disconnect: disconnectWebSocket
};
