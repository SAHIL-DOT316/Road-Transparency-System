const express = require("express");
const router = express.Router();

const upload = require("../config/cloudinaryStorage");
const uploadReview = require("../config/cloudinaryStorage");
const RoadPhoto = require("../models/RoadPhoto");
const Road = require("../models/Road");
const Contractor = require("../models/Contractor");
const Review = require("../models/Review");
const getDistanceInMeters = require("../utils/distance");
const cloudinary = require("../config/cloudinary");
const {isPublic,isLoggedIn, isOfficer } = require("../middleware/auth");


/* OFFICER ROAD PHOTO UPLOAD */
router.post("/add",isLoggedIn, isOfficer,upload.single("photo"), async (req, res) => {
  try {
    
    const { roadId, status,lat ,lng } = req.body;
    if (!req.file) throw new Error("Photo required");
     

    if (!lat || !lng) return res.send("Location required");

  const road1 = await Road.findById(roadId);

  const dist = getDistanceInMeters(
    lat, lng,
    road1.geo.lat, road1.geo.lng
  );

  if (dist > 10000000)
    return res.send("You are too far from road");
    const road = await Road.findById(roadId).populate("contractor");
    if (!road) throw new Error("Road not found");

    // Delete previous officer photos with DIFFERENT status
    const oldPhotos = await RoadPhoto.find({
      road: roadId,
      uploadedBy: "OFFICER",
      status: { $ne: status }
    });

    for (const p of oldPhotos) {
  if (p.cloudinaryId) {
    await cloudinary.uploader.destroy(p.cloudinaryId);
  }
  await p.deleteOne();
}


    // Save new officer photo
    const newPhoto = await RoadPhoto.create({
      road: roadId,
      status,
      uploadedBy: "OFFICER",
      photo: req.file.path || req.file.secure_url,
      cloudinaryId: req.file.public_id, 
      location: { lat, lng }
    });

    // Update road status
    road.status = status;
    await road.save();

    // Apply penalty if DAMAGED
    if (status === "DAMAGED") {
      const warrantyEnd = new Date(road.createdAt);
      warrantyEnd.setFullYear(warrantyEnd.getFullYear() + road.warrantyYears);

      if (new Date() <= warrantyEnd) {
        road.contractor.penaltyPoints += 10;
        if (road.contractor.penaltyPoints >= 50) {
          road.contractor.isBlacklisted = true;
        }
        await road.contractor.save();
      }
    }

    res.redirect(`/roads/${roadId}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Upload failed: " + err.message);
  }
});

/* PUBLIC REVIEW PHOTO UPLOAD */
router.post("/public/add",isLoggedIn,isPublic, uploadReview.single("photo"), async (req, res) => {
  try {
    const { roadId, rating, comment, lat, lng } = req.body;

    // 1️⃣ Fetch road with contractor
    const road = await Road.findById(roadId).populate("contractor");
    if (!road) return res.send("Road not found");

    // 2️⃣ Distance validation
    const dist = getDistanceInMeters(
      lat, lng,
      road.geo.lat, road.geo.lng
    );

    if (dist > 100000000)
      return res.send("You are not near this road");

    // 3️⃣ Save public photo (optional)
    console.log("USER ", req.session.user.name);
    const publicPhoto = req.file
      ? await RoadPhoto.create({
          road: roadId,
          uploadedBy: "PUBLIC",
     userName: req.session.user.name,
         photo: req.file.path || req.file.secure_url,
          cloudinaryId: req.file.public_id,
          location: { lat, lng }
        })
      : null;

    // 4️⃣ Create review WITH contractor
    console.log("USER ", req.session.user);
    await Review.create({
      road: roadId,
      contractor: road.contractor._id, //  FIX
      rating: Number(rating),
      comment,
      userId: String(req.session.user.id),
      userName: req.session.user.name,
      isAnonymous: req.body.isAnonymous === "true",
      photoId: publicPhoto ? publicPhoto._id : null,
      location: { lat, lng }
    });

    res.redirect(`/roads/${roadId}`);
  } catch (err) {
    if (err.code === 11000) {
    return res.send("You have already reviewed this road.");
  }
    res.status(500).send(err.message);
  }
});

module.exports = router;
