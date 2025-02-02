const express = require('express');
const router = express.Router();
const { BusLine, BusStop } = require('../database');

exports.createNewLine = async (req, res) => {
    try {
        const { name, directions } = req.body;
        if (!name || directions.length === 0) {
            return res.status(400).json({ message: "Name and at least one direction are required." });
        }

        console.log(directions)
        const processedDirections = await Promise.all(directions.map(async direction => {
            const stops = await Promise.all(direction.stops.map(async (stop, index) => {
                let stopDoc = undefined
                if(typeof stop === "string"){
                    stopDoc = await BusStop.findById(stop);
                    console.log(stopDoc)
                }else{
                    stopDoc = await new BusStop({name: stop.name, location: stop.location}).save()
                    console.log(stopDoc)
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
        //to-do update busStop line-dirtection
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
