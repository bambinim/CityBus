import requests from "@/lib/requests";



export const BusStopService = {

    async saveBusStop(name, coordinates) {
        let msg = '';
        try{
            res = await requests.post('/stops', { data: {
                name: name,
                coordinates: coordinates
            }, authenticated: true})
            if (res.status == 201) {
                return;
            }
        }catch{
            msg = 'Salvataggio stop fallito'
        }
        throw msg
    }

}