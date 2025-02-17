const express = require("express");
const router = express.Router();
const multer = require("multer");
const certificateController = require("../controllers/certificateController");
const { auth } = require("../middleware/auth");

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

router.use(auth);

router.post(
  "/events/:eventId/certificates/create",
  certificateController.createCertificates
);

// Public route - for participants to claim certificates
router.post(
  "/certificates/verify",
  certificateClaimController.verifyCertificateEligibility
);

router.post(
  "/:eventId/certificates/templates",
  auth,
  upload.single("image"),
  certificateController.uploadTemplate
);

router
  .route("/events/:eventId/certificates/templates")
  .get(certificateController.getTemplates)
  .post(upload.single("image"), certificateController.uploadTemplate);

router
  .route("/events/:eventId/certificates/templates/config")
  .post(certificateController.saveTemplate);

router
  .route("/events/:eventId/participants/:participantId/certificates")
  .post(certificateController.generateCertificate);

// Bulk certificate issuance routes
router.get(
  "/events/:eventId/participants/attended/count",

  certificateController.getAttendedParticipantsCount
);

router.post(
  "/events/:eventId/certificates/issue-batch",

  certificateController.issueCertificatesInBatch
);

module.exports = router;
