const { BusRouteService } = require('../services/BusRouteServices');

function getTimeStampFromTime(timeInput) {
    const now = new Date();
    const hourLocal = now.toLocaleTimeString('it-IT', { timeZone: 'Europe/Rome' }).split(':')[0];
    const hourUTC = now.toTimeString().split(':')[0]
    const offset = hourLocal - hourUTC
    return Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        timeInput.hour - offset,
        timeInput.minute,
        0,
        0
    );
}

async function getBusPosition(ride){
    try {
        const currentTimestamp = Date.now();
        const nextStopIndex = ride.stops.findIndex(stop => !stop.isBusPassed);
        const previousStopIndex = nextStopIndex - 1;
        const previousStop = ride.stops[previousStopIndex];
        const nextStop = ride.stops[nextStopIndex];

        const previousStopTime = previousStop.expectedArrivalTimestamp;
        const nextStopTime = nextStop.expectedArrivalTimestamp;
        if (currentTimestamp < previousStopTime) {
            throw new Error("Current timestamp is before previous stop arrival.");
        }
        const elapsedTime = (currentTimestamp - previousStopTime) / 1000;
        const totalTravelTime = (nextStopTime - previousStopTime) / 1000; 
        if (elapsedTime >= totalTravelTime) {   
            const route = await BusRouteService.getRoute(nextStop.stopId, ride.directionId);
            return route.path[0].coordinates[0];
        }
        
        const route = await BusRouteService.getRoute(previousStop.stopId, ride.directionId);
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


module.exports = { getTimeStampFromTime, getBusPosition}