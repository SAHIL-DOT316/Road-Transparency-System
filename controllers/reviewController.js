const Review = require("../models/Review");
const Road = require("../models/Road");
const Contractor = require("../models/Contractor");
const updateContractorRating = require("../utils/updateContractorRating");
const updateRoadRating = require("../utils/updateRoadRating");
const cloudinary = require("../config/cloudinary");
exports.addReview = async (req, res) => {
  try {
    const { roadId, rating, comment, userId, lat, lng } = req.body;

    // 1️⃣ Fetch road
    const road = await Road.findById(roadId).populate("contractor");
    if (!road) throw new Error("Road not found");
console.log("USER ", req.session.user);
    // 2️⃣ Create review
    await Review.create({
      road: roadId,
      contractor: road.contractor._id,
      rating: Number(rating),
      comment,
      userId: String(req.session.user.id),
      userName: req.session.user.name,
      isAnonymous: req.body.isAnonymous === "true",
      location: { lat, lng }
    });

    // 3️⃣ Update road and contractor ratings
    await updateRoadRating(roadId);            // important: wait for update
    await updateContractorRating(road.contractor._id);

    res.redirect(`/roads/${roadId}`);          // reload road detail
  } catch (err) {
  if (err.code === 11000) {
    return res.send("You have already reviewed this road.");
  }
  res.status(500).send(err.message);
}
};
exports.editReviewForm = async (req, res) => {
  const review = await Review.findById(req.params.id);

  if (!review || review.userId !== String(req.session.user.id)) {
    return res.status(403).send("Unauthorized");
  }

  res.render("reviews/edit", { review });
};

exports.editReview=async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.send("Review not found");

  if (review.userId !== req.session.user.id) {
    return res.status(403).send("Access denied");
  }

  review.rating = req.body.rating;
  review.comment = req.body.comment;
  await review.save();

  res.redirect(`/roads/${review.road}`);
};
exports.deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) return res.status(404).send("Review not found");

    const isOwner =
      review.userId.toString() === req.session.user.id.toString();

    const isAdmin = req.session.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).send("Not authorized to delete this review");
    }
if (review.photoId?.cloudinaryId) {
      await cloudinary.uploader.destroy(review.photoId.cloudinaryId);
      await review.photoId.deleteOne();
    }

    await review.deleteOne();

     res.redirect(`/roads/${review.road}`);
  } catch (err) {
    console.error(err);
    res.status(500).send("Delete failed");
  }
};