const express = require('express');
const router = express.Router();
const { BusLine, BusStop } = require('../database');

exports.createNewLine = async (req, res) => {
    try {
        const { name, directions } = req.body;
        if (!name || directions.length === 0) {
            return res.status(400).json({ message: "Name and at least one direction are required." });
        }

        const newBusLine = new BusLine({ name, directions });
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

        await BusLine.deleteOne({_id: busLineId})
        res.status(200).send({
            message: "Resource deleted successfully",
        });
    }catch(error){
        res.status(500).send({message: 'Internal Server Error'})
    }
}
