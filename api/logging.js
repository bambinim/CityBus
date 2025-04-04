const winston = require("winston");
const config = require("./config");


const logger = winston.createLogger({
    level: config.LOGGING_LEVEL.toLowerCase(),
    format: winston.format.simple(),
    transports: [
        new winston.transports.Console()
    ],
});

module.exports = {
    Logger: logger
}
