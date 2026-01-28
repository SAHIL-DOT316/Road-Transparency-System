const express = require("express");
const router = express.Router();
const Road = require("../models/Road");
const Contractor = require("../models/Contractor");
const Review = require("../models/Review");
const RoadPhoto = require("../models/RoadPhoto");
const updateRoadRating = require("../utils/updateRoadRating"); 
/* ================= HOME: ROADS ================= */
router.get("/", async (req, res) => {
  try {
    const roads = await Road.find()
      .populate("contractor", "name avgRating")
      .sort({ createdAt: -1 });
   const reviews = await Review.find();
    res.render("roads", { roads , reviews});
  } catch (err) {
    res.status(500).send("Server error");
  }
});

router.get("/add-contractor", (req, res) => {
  res.render("addContractor", {
    message: null,
    error: null
  });
});
/* ================= CONTRACTOR LEADERBOARD ================= */
router.get("/contractors", async (req, res) => {
  try {
    const contractors = await Contractor.find()
      .sort({ avgRating: -1 })
      .select("name avgRating totalRoads isBlacklisted");

    res.render("contractors", { contractors });
  } catch (err) {
    res.status(500).send("Server error");
  }
});

/* ================= ADD ROAD PAGE ================= */
router.get("/add-road", async (req, res) => {
  try {
    const contractors = await Contractor.find();
    res.render("addRoad", {
      contractors,
      message: null,
      error: null
    });
  } catch (err) {
    res.status(500).send("Server error");
  }
});


// View all reviews of one road
router.get("/roads/:id", async (req, res) => {
  try {
    const road = await Road.findById(req.params.id)
      .populate("contractor");  // contractor name for display

    if (!road) return res.status(404).send("Road not found");

    const roadPhotos = await RoadPhoto.find({ road: road._id });
    const reviews = await Review.find({ road: road._id })
      .populate({ path: "photoId", select: "photo uploadedBy" })
      .sort({ createdAt: -1 });
  
await updateRoadRating(road._id);
    res.render("roadDetails", { road, roadPhotos, reviews });
  } catch (err) {
    console.error(err);
    res.status(500).send(err.message);
  }
});

module.exports = router;
