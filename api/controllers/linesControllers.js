const express = require('express');
const router = express.Router();
const { BusLine, BusStop } = require('../database');

exports.createNewLine = async (req, res) => {
    try {
        const { name, directions } = req.body;
        if (!name || directions.length === 0) {
            return res.status(400).json({ message: "Name and at least one direction are required." });
        }

        // Creazione dell'oggetto BusLine con i dati ricevuti
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