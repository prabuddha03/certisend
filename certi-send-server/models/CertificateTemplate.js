const mongoose = require("mongoose");

const placeholderSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["name", "position", "date", "event_name", "custom"],
    required: true,
  },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  fontSize: { type: Number, required: true },
  fontFamily: { type: String, default: "Arial" },
  color: { type: String, default: "#000000" },
  customText: String,
});

const certificateTemplateSchema = new mongoose.Schema(
  {
    eventId: {
      type: String,
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["appreciation", "participation"],
      required: true,
    },
    templateUrl: {
      type: String,
      required: true,
    },
    config: {
      dimensions: {
        width: Number,
        height: Number,
      },
      format: {
        type: String,
        enum: ["A4", "letter", "custom"],
        default: "A4",
      },
      orientation: {
        type: String,
        enum: ["portrait", "landscape"],
        default: "landscape",
      },
    },
    placeholders: [placeholderSchema],
    metadata: {
      eventName: String,
      eventDate: Date,
      organizerName: String,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for faster queries
certificateTemplateSchema.index({ eventId: 1, type: 1, isActive: 1 });

module.exports = mongoose.model(
  "CertificateTemplate",
  certificateTemplateSchema
);
