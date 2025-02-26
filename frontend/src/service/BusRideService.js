import requests from "@/lib/requests";
import { BusSimulator } from '@/utils/BusSimulator';

export const BusRideService = {

    async createBusRide(data){
        const {directionId, departureTime} = data

        let msg = '';

        try{
            const res = await requests.post(`/rides`,{ data: {
                directionId: directionId,
                departureTime: departureTime
            }, authenticated: true})
            if (res.status == 200) {
                return res.data;
            }
            msg = 'Si è verificato un errore durante il recupero della corsa'
        }catch{
            msg = 'Errore nel recupero della corsa'
        }
        throw msg
    }
    ,async getBusRide(rideId){
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
    async startBusRideSimulation(stopId, departureTime){
        const simulator = new BusSimulator()
        simulator.init(stopId, departureTime)

    }

}