const Road = require("../models/Road");

exports.topDamagedRoads = async (req, res) => {
  try {
    const damagedRoads = await Road.find({ status: "DAMAGED" })
      .sort({ reviewCount: -1 })   // most complained first
      .limit(10)
      .populate("contractor", "name");

    // Prepare data for chart
    const labels = damagedRoads.map(r => r.location);
    const data = damagedRoads.map(r => r.reviewCount || 0);

    res.render("analytics/roads", {
      roads: damagedRoads,
      labels: JSON.stringify(labels),
      data: JSON.stringify(data)
    });

  } catch (err) {
    console.error(err);
    res.status(500).send("Analytics Error");
  }
};
