import requests from "@/lib/requests";


export const BusRideService = {

    async getBusRide(rideId){
        let msg = '';

        try{
            const res= await requests.get(`/rides/${rideId}`,{authenticated: true})
            if (res.status == 200) {
                return res.data;
            }
            msg = 'Si è verificato un errore durante il recupero della corsa'
        }catch{
            msg = 'Errore nel recupero della corsa'
        }
        throw msg
    },
    async startBusRidSimulation(rideId){
        const {BusSimulator} = require('../utils/BusSimulator');

        const simulator = new BusSimulator(rideId)
        simulator.init()
        simulator.start()
    }

}