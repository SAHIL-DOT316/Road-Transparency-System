const express = require("express");
const router = express.Router();
const roadController = require("../controllers/roadController");
const { isLoggedIn, isOfficer, isAdmin } = require("../middleware/auth");



router.post("/add", isLoggedIn, isAdmin, roadController.addRoad);

router.get("/", roadController.getAllRoads);

// NEW: update road status
router.post("/:id/status", roadController.updateRoadStatus);

module.exports = router;

