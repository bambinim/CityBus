const express = require("express");
const {allowedRoles} = require("../middleware/security");

const router = express.Router();

router.get("/test", allowedRoles(["admin"]), (req, res) => {
    res.send({message: "User authenticated"});
})

module.exports = router;