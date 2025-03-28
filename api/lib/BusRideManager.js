const { BusLine, BusRide, BusStop } = require('../database');
const { getTimeStampFromTime } = require('./BusRideManagerUtils');
const { RideDataProvider } = require("../lib/RedisRide")

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
                                await this.#createNewRide(direction._id, time[0])
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

    async #createNewRide(directionId, departureTime){
        const line = await BusLine.findOne({'directions._id': directionId}).exec();
        if (!line) {
            return
        }

        const direction = line.directions.filter(dir => dir._id.toString() == directionId.toString())[0]
        let timetable = direction.timetable.filter(time => time[0].hour == departureTime.hour && time[0].minute == departureTime.minute)
        if (timetable.length < 1) {
            return
        }
        timetable = timetable[0]
        const ride = BusRide()
        const now = Date.now()
        const scheduledDeparture = new Date()
        scheduledDeparture.setHours(departureTime.hour-1, departureTime.minute, 0, 0)
        ride.scheduledDepartureTimestamp = scheduledDeparture.getTime()
        ride.lineId = line._id
        ride.directionId = direction._id
        ride.status = 'running'
        const currentStopTime = scheduledDeparture
        ride.stops = direction.stops.map(stop => {
            const res = {
                stopId: stop.stopId,
                name: stop.name,
                expectedArrivalTimestamp: currentStopTime.getTime(),
                isBusPassed: currentStopTime.getTime() < now ? true : false
            }
            currentStopTime.setSeconds(currentStopTime.getSeconds() + stop.timeToNext)
            return res
        })
        ride.stops[0].isBusPassed = true
        await ride.save()
        const rideData = new RideDataProvider()
        await rideData.connect()
        await rideData.setRide(ride._id.toString(), {
            position: (await BusStop.findById(ride.stops[0].stopId)).location.coordinates,
            minutesLate: Math.floor((new Date() - scheduledDeparture) / 1000 / 60),
            timeToNextStop: direction.stops[0].timeToNext,
            nextStop: {stopId: ride.stops[1].stopId, name: ride.stops[1].name}
        })
    }

}

module.exports = {
    BusRideManager
}