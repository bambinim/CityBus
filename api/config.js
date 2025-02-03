module.exports = {
    NODE_ENV: process.env.NODE_ENV,
    APP_SECRET: process.env.APP_SECRET || "appsecret",
    MONGODB_URL: process.env.MONGODB_URL,
    LOGGING_LEVEL: process.env.LOGGING_LEVEL || "INFO",
    REDIS_URL: process.env.REDIS_URL || "redis://redis:6380"
}