const mongoose = require("mongoose")
const Schema = mongoose.Schema;

const userSchema = new Schema({
    _id: Schema.Types.ObjectId,
    name: {type: new Schema({
        first: {type: String, required: true},
        last: {type: String, required: true},
    }), required: true},
    email: {type: String, required: true},
    password: {type: String, required: true},
    role: {type: String, required: false, enum: ["user", "admin", "driver"], default: "user"}
});

const renewTokenSchema = new Schema({
    _id: Schema.Types.ObjectId,
    token: {type: String, required: true},
    userId: {type: Schema.Types.ObjectId, required: true, ref: "User"}
});

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
    geometry: {type: lineStringSchema, required: true}
}, {_id: false});

const directionSchema = new Schema({
    _id: Schema.Types.ObjectId,
    name: {type: String, required: true},
    stops: {type: [new Schema({
        stopId: {type: Schema.Types.ObjectId, required: true, ref: "BusStop"},
        name: {type: String, required: true},
        routeToNext: {type: [routeStepSchema], required: true, default: undefined},
        timeToNext: {type: Number, required: true}
    })], required: true, default: undefined},
    timetable: {type: [[Number]], required: true, default: undefined}
});

const busLineSchema = new Schema({
    _id: Schema.Types.ObjectId,
    name: {type: String, required: true},
    directions: {type: [directionSchema], required: true, default: undefined},
    fullRoute: {type: [routeStepSchema], required: true, default: undefined}
});

const busStopSchema = new Schema({
    _id: Schema.Types.ObjectId,
    name: {type: String, required: true},
    location: {type: pointSchema, required: true},
    connectedLineDirections: {type: [{type: Schema.Types.ObjectId, ref: "BusLine.directions"}], required: false, default: []}
});

const busRideSchema = new Schema({
    _id: Schema.Types.ObjectId,
    directionId: {type: Schema.Types.ObjectId, required: true, ref: "BusLine.directions"},
    status: {type: String, required: true, enum: ["running", "finished"]},
    stops: {type: [new Schema({
        stopId: {type: Schema.Types.ObjectId, required: true, ref: "BusStop"},
        name: {type: String, required: true},
        expectedArrivalTimestamp: {type: Number},
        isBusPassed: {type: Boolean, default: false}
    }, {_id: false})], required: true, default: undefined}
});

const BusLine = mongoose.model("BusLine", busLineSchema);
const BusStop = mongoose.model("BusStop", busStopSchema);
const BusRide = mongoose.model("BusRun", busRideSchema)
const User = mongoose.model("User", userSchema);
const RenewToken = mongoose.model("RenewToken", renewTokenSchema);


module.exports = {
    BusLine: BusLine,
    BusStop: BusStop,
    BusRide: BusRide,
    User: User,
    RenewToken: RenewToken,
}
