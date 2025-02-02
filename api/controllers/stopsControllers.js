const { query } = require('express')
const {BusStop} = require('../database')



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


exports.saveBusStops = async (req,res) => {
    const {name, coordinates} = req.body
    try{
        const stop = new BusStop({
            name: name,
            location: {
                type: "Point",
                coordinates: coordinates
            }
        })
        await stop.save()
        res.status(201).send("Stop created successfully")
    }catch (error) {
        res.status(500).send({message: 'Internal Server Error'})
    }
}