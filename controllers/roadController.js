const Road = require("../models/Road");
const Contractor = require("../models/Contractor");

/* ================= ADD ROAD ================= */
exports.addRoad = async (req, res) => {
  console.log(req.body);

  try {
    const { location,lat, lng, contractorId, cost, warrantyYears } = req.body;
    if (!location || !lat || !lng) return res.send("Location required");
    const contractor = await Contractor.findById(contractorId);
    if (!contractor) throw new Error("Contractor not found");

    // 🚫 Block blacklisted contractors
    if (contractor.isBlacklisted) {
      throw new Error("This contractor is blacklisted");
    }

    await Road.create({
      location,
      contractor: contractorId,
      cost,
      warrantyYears,
      geo: { lat, lng }
    });

    contractor.totalRoads += 1;
    await contractor.save();

    const contractors = await Contractor.find();
    res.render("addRoad", {
      contractors,
      message: "Road added successfully!",
      error: null
    });

  } catch (err) {
    const contractors = await Contractor.find();
    res.render("addRoad", {
      contractors,
      message: null,
      error: err.message
    });
  }
};

/* ================= DASHBOARD ================= */
/* ================= DASHBOARD ================= */
exports.getAllRoads = async (req, res) => {
  try {
    const { search } = req.query;

    let filter = {};
    if (search) {
      filter.location = { $regex: search, $options: "i" };
    }

    const roads = await Road.find(filter)
      .populate("contractor", "name avgRating isBlacklisted")
      .sort({ createdAt: -1 });

    res.render("roads", { 
      roads,
      search 
    });

  } catch (error) {
    res.status(500).send("Server Error");
  }
};


/* ================= UPDATE STATUS ================= */
exports.updateRoadStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // ✅ Allowed values only
    if (!["COMPLETED", "DAMAGED"].includes(status)) {
      return res.status(400).send("Invalid status");
    }

    const road = await Road.findById(req.params.id).populate("contractor");
    if (!road) return res.status(404).send("Road not found");

    road.status = status;

    // 🚨 Warranty penalty logic
    if (status === "DAMAGED") {
      const warrantyEnd = new Date(road.createdAt);
      warrantyEnd.setFullYear(
        warrantyEnd.getFullYear() + road.warrantyYears
      );

      if (new Date() <= warrantyEnd) {
        road.contractor.penaltyPoints += 10;

        if (road.contractor.penaltyPoints >= 50) {
          road.contractor.isBlacklisted = true;
        }

        await road.contractor.save();
      }
    }

    await road.save();
    res.redirect("/");

  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};
