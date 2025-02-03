const { createClient } = require('redis')
const config = require("../config")
const logging = require("./logging");
const Logger = logging.Logger

class RideData {
    constructor() {
        this.client = createClient({url: config.REDIS_URL})
        this.client.on('error', err => {Logger.error("Failed to connect to Redis")})
    }

    async connect() {
        await this.client.connect()
    }

    async removeRide(rideId) {
        await this.client.del([rideId])
    }

    async setRide(rideId, { position, isLate, timeToNextStop }) {
        await this.client.set(rideId, JSON.stringify({ position, isLate, timeToNextStop }))
        await this.client.publish(`${rideId}/update`, JSON.stringify({ position, isLate, timeToNextStop }))
    }

    async getRide(rideId) {
        return JSON.parse(await this.client.get(rideId))
    }
}

class RideDataEvent {
    constructor(onMessageCallback) {
        this.client = createClient({url: config.REDIS_URL})
        this.client.on('error', err => {Logger.error("Failed to connect to Redis")})
        this.onMessageCallback = onMessageCallback
    }

    async connect() {
        await this.client.connect()
    }

    async publish(rideId, rideData) {
        await this.client.publish(`${rideId}:update`, JSON.stringify(rideData))
    }

    async subscribe(rideIds) {
        await this.client.subscribe(rideIds, this.onMessageCallback)
    }

    async unsubscribe(rideIds = undefined) {
        await this.client.unsubscribe(rideIds)
    }
}

module.exports = {
    RideData,
    RideDataEvent
}