const io = require("socket.io-client");
const { getBusPosition } = require('./BusRideManagerUtils')
const { generateAgentToken } = require('./AgentUtils')
const config = require("../config");
const { BusLine, BusRide } = require('../database');


class RideAgent{
    constructor(rideData){
        this.ride = rideData
        this.socket = io(`${config.WS_ENDPOINT}/rides/${this.ride._id}/position`, {
            transports: ['websocket'],
            auth: {
                token: generateAgentToken(this.ride._id)
            }
        });
        this.interval = null

        this.socket.on('ride_update', async (updatedData) => {
            this.ride = await BusRide.findById(this.ride._id);
        });
    }

    async start(){
        
        this.interval = setInterval(async () => {
            if (this.socket) {
                const position = await getBusPosition(this.ride)
                if (!position) {
                    this.ride.stops.forEach(stop => stop.isBusPassed = true)
                    await this.ride.save()
                    this.stop()
                    return
                }
                this.socket.emit("put", JSON.stringify(position))
            }
        }, 1000)
    }

    stop(){
        clearInterval(this.interval);
        if (this.socket) {
            this.socket.disconnect();
        }
    }
}


module.exports = {
    RideAgent
}