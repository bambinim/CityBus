const { BusLine, BusRide } = require('../database');
const { getTimeStampFromTime } = require('./BusRideManagerUtils');
const { BusRideService } = require('../services/BusRideServices')

class BusRideManager{

    constructor(){

    }

    async init(){
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
                            console.log("Entry")
                            const ride = await BusRide.findOne({
                                directionId: direction._id,
                                scheduledDepartureTimestamp: { $eq: scheduledDeparture }
                            }).exec();
                            if(ride){
                                const allStopPassed = ride.stops.every(stop => stop.isBusPassed)

                                if(allStopPassed){
                                    await BusRide.findByIdAndDelete(ride._id)
                                }
                            }else{
                                console.log("Create new ride")
                                await BusRideService.createNewRide(direction._id, time[0])
                            }
                        }else{
                            await BusRide.deleteOne({
                                directionId: direction._id,
                                scheduledDepartureTimestamp: { $eq: scheduledDeparture }
                            }).exec();
                        }

                    })))
        }, 10000)
    }

}

module.exports = {
    BusRideManager
}