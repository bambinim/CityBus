const express = require('express');
const { BusLine, BusStop, BusRide } = require('../database');
const { RideDataProvider } = require("../lib/RedisRide")

exports.createNewRide = async (req, res) => {
    try {
        const body = req.body
        if (!(body.directionId && body.departureTime)) {
            res.status(400).json({message: 'Some parameters are missing'})
            return
        }
        const line = await BusLine.findOne({'directions._id': body.directionId}).exec();
        if (!line) {
            res.status(400).json({message: 'Invalid direction id'})
            return
        }
        const direction = line.directions.filter(dir => dir._id == body.directionId)[0]
        console.log(body.departureTime.minute)
        let timetable = direction.timetable.filter(time => time[0].hour == body.departureTime.hour && time[0].minute == body.departureTime.minute)
        if (timetable.length < 1) {
            res.status(400).json({message: 'Departure time not valid'})
            return
        }
        timetable = timetable[0]
        const ride = BusRide()
        const scheduledDeparture = new Date()
        scheduledDeparture.setHours(body.departureTime.hour, body.departureTime.minute, 0, 0)
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
                isBusPassed: false
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
        res.json({rideId: ride._id})
    } catch (err) {
        res.status(500).json({message: `Internal server error: ${err}`})
    }
}

exports.getRidesList = async (req, res) => {
    try {
        const filters = { status: 'running' }
        if (req.query.line) {
            filters.lineId = req.query.line
        }
        if (req.query.direction) {
            filters.directionId = req.query.direction
        }
        const rides = await BusRide.find(filters).populate('lineId', ['name', 'directions._id', 'directions.name']).exec()
        res.json(rides.map(ride => {
            return {
                id: ride._id,
                line: {
                    id: ride.lineId._id,
                    name: ride.lineId.name,
                    direction: ride.lineId.directions.filter(dir => dir._id.toString() == ride.directionId.toString()).map(dir => {
                        return {
                            id: dir._id,
                            name: dir.name
                        }
                    })[0]
                }
            }
        }))
    } catch (err) {
        res.status(500).json({message: `Internal server error: ${err}`})
    }
}

exports.getRide = async (req, res) => {
    //try {
        const ride = await BusRide.findById(req.params.id)
            .populate('lineId', ['name', 'directions._id', 'directions.name'])
            .exec()
        if (!ride) {
            res.status(404).json({message: 'Bus ride not found'})
            return
        }

        const rideDataProvider = new RideDataProvider()
        await rideDataProvider.connect()
        const rideStatus = await rideDataProvider.getRide(ride._id.toString())
        res.json({
            id: ride._id,
            minutesLate: rideStatus.minutesLate,
            line: ride.lineId.directions.filter(dir => dir._id.toString() == ride.directionId.toString()).map(dir => {
                return {
                    id: ride.lineId._id,
                    name: ride.lineId.name,
                    direction: {
                        id: dir._id,
                        name: dir.name
                    }
                }
            })[0],
            stops: ride.stops
        })
    //} catch (err) {
    //    res.status(500).json({message: `Internal server error: ${err}`})
    //}
}
