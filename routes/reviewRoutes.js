const express = require("express");
const router = express.Router();
const upload = require("../config/upload");
const reviewController = require("../controllers/reviewController");
const { isLoggedIn,isPublic } = require("../middleware/auth");
router.post(
  "/add", isLoggedIn,isPublic,
  upload.single("photo"),
  reviewController.addReview
);

router.get("/:id/edit", isLoggedIn, reviewController.editReviewForm);

// Edit review (SUBMIT)
router.post("/:id/edit", isLoggedIn, reviewController.editReview);
router.post("/:id/delete",isLoggedIn, reviewController.deleteReview);

module.exports = router;

