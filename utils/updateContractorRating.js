const Review = require("../models/Review");
const Contractor = require("../models/Contractor");

async function updateContractorRating(contractorId) {
  const stats = await Review.aggregate([
    { $match: { contractor: contractorId } },
    {
      $group: {
        _id: "$contractor",
        avgRating: { $avg: "$rating" },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await Contractor.findByIdAndUpdate(contractorId, {
      avgRating: Number(stats[0].avgRating.toFixed(1)),
      totalReviews: stats[0].totalReviews
    });
  }
}

module.exports = updateContractorRating;
