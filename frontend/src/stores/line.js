import { defineStore } from 'pinia';
import { RoutingService } from '@/service/RoutingService';
import { RoutingDataElaborator } from '@/utils/RoutingDataElaborator';

export const useBusLineStore = defineStore('busLine', {
    state: () => ({
        line: {
            name: '',
            directions: []
        }
    }),
    actions: {
        setLineName(name) {
            this.line.name = name;
        },
        addDirection() {
            this.line.directions.push({
                name: '',
                stops: [],
                timetable: [],
                fullRoute: []
            });
        },
        updateDirection(index, direction) {
            this.line.directions[index] = direction;
        },
        removeDirection(index) {
            this.line.directions.splice(index, 1);
        },
        addStop(directionIndex, stop) {
            this.line.directions[directionIndex].stops.push(stop);
        },
        updateStop(directionIndex, stopIndex, stop) {
            this.line.directions[directionIndex].stops[stopIndex] = stop;
        },
        removeStop(directionIndex, stopIndex) {
            this.line.directions[directionIndex].stops.splice(stopIndex, 1);
        },
        addTime(directionIndex) {
            const newTime = {
                hour: new Date().getHours(),
                minute: new Date().getMinutes(),
                selectedTime: new Date()
            };
            this.line.directions[directionIndex].timetable.push(newTime);
        },
        updateTime(){
            this.line.directions.forEach(direction => {
                direction.timetable = direction.timetable.map(t => ({         
                        hour: t.selectedTime.getHours(),
                        minute: t.selectedTime.getMinutes()
                }),
            )})
        },
        removeTime(directionIndex, timeIndex) {
            this.line.directions[directionIndex].timetable.splice(timeIndex, 1);
        },
        async generateRoutes() {
            this.line.directions.forEach(async (direction) => {
                const coordinates = direction.stops.map(stop => ({location: stop.name.location.coordinates}))
                direction.stops = direction.stops.map(stop => ({
                    stopId: stop.name.stopId,
                    name: stop.name.name,
                    routeToNext: stop.name.routeToNext,
                    timeToNext: stop.name.timeToNext
                }))
                const routeData = await RoutingService.calculateRoute(coordinates)
                direction.fullRoute = RoutingDataElaborator.elaborateFullRoute(routeData)
                const routeSteps = RoutingDataElaborator.elaborateRouteStep(routeData)
                routeSteps.forEach((step, i) => {
                    direction.stops[i].timeToNext = step.timeToNext
                    direction.stops[i].routeToNext = step.routeToNext
                })
            })
        },
        clearLine() {
            this.line = { name: '', directions: [] };
        }
    }

});