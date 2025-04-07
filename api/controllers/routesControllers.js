const axios = require('axios');
const {Route, BusLine} = require('../database');
const { BusRouteService } = require('../services/BusRouteServices');


exports.generateRoutes = async (req, res) => {
    
    const { stops } = req.query;
    if (!stops) {
        return res.status(400).send({ message: "Parameter 'stops' is required" });
    }

    try {

        const response = await axios.get(`http://router.project-osrm.org/route/v1/driving/${stops}?overview=full&geometries=geojson&steps=true`);
        if (response.data.routes.length > 0) {
            const route = response.data.routes[0];
            const data = route.legs.map(leg => ({
                duration: leg.duration,
                steps: leg.steps.map(step => ({
                    duration: step.duration,
                    geometry: step.geometry
                }))
            }))
            res.status(200).json(data);
        }
        
    } catch (error) {
        console.error('Error while fetching data from OSRM:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
}

exports.getRoute = async (req, res) => {
    try {
        const stopId = req.params.stopId
        const directionId = req.params.directionId
        
        const route = BusRouteService.getRoute(stopId, directionId)

        if (!route) {
            return res.status(404).json({ error: "Route not found" });
        }

        res.json({
            id: route._id,
            type: route.type,
            directionId: route.directionId,
            path: route.path.map(step => ({
                duration: step.duration,
                coordinates: step.geometry.coordinates,
            }))
        });
    } catch (error) {
        console.error("Error fetching route:", error.message);
        res.status(500).json({ error: "Internal server error" });
    }
}