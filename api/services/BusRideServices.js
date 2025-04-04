const { RideDataProvider } = require("../lib/RedisRide")
const { BusLine, BusRide, BusStop } = require('../database');
const { getTimeStampFromTime } = require('../manager/BusRideManagerUtils');

const BusRideService = {

    async createNewRide(directionId, departureTime){
        const line = await BusLine.findOne({ 'directions._id': directionId }).exec();
        if (!line) return;

        const direction = line.directions.find(dir => dir._id.toString() === directionId.toString());
        if (!direction) return;

        const timetable = direction.timetable.find(
            time => time[0].hour === departureTime.hour && time[0].minute === departureTime.minute
        );
        if (!timetable) return;

        const now = Date.now()
        const scheduledDepartureTimestamp = getTimeStampFromTime(departureTime);

        const ride = BusRide();
        ride.scheduledDepartureTimestamp = scheduledDepartureTimestamp;
        ride.lineId = line._id;
        ride.directionId = direction._id;
        ride.status = 'running';

        let currentStopTime = scheduledDepartureTimestamp;

        ride.stops = direction.stops.map(stop => {
            const stopData = {
                stopId: stop.stopId,
                name: stop.name,
                expectedArrivalTimestamp: currentStopTime,
                isBusPassed: currentStopTime < now
            };
            currentStopTime += stop.timeToNext * 1000;
            return stopData;
        });

        ride.stops[0].isBusPassed = true;

        await ride.save();

        const rideData = new RideDataProvider();
        await rideData.connect();
        await rideData.setRide(ride._id.toString(), {
            position: (await BusStop.findById(ride.stops[0].stopId)).location.coordinates,
            minutesLate: Math.floor((Date.now() - scheduledDepartureTimestamp) / 1000 / 60),
            timeToNextStop: direction.stops[0].timeToNext,
            nextStop: {
                stopId: ride.stops[1].stopId,
                name: ride.stops[1].name
            }
        });
    }
}

module.exports = { BusRideService };