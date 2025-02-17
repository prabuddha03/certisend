const mongoose = require("mongoose");
const CacheService = require("../services/cacheService");

const eventSchema = new mongoose.Schema(
  {
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: String,
    logo: String,
    banner: String,
    eventType: {
      type: String,
      enum: ["individual", "mega"],
      required: true,
    },
    duration: {
      type: String,
      enum: ["single_day", "multi_day"],
      required: true,
    },
    eventDates: [
      {
        type: Date,
        required: true,
      },
    ],
    //for single day events and previous events need to be handled seperately in future, impacts mailing
    eventDate: {
      type: Date,
    },
    category: {
      type: String,
      enum: ["corporate", "school", "college", "general", "other", "charity"],
      required: true,
    },
    domain: [String], // Array of domains this event belongs to
    targetGroup: [String],
    ageStart: Number,
    ageEnd: Number,
    eventMode: {
      type: String,
      enum: ["online", "offline", "hybrid"],
      required: true,
    },

    prizeMoney: Number,
    venue: {
      name: String,
      address: String,
      location: {
        type: {
          type: String,
          enum: ["Point"],
          default: "Point",
        },
        coordinates: {
          type: [Number],
          default: [0, 0],
        },
      },
    },
    approximateParticipants: Number,
    registrationDeadline: Date,
    isTicketed: {
      type: Boolean,
      default: false,
    },
    ticketPrice: Number,
    pointOfContact: [
      {
        name: String,
        email: String,
        phone: String,
        role: String,
      },
    ],
    approvalType: {
      type: String,
      enum: ["manual", "automatic"],
      default: "automatic",
    },
    status: {
      type: String,
      enum: [
        "draft",
        "registration_open",
        "registration_closed",
        "ongoing",
        "completed",
      ],
      default: "draft",
    },
    registrationForm: {
      fields: [
        {
          fieldName: String,
          label: String,
          type: {
            type: String,
            enum: [
              "text",
              "textarea",
              "email",
              "phone",
              "number",
              "date",
              "select",
              "radio",
              "checkbox",
            ],
            required: true,
          },
          required: Boolean,
          options: [String],
        },
      ],
    },
    settings: {
      registrationDeadline: Date,
      maxParticipants: Number,
      allowWaitlist: Boolean,
      certificateValidityDays: Number,
    },
    isTicketed: {
      type: Boolean,
      default: false,
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    participationType: {
      type: String,
      enum: ["solo", "team", "both"],
      required: true,
      default: "solo",
    },
    teamSettings: {
      enabled: {
        type: Boolean,
        default: false,
      },
      size: {
        min: {
          type: Number,
          default: 1,
        },
        max: {
          type: Number,
          default: 1,
        },
      },
      allowMultipleTeams: {
        type: Boolean,
        default: false,
      },
    },
    registrationSettings: {
      type: {
        type: String,
        enum: ["free", "paid"],
        required: true,
        default: "free",
      },
      fee: {
        individual: {
          type: Number,
          default: 0,
        },
        team: {
          type: Number,
          default: 0,
        },
      },
      earlyBird: {
        enabled: {
          type: Boolean,
          default: false,
        },
        deadline: Date,
        discount: {
          type: Number,
          min: 0,
          max: 100,
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

eventSchema.pre(/^find/, function (next) {
  // Only populate necessary fields
  this.populate({
    path: "organizerId",
    select: "name email",
  });
  next();
});

eventSchema.post(["save", "remove", "updateOne"], async function (doc) {
  try {
    // Clear both event and list caches
    await Promise.all([
      CacheService.del(`event:${doc._id}`),
      CacheService.del("events:public"),
      CacheService.del(`events:organizer:${doc.organizerId}`),
    ]);
  } catch (error) {
    console.error("Cache cleanup error:", error);
  }
});

eventSchema.statics.findPublicEvents = function () {
  return this.find({ isPublic: true })
    .select("name description eventDate venue status")
    .lean()
    .exec();
};

eventSchema.index(
  { name: "text", description: "text", venue: "text" },
  {
    weights: {
      name: 10,
      description: 5,
      venue: 3,
    },
    name: "EventTextIndex",
  }
);

// Add validation middleware
eventSchema.pre("save", function (next) {
  // If it's an individual event and team settings are enabled
  if (this.eventType === "individual" && this.teamSettings.enabled) {
    // Ensure team settings are properly configured
    if (!this.teamSettings.size.min || !this.teamSettings.size.max) {
      return next(
        new Error(
          "Team size limits must be set when team participation is enabled"
        )
      );
    }
  }

  // If it's a paid registration
  if (this.registrationSettings.type === "paid") {
    // Ensure at least one fee is set
    if (
      this.participationType === "solo" &&
      !this.registrationSettings.fee.individual
    ) {
      return next(
        new Error("Individual registration fee must be set for paid events")
      );
    }
    if (this.teamSettings.enabled && !this.registrationSettings.fee.team) {
      return next(
        new Error(
          "Team registration fee must be set when team participation is enabled"
        )
      );
    }
  }

  next();
});

const Event = mongoose.model("Event", eventSchema);

// Create indexes
Event.createIndexes().catch(console.error);

module.exports = Event;
