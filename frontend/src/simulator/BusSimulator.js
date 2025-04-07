import io from "socket.io-client";
import { BusRideService } from '@/service/BusRideService';
import { BusStopService } from '@/service/BusStopService';
import { RouteService } from "@/service/RouteService";
import { getTimeFromTimestamp } from '../utils/DateUtils';
import socketRequests from "@/lib/socketRequests";
import { useBusRideStore } from '@/stores/ride';


export class BusSimulator {
    constructor() {
        this.reset()
    }

    reset() {
        this.socket = null;     
        this.rideId = null;
        this.ride = null
        this.busRideStore = useBusRideStore()
        this.isReady = false
    }

    async followBusRide(rideId, onError){
        
        try {
            if(this.socket)
                this.reset()
            this.rideId = rideId;
            this.ride = await BusRideService.getBusRide(this.rideId)  
            this.busRideStore.setRideInfo(this.ride)
            this.socket = await socketRequests.connect(`/rides/${this.rideId}/position`);
            this.isReady = true

            this.socket.on("error", (error) => {
                console.error("Errore WebSocket:", error);
                this.reset()
                if (onError) onError("Errore di connessione WebSocket");
            });

            this.socket.on("ride_update", (data) => {
                this.busRideStore.updateRideData(data);
            });

        } catch (error) {
            console.error("Errore nella connessione WebSocket:", error);
            if (this.socket) this.socket.disconnect();
            this.reset();
            if (onError) onError("Errore nella connessione o nella simulazione.");
        }
        
    }

}