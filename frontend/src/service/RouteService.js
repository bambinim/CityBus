import requests from "@/lib/requests";

export const RouteService = {

    async getRoute(data){
        let msg = '';

        const {stopId, directionId} = data

        try{
            const res= await requests.get(`/routes/directions/${directionId}/stops/${stopId}`,{authenticated: true})
            if (res.status == 200) {
                return res.data;
            }
            msg = 'Si è verificato un errore durante il recupero della route'
        }catch{
            msg = 'Errore nel recupero della route'
        }
        throw msg
    },
    async getNavigationRoute(data){
        let {departure, arrival, departureTime} = data;
        if (!departure || !arrival || !departureTime) {
            throw 'Dati di partenza, arrivo o orario di partenza mancanti';
        }
        departure = departure.lng + ';' + departure.lat;
        arrival = arrival.lng + ';' + arrival.lat;
        let msg = '';
        try{
            const res = await requests.get(`/routes/navigation?departure=${departure}&arrival=${arrival}&departureTime=${departureTime}`, {authenticated: true})
            if (res.status == 200) {
                return res.data;
            }
            msg = 'Si è verificato un errore durante il recupero della route'
        }catch{
            msg = 'Errore nel recupero della route'
        }
        throw msg;
    }


}