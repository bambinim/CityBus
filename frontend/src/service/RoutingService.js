import requests from "@/lib/requests";

const DRIVING_END_POINT = `http://router.project-osrm.org/route/v1/driving`

export const RoutingService = {
    
    async calculateRoute(coordinates) {
        console.log(coordinates)
        const coordinateString = coordinates.map(coord => coord.location.join(',')).join(';');

        const endpoint = `${DRIVING_END_POINT}/${coordinateString}?overview=full&geometries=geojson&steps=true`
        const response = await requests.get(endpoint, {authenticated: false});
        return response.data.routes[0];
    }
}