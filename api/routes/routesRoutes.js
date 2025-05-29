const express = require("express");
const {allowedRoles} = require("../middleware/security");
const router = express.Router();
const routesController = require('../controllers/routesControllers')


router.get('/busline', allowedRoles(["admin"]), routesController.generateRoutes)
router.get('/directions/:directionId/stops/:stopId', allowedRoles(["user", "driver", "admin"]), routesController.getRoute)
router.get('/navigation', allowedRoles(), routesController.getNavigationRoutes)

module.exports = router;