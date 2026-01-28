const express = require("express");
const router = express.Router();

const Road = require("../models/Road");
const Contractor = require("../models/Contractor");
const Review = require("../models/Review");
const bcrypt = require("bcryptjs");
const User = require("../models/User");
const { isLoggedIn,  isAdmin } = require("../middleware/auth");
router.get("/dashboard", isLoggedIn,isAdmin, async (req, res) => {
  try {
    const totalRoads = await Road.countDocuments();
    const damagedRoads = await Road.countDocuments({ status: "DAMAGED" });
    const totalContractors = await Contractor.countDocuments();
    const totalReviews = await Review.countDocuments();

    // 🔥 Aggregated contractor leaderboard
    const contractors = await Review.aggregate([
      {
        $group: {
          _id: "$contractor",
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "contractors",
          localField: "_id",
          foreignField: "_id",
          as: "contractor"
        }
      },
      { $unwind: "$contractor" },
      {
        $lookup: {
          from: "roads",
          localField: "_id",
          foreignField: "contractor",
          as: "roads"
        }
      },
      {
        $project: {
          _id: "$contractor._id",
          name: "$contractor.name",
          avgRating: { $round: ["$avgRating", 1] },
          totalReviews: 1,
          totalRoads: { $size: "$roads" },
          penaltyPoints: "$contractor.penaltyPoints",
          isBlacklisted: "$contractor.isBlacklisted"
        }
      },
      { $sort: { avgRating: -1, penaltyPoints: 1 } }
    ]);

    // Chart data
    const chartData = {
      contractorNames: contractors.map(c => c.name),
      contractorRatings: contractors.map(c => c.avgRating),
      contractorPenalties: contractors.map(c => c.penaltyPoints)
    };

    res.render("adminDashboard", {
      stats: {
        totalRoads,
        damagedRoads,
        totalContractors,
        totalReviews
      },
      contractors,
      chartData
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});
router.get("/contractor/:id", async (req, res) => {
  try {
    const contractorId = req.params.id;

    // 🔹 Contractor basic info
    const contractor = await Contractor.findById(contractorId);
    if (!contractor) return res.send("Contractor not found");

    // 🔹 Roads with review aggregation
    const roads = await Road.aggregate([
      { $match: { contractor: contractor._id } },
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "road",
          as: "reviews"
        }
      },
      {
        $addFields: {
          reviewCount: { $size: "$reviews" },
          avgRating: {
            $cond: [
              { $gt: [{ $size: "$reviews" }, 0] },
              { $avg: "$reviews.rating" },
              0
            ]
          }
        }
      }
    ]);

    // 🔹 Contractor average rating (derived from reviews)
    const contractorStats = await Review.aggregate([
      { $match: { contractor: contractor._id } },
      {
        $group: {
          _id: "$contractor",
          avgRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 }
        }
      }
    ]);

    contractor.avgRating =
      contractorStats.length > 0 ? contractorStats[0].avgRating : 0;

    res.render("contractorDetail", {
      contractor,
      roads
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading contractor details");
  }
});
router.post("/contractor/:id/blacklist",isLoggedIn,  isAdmin, async (req, res) => {
  const contractorId = req.params.id;

  await Contractor.findByIdAndUpdate(contractorId, {
    isBlacklisted: true
  });

  res.redirect(`/admin/contractor/${contractorId}`);
});

router.post("/contractor/:id/unblacklist",isLoggedIn,  isAdmin, async (req, res) => {
  try {
    const contractorId = req.params.id;

    await Contractor.findByIdAndUpdate(contractorId, {
      isBlacklisted: false
    });

    res.redirect(`/admin/contractor/${contractorId}`);
  } catch (err) {
    res.status(500).send("Failed to un-blacklist contractor");
  }
});
router.get("/create--user", isLoggedIn, isAdmin, (req, res) => {
  res.render("admin/create--user");
});

/* HANDLE CREATE */
router.post("/create--user", isLoggedIn, isAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!["officer", "contractor"].includes(role)) {
      return res.status(400).send("Invalid role");
    }

    const exists = await User.findOne({ email });
    if (exists) return res.send("User already exists");

    const hashed = await bcrypt.hash(password, 10);

    await User.create({
      name,
      email,
      password: hashed,
      role,
       mustChangePassword: true

    });

    res.redirect("/admin/dashboard");
  } catch (err) {
    console.error(err);
    res.status(500).send("Failed to create user");
  }
});
module.exports = router;
