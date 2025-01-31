import requests from "@/lib/requests";

export const RoutingService = {
    
    async calculateRoute(coordinates) {
        const coordinateString = coordinates.map(coord => coord.coordinates.join(',')).join(';');
        console.log(coordinateString)
        let msg = ''
        let queryParams = [];

        queryParams.push(`stops=${coordinateString}`);
        console.log(queryParams)
        try{
            const res = await requests.get(`/routes/busline?${queryParams}`, {authenticated: true})
            console.log(res)
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