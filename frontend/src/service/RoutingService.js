import requests from "@/lib/requests";

const DRIVING_END_POINT = `https://routing.openstreetmap.de/routed-car/route/v1/driving/`

export const RoutingService = {

    async calculateRoute(points) {
        const coordinateString = points.map(point => point.coordinates.join(',')).join(';');

        const endpoint = `${DRIVING_END_POINT}/${coordinateString}?overview=false&geometries=geojson&steps=true`
        const response = await requests.get(endpoint, {authenticated: false});
        return response.data.routes[0];
    }
}
