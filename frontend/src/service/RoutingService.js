import requests from "@/lib/requests";

const DRIVING_END_POINT = `https://routing.openstreetmap.de/routed-car/route/v1/driving/`

export const RoutingService = {

    async calculateRoute(points) {
        let queryParams = [];
        const coordinateString = points.map(point => point.coordinates.join(',')).join(';');

        queryParams.push(`stops=${coordinateString}`);
        try{
            const res = await requests.get(`/routes/busline?${queryParams}`, {authenticated: true})
            if (res.status == 200) {
                return res.data;
            }
            msg = 'Non è stato possibile generare la route'
        }catch{
            msg = 'Errore nella richiesta'
        }
        throw msg
    }
}
