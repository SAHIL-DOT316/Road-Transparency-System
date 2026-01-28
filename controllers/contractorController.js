const Contractor = require("../models/Contractor");

/* ========== ADD CONTRACTOR ========== */
exports.addContractor = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) throw new Error("Contractor name is required");

    await Contractor.create({ name });

    res.render("addContractor", {
      message: "Contractor added successfully!",
      error: null
    });
  } catch (err) {
    res.render("addContractor", {
      message: null,
      error: err.message
    });
  }
};

/* ========== CONTRACTOR LEADERBOARD ========== */
exports.getContractorLeaderboard = async (req, res) => {
  try {
    const contractors = await Contractor.find()
      .sort({ avgRating: -1, penaltyPoints: 1 })
      .select("name avgRating totalRoads penaltyPoints isBlacklisted");
      
    // ✅ Render EJS instead of JSON
    res.render("contractors", { contractors });

  } catch (error) {
    res.status(500).send("Server error");
  }
};
