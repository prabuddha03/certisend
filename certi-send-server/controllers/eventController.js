const Event = require("../models/Event");
const factory = require("../utils/handlerFactory");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const CacheService = require("../services/cacheService");
const Participant = require("../models/Participant");
const Team = require("../models/Team");
//const SubEvent = require("../models/SubEvent");
const multer = require("multer");
const { uploadToS3, deleteFromS3 } = require("../utils/s3");

// Basic CRUD operations using factory functions

exports.getAllEvents = factory.getAll(Event);

const clearEventCache = async (eventId) => {
  try {
    // Clear specific event cache
    await CacheService.del(`event:${eventId}`);

    // Clear popular events cache
    await CacheService.del("events:popular");

    // Clear all events list cache
    await CacheService.del("events:all");

    // Clear local cache
    CacheService.clearLocalCache();

    console.log(`Cleared all caches for event ${eventId}`);
  } catch (error) {
    console.error("Cache clear error:", error);
  }
};

// Configure multer for memory storage
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

// Middleware to handle multiple file uploads
exports.uploadEventImages = upload.fields([
  { name: "logo", maxCount: 1 },
  { name: "banner", maxCount: 1 },
]);

exports.createEvent = catchAsync(async (req, res, next) => {
  let eventData;

  // Check if the request is multipart/form-data (initial creation)
  if (req.files) {
    // Parse the event data from the form
    eventData = JSON.parse(req.body.eventData);

    // Handle file uploads to S3
    if (req.files.logo) {
      const logoPath = `events/${Date.now()}-logo-${
        req.files.logo[0].originalname
      }`;
      eventData.logo = await uploadToS3(req.files.logo[0], logoPath);
    }

    if (req.files.banner) {
      const bannerPath = `events/${Date.now()}-banner-${
        req.files.banner[0].originalname
      }`;
      eventData.banner = await uploadToS3(req.files.banner[0], bannerPath);
    }

    // Create a new event
    const event = await Event.create(eventData);
    await clearEventCache(event._id);

    return res.status(201).json({
      status: "success",
      data: { data: event },
    });
  } else {
    // If no files, assume it's an update with JSON data
    eventData = req.body.eventData;

    // Check if an _id is provided for updating
    if (eventData._id) {
      // Update the existing event
      const event = await Event.findByIdAndUpdate(eventData._id, eventData, {
        new: true, // Return the updated document
        runValidators: true, // Validate the updated data
      });

      if (!event) {
        return next(new AppError("No event found with that ID", 404));
      }

      return res.status(200).json({
        status: "success",
        data: { data: event },
      });
    } else {
      return next(new AppError("Event ID is required for updates", 400));
    }
  }
});

exports.deleteEvent = catchAsync(async (req, res, next) => {
  const event = await Event.findByIdAndDelete(req.params.id);

  if (!event) {
    return next(new AppError("No event found with that ID", 404));
  }

  await clearEventCache(event._id);

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.updateEvent = catchAsync(async (req, res, next) => {
  // Similar validations as createEvent
  if (req.body.teamSettings?.enabled) {
    const { min, max } = req.body.teamSettings.size;
    if (min > max) {
      return next(
        new AppError("Minimum team size cannot be greater than maximum", 400)
      );
    }
  }

  if (req.body.registrationSettings?.type === "paid") {
    const { individual, team } = req.body.registrationSettings.fee;

    if (req.body.participationType !== "team" && !individual) {
      return next(
        new AppError(
          "Individual registration fee is required for paid events",
          400
        )
      );
    }

    if (req.body.teamSettings?.enabled && !team) {
      return next(
        new AppError(
          "Team registration fee is required when team participation is enabled",
          400
        )
      );
    }
  }

  const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!event) {
    return next(new AppError("No event found with that ID", 404));
  }

  await clearEventCache(event._id);

  res.status(200).json({
    status: "success",
    data: { data: event },
  });
});

exports.getEvent = catchAsync(async (req, res, next) => {
  const start = Date.now();
  const { id } = req.params;

  // Try to get from cache first
  try {
    // Try to get from cache first
    const cachedEvent = await CacheService.get(`event:${id}`);

    if (cachedEvent) {
      // Increment view count asynchronously
      CacheService.incrementViews(id).catch(console.error);
      console.log(`Cache hit: ${Date.now() - start}ms`); // Log timing

      return res.status(200).json({
        status: "success",
        data: {
          data: cachedEvent,
        },
        fromCache: true,
      });
    }
  } catch (error) {
    console.error("Cache Error:", error);
    // Continue without cache
  }

  // If not in cache, get from database
  const event = await Event.findById(id);

  if (!event) {
    return next(new AppError("Event not found", 404));
  }

  // Cache the event
  Promise.all([
    CacheService.set(`event:${id}`, event),
    CacheService.incrementViews(id),
  ]).catch(console.error);

  console.log(`Database hit: ${Date.now() - start}ms`);

  res.status(200).json({
    status: "success",
    data: {
      data: event,
    },
  });
});

// Add new method for popular events
exports.getPopularEvents = catchAsync(async (req, res) => {
  const popularEventIds = await CacheService.getPopularEvents();

  // Sort by views and get top 10
  const topEvents = popularEventIds
    .sort((a, b) => b.views - a.views)
    .slice(0, 10);

  // Get event details for top events
  const events = await Event.find({
    _id: { $in: topEvents.map((e) => e.eventId) },
  });

  res.status(200).json({
    success: true,
    data: events.map((event) => ({
      ...event.toObject(),
      views: popularEventIds.find((e) => e.eventId === event.id.toString())
        .views,
    })),
  });
});

// Custom getEvents function to only return events for the current organizer
exports.getEvents = async (req, res) => {
  try {
    // Get the organizer ID from the authenticated user
    const organizerId = req.user._id;

    // Find all events for this organizer
    const events = await Event.find({ organizerId });

    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({
      success: false,
      error: "Server Error",
    });
  }
};

// Custom controller methods for specific event operations
exports.updateEventStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { isPublic, status } = req.body;

    const updateData = {};

    // When publishing an event
    if (isPublic === true) {
      updateData.isPublic = true;
      updateData.status = "registration_open"; // Automatically set status when publishing
    } else {
      // For other status updates
      if (isPublic !== undefined) {
        updateData.isPublic = isPublic;
      }
      if (status) {
        updateData.status = status;
      }
    }

    const event = await Event.findByIdAndUpdate(id, updateData, { new: true });
    await clearEventCache(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    res.json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("Error updating event status:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update event status",
    });
  }
};

exports.updateRegistrationForm = catchAsync(async (req, res, next) => {
  const event = await Event.findOne({
    _id: req.params.id,
    organizerId: req.user.id,
  });

  if (!event) {
    return next(new AppError("Event not found", 404));
  }

  event.registrationForm = req.body.registrationForm;
  await event.save();

  res.status(200).json({
    status: "success",
    data: {
      data: event,
    },
  });
});

exports.updateCertificateTemplate = catchAsync(async (req, res, next) => {
  const event = await Event.findOne({
    _id: req.params.id,
    organizerId: req.user.id,
  });

  if (!event) {
    return next(new AppError("Event not found", 404));
  }

  event.certificateTemplate = req.body.certificateTemplate;
  await event.save();

  res.status(200).json({
    status: "success",
    data: {
      data: event,
    },
  });
});

exports.getEventStats = catchAsync(async (req, res, next) => {
  const event = await Event.findOne({
    _id: req.params.id,
    organizerId: req.user.id,
  });

  if (!event) {
    return next(new AppError("Event not found", 404));
  }

  // Get participant stats from Participant model
  const stats = await Participant.aggregate([
    {
      $match: { eventId: event._id },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      data: {
        event,
        stats,
      },
    },
  });
});

// Add middleware to check if user is organizer before any event operation
exports.checkIsOrganizer = catchAsync(async (req, res, next) => {
  if (req.user.role !== "organizer") {
    return next(
      new AppError("You do not have permission to perform this action", 403)
    );
  }
  next();
});

exports.toggleEventPrivacy = catchAsync(async (req, res, next) => {
  const { eventId } = req.params;
  const { isPublic } = req.body;

  // Validate that the event exists and belongs to the organizer
  const event = await Event.findOne({
    _id: eventId,
    organizerId: req.user._id,
  });

  if (!event) {
    return next(new AppError("Event not found", 400));
  }

  // Update the event's privacy status
  event.isPublic = isPublic;
  await event.save();
  await clearEventCache(event._id);

  res.status(200).json({
    status: "success",
    message: `Event is now ${isPublic ? "public" : "private"}`,
    data: {
      data: event,
    },
  });
});

// Get event participation list
exports.getEventParticipation = catchAsync(async (req, res, next) => {
  const { eventId } = req.params;

  // Get individual participants
  const participants = await Participant.find({ eventId })
    .select("name email phone status registrationNumber teamId")
    .lean();

  // Get teams if enabled
  const event = await Event.findById(eventId);
  let teams = [];

  if (event.teamSettings?.enabled) {
    teams = await Team.find({ eventId })
      .populate("members", "name email phone status registrationNumber")
      .populate("teamLeaderId", "name email")
      .select("name status members teamLeaderId")
      .lean();
  }

  res.status(200).json({
    status: "success",
    data: {
      event: {
        name: event.name,
        type: event.eventType,
      },
      participants: {
        individual: participants.filter((p) => !p.teamId),
        teams,
        total: participants.length,
      },
    },
  });
});

