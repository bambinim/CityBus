import requests from "@/lib/requests";



export const BusStopService = {

    async saveBusStop(data) {
        let msg = '';

        try{
            const res = await requests.post(`/stops`, { data: {
                name: data.name,
                coordinates: data.coordinates
            }, authenticated: true})
            if (res.status == 201) {
                return;
            }
        }catch{
            msg = 'Salvataggio stop fallito'
        }
        throw msg
    },
    async searchBusStops(query = {}) {
        let msg = ''
        const {search, near} = query
        let queryParams = [];

        if (search) {
            queryParams.push(`search=${encodeURIComponent(search)}`);
        }
        if (near) {
            queryParams.push(`near=${encodeURIComponent(near)}`);
        }
        const queryString = queryParams.join('&');
        try{
            const res = await requests.get(`/stops?${queryString}`, {authenticated: true})
            if (res.status == 200) {
                return res.data;
            }
            msg = 'Nessuna fermata trovata'
        }catch{
            msg = 'Errore nella richiesta'
        }
        throw msg
    },
    async getStopInformation(stopId){
        let msg = ''

        try{
            const res = await requests.get(`/stops/${stopId}`, {authenticated: true})
            if (res.status == 200) {
                return res.data;
            }
            msg = 'Informazioni non reperibili'
        }catch{
            msg = 'Errore nella richiesta'
        }
        throw msg
    },
    async getDepartures(data){
        let msg = ''
        const{stopId, departureTimeStamp} = data

        try{
            const res = await requests.get(`/stops/${stopId}/departures?departure_timestamp=${departureTimeStamp}`, {authenticated: true})
            if (res.status == 200) {
                return res.data;
            }
            msg = 'Nessuna fermata trovata'
        }catch{
            msg = 'Errore nella richiesta'
        }
        throw msg
    }

}