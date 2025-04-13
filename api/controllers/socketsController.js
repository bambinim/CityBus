const { BusRide, BusLine, Route } = require("../database");
const io = require("socket.io")();
const { RideDataProvider, RideDataEvent } = require("../lib/RedisRide")
const { coordinatesDistance } = require("../lib/utils");
const { Logger } = require("../logging");


const checkRideId = async (rideId) => {
    const ride = await BusRide.findById(rideId)
    return ride ? true : false
} 

const getTimeToNextStop = ({ routeToNext, currentStepIndex, position }) => {
    let closestIndex = -1
    let closestDistance = -1
    let currentDistance = undefined
    for (let [i, coord] of routeToNext[currentStepIndex].geometry.coordinates) {
        currentDistance = coordinatesDistance(position[1], position[0], coord[1], coord[0])
        if (closestDistance < 0 || currentDistance < closestDistance) {
            closestDistance = currentDistance
            closestIndex = i
        }
    }
    let timeToNext = routeToNext[currentStepIndex].duration * (1 - (closestIndex / routeToNext[currentStepIndex].geometry.coordinates.length))
    for (let i = currentStepIndex + 1; i < routeToNext.length; i++) {
        timeToNext += routeToNext[i].duration
    }
    return timeToNext
}


const calculateRealTimeRideData = async ({ rideId, position }) => {
    const ride = await BusRide.findById(rideId).exec()
    const currentRouteLeg = (await Route.aggregate([
        {"$geoNear": {
                near: {coordinates: position, type: 'Point'},
                distanceField: "distance",
                includeLocs: "location",
                spherical: true,
                key: "path.geometry",
                query: { directionId: ride.directionId, type: 'partial' }
        }},
        {"$addFields": {
            "currentStepIndex": { "$indexOfArray": ["$path.geometry", "$location"] }
        }}
    ]).exec())[0]
    const direction = (await BusLine.findOne({ "directions._id": ride.directionId }).exec()).directions.filter(d => d._id.toString() == ride.directionId.toString())[0]
    let currentStopIndex = undefined
    for (const [idx, stop] of direction.stops.entries()) {
        if (!stop.routeToNext) {
            continue
        }
        if (stop.routeToNext.toString() != currentRouteLeg._id.toString()) {
            continue
        }
        currentStopIndex = idx
        break 
    }
    for (const stop of ride.stops) {
        if (stop.stopId.toString() == direction.stops[currentStopIndex + 1].stopId.toString()) {
            break
        }
        stop.isBusPassed = true
    }
    await ride.save()
    const timeToNextStop = getTimeToNextStop({routeToNext: currentRouteLeg.path, currentStepIndex: currentRouteLeg.currentStepIndex, position})
    const expectedArrivalTime = new Date()
    expectedArrivalTime.setSeconds(expectedArrivalTime.getSeconds() + timeToNextStop)
    // calculate bus lateness in milliseconds
    let lateness = Math.floor(expectedArrivalTime - new Date(ride.stops[currentStopIndex + 1].expectedArrivalTimestamp))
    if (lateness < 0) {
        lateness = 0
    }

    return {
        timeToNextStop: Math.floor(timeToNextStop), 
        nextStop: direction.stops[currentStopIndex + 1].stopId.toString(),
        minutesLate: Math.floor(lateness / 1000 / 60),
        position: position
    }
}


module.exports = {
    ridePosition: async (socket) => {
        Logger.debug('Connected to ridePosition websocket')
        const rideId = socket.nsp.name.split('/')[2]
        if (!(await checkRideId(rideId))) {
            Logger.error(`Position websocket error: ride with id ${rideId} does not exists`)
            socket.emit('error', 'Specified ride does not exists')
            socket.disconnect()
            return
        }
        const rideDataProvider = new RideDataProvider()
        rideDataProvider.connect()
        const rideDataEvent = new RideDataEvent()
        rideDataEvent.connect()
        // Logger.debug('Ride position websocket estrablished')
        await rideDataEvent.subscribe([`${rideId}:update`]);

        rideDataEvent.onMessage((rideData) => {
            if (rideData.rideId === `${rideId}:update`) {
                // Logger.debug(`Inoltro aggiornamento ricevuto da Redis a WebSocket`);
                socket.emit('ride_update', rideData);
            }
        });

        socket.on('put', async (position) => {
            if (!(await checkRideId(rideId))) {
                Logger.debug("Ride deleted")
                socket.emit("deleted_ride")
                socket.disconnect()
                return
            }
            // Logger.debug("put")
            const rideData = await calculateRealTimeRideData({rideId, position: JSON.parse(position)})
            await rideDataProvider.setRide(rideId, rideData)
        })

        socket.on('disconnect', () => {
            Logger.debug('Socket closed')
        })
    },

    allRidesPositions: async (socket) => {
        Logger.debug('Connecte to allRidesPositions websocket')
        const rideDataProvider = new RideDataProvider()
        rideDataProvider.connect()
        const rideDataEvent = new RideDataEvent((rideData) => {
            socket.emit('update', rideData)
        })

        rideDataEvent.connect()

        socket.on('disconnect', () => {
            rideDataProvider.disconnect()
            rideDataEvent.disconnect()
        })

        // get data stored inside redis for specified rides
        socket.on('get-rides', (ridesIds, callback) => {
            Logger.debug('Received all position request')
            callback(ridesIds.map(ride => rideDataProvider.getRide(ride)).filter(ride => ride))
        })
        // subscribe to rides updates
        socket.on('subscribe', async (rides) => {
            await rideDataEvent.subscribe(rides)
        })
    }
}
