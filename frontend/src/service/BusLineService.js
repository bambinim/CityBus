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
    },
    async getBusLineToEdit(id){
        let msg = '';

        try{
            const res = await requests.get(`/lines/${id}/complete`,{ authenticated: true })
            if (res.status == 200) {
                return res.data;
            }
            msg = 'Si è verificato un errore durante il recupero delle informazioni'
        }catch{
            msg = 'Recupero linea fallito'
        }
        throw msg
    },
    async getBusLinesDetailedInformation(){
        let msg = '';
        try{
            const res = await requests.get(`/lines/detailed`, {authenticated: true})
            if (res.status == 200) {
                return res.data;
            }
            msg = 'Si è verificato un errore durante il recupero delle linee'
        }catch{
            msg = 'Recupero linee fallito'
        }
        throw msg
    },
    async editBusLine(id, data){
        let msg = '';
        const {name, directions} = data

        try{
            const res = await requests.put(`/lines/${id}`, { data: {
                name: name,
                directions: directions
            }, authenticated: true})
            if (res.status == 201) {
                return;
            }
            msg = 'Si è verificato un errore durante la modifica della linea'
        }catch{
            msg = 'Salvataggio linea fallito'
        }
        throw msg
    },
    async deleteBusLine(id){
        let msg = '';

        try{
            const res = await requests.delete(`/lines/${id}`,{ authenticated: true })
            if (res.status == 200) {
                return;
            }
            msg = 'Si è verificato un errore durante la rimozione della linea'
        }catch{
            msg = 'Eliminazione linea fallito'
        }
        throw msg
    },


}
