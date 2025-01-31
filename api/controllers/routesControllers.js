const axios = require('axios');


exports.generateRoutes = async (req, res) => {
    
    const { stops } = req.query;
    if (!stops) {
        return res.status(400).send({ message: "Parameter 'stops' is required" });
    }

    const coordinates = stops.split(';');
    try {
        let routeLegs = [];

        for (let i = 0; i < coordinates.length - 1; i++) {
            const start = coordinates[i];
            const end = coordinates[i + 1];
            const response = await axios.get(`http://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson&steps=true`);

            if (response.data.routes.length > 0) {
                const route = response.data.routes[0];
                const routeLeg = {
                    duration: route.duration,
                    steps: route.legs.map(leg => ({
                        duration: leg.duration,
                        geometry: leg.steps.map(step => ({
                            type: 'LineString',
                            coordinates: step.geometry.coordinates
                        }))
                    }))
                };
                routeLegs.push(routeLeg);
            }
        }

        res.status(200).json(routeLegs);
    } catch (error) {
        console.error('Error while fetching data from OSRM:', error);
        res.status(500).send({ message: 'Internal Server Error' });
    }
}