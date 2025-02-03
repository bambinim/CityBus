const { query } = require('express')
const {BusStop} = require('../database')
const {BusLine} = require('../database')
const {BusRide} = require('../database')
const { RideDataProvider } = require("../lib/RedisRide")



exports.getBusStops = async (req, res) => {
    const {near, search} = req.query
    const query = {}
    if(near){
        const coordinates = near.split(',').map(Number)
        query.location = {
            $near: {
                $geometry: {
                    type: 'Point',
                    coordinates: coordinates
                },
                $maxDistance: 1000
            }
        }
    }

    if(search){
        query.name = { $regex: search, $options: 'i'}
    }

    try{
        const busStops = await BusStop.find(query)
        const response = busStops.map(stop => ({
            stopId: stop._id,
            name: stop.name,
            location: stop.location
        }));
        res.json(response)
    }catch (error) {
        console.error('Error fetching bus stops:', error);
        res.status(500).json({ message: 'Error processing your request' });
    }
}

exports.getBusStopInformation = async (req,res) => {
    const busStopId = req.params.id

    try{
        const busStop = await BusStop.findById(busStopId).populate({
            path: 'connectedLineDirections',
            populate: { path: 'directions' }
        })
        

        if (!busStop) {
            return res.status(404).json({ message: 'Bus stop not found' });
        }

        response = {
            busStopId: busStopId,
            busStopName: busStop.name,
            lines: busStop.connectedLineDirections.map(line => ({
                lineId: line._id,
                lineName: line.name,
                direction: line.directions.map(direction => ({
                    id: direction._id,
                    name: direction.name
                }))
            }))
        }
        res.status(200).json(response)
    }catch (error) {
        console.error('Error fetching bus stop:', error);
        res.status(500).json({ message: 'Error processing your request' });
    }
}

exports.getDepartures = async (req, res) => {
    const busStopId = req.params.id
    const departure_timestamp = req.query.departure_timestamp

    try{

        const stop = await BusStop.findById(busStopId)

        if (!stop) {
            return res.status(404).json({ message: 'Bus stop not found' });
        }

        const response = await Promise.all(stop.connectedLineDirections.map(async direction => {
            const line = await BusLine.findOne({ 'directions._id': direction }, 'name directions.$');

            if (!line) {
                return null;
            }

            const dir = line.directions[0]

            const ride = await BusRide.findOne({
                lineId: line._id, 
                directionId: dir._id,
                stops: {
                    $elemMatch: {
                        stopId: stop._id,
                        expectedArrivalTimestamp: { $gte: departure_timestamp }
                    }
                }
            });

            const rideData = new RideDataProvider()
            await rideData.connect()


            const redisData = await rideData.getRide(ride._id.toString());
            if (!redisData) {
                throw new Error('Ride data not available.');
            }

            const stopInfo = ride.stops.find(stop => stop.stopId.toString() === busStopId);

            return {
                id: line._id,
                name: line.name,
                direction: {
                    id: dir._id,
                    name: dir.name,
                    rideId: ride._id,
                    scheduledArrivalTimestamp: stopInfo.expectedArrivalTimestamp,
                    delay: redisData.minutesLate
                }
            };
        }))

        res.status(200).json(response)

    }catch (error) {
        console.error('Error fetching bus stop:', error);
        res.status(500).json({ message: 'Error processing your request' });
    }
}