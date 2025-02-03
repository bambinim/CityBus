const express = require('express');
const router = express.Router();
const { BusLine, BusStop } = require('../database');

exports.createNewLine = async (req, res) => {
    try {
        const { name, directions } = req.body;
        if (!name || directions.length === 0) {
            return res.status(400).json({ message: "Name and at least one direction are required." });
        }

        const processedDirections = await Promise.all(directions.map(async direction => {
            const stops = await Promise.all(direction.stops.map(async (stop, index) => {
                let stopDoc = undefined
                if(typeof stop === "string"){
                    stopDoc = await BusStop.findOne({ _id: stop });
                }else{
                    stopDoc = await BusStop.findOne({name: stop.name, location: stop.location})
                }
                
                if(!stopDoc){
                    stopDoc = await new BusStop({name: stop.name, location: stop.location}).save()
                }

                return {
                    stopId: stopDoc ? stopDoc._id : mongoose.Types.ObjectId(), 
                    name: stopDoc.name,
                    routeToNext: index === direction.stops.length-1 ? [] : direction.routeLegs[index].steps,
                    timeToNext: index === direction.stops.length-1 ? 0 : direction.routeLegs[index].duration
                };
            }));
    

            const fullRoute = direction.routeLegs.flatMap(leg => leg.steps.map(step => ({
                duration: step.duration,
                geometry: step.geometry
            })))
    
            return {
                name: direction.name,
                stops: stops,
                timetable: direction.timetable,
                fullRoute: fullRoute
            };
        }));
    
        const newBusLine = new BusLine({
            name: name,
            directions: processedDirections
        });

        await newBusLine.save();
        for (const direction of newBusLine.directions) {
            await BusStop.updateMany(
                { _id: { $in: direction.stops.map(stop => stop.stopId) } },
                { $push: { connectedLineDirections: direction._id } }
            );
        }
        res.status(201).json({
            message: "Bus line created successfully",
        });
    } catch (error) {
        console.error("Failed to create a new bus line:", error);
        res.status(500).json({ message: "Error creating a new bus line", error: error.message });
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

exports.deleteBusLine = async (req, res) => {
    const busLineId = req.params.id

    try{
        const busLine = await BusLine.findById(busLineId)

        if(!busLine){
            return res.status(404).json({ message: 'Bus line not found' });
        }

        const directions = busLine.directions.map(direction => direction._id)
        console.log(directions)

        await BusLine.deleteOne({_id: busLineId})

        await BusStop.updateMany(
            { connectedLineDirections: { $in: directions } },
            { $pull: { connectedLineDirections: { $in: directions } } }
        )

        
        res.status(200).send({
            message: "Resource deleted successfully",
        });
    }catch(error){
        res.status(500).send({message: 'Internal Server Error'})
    }
}

exports.getCompleteBusLinesInfo = async (req, res) => {
    const busLineId = req.params.id

    try{
        const busLine = await BusLine.findById(busLineId)

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

            const routeLegs = direction.stops.map(stop => ({
                duration: stop.routeToNext.reduce((total, route) => total + route.duration, 0),
                steps: stop.routeToNext
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
        res.status(500).send({message: 'Internal Server Error'})
    }
}

exports.editBusLine = async (req, res) => {
    try {
        const busLineId = req.params.id
        const { name, directions } = req.body;
        if (!name || directions.length === 0) {
            return res.status(400).json({ message: "Name and at least one direction are required." });
        }

        const originalLine = await BusLine.findById(busLineId)
        const directionId = originalLine.directions.map(direction => direction._id)
        console.log(directionId)

        const processedDirections = await Promise.all(directions.map(async direction => {
            const stops = await Promise.all(direction.stops.map(async (stop, index) => {
                let stopDoc = undefined
                if(typeof stop === "string"){
                    stopDoc = await BusStop.findOneAndUpdate({_id: stop}, { $pull: { connectedLineDirections: { $in: directionId } } }, {returnNewDocument: true});
                }else{
                    stopDoc = await BusStop.findOneAndUpdate({name: stop.name, location: stop.location}, { $pull: { connectedLineDirections: { $in: directionId } } }, {returnNewDocument: true})
                }
                console.log(stopDoc)
                
                if(!stopDoc){
                    stopDoc = await new BusStop({name: stop.name, location: stop.location}).save()
                }
                
                return {
                    stopId: stopDoc ? stopDoc._id : mongoose.Types.ObjectId(), 
                    name: stopDoc.name,
                    routeToNext: index === direction.stops.length-1 ? [] : direction.routeLegs[index].steps,
                    timeToNext: index === direction.stops.length-1 ? 0 : direction.routeLegs[index].duration
                };
            }));
    

            const fullRoute = direction.routeLegs.flatMap(leg => leg.steps.map(step => ({
                duration: step.duration,
                geometry: step.geometry
            })))
    
            return {
                name: direction.name,
                stops: stops,
                timetable: direction.timetable,
                fullRoute: fullRoute
            };
        }));
        
        originalLine.directions = processedDirections

        const updatedBusLine = await originalLine.save()
        updatedBusLine.directions.forEach(d => {
            console.log(d._id)
        })
        updatedBusLine.directions.forEach(async direction => {
            await BusStop.updateMany(
                { _id: { $in: direction.stops.map(stop => stop.stopId) } },
                { $push: { connectedLineDirections: direction._id } }
            );
        })

        res.status(201).json({
            message: "Bus line modified successfully",
        });
    } catch (error) {
        console.error("Failed to modify  bus line:", error);
        res.status(500).json({ message: "Error modify bus line", error: error.message });
    }
};
