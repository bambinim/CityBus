const express = require("express");
const http = require('http');
const { Server } = require("socket.io")
const mongoose = require("mongoose");
const config = require("./config");
const logging = require("./logging");
const bodyParser = require('body-parser');
const { socketAllowedRoles } = require("./middleware/security")
const { BusRideManager } = require("./manager/BusRideManager")

const app = express()
const server = http.createServer(app)
const busRideManager = new BusRideManager()
const io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] }
})
const Logger  = logging.Logger;


async function connectToMongo() {
    try {
        await mongoose.connect(config.MONGODB_URL)
        Logger.info("Successfully connected to MongoDB")
    } catch (error) {
        Logger.error(`Failed to connecto to MongoDB: ${error}`)
        process.exit(1);
    }
}

function createCollections() {
    Logger.info("Creating collections");
    require("./database");
}

function routerSetup() {
    const router = require("./routes");
    const userRoutes = require('./routes/usersRoutes')
    const authenticationsRoutes = require('./routes/authenticationsRoutes')
    const stopsRoutes = require('./routes/stopsRoutes')
    const linesRoutes = require('./routes/linesRoutes')
    const routesRoutes = require('./routes/routesRoutes')
    const ridesRoutes = require('./routes/ridesRoutes')
    app.use("/", router);
    app.use(bodyParser.json({ limit: '50mb' }));
    app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
    app.use('/users', userRoutes);
    app.use('/auth', authenticationsRoutes)
    app.use('/stops', stopsRoutes);
    app.use('/lines', linesRoutes);
    app.use('/routes', routesRoutes)
    app.use('/rides', ridesRoutes)
}

function socketsSetup() {
    const { ridePosition, allRidesPositions } = require("./controllers/socketsController")
    io.of('/rides').use(socketAllowedRoles(['admin'])).on('connection', allRidesPositions)
    io.of(/^\/rides\/[a-z 0-9]{24}\/position$/).use(socketAllowedRoles(['admin', 'driver'])).on('connection', ridePosition)
}

async function runDevelopmentServer() {
    Logger.info("Starting development server")
    await connectToMongo();
    createCollections();
    routerSetup();
    socketsSetup();
    busRideManager.init(io)
    const fs = require("fs");
    const YAML = require("yaml");
    const swaggerUi = require("swagger-ui-express");
    const apiSchema = fs.readFileSync("./api-schema.yaml", "utf-8");
    app.use("/ui", swaggerUi.serve, swaggerUi.setup(YAML.parse(apiSchema)));
    
    server.listen(config.LISTEN_PORT, () => {
        Logger.info(`Development server listening on port ${config.LISTEN_PORT}`);
    })
}

async function runProductionServer() {
    Logger.info("Starting API server")
    await connectToMongo();
    createCollections();
    routerSetup();
    socketsSetup();
    busRideManager.init(io)
    server.listen(config.LISTEN_PORT, () => {
        Logger.info(`Production server listening on port ${config.LISTEN_PORT}`);
    })
}

if (config.NODE_ENV == "development") {
    runDevelopmentServer();
} else if (config.NODE_ENV == "production") {
    runProductionServer()
}
