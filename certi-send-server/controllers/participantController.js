const Participant = require("../models/Participant");
const Event = require("../models/Event");
const factory = require("../utils/handlerFactory");
const catchAsync = require("../utils/catchAsync");
const AppError = require("../utils/appError");
const crypto = require("crypto");
const axios = require("axios");
const multer = require("multer");
const CacheService = require("../services/cacheService");

exports.getAllParticipants = factory.getAll(Participant);
exports.getParticipant = factory.getOne(Participant);
exports.updateParticipant = factory.updateOne(Participant);
exports.deleteParticipant = factory.deleteOne(Participant);

const clearParticipantCache = async (eventId) => {
  try {
    const keys = await CacheService.keys(`event:${eventId}:participants:*`);
    if (keys.length > 0) {
      await Promise.all(keys.map(key => CacheService.del(key)));
    }
    CacheService.clearLocalCache();
  } catch (error) {
    console.error('Cache clear error:', error);
  }
};
// Helper function for email notification
const sendRegistrationEmail = async (participant, event) => {
  try {
    const emailServiceUrl = process.env.REGISTER_MAIL_API;
    console.log("Attempting to send email to:", emailServiceUrl);

    const emailData = {
      participant: {
        qrCode: {
          code: participant.qrCode.code,
        },
        _id: participant._id,
        eventId: participant.eventId,
        name: participant.name,
        email: participant.email,
        registrationNumber: participant.registrationNumber,
      },
      event: {
        name: event.name,
        eventDate: event.eventDate,
        venue: event.venue,
      },
      emailTemplate: {
        number: 2,
        hasQR: true,
        withCalendarInvite: true
      }
    };

    console.log("Email payload:", JSON.stringify(emailData, null, 2));

    // Fire and forget - don't await the response
    axios
      .post(emailServiceUrl, emailData)
      .catch((error) => {
        // Log error but don't throw - this is async
        console.error("Failed to send registration email:", {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message,
        });
      });
  } catch (error) {
    // Log but don't throw - main flow shouldn't be affected
    console.error("Error in email notification service:", error);
  }
};
exports.uploadFile = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv" || file.mimetype.includes("spreadsheet")) {
      cb(null, true);
    } else {
      cb(new AppError("Please upload a CSV or Excel file", 400), false);
    }
  },
}).single("file");

// Register for an event
exports.register = catchAsync(async (req, res, next) => {
  // Get the event first
  const event = await Event.findById(req.params.eventId);
  if (!event) {
    return next(new AppError("Event not found", 404));
  }

  // Check if registration is open
  if (event.status !== "registration_open") {
    return next(new AppError("Registration is not open for this event", 400));
  }

  // Check registration deadline
  if (event.settings?.registrationDeadline) {
    const deadline = new Date(event.settings.registrationDeadline);
    if (deadline < new Date()) {
      return next(new AppError("Registration deadline has passed", 400));
    }
  }

  // Check if event is full
  const participantCount = await Participant.countDocuments({
    eventId: event._id,
  });
  if (
    event.settings?.maxParticipants &&
    participantCount >= event.settings.maxParticipants &&
    !event.settings.allowWaitlist
  ) {
    return next(new AppError("Event is full", 400));
  }

  // Create the participant
  const participant = await Participant.create({
    eventId: event._id,
    ...req.body,
    registrationData: new Map(Object.entries(req.body.registrationData || {})),
  });

  // Send registration email asynchronously
  sendRegistrationEmail(participant, event);

  // Send response immediately without waiting for email
  res.status(201).json({
    status: "success",
    data: {
      participant,
    },
  });

});

exports.batchRegister = catchAsync(async (req, res, next) => {
  const { eventId } = req.params;
  let participants;

  // Handle file upload case
  if (req.file) {
    participants = await parseFile(req.file);
  } else {
    participants = req.body.participants;
  }

  // Validate participants data
  if (!Array.isArray(participants) || participants.length === 0) {
    return next(new AppError("Invalid participants data", 400));
  }

  // Validate event and check capacity
  const event = await Event.findById(eventId).select(
    "status settings.maxParticipants"
  );
  if (!event) {
    return next(new AppError("Event not found", 404));
  }

  if (event.status !== "registration_open") {
    return next(new AppError("Event registration is closed", 400));
  }

  const currentCount = await Participant.countDocuments({ eventId });
  if (
    event.settings?.maxParticipants &&
    currentCount + participants.length > event.settings.maxParticipants
  ) {
    return next(new AppError("Event capacity would be exceeded", 400));
  }

  try {
    // Use the batch registration from Participant model
    const result = await Participant.batchRegister(eventId, participants);

    res.status(201).json({
      success: true,
      message: `Successfully registered ${result.insertedCount} participants`,
      data: {
        registered: result.insertedCount,
        failed: participants.length - result.insertedCount,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      return next(new AppError("Duplicate registrations detected", 400));
    }
    throw error;
  }
});

// Helper function to parse files
async function parseFile(file) {
  if (file.mimetype === "text/csv") {
    return parseCSV(file.buffer);
  } else {
    return parseExcel(file.buffer);
  }
}
function parseExcel(buffer) {
  const workbook = xlsx.read(buffer);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = xlsx.utils.sheet_to_json(sheet);
  return data.map(formatParticipantData);
}

function formatParticipantData(data) {
  return {
    name: data.name,
    email: data.email,
    phone: data.phone,
    registrationData: Object.entries(data)
      .filter(([key]) => !["name", "email", "phone"].includes(key))
      .reduce((acc, [key, value]) => {
        acc[key] = value;
        return acc;
      }, {}),
  };
}

// Verify and check-in participant using QR code
exports.verifyAndCheckIn = catchAsync(async (req, res, next) => {
  const { verificationString, registrationNumber } = req.body;

  let participant;

  // Try to find participant by verification string first
  if (verificationString) {
    participant = await Participant.findOne({
      "qrCode.code": verificationString,
      eventId: req.params.eventId,
    });
  }

  // If not found and registration number provided, try that
  if (!participant && registrationNumber) {
    participant = await Participant.findOne({
      registrationNumber,
      eventId: req.params.eventId,
    });
  }

  if (!participant) {
    return next(
      new AppError("Invalid verification code or registration number", 404)
    );
  }

  // Check if event is ongoing
  const event = await Event.findById(req.params.eventId);
  if (event.status !== "ongoing") {
    return next(new AppError("Event check-in is not active", 400));
  }

  if (participant.status === "approved") {
    return next(new AppError("Participant already Approved", 400));
  }

  participant.status = "approved";
  participant.checkInTime = new Date();
  participant.qrCode.scannedAt = new Date();
  await participant.save();

  res.status(200).json({
    status: "success",
    data: {
      data: participant,
    },
  });
});

// Get participants by event
exports.getEventParticipants = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  const search = req.query.search;
  const eventId = req.params.eventId;

  let query = { eventId };

  if (search) {
    query = {
      ...query,
      $or: [
        { registrationNumber: { $regex: search, $options: "i" } },
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { phone: { $regex: search, $options: "i" } },
      ],
    };
  }

  const [participants, total] = await Promise.all([
    Participant.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .lean(),
    Participant.countDocuments(query),
  ]);

  // Match the exact structure expected by the client
  res.status(200).json({
    success: true,
    data: {
      data: {
        participants,
        total,
      },
    },
  });
});

// Mark participant as attended
exports.markAttended = catchAsync(async (req, res, next) => {
  const participant = await Participant.findById(req.params.id);

  if (!participant) {
    return next(new AppError("Participant not found", 404));
  }

  // Update the status based on the request
  participant.status =
    req.body.status === "attended" ? "attended" : "registered";

    await participant.save();
  res.status(200).json({
    status: "success",
    data: {
      data: participant,
    },
  });
});

exports.attendWithQR = catchAsync(async (req, res, next) => {
  const { qrCode, status } = req.body;

  // Use findOne with qrCode.code instead of _id
  const participant = await Participant.findOne({
    "qrCode.code": qrCode,
  });

  if (!participant) {
    return next(new AppError("No participant found with this QR code", 404));
  }

  // Update the status
  participant.status = status === "attended" ? "attended" : "registered";
  await participant.save();

  res.status(200).json({
    success: true,
    data: participant,
  });
});

// Get participant details by verification string or registration number
exports.getParticipantDetails = catchAsync(async (req, res, next) => {
  const { verificationString, registrationNumber } = req.query;

  let participant;

  if (verificationString) {
    participant = await Participant.findOne({
      "qrCode.code": verificationString,
    }).populate("eventId", "name eventDate venue");
  } else if (registrationNumber) {
    participant = await Participant.findOne({
      registrationNumber,
    }).populate("eventId", "name eventDate venue");
  }

  if (!participant) {
    return next(new AppError("Participant not found", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      data: participant,
    },
  });
});

// Get check-in statistics for an event
exports.getEventCheckInStats = catchAsync(async (req, res, next) => {
  const stats = await Participant.aggregate([
    {
      $match: { eventId: mongoose.Types.ObjectId(req.params.eventId) },
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
      data: stats,
    },
  });
});
