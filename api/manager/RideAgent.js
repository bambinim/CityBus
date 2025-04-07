const io = require("socket.io-client");
const { getBusPosition } = require('./BusRideManagerUtils')
const { generateAgentToken } = require('./AgentUtils')
const config = require("../config");


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
    }

    async start(){
        this.interval = setInterval(async () => {
            if (this.socket) {
                const position = await getBusPosition(this.ride)
                this.socket.emit("put", JSON.stringify(position))
            }
        }, 1000)
    }

    stop(){
        clearInterval(this.interval)
    }
}


module.exports = {
    RideAgent
}