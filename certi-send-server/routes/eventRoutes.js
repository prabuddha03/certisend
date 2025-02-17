const express = require("express");
const router = express.Router();
const multer = require("multer");
const eventController = require("../controllers/eventController");
const certificateController = require("../controllers/certificateController");
const certificateClaimController = require("../controllers/certificateClaimController");
const participantRoutes = require("./participantRoutes");
const leaderboardRoutes = require("./leaderboardRoutes");
const auth = require("../middleware/auth");
const { cacheMiddleware } = require("../middleware/cacheMiddleware");


// Multer configuration for certificate template uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Not an image! Please upload only images."), false);
    }
  },
});

// Public routes
router.get("/", cacheMiddleware(200), eventController.getAllEvents);
router.get("/popular", cacheMiddleware(3600), eventController.getPopularEvents);
router.get("/:id", eventController.getEvent);

// Mount participant routes for each event
router.use("/:eventId/register", participantRoutes);
router.use("/:eventId/participants", participantRoutes);

// Mount leaderboard routes
router.use("/:eventId/leaderboard", leaderboardRoutes);
router.get("/popular", eventController.getPopularEvents);

// Certificate verification (public route)
router.post(
  "/certificates/verify",
  certificateClaimController.verifyCertificateEligibility
);
router.post(
  "/:eventId/certificates/check",
  certificateController.checkCertificate
);

// Protected routes
router.use(auth);

router.patch("/:eventId/toggle-privacy", eventController.toggleEventPrivacy);

// Event management routes
router.get("/organizer/list", eventController.getEvents);
router
  .route("/")
  .patch(eventController.uploadEventImages, eventController.createEvent);
router.patch("/:id/status", eventController.updateEventStatus);
router.patch("/:id", eventController.updateEvent);
router.delete("/:id", eventController.deleteEvent);

router.get(
  "/events/:eventId/participants/attended/count",
  certificateController.getAttendedParticipantsCount
);

// Certificate management routes
router
  .route("/:eventId/certificates/templates")
  .get(certificateController.getTemplates)
  .post(upload.single("image"), certificateController.uploadTemplate);

// Type-specific template operations
router
  .route("/:eventId/certificates/templates/:type")
  .get(certificateController.getTemplateByType)
  .patch(upload.single("image"), certificateController.updateTemplateByType)
  .delete(certificateController.deleteTemplateByType);

// Certificate generation routes
router.post(
  "/:eventId/certificates/create",
  certificateController.createCertificates
);

router.post(
  "/:eventId/participants/:participantId/certificates",
  certificateController.generateCertificate
);

// Add these new routes
router.get(
  "/:eventId/participants/attended/count",

  certificateController.getAttendedParticipantsCount
);

router.post(
  "/:eventId/certificates/issue-batch",

  certificateController.issueCertificatesInBatch
);

// Get event participation list (including teams)
router.get(
  "/:eventId/participation",
  auth,
  cacheMiddleware(300), // Cache for 5 minutes
  eventController.getEventParticipation
);


module.exports = router;
