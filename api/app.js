const express = require("express");
const mongoose = require("mongoose");
const config = require("./config");
const logging = require("./logging");

const app = express()
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
    app.use("/", router);
}

async function runDevelopmentServer() {
    Logger.info("Starting development server")
    await connectToMongo();
    createCollections();
    routerSetup();
    const fs = require("fs");
    const YAML = require("yaml");
    const swaggerUi = require("swagger-ui-express");
    const apiSchema = fs.readFileSync("./api-schema.yaml", "utf-8");
    app.use("/ui", swaggerUi.serve, swaggerUi.setup(YAML.parse(apiSchema)));
    app.listen(3001, () => {
        Logger.info(`Development server listening on port ${3001}`);
    })
}

if (config.NODE_ENV == "development") {
    runDevelopmentServer();
}
