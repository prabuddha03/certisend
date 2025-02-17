const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
  {
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CertificateTemplate",
      required: true,
    },
    eventId: {
      type: String,
      required: true,
      index: true,
    },
    participantId: {
      type: String,
      required: true,
    },
    recipientData: {
      name: String,
      position: String,
      email: String,
      phone: String,
    },
    certificateNumber: {
      type: String,
      unique: true,
    },
    status: {
      type: String,
      enum: ["pending", "generated", "claimed"],
      default: "pending",
    },
    claimCode: {
      type: String,
    },
    expiresAt: Date,
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
certificateSchema.index({ eventId: 1, status: 1 });
certificateSchema.index({ certificateNumber: 1 });

module.exports = mongoose.model("Certificate", certificateSchema);
