const { BusLine, BusRide } = require('../database');
const { getTimeStampFromTime } = require('./BusRideManagerUtils');
const { BusRideService } = require('../services/BusRideServices');
const { RideAgent } = require('./RideAgent');

class BusRideManager{

    constructor(){
        this.agents = []
        const io = null
    }

    async init(io){
        this.io = io
        this.startLoop()
    }

    async startLoop(){
        setInterval(async () => {
            const now = Date.now()
            const lines = await BusLine.find().populate('directions')
            lines.map(line => 
                line.directions.map(direction => 
                    direction.timetable.map(async time => {
                        const scheduledDeparture = getTimeStampFromTime(time[0])
                        const scheduledFinished = getTimeStampFromTime(time[time.length - 1])
                        if(now >= scheduledDeparture && now <= scheduledFinished){
                            const ride = await BusRide.findOne({
                                directionId: direction._id,
                                scheduledDepartureTimestamp: { $eq: scheduledDeparture }
                            }).exec();
                            if(ride){
                                const agent = this.agents.find(ag => ag.ride._id.toString() == ride._id.toString())
                                if(!agent){
                                    const newAgent = new RideAgent(ride, this.io)
                                    newAgent.start()
                                    this.agents.push(newAgent)
                                }
                                const allStopPassed = ride.stops.every(stop => stop.isBusPassed)

                                if(allStopPassed){
                                    agent.stop()
                                    await BusRide.findByIdAndUpdate(ride._id, {status: 'finished'})
                                }
                            }else{
                                await BusRideService.createNewRide(direction._id, time[0])
                            }
                        }

                    })))
        }, 10000)
    }

}

module.exports = {
    BusRideManager
}