import requests from "@/lib/requests";

const DRIVING_END_POINT = `http://router.project-osrm.org/route/v1/driving`

export const RoutingService = {
    
    mapRouteData(routeData) {
        return routeData.legs.map(leg => {
            const steps = leg.steps.map(step => ({
                duration: step.duration,
                geometry: step.geometry.coordinates.map(coord => ({
                    type: "LineString",
                    coordinates: coord
                }))
            }));

            return {
                duration: leg.duration,
                steps: steps
            };
        });
    },
    async calculateRoute(coordinates) {
        const coordinateString = coordinates.map(coord => coord.location.join(',')).join(';');

        const endpoint = `${DRIVING_END_POINT}/${coordinateString}?overview=full&geometries=geojson&steps=true`
        const response = await requests.get(endpoint, {authenticated: false});
        return this.mapRouteData(response.data.routes[0]);
    }
}