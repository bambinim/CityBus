


export const RoutingDataElaborator = {

    elaborateFullRoute(routeData) {
        console.log(routeData)
        return routeData.map(leg => ({
            duration: leg.duration,
            geometry: {
                type: "LineString",
                coordinates: leg.steps.flatMap(step => step.geometry.coordinates)
            }
        }));
    },

    elaborateRouteStep(routeData) {
        return routeData.map(leg => ({
            routeToNext: {
                duration: leg.duration,
                geometry: {
                    type: "LineString",
                    coordinates: leg.steps.flatMap(step => step.geometry.coordinates)
                }
            },
            timeToNext: leg.duration
        }))
    }

}