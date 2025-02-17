const mongoose = require("mongoose");

const teamSchema = new mongoose.Schema(
  {
    subEventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubEvent",
      index: true,
    },
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },
    teamLeaderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Participant",
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Participant",
      },
    ],
    inviteCodes: [
      {
        code: {
          type: String,
          unique: true,
        },
        email: String,
        status: {
          type: String,
          enum: ["pending", "accepted", "rejected"],
          default: "pending",
        },
        expiresAt: Date,
      },
    ],
    status: {
      type: String,
      enum: ["forming", "complete", "locked"],
      default: "forming",
    },
  },
  {
    timestamps: true,
  }
);

// Create a compound unique index for team name within a sub-event
teamSchema.index({ subEventId: 1, name: 1 }, { unique: true });



// Middleware to validate team size against sub-event requirements
teamSchema.pre("save", async function (next) {
  if (this.isModified("members")) {
    const subEvent = await mongoose.model("SubEvent").findById(this.subEventId);
    if (!subEvent) {
      return next(new Error("SubEvent not found"));
    }

    if (this.members.length > subEvent.teamSize.max) {
      return next(
        new Error(`Team size cannot exceed ${subEvent.teamSize.max} members`)
      );
    }

    if (
      this.status === "complete" &&
      this.members.length < subEvent.teamSize.min
    ) {
      return next(
        new Error(`Team must have at least ${subEvent.teamSize.min} members`)
      );
    }
  }
  next();
});

teamSchema.methods.checkCompletion = async function () {
  const subEvent = await SubEvent.findById(this.subEventId);

  if (this.members.length >= subEvent.teamSize.min) {
    this.status = "complete";
    await this.save();
    return true;
  }
  return false;
};

const Team = mongoose.model("Team", teamSchema);
module.exports = Team;
