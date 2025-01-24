const express = require("express");
const {allowedRoles} = require("../middleware/security");
const router = express.Router();
const userController = require('../controllers/usersControllers')




router.post('/registration', userController.registerNewUser)
router.get('/me', allowedRoles(["user", "driver", "admin"]), userController.getUserInformation)
router.put('/me', allowedRoles(["user", "driver", "admin"]), userController.changeUserInformation)
router.put('/me/password', allowedRoles(["user", "driver", "admin"]), userController.updatePassword)



module.exports = router;