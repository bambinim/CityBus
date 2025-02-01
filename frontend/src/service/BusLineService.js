import requests from "@/lib/requests";

export const BusLineService = {

    async createNewBusLine(data){
        let msg = '';
        const {name, directions} = data
        
        try{
            const res = await requests.post(`/lines`, { data: {
                name: name,
                directions: directions
            }, authenticated: true})
            if (res.status == 201) {
                return;
            }
            msg = 'Si è verificato un errore durante il salvataggio'
        }catch{
            msg = 'Salvataggio linea fallito'
        }
        throw msg
    }
    

}