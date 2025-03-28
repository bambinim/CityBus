import io from "socket.io-client";
import { BusRideService } from '@/service/BusRideService';
import { BusStopService } from '@/service/BusStopService';
import { RouteService } from "@/service/RouteService";
import { getTimeFromTimestamp } from './DateUtils';
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

    async init(data){
        const{stopId, departureTimestamp} = data


        let departureTime = getTimeFromTimestamp(departureTimestamp)
        departureTime = {
            hour: departureTime.split(':').map(Number)[0],
            minute: departureTime.split(':').map(Number)[1]
        }
        
        return BusStopService.getDepartures({stopId: stopId, departureTimestamp: departureTimestamp})
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

            this.socket.on("deleted_ride", () => {
                this.socket.disconnect()
                this.reset()
                if (onError) onError("La corsa è terminata o eliminata.");
            })

            this.socket.on("ride_update", (data) => {
                this.busRideStore.updateRideData(data);
            });

            setInterval(async () => {
                if (this.socket) {
                    const position = await this.getBusPosition()

                    this.socket.emit("put", JSON.stringify(position));
                }
            }, 1000);
        } catch (error) {
            console.error("Errore nella connessione WebSocket:", error);
            if (this.socket) this.socket.disconnect();
            this.reset();
            if (onError) onError("Errore nella connessione o nella simulazione.");
        }
        
    }

    async getBusPosition(){
        try {
            const currentTimestamp = Date.now();
            let nextStopIndex = this.ride.stops.findIndex(stop => !stop.isBusPassed);
            if(this.busRideStore.nextStop != null){
                nextStopIndex = this.ride.stops.findIndex(stop => stop.stopId.toString() == this.busRideStore.nextStop.toString())
            }
            const previousStopIndex = nextStopIndex - 1;
            const previousStop = this.ride.stops[previousStopIndex];
            const nextStop = this.ride.stops[nextStopIndex];
            const previousStopTime = previousStop.expectedArrivalTimestamp;
            const nextStopTime = nextStop.expectedArrivalTimestamp;
            if (currentTimestamp < previousStopTime) {
                throw new Error("Current timestamp is before previous stop arrival.");
            }
    
            const elapsedTime = (currentTimestamp - previousStopTime) / 1000;
            const totalTravelTime = (nextStopTime - previousStopTime) / 1000; 
            if (elapsedTime >= totalTravelTime) {   
                const route = await RouteService.getRoute({stopId: nextStop.stopId, directionId: this.ride.line.direction.id});
                return route.path[0].coordinates[0];
            }
            
            
            const route = await RouteService.getRoute({stopId: previousStop.stopId, directionId: this.ride.line.direction.id});
            if (!route) {
                throw new Error("Route to next stop not found.");
            }
    
            const routeSteps = route.path
            let timeAccumulated = 0;

            for (const step of routeSteps) {
                const stepDuration = step.duration;
                if (timeAccumulated + stepDuration >= elapsedTime) {
                    const totalSteps = step.coordinates.length
                    const progressRatio = (elapsedTime - timeAccumulated) / stepDuration;
                    const estimatedStep = Math.floor(progressRatio * (totalSteps - 1));
                    return step.coordinates[estimatedStep]
                }
                timeAccumulated += stepDuration;
            }

        }catch (error) {
            console.error("Error estimating bus position:", error.message);
            return null;
        }
    }

}