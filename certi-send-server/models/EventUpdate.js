const mongoose = require('mongoose');

const eventUpdateSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true,
    index: true // For better query performance
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['announcement', 'update', 'reminder', 'result'],
    default: 'update'
  },
  attachments: [{
    url: String,
    type: String,
    name: String
  }],
  pinned: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true // Automatically manage createdAt and updatedAt
});

// Index for efficient querying
eventUpdateSchema.index({ eventId: 1, createdAt: -1 });

const EventUpdate = mongoose.model('EventUpdate', eventUpdateSchema);

module.exports = EventUpdate;