import socketRequests from "@/lib/socketRequests";
import { useBusRideStore } from '@/stores/ride';


export class BusSimulator {
    constructor() {
        this.reset()
    }

    reset() {
        if(this.socket){
            this.socket.disconnect()
            this.socket = null
        }
        this.socket = null;     
        this.rideId = null;
        this.ride = null
        this.busRideStore = useBusRideStore()
    }

    async followBusRide(rideId, onError){
        
        try {
            if(this.socket)
                this.reset()
            this.rideId = rideId;
            this.busRideStore.setRideInfo(this.rideId)
            this.socket = await socketRequests.connect(`/rides/${this.rideId}/position`);

            this.socket.on("error", (error) => {
                console.error("Errore WebSocket:", error);
                this.reset()
                if (onError) onError("Errore di connessione WebSocket");
            });

            this.socket.on("ride_update", (data) => {
                this.busRideStore.updateRideData(data);
                if (!this.isReady) this.isReady = true
            });

            this.socket.on("disconnect", () => {
                console.log("WebSocket disconnesso.");
            })

            this.socket.on("connect", () => {
                console.log("WebSocket connesso.");
            })

        } catch (error) {
            console.error("Errore nella connessione WebSocket:", error);
            if (this.socket) this.socket.disconnect();
            this.reset();
            if (onError) onError("Errore nella connessione o nella simulazione.");
        }
        
    }

}