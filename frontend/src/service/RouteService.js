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
    }

}