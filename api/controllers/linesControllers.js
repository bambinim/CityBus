const express = require('express');
const router = express.Router();
const mongoose = require('mongoose')
const { BusLine, BusStop, Route, StopsConnection } = require('../database');
const { Logger } = require('../logging');


const processDirections = async ({ session, directions }) => {
    const stopCache = new Map();

    const processed = [];

    for (const direction of directions) {
        const stops = [];

        for (let i = 0; i < direction.stops.length; i++) {
        const rawStop = direction.stops[i];

        const key = typeof rawStop === 'string'
            ? rawStop
            : `${rawStop.name}-${JSON.stringify(rawStop.location)}`;

        let stopDoc = stopCache.get(key);
        if (!stopDoc) {
            if (typeof rawStop === 'string') {
                stopDoc = await BusStop
                    .findOne({ _id: rawStop })
                    .session(session)
                    .exec();
                } else {
                stopDoc = await BusStop
                    .findOne({ name: rawStop.name, location: rawStop.location })
                    .session(session)
                    .exec();
            }
            if (!stopDoc) {
                stopDoc = new BusStop({
                    name: rawStop.name,
                    location: rawStop.location
                });
                await stopDoc.save({ session });
            }

            stopCache.set(key, stopDoc);
        }

        let routeToNext;
        if (i < direction.stops.length - 1) {
            routeToNext = new Route({
            path: direction.routeLegs[i].steps,
            type: 'partial'
            });
            await routeToNext.save({ session });
        }

        stops.push({
            stopId: stopDoc._id,
            name: stopDoc.name,
            routeToNext: routeToNext?._id,
            timeToNext: i === direction.stops.length - 1
            ? 0
            : direction.routeLegs[i].duration
        });
        }

        const fullRoute = new Route({
        path: direction.routeLegs.flatMap(leg =>
            leg.steps.map(step => ({
            duration: step.duration,
            geometry: step.geometry
            }))
        ),
        type: 'full'
        });
        await fullRoute.save({ session });

        processed.push({
            name: direction.name,
            stops,
            timetable: direction.timetable,
            fullRoute: fullRoute._id
        });
    }

    return processed;
}

const updateLinesCollateralCollections = async ({ session, busLine }) => {
    for (const direction of busLine.directions) {
        await BusStop.updateMany(
            { _id: { $in: direction.stops.map(stop => stop.stopId) } },
            { $push: { connectedLineDirections: direction._id } },
            { session }
        ).exec();

        await Route.updateMany(
            { _id: { $in: [direction.fullRoute].concat(direction.stops.map(s => s.routeToNext)) } },
            { directionId: direction._id },
            { session }
        ).exec();
            
        for (let i = 0; i < direction.stops.length - 1; i++) {
            let connection = await StopsConnection.findOne({
                from: direction.stops[i].stopId,
                to: direction.stops[i+1].stopId
            })
            if (!connection) {
                connection = new StopsConnection({
                    from: direction.stops[i].stopId,
                    to: direction.stops[i+1].stopId,
                    lines: []
                })
            }
            connection.lines.push({
                lineId: busLine._id,
                directionId: direction._id,
                travelTime: direction.stops[i].timeToNext
            })
            await connection.save({ session })
        }
    }
}

const removeOldLineData = async ({ session, line }) => {
    // remove routes
    const routesToDelete = line.directions.flatMap(dir => [dir.fullRoute].concat(dir.stops.map(s => s.routeToNext)))
    Logger.debug(`Routes to delete: ${routesToDelete}`)
    await Route.deleteMany(
        { "_id": { "$in": routesToDelete } },
        { session }
    ).exec()
    // remove references from stops
    const directionsIds = line.directions.map(d => d._id)
    Logger.debug(`Directions ids: ${directionsIds}`)
    await BusStop.updateMany(
        { connectedLineDirections: { "$in": directionsIds } },
        { "$pull": { connectedLineDirections: { "$in": directionsIds } } },
        { session }
    ).exec()
    //remove references from stops connections
    await StopsConnection.updateMany(
        { "lines.lineId": line._id },
        { "$pull": { "lines": { "lineId": line._id } } },
        { session }
    ).exec()
}

exports.createNewLine = async (req, res) => {
    const session = await mongoose.startSession()
    try {
        await session.withTransaction(async () => {
            const { name, directions } = req.body;
            if (!name || directions.length === 0) {
                return res.status(400).json({ message: "Name and at least one direction are required." });
            }

            const processedDirections = await processDirections({ session, directions })
        
            const newBusLine = new BusLine({
                name: name,
                directions: processedDirections
            });

            await newBusLine.save({ session });
            await updateLinesCollateralCollections({ session, busLine: newBusLine })
        })

        
        res.status(201).json({
            message: "Bus line created successfully",
        });
    } catch (error) {
        console.error("Failed to create a new bus line:", error);
        res.status(500).json({ message: "Error creating a new bus line", error: error.message });
    } finally {
        session.endSession()
    }
};

exports.getBusLines = async (req, res) => {
    try{
        const {search} = req.query
        const query = {}
        if(search){
            query.name = { $regex: search, $options: 'i'}
        }

        const busLines = await BusLine.find(query)
        const response = busLines.map(line => ({
            id: line._id,
            name: line.name
        }))
        res.status(200).json(response)
    }catch(error){
        res.status(500).send({message: 'Internal Server Error'})
    }
}

exports.getBusLinesDetailed = async (req, res) => {
    try{
        const busLines = await BusLine.find().populate('directions')
        console.log(busLines[0])
        const response = []
        busLines.map(line => {
            line.directions.map(direction => {
                response.push({
                    line_id: line._id,
                    line_name: line.name,
                    direction_id: direction._id,
                    direction_name: direction.name,
                    stops: direction.stops.map(stop => ({
                        stop_id: stop.stopId,
                        stop_name: stop.name
                    }))
                })
            })
        })
        res.status(200).json(response)
    }catch(error){
        res.status(500).send({message: 'Internal Server Error'})
    }
}

exports.deleteBusLine = async (req, res) => {
    const busLineId = req.params.id
    const session = await mongoose.startSession()
    try{
        await session.withTransaction(async () => {
            const busLine = await BusLine.findById(busLineId)

            if(!busLine){
                return res.status(404).json({ message: 'Bus line not found' });
            }

            await removeOldLineData({ session, line: busLine })
            await BusLine.deleteOne({_id: busLineId})

            res.status(200).send({
                message: "Resource deleted successfully",
            });
        })
    }catch(error){
        res.status(500).send({message: 'Internal Server Error'})
        Logger.error(error)
    } finally {
        await session.endSession()
    }
}

exports.getCompleteBusLinesInfo = async (req, res) => {
    const busLineId = req.params.id

    try{
        const busLine = await BusLine.findById(busLineId).populate('directions.stops.routeToNext')

        if(!busLine){
            return res.status(404).json({ message: 'Bus line not found' });
        }

        const directionsProcessed = await Promise.all(busLine.directions.map(async direction => {
            const stops = await Promise.all(direction.stops.map(async stop => {
                const stopDoc = await BusStop.findById(stop.stopId)
                return { 
                    name: stopDoc.name,
                    location: stopDoc.location
                }
            }))

            const routeLegs = direction.stops.filter(stop => stop.routeToNext).map(stop => ({
                duration: stop.routeToNext.path.reduce((total, route) => total + route.duration, 0),
                steps: stop.routeToNext.path
            }))
                

            return {
                name: direction.name,
                stops: stops,
                routeLegs: routeLegs,
                timetable: direction.timetable
            }
        }))
        
        const data = {
            name: busLine.name,
            directions: directionsProcessed
        }
        res.status(200).json(data)
    }catch(error){
        Logger.error(`/lines/{lineId/complete error: ${error}`)
        res.status(500).send({message: 'Internal Server Error'})
    }
}

exports.editBusLine = async (req, res) => {
    const busLineId = req.params.id
    const { name, directions } = req.body;
    if (!name || directions.length === 0) {
        return res.status(400).json({ message: "Name and at least one direction are required." });
    }
    const session = await mongoose.startSession()
    try {
        await session.withTransaction(async () => {
            const originalLine = await BusLine.findById(busLineId)

            await removeOldLineData({ session, line: originalLine })

            const processedDirections = await processDirections({ session, directions })
            
            originalLine.directions = processedDirections

            const updatedBusLine = await originalLine.save({ session })
            await updateLinesCollateralCollections({ session, busLine: updatedBusLine })
        })

        res.status(201).json({
            message: "Bus line modified successfully",
        });
    } catch (error) {
        Logger.error("Failed to modify  bus line:", error);
        res.status(500).json({ message: "Error modify bus line", error: error.message });
    } finally {
        session.endSession()
    }
};
