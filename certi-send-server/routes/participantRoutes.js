const express = require("express");
const router = express.Router({ mergeParams: true });
const participantController = require("../controllers/participantController");
const auth = require("../middleware/auth");

// Public routes
router.post("/", participantController.register); // Changed from /register to just /
router.post("/batch", participantController.batchRegister); // Batch registration

// Protected routes for organizers
router.use(auth);
router.post("/import", 
  //auth.restrictTo("organizer"), 
  participantController.uploadFile,  // Middleware for file upload
  participantController.batchRegister // Reuse same batch function
);

// Protected routes for organizers
router.use(auth);
//router.use(auth.restrictTo("organizer"));

router.get("/", participantController.getEventParticipants);
router.get("/:id", participantController.getParticipant);
router.patch("/:id", participantController.updateParticipant);
router.delete("/:id", participantController.deleteParticipant);
router.post("/verify-check-in", participantController.verifyAndCheckIn);
router.patch("/:id/mark-attended", participantController.markAttended);
router.post("/attend-with-qr", participantController.attendWithQR);
//router.get("/check-in-stats", participantController.getCheckInStats);

module.exports = router;
