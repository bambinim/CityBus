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
        const activeRides = await BusRide.find({ status: 'running' });
        activeRides.forEach(async busRide => {
            busRide = this.checkCompletedRide(busRide);
            if (busRide.status === 'finished'){
                await BusRide.updateOne(
                    { _id: busRide._id },
                    {
                        $set: {
                            status: 'finished',
                            'stops.$[].isBusPassed': true
                        }
                    }
                );
            }
        })
        this.startLoop()
    }

    checkCompletedRide(busRide) {
        if (busRide.status !== 'running') return busRide;

        const now = Date.now();
        const lastStop = busRide.stops[busRide.stops.length - 1];

        if (!lastStop) return busRide;

        const lastArrival = lastStop.expectedArrivalTimestamp;

        if (now > lastArrival) {
            busRide.status = 'finished';
        }

        return busRide;
    }

    async startLoop(){
        setInterval(async () => {
            const lines = await BusLine.find().populate('directions')
            lines.map(line => 
                line.directions.map(direction => 
                    direction.timetable.map(async time => {
                        const scheduledDeparture = getTimeStampFromTime(time[0])
                        const ride = await BusRide.findOne({
                            directionId: direction._id,
                            scheduledDepartureTimestamp: { $eq: scheduledDeparture }
                        }).exec();
                        if(ride){
                            const allStopPassed = ride.stops.every(stop => stop.isBusPassed)
                            const agent = this.agents.find(ag => ag.ride._id.toString() == ride._id.toString())
                            if(allStopPassed){
                                if (agent) {
                                    agent.stop()
                                    this.agents.splice(this.agents.indexOf(agent), 1)
                                }
                                await BusRide.findByIdAndUpdate(ride._id, {status: 'finished'})
                                
                            }
                            
                            if(!agent && !allStopPassed){
                                const newAgent = new RideAgent(ride, this.io)
                                newAgent.start()
                                this.agents.push(newAgent)
                            }
                        }else{
                            const now = Date.now()
                            const scheduledFinished = getTimeStampFromTime(time[time.length - 1])
                            if(scheduledDeparture < now && now < scheduledFinished){
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