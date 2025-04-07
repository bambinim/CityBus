const { BusLine, Route } = require('../database');

const BusRouteService = {
    async getRoute(stopId, directionId){
        const line = await BusLine.findOne({'directions._id': directionId}).exec();
        if (!line) {
            res.status(400).json({message: 'Invalid direction id'})
            return
        }
        const direction = line.directions.filter(dir => dir._id.toString() == directionId.toString())[0]
        const stopInfo = direction.stops.filter(stop => stop.stopId.toString() == stopId.toString())[0]
        
        const route = await Route.findById(stopInfo.routeToNext)
        return {
            id: route._id,
            type: route.type,
            directionId: route.directionId,
            path: route.path.map(step => ({
                duration: step.duration,
                coordinates: step.geometry.coordinates,
            }))
        }
    }
}

module.exports = {
    BusRouteService
}