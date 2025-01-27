const express = require("express");
const {allowedRoles} = require("../middleware/security");
const router = express.Router();
const linesController = require('../controllers/linesControllers')


router.post('/', allowedRoles(['admin']), linesController.createNewLine)

module.exports = router;