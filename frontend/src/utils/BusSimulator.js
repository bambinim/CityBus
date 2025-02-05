const { RideDataProvider, RideDataEvent } = require('./RedisRide');
import { BusRideService } from '@/service/BusRideService';

class BusSimulator {
    constructor(busRideId) {
        this.dataProvider = new RideDataProvider();
        this.dataEvent = new RideDataEvent()
        this.busRideId = busRideId;
        this.nextStop = 0;
        this.currentCoordinateIndex = 0;
        this.currentRouteStep = 0
        this.time = 0
    }

    async init(){
        this.ride = BusRideService.getBusRide(this.busRideId).populate({
            path: 'directionId'
        })
        console.log(this.ride)
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

module.exports = BusSimulator;