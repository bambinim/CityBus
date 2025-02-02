export const RoutingDataElaborator = {

    elaborateFullRoute(routeData) {
        return routeData.legs.map(leg => ({
            duration: leg.duration,
            geometry: {
                type: "LineString",
                coordinates: leg.steps.flatMap(step => step.geometry.coordinates)
            }
        }));
    },

    elaborateRouteStep(routeData) {
        return routeData.legs.map(leg => ({
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
