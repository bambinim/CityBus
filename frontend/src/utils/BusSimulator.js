
import { BusRideService } from '@/service/BusRideService';
import { BusStopService } from '@/service/BusStopService';

export class BusSimulator {
    constructor() {
        
    }

    async init(stopId, departureTime){
        const stopInfo = await BusStopService.getStopInformation(stopId)
        console.log(stopInfo)
        stopInfo.lines.map(line => {
            line.directions.map(async dir => {
                await BusRideService.createBusRide({directionId: dir.id, departureTime: departureTime})
            })
        })
        await this.dataProvider.connect();
        await this.dataEvent.connect()
    }

    async start(){
        console.log(`Starting simulation for ride ${this.busRideId}`);
        this.time = this.busRideId.scheduledDepartureTimestamp
        this.interval = setInterval(() => {
            this.simulateStep()
        }, 5000)
    }

    async simulateStep(){
        const now = new Date().getTime();
        
        this.ride.stops.map(stop => {
            if(stop.expectedArrivalTimestamp > now){
                this.nextStop = stop.stopId
            }
        })

        const elapsedTime = now - this.time / 1000


    }

}