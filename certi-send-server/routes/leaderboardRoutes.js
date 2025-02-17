const express = require("express");
const auth = require("../middleware/auth");
//const  restrictTo  = require("../middleware/auth");
const leaderboardController = require("../controllers/leaderboardController");

const router = express.Router({ mergeParams: true });

// Protect all routes after this middleware
router.use(auth);

// Event-specific leaderboard routes
router
  .route("/")
  .get(leaderboardController.getEventLeaderboard)
  .post(
    //restrictTo("organizer", "admin"),
    leaderboardController.setEventId,
    leaderboardController.createLeaderboard
  )
  .patch(
    //restrictTo("organizer", "admin"),
    leaderboardController.setEventId,
    leaderboardController.updateLeaderboard
  );

router.post(
  "/publish",
  //restrictTo('organizer', 'admin'),
  leaderboardController.publishLeaderboard
);

router.get("/export", leaderboardController.exportLeaderboard);

// Admin-only routes
//router.use(restrictTo("admin"));

router.route("/").get(leaderboardController.getAllLeaderboards);

router.route("/:id").delete(leaderboardController.deleteLeaderboard);

module.exports = router;
