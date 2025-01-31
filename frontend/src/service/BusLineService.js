import requests from "@/lib/requests";

export const BusLineService = {

    async createNewBusLine(data){
        let msg = '';
        const {name, directions} = data
        console.log(data)
        
        try{
            const res = await requests.post(`/lines`, { data: {
                name: name,
                directions: directions
            }, authenticated: true})
            if (res.status == 201) {
                return;
            }
        }catch{
            msg = 'Salvataggio linea fallito'
        }
        throw msg
    }
    

}