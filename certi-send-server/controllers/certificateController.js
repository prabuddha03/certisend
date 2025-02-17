const CertificateTemplate = require("../models/CertificateTemplate");
const Certificate = require("../models/Certificate");
const Participant = require("../models/Participant");
const { uploadToS3, deleteFromS3 } = require("../utils/s3");
const crypto = require("crypto");
const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const Event = require("../models/Event");
const CacheService = require("../services/cacheService");

const clearCacheAfterCertificateUpdate = async (eventId) => {
  try {
    // Clear event-related caches
    await CacheService.del(`event:${eventId}`);
    await CacheService.del('events:popular');
    await CacheService.del('events:all');
    
    // Clear template-related caches
    await CacheService.del(`event:${eventId}:templates`);
    await CacheService.del(`event:${eventId}:templates:*`);
    
    // Clear certificate-related caches
    await CacheService.del(`event:${eventId}:certificates:*`);
    
    // Force clear local cache
    CacheService.clearLocalCache();
    
    console.log(`🗑️ Cleared all caches for event ${eventId} certificates`);
  } catch (error) {
    console.error('Cache clear error:', error);
  }
};

exports.uploadTemplate = catchAsync(async (req, res, next) => {
  if (!req.file) {
    return next(
      new AppError("Please provide a certificate template image", 400)
    );
  }

  const { eventId } = req.params;
  const { type, config, placeholders } = req.body;

  // Add logging to track multiple calls
  console.log(`Upload request received for event ${eventId}, type ${type}`);

  try {
    const path = `certificates/templates/${eventId}/${type}-${Date.now()}.jpg`;
    const templateUrl = await uploadToS3(req.file, path);

    const template = await CertificateTemplate.create({
      eventId,
      type,
      templateUrl,
      config: JSON.parse(config),
      placeholders: JSON.parse(placeholders),

      isActive: true,
    });

    // Update Event model
    await Event.findByIdAndUpdate(eventId, {
      [`is${type.charAt(0).toUpperCase() + type.slice(1)}Template`]: true,
    });
    await clearCacheAfterCertificateUpdate(eventId);

    res.status(201).json({
      status: "success",
      data: { template },
    });
  } catch (error) {
    console.error("Template upload failed:", error);
    next(new AppError("Failed to upload template", 500));
  }
});

exports.saveTemplate = catchAsync(async (req, res, next) => {
  const { eventId } = req.params;
  const { type, imageUrl, placeholders } = req.body;

  // Deactivate existing template of same type if exists
  await CertificateTemplate.updateMany(
    { eventId, type, isActive: true },
    { isActive: false }
  );

  // Create new template
  const template = await CertificateTemplate.create({
    eventId,
    type,
    imageUrl,
    placeholders,
  });

  await clearCacheAfterCertificateUpdate(eventId);

  res.status(201).json({
    status: "success",
    data: { template },
  });
});

exports.getTemplates = catchAsync(async (req, res, next) => {
  const { eventId } = req.params;

  const templates = await CertificateTemplate.find({
    eventId,
    isActive: true,
  });

  res.status(200).json({
    status: "success",
    data: { templates },
  });
});

exports.generateCertificate = catchAsync(async (req, res, next) => {
  const { eventId, participantId } = req.params;
  const { templateId } = req.body;

  // Check if certificate already exists
  const existingCertificate = await Certificate.findOne({
    eventId,
    participantId,
    templateId,
  });

  if (existingCertificate) {
    return next(
      new AppError("Certificate already generated for this participant", 400)
    );
  }

  // Generate unique hash
  const hash = crypto
    .createHash("sha256")
    .update(`${eventId}${participantId}${Date.now()}`)
    .digest("hex");

  // Create certificate record
  const certificate = await Certificate.create({
    templateId,
    eventId,
    participantId,
    hash,
    validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30), // 30 days
  });

  res.status(201).json({
    status: "success",
    data: { certificate },
  });
});

exports.createCertificates = async (req, res) => {
  try {
    const { eventId, participants } = req.body;

    // Bulk create certificate records
    const certificatesToCreate = participants.map((participant) => ({
      eventId,
      participantId: participant.id,
      recipientData: {
        name: participant.name,
        position: participant.position,
        phone: participant.phone,
      },
      certificateNumber: `CERT-${eventId.slice(-4)}-${Date.now()
        .toString()
        .slice(-6)}`,
      claimCode: crypto.randomBytes(6).toString("hex"),
      status: "pending",
    }));

    await Certificate.insertMany(certificatesToCreate);

    res.json({
      success: true,
      message: `Created ${participants.length} certificate records`,
    });
  } catch (error) {
    console.error("Failed to create certificates:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

exports.deleteTemplate = catchAsync(async (req, res, next) => {
  const { eventId, templateId } = req.params;

  const template = await CertificateTemplate.findById(templateId);
  if (!template) {
    return next(new AppError("Template not found", 404));
  }

  // Delete from S3
  const s3Key = template.templateUrl.split("/").slice(-1)[0];
  await deleteFromS3(`certificates/templates/${eventId}/${s3Key}`);

  // Delete from DB
  await CertificateTemplate.findByIdAndDelete(templateId);

  // Update Event model
  const otherTemplates = await CertificateTemplate.find({
    eventId,
    type: template.type,
    isActive: true,
  });

  if (otherTemplates.length === 0) {
    await Event.findByIdAndUpdate(eventId, {
      [`is${
        template.type.charAt(0).toUpperCase() + template.type.slice(1)
      }Template`]: false,
    });
  }
  await clearCacheAfterCertificateUpdate(eventId);

  res.status(200).json({
    status: "success",
    message: "Template deleted successfully",
  });
});

exports.updateTemplate = catchAsync(async (req, res, next) => {
  const { eventId, templateId } = req.params;

  const oldTemplate = await CertificateTemplate.findById(templateId);
  if (!oldTemplate) {
    return next(new AppError("Template not found", 404));
  }

  // If new image is uploaded
  if (req.file) {
    // Delete old image from S3
    const oldS3Key = oldTemplate.templateUrl.split("/").slice(-1)[0];
    await deleteFromS3(`certificates/templates/${eventId}/${oldS3Key}`);

    // Upload new image
    const path = `certificates/templates/${eventId}/${
      oldTemplate.type
    }-${Date.now()}.jpg`;
    const templateUrl = await uploadToS3(req.file, path);
    req.body.templateUrl = templateUrl;
  }

  // Update template
  const template = await CertificateTemplate.findByIdAndUpdate(
    templateId,
    {
      ...req.body,
      config: req.body.config
        ? JSON.parse(req.body.config)
        : oldTemplate.config,
      placeholders: req.body.placeholders
        ? JSON.parse(req.body.placeholders)
        : oldTemplate.placeholders,
      metadata: req.body.metadata
        ? JSON.parse(req.body.metadata)
        : oldTemplate.metadata,
    },
    { new: true }
  );

  await clearCacheAfterCertificateUpdate(eventId);

  res.status(200).json({
    status: "success",
    data: { template },
  });
});

// Get template by type
exports.getTemplateByType = catchAsync(async (req, res, next) => {
  const { eventId, type } = req.params;

  const template = await CertificateTemplate.findOne({
    eventId,
    type,
    isActive: true,
  });

  if (!template) {
    return next(new AppError("Template not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: { template },
  });
});

// Update template by type
exports.updateTemplateByType = catchAsync(async (req, res, next) => {
  const { eventId, type } = req.params;

  const oldTemplate = await CertificateTemplate.findOne({
    eventId,
    type,
    isActive: true,
  });

  if (!oldTemplate) {
    return next(new AppError("Template not found", 404));
  }

  // If new image is uploaded
  if (req.file) {
    // Delete old image from S3
    const oldS3Key = oldTemplate.templateUrl.split("/").slice(-1)[0];
    await deleteFromS3(`certificates/templates/${eventId}/${oldS3Key}`);

    // Upload new image
    const path = `certificates/templates/${eventId}/${type}-${Date.now()}.jpg`;
    const templateUrl = await uploadToS3(req.file, path);
    req.body.templateUrl = templateUrl;
  }

  // Update template
  const template = await CertificateTemplate.findByIdAndUpdate(
    oldTemplate._id,
    {
      ...req.body,
      config: req.body.config
        ? JSON.parse(req.body.config)
        : oldTemplate.config,
      placeholders: req.body.placeholders
        ? JSON.parse(req.body.placeholders)
        : oldTemplate.placeholders,
      metadata: req.body.metadata
        ? JSON.parse(req.body.metadata)
        : oldTemplate.metadata,
    },
    { new: true }
  );  
  await clearCacheAfterCertificateUpdate(eventId);

  res.status(200).json({
    status: "success",
    data: { template },
  });
});

// Delete template by type
exports.deleteTemplateByType = catchAsync(async (req, res, next) => {
  const { eventId, type } = req.params;

  const template = await CertificateTemplate.findOne({
    eventId,
    type,
    isActive: true,
  });

  if (!template) {
    return next(new AppError("Template not found", 404));
  }

  // Delete from S3
  const s3Key = template.templateUrl.split("/").slice(-1)[0];
  await deleteFromS3(`certificates/templates/${eventId}/${s3Key}`);

  // Delete from DB
  await CertificateTemplate.findByIdAndDelete(template._id);

  // Update Event model
  await Event.findByIdAndUpdate(eventId, {
    [`is${type.charAt(0).toUpperCase() + type.slice(1)}Template`]: false,
  });
  await clearCacheAfterCertificateUpdate(eventId);
  res.status(200).json({
    status: "success",
    message: "Template deleted successfully",
  });
});

// Add these new methods

exports.getAttendedParticipantsCount = catchAsync(async (req, res) => {
  const { eventId } = req.params;

  const count = await Participant.countDocuments({
    eventId,
    status: "attended",
  });

  res.status(200).json({
    status: "success",
    count,
  });
});

exports.issueCertificatesInBatch = catchAsync(async (req, res) => {
  const { eventId } = req.params;
  const { skip, limit } = req.body;

  // Get participants for this batch
  const participants = await Participant.find({
    eventId,
    status: "attended",
  })
    .skip(skip)
    .limit(limit);

  // Get only the participation template
  const template = await CertificateTemplate.findOne({
    eventId,
    type: "participation", // Only get participation template
    isActive: true,
  });

  if (!template) {
    return next(
      new AppError("No active participation certificate template found", 404)
    );
  }

  const certificatesToCreate = [];

  // Create certificate entries for each participant
  for (const participant of participants) {
    // Check if certificate already exists
    const existingCert = await Certificate.findOne({
      eventId,
      participantId: participant._id,
      templateId: template._id,
    });

    if (!existingCert) {
      certificatesToCreate.push({
        eventId,
        participantId: participant._id,
        templateId: template._id,
        recipientData: {
          name: participant.name,
          position: participant.position,
          email: participant.email,
          phone: participant.phone,
          // Add other relevant participant data
        },
        certificateNumber: `CERT-${eventId.slice(-4)}-${Date.now()
          .toString()
          .slice(-6)}`,
        status: "pending",
        issuedAt: new Date(),
      });
    }
  }

  // Bulk insert certificates
  if (certificatesToCreate.length > 0) {
    await Certificate.insertMany(certificatesToCreate);

    // Update event status if this is the last batch
    const remainingCount =
      (await Participant.countDocuments({
        eventId,
        status: "attended",
      })) -
      (skip + participants.length);

    if (remainingCount <= 0) {
      await Event.findByIdAndUpdate(eventId, {
        isCertificatesIssued: true,
      });
    }
  }

  res.status(200).json({
    status: "success",
    processed: participants.length,
  });
});

exports.checkCertificate = catchAsync(async (req, res, next) => {
  const { eventId } = req.params;
  const { phone } = req.body;

  const certificate = await Certificate.findOne({
    eventId,
    "recipientData.phone": phone,
  }).populate({
    path: "templateId",
    model: "CertificateTemplate",
    select: "templateUrl config placeholders type",
  });

  if (!certificate) {
    return res.status(200).json({
      status: "success",
      found: false,
    });
  }

  res.status(200).json({
    status: "success",
    found: true,
    certificate,
  });
});
