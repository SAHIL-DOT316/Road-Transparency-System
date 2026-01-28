const mongoose = require("mongoose");

const roadPhotoSchema = new mongoose.Schema({
  road: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Road",
    required: true
  },

  uploadedBy: {
    type: String,
    enum: ["OFFICER", "PUBLIC"],
    required: true
  },

  status: String,

  photo: {
    type: String,
    required: true   // ✅ Cloudinary URL
  },

  cloudinaryId: {
    type: String,
    required: true   // ✅ public_id (needed for delete)
  },

  userName: String,

  location: {
    lat: Number,
    lng: Number
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("RoadPhoto", roadPhotoSchema);
