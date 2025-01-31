const express = require("express");
const {allowedRoles} = require("../middleware/security");
const router = express.Router();
const routesController = require('../controllers/routesControllers')


router.get('/busline', allowedRoles(["admin"]), routesController.generateRoutes)


module.exports = router;