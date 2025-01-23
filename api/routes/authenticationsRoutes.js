const express = require("express");
const {allowedRoles} = require("../middleware/security");
const router = express.Router();
const authenticationsController = require('../controllers/authenticationsControllers')




router.post('/session', authenticationsController.authenticateUser)
router.put('/session', authenticationsController.renewSession)
router.delete('/session', allowedRoles("user", "driver", "admin"), authenticationsController.deleteSession)




module.exports = router;