const mongoose = require("mongoose");

const contractorSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  totalRoads: {
    type: Number,
    default: 0
  },
  avgRating: {
    type: Number,
    default: 0
  },
  penaltyPoints: {
    type: Number,
    default: 0
  },
  isBlacklisted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});
module.exports = mongoose.model("Contractor", contractorSchema);
