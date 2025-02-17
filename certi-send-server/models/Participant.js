const mongoose = require("mongoose");
const crypto = require("crypto");
const CacheService = require("../services/cacheService");

const participantSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    subEventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      index: true,
    },
    name: {
      type: String,
      trim: true,
      required: true,
      index: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
      index: true,
    },
    registrationData: {
      type: Map,
      of: String, // Stores dynamic form field values
    },
    status: {
      type: String,
      enum: [
        "registered",
        "approved",
        "attended",
        "certificate_generated",
        "certificate_claimed",
      ],
      default: "registered",
      index: true,
    },
    qrCode: {
      code: {
        type: String,
        sparse: true,
      },
      scannedAt: Date,
    },
    checkInTime: Date,
    registrationNumber: {
      type: String,
      unique: true,
      sparse: true,
    },
    teamName: String,
    teamMembers: [
      {
        name: String,
        email: String,
        phone: String,
        role: String,
      },
    ],
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      index: true,
    },
    isTeamLeader: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    indexes: [
      { eventId: 1, status: 1 }, // For event participant lists
      { eventId: 1, email: 1 }, // For duplicate checks
      { eventId: 1, phone: 1 }, // For duplicate checks
    ],
  }
);

// Generate QR code and registration number before saving
const registrationCounterSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    unique: true,
  },
  count: {
    type: Number,
    default: 0,
  },
});

const RegistrationCounter = mongoose.model(
  "RegistrationCounter",
  registrationCounterSchema
);

// Update the generateRegistrationNumber method
participantSchema.statics.generateRegistrationNumber = async function (
  eventId,
  eventName
) {
  const yearSuffix = new Date().getFullYear().toString().slice(-2);
  const eventPrefix = eventName
    .replace(/[^a-zA-Z]/g, "")
    .substring(0, 4)
    .toUpperCase();

  // Use findOneAndUpdate on the counter collection
  const counter = await RegistrationCounter.findOneAndUpdate(
    { eventId },
    { $inc: { count: 1 } },
    {
      upsert: true,
      new: true,
    }
  );

  const uniqueNumber = counter.count.toString().padStart(6, "0");
  return `${eventPrefix}${yearSuffix}_${uniqueNumber}`;
};
// Optimize QR code generation
participantSchema.methods.generateQRCode = function () {
  const timestamp = Date.now().toString(36);
  const random = crypto.randomBytes(2).toString("hex");
  return `${this.eventId.toString().slice(-4)}-${timestamp}-${random}`;
};

// Batch registration helper
participantSchema.statics.batchRegister = async function (
  eventId,
  participants
) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const event = await mongoose.model("Event").findById(eventId).lean();
    if (!event) throw new Error("Event not found");

    // Generate registration numbers in bulk
    const registrationNumbers = await Promise.all(
      participants.map(() =>
        this.generateRegistrationNumber(eventId, event.name)
      )
    );

    // Prepare bulk operations
    const operations = participants.map((participant, index) => ({
      insertOne: {
        document: {
          ...participant,
          eventId,
          registrationNumber: registrationNumbers[index],
          qrCode: {
            code: `${eventId.toString().slice(-4)}-${Date.now().toString(
              36
            )}-${index}`,
          },
        },
      },
    }));

    // Execute bulk write
    const result = await this.bulkWrite(operations, { session });
    await session.commitTransaction();
    return result;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
};

async function clearParticipantCache(eventId) {
  try {
    // Clear Redis cache
    const keys = await CacheService.keys(`event:${eventId}:participants:*`);
    if (keys.length > 0) {
      await Promise.all(keys.map((key) => CacheService.del(key)));
    }

    // Clear local cache
    CacheService.clearLocalCache();

    console.log(`Cleared all caches for event ${eventId}`);
  } catch (error) {
    console.error("Cache clear error:", error);
  }
}
// Clear cache after any modification
participantSchema.post(
  ["save", "updateOne", "findOneAndUpdate", "findByIdAndUpdate"],
  async function (doc) {
    if (doc) {
      await clearParticipantCache(doc.eventId);
    }
  }
);

// Clear cache after delete operations
participantSchema.post(
  ["remove", "deleteOne", "findOneAndDelete", "findByIdAndDelete"],
  async function (doc) {
    if (doc) {
      await clearParticipantCache(doc.eventId);
    }
  }
);

// Optimize pre-save hook
participantSchema.pre("save", async function (next) {
  if (this.isNew) {
    if (!this.registrationNumber) {
      const event = await mongoose
        .model("Event")
        .findById(this.eventId)
        .select("name")
        .lean();

      if (!event) throw new Error("Event not found");

      this.registrationNumber =
        await this.constructor.generateRegistrationNumber(
          this.eventId,
          event.name
        );
    }

    if (!this.qrCode.code) {
      this.qrCode.code = this.generateQRCode();
    }
  }
  next();
});

const Participant = mongoose.model("Participant", participantSchema);

module.exports = Participant;
