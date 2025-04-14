import { defineStore } from 'pinia';
import { BusRideService } from '@/service/BusRideService';

export const useBusRideStore = defineStore('ride', {
    state: () => ({
        rideInfo: null,
        position: null,
        minutesLate: 0,
        timeToNextStop: 0,
        nextStop: null,
        stopPassed: []
    }),
    actions: {
        updateRideData(data) {
            this.position = data.position;
            this.minutesLate = data.minutesLate;
            this.timeToNextStop = data.timeToNextStop;
            this.nextStop = data.nextStop;
            const nextStopIndex = this.rideInfo.stops.findIndex(stop => stop.stopId == this.nextStop)
            this.rideInfo.stops.filter((stop, id, arr) => id < nextStopIndex).map(stop => {
                this.stopPassed.indexOf(stop.stopId) === -1 ? this.stopPassed.push(stop.stopId) : null
            })
        },
        async setRideInfo(rideId){
            this.rideInfo = await BusRideService.getBusRide(rideId)
            this.stopPassed = []
        }
    }
});