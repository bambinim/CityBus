const express = require("express");
const {allowedRoles} = require("../middleware/security");
const router = express.Router();
const linesController = require('../controllers/linesControllers')


router.post('/', allowedRoles(['admin']), linesController.createNewLine)
router.get('/', allowedRoles(['admin', 'user', 'driver']), linesController.getBusLines)
router.delete('/:id', allowedRoles(['admin']), linesController.deleteBusLine)
router.get('/:id/complete', allowedRoles(['admin', 'user', 'driver']), linesController.getCompleteBusLinesInfo)
router.put('/:id', allowedRoles(['admin']), linesController.editBusLine)

module.exports = router;