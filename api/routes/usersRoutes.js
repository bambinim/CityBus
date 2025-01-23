const express = require("express");

const router = express.Router();
const userController = require('../controllers/usersControllers')




router.post('/registration', userController.registerNewUser)





module.exports = router;