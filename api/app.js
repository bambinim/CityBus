const express = require("express")
const app = express()
const config = require("./config")

function runDevelopmentServer() {
    const fs = require("fs")
    const YAML = require("yaml")
    const swaggerUi = require("swagger-ui-express")
    const apiSchema = fs.readFileSync("./api-schema.yaml", "utf-8")
    app.use("/ui", swaggerUi.serve, swaggerUi.setup(YAML.parse(apiSchema)))
    app.listen(3001, () => {
        console.log(`Development server listening on port ${3001}`)
    })
}

if (config.NODE_ENV == "development") {
    runDevelopmentServer()
}