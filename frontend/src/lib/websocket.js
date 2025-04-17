import requests from '@/lib/requests'
import { io } from 'socket.io-client'

class WebSocketClass {
    constructor(namespace) {
        this.namespace = namespace;
        this.socket = null;
        this.created = false;
        this.createSocket();
    }

    async createSocket() {
        const authHeader = await requests.authorizationHeader();
        this.socket = io(this.namespace, {
            extraHeaders: {'Authorization': authHeader}
        });
        this.created = true;
    }

    async updateAuthHeader() {
        const authHeader = await requests.authorizationHeader();
        this.socket._opts.extraHeaders = {'Authorization': authHeader}
    }

    async verifySocketHealth() {
        if (this.created && !this.socket.connected) {
            await this.updateAuthHeader();
        }
    }

    async emit(event, ...data) {
        await this.verifySocketHealth();
        this.socket.emit(event, ...data);
    }

    async on(event, callback) {
        await this.verifySocketHealth();
        this.socket.on(event, callback);
    }

    disconnect() {
        this.socket.disconnect();
    }
}

export const WebSocket = WebSocketClass;
