const mongoose = require("mongoose");

const emailLogSchema = new mongoose.Schema(
  {
    eventId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    type: {
      type: String,
      enum: ["registration", "qr_code", "certificate", "reminder", "bulk"],
      required: true,
    },
    recipients: [{
      participantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Participant",
      },
      email: String,
      status: {
        type: String,
        enum: ["pending", "sent", "failed"],
        default: "pending"
      },
      error: String
    }],
    templateData: {
      subject: String,
      body: String,
      attachments: [{
        filename: String,
        path: String
      }]
    },
    metadata: {
      totalRecipients: Number,
      successCount: Number,
      failureCount: Number,
      startTime: Date,
      endTime: Date
    }
  },
  {
    timestamps: true
  }
);

emailLogSchema.index({ eventId: 1, type: 1 });
emailLogSchema.index({ "recipients.participantId": 1 });
emailLogSchema.index({ "recipients.status": 1 });

module.exports = mongoose.model("EmailLog", emailLogSchema);