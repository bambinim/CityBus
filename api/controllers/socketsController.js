const { BusRide, BusLine } = require("../database");
const { RideDataProvider, RideDataEvent } = require("../lib/RedisRide")
const io = require("socket.io")();


const findNextStop = async (ride, position) => {
    const stops = await BusLine.find({
        'directions._id': ride.directionId,
        'directions.stops.routeToNext.geometry': {
            $near: {
                $geometry: {
                    coordinates: position,
                    type: 'Point'
                }
            }
        }
    }, ['directions.stops.stopId', 'directions.stops.name']).exec()
    return stops
}


module.exports = {
    ridePosition: async (socket) => {
        const rideId = socket.nsp.name.split('/')[2]
        const ride = await BusRide.findById(rideId).exec()
        if (!ride) {
            socket.emit('error', 'Specified ride does not exists')
            socket.disconnect()
        }
        const rideDataProvider = new RideDataProvider()
        rideDataProvider.connect()
        const rideDataEvent = new RideDataEvent()
        rideDataEvent.connect()

        socket.on('put', async (position) => {
            console.log(JSON.stringify(await findNextStop(ride, JSON.parse(position))))
        })

        socket.on('disconnect', () => {
            console.log('Socket closed')
        })
    }
}
