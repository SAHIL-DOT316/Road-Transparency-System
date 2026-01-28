const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  road: { type: mongoose.Schema.Types.ObjectId, ref: "Road", required: true },
  contractor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Contractor",
    required: true
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  comment: String,
 userId: { type: String, required: true },
  userName: {
    type: String 
  },
isAnonymous: { type: Boolean, default: false },
  photoId: { type: mongoose.Schema.Types.ObjectId, ref: "RoadPhoto" }, // optional link to public photo
  location: {
    lat: Number,
    lng: Number
  },
  createdAt: { type: Date, default: Date.now }
});
reviewSchema.index({ road: 1, userId: 1 }, { unique: true });
module.exports = mongoose.model("Review", reviewSchema);
