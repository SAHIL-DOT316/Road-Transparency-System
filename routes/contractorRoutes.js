const express = require("express");
const router = express.Router();
const {
  addContractor,
  getContractorLeaderboard
} = require("../controllers/contractorController");

// Add contractor
router.post("/add", addContractor);

// Contractor leaderboard
router.get("/leaderboard", getContractorLeaderboard);

module.exports = router;
