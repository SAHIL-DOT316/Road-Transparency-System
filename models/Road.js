const mongoose = require("mongoose");

const roadSchema = new mongoose.Schema({
  location: { type: String, required: true },

  geo: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },

  contractor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Contractor",
    required: true
  },

  cost: Number,
  warrantyYears: Number,

  status: {
    type: String,
    enum: ["UNDER_CONSTRUCTION", "COMPLETED", "DAMAGED"],
    default: "UNDER_CONSTRUCTION"
  },

  avgRating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 }

}, { timestamps: true });

module.exports = mongoose.model("Road", roadSchema);
