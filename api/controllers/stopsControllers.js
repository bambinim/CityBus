const { query } = require('express')
const {BusStop} = require('../database')
const {BusLine} = require('../database')
const {BusRide} = require('../database')
const { RideDataProvider } = require("../lib/RedisRide")
const mongoose = require('mongoose');


exports.getBusStops = async (req, res) => {
    const {near, search} = req.query
    const query = {}
    if(near){
        const coordinates = near.split(',').map(Number)
        if(coordinates.length !== 2 || isNaN(coordinates[0]) || isNaN(coordinates[1])){
            return res.status(400).json({ message: 'Invalid coordinates format. Use "longitude,latitude".' });
        }
        if(coordinates[0] < -180 || coordinates[0] > 180 || coordinates[1] < -90 || coordinates[1] > 90){
            return res.status(400).json({ message: 'Coordinates out of bounds. Longitude must be between -180 and 180, latitude between -90 and 90.' });
        }

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
        res.status(200).json(response)
    }catch (error) {
        console.error('Error fetching bus stops:', error);
        res.status(500).json({ message: 'Error processing your request' });
    }
}

exports.getBusStopInformation = async (req,res) => {
    const busStopId = req.params.id

    if (!mongoose.Types.ObjectId.isValid(busStopId)) {
            return res.status(404).json({ message: "Bus stop not found" });
    }

    try{
        const busStop = await BusStop.findById(busStopId)
        const busLines = await BusLine.find({ "directions.stops.stopId": busStopId }).lean();
        

        if (!busStop) {
            return res.status(404).json({ message: 'Bus stop not found' });
        }

        response = {
            busStopId: busStopId,
            busStopName: busStop.name,
            lines: busLines.map(line => {
                connectedDirections = []
                line.directions.forEach(direction => {
                    if (direction.stops.some(stop => stop.stopId.toString() === busStopId.toString())) {
                        connectedDirections.push({id: direction._id, name: direction.name});
                    }
                })
                return {
                    lineId: line._id,
                    lineName: line.name,
                    directions: connectedDirections
                }
            })
        }
        res.status(200).json(response)
    }catch (error) {
        console.error('Error fetching bus stop:', error);
        res.status(500).json({ message: 'Error processing your request' });
    }
}

exports.getDepartures = async (req, res) => {
    const busStopId = req.params.id;
    const departureTimestamp = req.query.departure_timestamp;
    const lineId = req.query.line;

    try {
        const stop = await BusStop.findById(busStopId);
        if (!stop) {
            return res.status(404).json({ message: 'Bus stop not found' });
        }

        const rideData = new RideDataProvider();
        await rideData.connect();

        const response = [];

        // Helper: processa i rides e popola response
        const processRides = async (rides, line, dir) => {
            await Promise.all(rides.map(async (ride) => {
                const redisData = await rideData.getRide(ride._id.toString());
                if (!redisData) {
                    throw new Error('Ride data not available for ride ID ' + ride._id);
                }

                const stopInfo = ride.stops.find(s => s.stopId.equals(stop._id));
                if (!stopInfo) return;

                response.push({
                    id: line._id,
                    name: line.name,
                    direction: {
                        id: dir._id,
                        name: dir.name
                    },
                    rideId: ride._id,
                    scheduledArrivalTimestamp: stopInfo.expectedArrivalTimestamp,
                    delay: redisData.minutesLate
                });
            }));
        };

        if (lineId) {
            const line = await BusLine.findById(lineId);
            if (!line) {
                return res.status(404).json({ message: 'Line not found' });
            }

            const rides = await BusRide.find({
                lineId: new mongoose.Types.ObjectId(lineId),
                stops: { $elemMatch: { stopId: stop._id } },
                status: "running"
            });

            const dir = line.directions[0];
            await processRides(rides, line, dir);
        } else {
            await Promise.all(stop.connectedLineDirections.map(async (directionId) => {
                const line = await BusLine.findOne({ 'directions._id': directionId }, 'name directions.$');
                if (!line) return;

                const dir = line.directions[0];

                const rides = await BusRide.find({
                    lineId: line._id,
                    directionId: dir._id,
                    stops: {
                        $elemMatch: {
                            stopId: stop._id,
                            expectedArrivalTimestamp: { $gte: departureTimestamp }
                        }
                    },
                    status: "running"
                });

                await processRides(rides, line, dir);
            }));
        }

        res.status(200).json(response);

    } catch (error) {
        console.error('Error fetching bus stop:', error);
        res.status(500).json({ message: 'Error processing your request' });
    }
};
