const axios = require('axios');
const {Route, BusLine, BusStop} = require('../database');
const { BusRouteService } = require('../services/BusRouteServices');
const { getNavigationPath } = require('../pathFinder/pathFinder')


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

exports.getNavigationRoutes = async (req, res) => {
    const { departure, arrival, departureTime } = req.query;
    if (!departure || !arrival || !departureTime) {
        return res.status(400).send({ message: "Parameters 'departure', 'arrival' and 'departureTime' are required" });
    }
    const date = new Date();
    date.setHours(departureTime.split(':')[0], departureTime.split(':')[1], 0, 0);
    const departureCoords = departure.split(';').map(coord => parseFloat(coord));
    const arrivalCoords = arrival.split(';').map(coord => parseFloat(coord));
    const departureStops = await BusStop.aggregate([
        {
            $geoNear: {
            near: { type: "Point", coordinates: departureCoords },
            distanceField: "distance",
            spherical: true
            }
        },
        { $limit: 4 }
    ]);

    const arrivalStops = await BusStop.aggregate([
        {
            $geoNear: {
            near: { type: "Point", coordinates: arrivalCoords },
            distanceField: "distance",
            spherical: true
            }
        },
        { $limit: 4 }
    ]);

    const paths = [];

    for( const departure of departureStops) {
        for (const arrival of arrivalStops) {
            if (departure._id.toString() !== arrival._id.toString()) {
                const path = await getNavigationPath({departureStop: departure._id, arrivalStop: arrival._id, departureTime: date})
                if(path.length > 0) {
                    paths.push(path)
                }
            }
        }
    }
    paths.sort((a, b) => {
        const lastA = a[a.length - 1];
        const lastB = b[b.length - 1];
        return new Date(lastA.arrivalTime) - new Date(lastB.arrivalTime);
    });
    const departureTimestamp = new Date(paths[0][0].departureTime).getTime();
    const arrivalTimestamp = new Date(paths[0][paths[0].length - 1].arrivalTime).getTime();
    const totalDuration = (arrivalTimestamp - departureTimestamp) / 1000; 

    const legs = await Promise.all(paths[0].map(async (leg) => {
        const duration = (new Date(leg.arrivalTime).getTime() - new Date(leg.departureTime)) / 1000
        const departureTimestamp = new Date(leg.departureTime).getTime()
        const arrivalTimestamp = new Date(leg.arrivalTime).getTime()
        const lineDir = await BusLine.findById(leg.lineid)
        const line = lineDir.directions.filter(dir => dir._id.toString() === leg.directionId).map(dir => {
            return {
                id: leg.lineid,
                name: lineDir.name,
                direction: {
                    id: dir._id,
                    name: dir.name
                }
            }
        })[0]
        const stopsInfo = await BusStop.find({
            '_id': {
                $in: [leg.departureStop, leg.arrivalStop]
            }
        })

        const stops = await Promise.all(stopsInfo.map(async stop => {
            const dir = lineDir.directions.find(dir => dir._id.toString() === leg.directionId);
            const stopData = dir.stops.find(s => s.stopId.toString() === leg.departureStop);
            let routeToNext = null;
            if (stopData && stopData.routeToNext) {
                const route = await Route.findById(stopData.routeToNext);
                routeToNext = {
                    type: "LineString",
                    coordinates: route ? route.path.flatMap(segment => segment.geometry.coordinates) : []
                };
            }
            return {
                name: stop.name,
                location: stop.location,
                timeToNext: stopData ? stopData.timeToNext : null,
                routeToNext: routeToNext
            };
        }));

        return {
            duration: duration,
            departureTimestamp: departureTimestamp,
            arrivalTimestamp: arrivalTimestamp,
            line: line,
            stops: stops
        }

    }))

    const json = {
        totalDuration: totalDuration,
        departureTimestamp: departureTimestamp,
        arrivalTimestamp: arrivalTimestamp,
        legs: legs
    }
    
    res.json(json);
}