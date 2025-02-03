const express = require("express");
const {allowedRoles} = require("../middleware/security");
const router = express.Router();
const ridesController = require('../controllers/ridesController')

router.post('/', allowedRoles(['admin', 'driver']), ridesController.createNewRide)

module.exports = router;