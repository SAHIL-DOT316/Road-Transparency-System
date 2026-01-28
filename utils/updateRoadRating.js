const Review = require("../models/Review");
const Road = require("../models/Road");

const updateRoadRating = async (roadId) => {
  const agg = await Review.aggregate([
    { $match: { road: roadId } },
    {
      $group: {
        _id: "$road",
        avgRating: { $avg: "$rating" },
        reviewCount: { $sum: 1 }
      }
    }
  ]);

  if (agg.length > 0) {
    await Road.findByIdAndUpdate(roadId, {
      avgRating: agg[0].avgRating,
      reviewCount: agg[0].reviewCount
    });
  } else {
    await Road.findByIdAndUpdate(roadId, {
      avgRating: 0,
      reviewCount: 0
    });
  }
};

module.exports = updateRoadRating;
