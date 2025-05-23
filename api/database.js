const mongoose = require("mongoose")
const Schema = mongoose.Schema;

const userSchema = new Schema({
    name: {type: new Schema({
        first: {type: String, required: true},
        last: {type: String, required: true},
    }, {_id: false}), required: true},
    email: {type: String, required: true, unique: true},
    password: {type: String, required: true},
    role: {type: String, required: false, enum: ["user", "admin", "driver"], default: "user"}
});

const renewTokenSchema = new Schema({
    token: {type: String, required: true},
    userId: {type: Schema.Types.ObjectId, required: true, ref: "User"}
});

const timeSchema = new Schema({
    hour: {type: Number, required: true},
    minute: {type: Number, required: true}
}, {_id: false});

const pointSchema = new Schema({
    type: {type: String, required: true, enum: ["Point"], default: "Point"},
    coordinates: {type: [Number], required: true, default: undefined}
}, {_id: false});
const lineStringSchema = new Schema({
    type: {type: String, required: true, enum: ["LineString"], default: "LineString"},
    coordinates: {type: [[Number]], required: true, default: undefined}
}, {_id: false});
const routeStepSchema = new Schema({
    duration: {type: Number, required: true},
    geometry: {type: lineStringSchema, required: true, index: '2dsphere'}
}, {_id: false});

const routeSchema = new Schema({
    path: {type: [routeStepSchema], required: true, default: undefined},
    type: {type: String, required: true, default: undefined, enum: ['full', 'partial']},
    directionId: {type: Schema.Types.ObjectId, required: false, default: undefined}
})

const directionSchema = new Schema({
    name: {type: String, required: true},
    stops: {type: [new Schema({
        stopId: {type: Schema.Types.ObjectId, required: true, ref: "BusStop"},
        name: {type: String, required: true},
        routeToNext: {type: Schema.Types.ObjectId, required: false, default: undefined, ref: "Route"},
        timeToNext: {type: Number, required: true}
    }, {_id: false})], required: true, default: undefined},
    timetable: {type: [[timeSchema]], required: true, default: undefined},
    fullRoute: {type: Schema.Types.ObjectId, required: true, ref: "Route"},
});

const busLineSchema = new Schema({
    name: {type: String, required: true},
    directions: {type: [directionSchema], required: true, default: undefined}
});

const busStopSchema = new Schema({
    name: {type: String, required: true},
    location: {type: pointSchema, required: true, index: '2dsphere'},
    connectedLineDirections: {type: [{type: Schema.Types.ObjectId, ref: "BusLine.directions"}], required: false, default: []}
});

const busRideSchema = new Schema({
    scheduledDepartureTimestamp: {type: Number, required: true},
    lineId: {type: Schema.Types.ObjectId, required: true, ref: "BusLine"},
    directionId: {type: Schema.Types.ObjectId, required: true, ref: "BusLine.directions"},
    status: {type: String, required: true, enum: ["running", "finished"]},
    stops: {type: [new Schema({
        stopId: {type: Schema.Types.ObjectId, required: true, ref: "BusStop"},
        name: {type: String, required: true},
        expectedArrivalTimestamp: {type: Number},
        isBusPassed: {type: Boolean, default: false}
    }, {_id: false})], required: true, default: undefined}
});

const stopsConnectionSchema = new Schema({
    from: {type: Schema.Types.ObjectId, required: true, ref: "BusStop"},
    to: {type: Schema.Types.ObjectId, required: true, ref: "BusStop"},
    lines: {
        type: [new Schema({
            lineId: {type: Schema.Types.ObjectId, required: true, ref: "BusLine"},
            directionId: {type: Schema.Types.ObjectId, required: true, ref: "BusLine.directions"},
            travelTime: {type: Number, required: true}
        }, {_id: false})],
        required: true, default: []}
})


const Route = mongoose.model("Route", routeSchema, "routes")
const BusLine = mongoose.model("BusLine", busLineSchema, "bus_lines");
const BusStop = mongoose.model("BusStop", busStopSchema, "bus_stops");
const BusRide = mongoose.model("BusRun", busRideSchema, "bus_rides")
const User = mongoose.model("User", userSchema, "users");
const RenewToken = mongoose.model("RenewToken", renewTokenSchema, "renew_tokens");
const StopsConnection = mongoose.model("StopsConnection", stopsConnectionSchema, "stops_connections")


module.exports = {
    Route: Route,
    BusLine: BusLine,
    BusStop: BusStop,
    BusRide: BusRide,
    User: User,
    RenewToken: RenewToken,
    StopsConnection: StopsConnection
}
