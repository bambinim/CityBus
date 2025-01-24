const express = require("express");
const {allowedRoles} = require("../middleware/security");
const router = express.Router();
const stopController = require('../controllers/stopsControllers')


router.get('/', allowedRoles(["user", "driver", "admin"]), stopController.getBusStops)
router.get('/:id', allowedRoles(["user", "driver", "admin"]), stopController.getBusStopInformation)


module.exports = router;