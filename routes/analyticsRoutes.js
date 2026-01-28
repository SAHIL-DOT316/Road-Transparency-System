const express = require("express");
const router = express.Router();
const analyticsController = require("../controllers/analyticsController");
const { isLoggedIn, isAdmin } = require("../middleware/auth");

router.get("/roads", isLoggedIn, isAdmin, analyticsController.topDamagedRoads);

module.exports = router;
