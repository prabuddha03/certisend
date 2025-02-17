const mongoose = require('mongoose');

const leaderboardSchema = new mongoose.Schema({
  eventId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Event',
    required: [true, 'Leaderboard must belong to an event']
  },
  participants: [{
    participantId: {
      type: mongoose.Schema.ObjectId,
      ref: 'Participant',
      required: [true, 'Participant must have an ID']
    },
    name: {
      type: String,
      required: [true, 'Participant must have a name']
    },
    rank: {
      type: Number,
    },
    points: {
      type: Number,
      required: [true, 'Participant must have points']
    },
    metrics: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: {}
    }
  }],
  isPublished: {
    type: Boolean,
    default: false
  },
  settings: {
    sortBy: {
      type: String,
      enum: ['points', 'time', 'custom'],
      default: 'points'
    },
    orderBy: {
      type: String,
      enum: ['asc', 'desc'],
      default: 'desc'
    },
    displayFields: [String]
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
leaderboardSchema.index({ eventId: 1 }, { unique: true });

// Pre-save middleware to sort participants based on settings
leaderboardSchema.pre('save', function(next) {
  if (this.participants && this.participants.length > 0) {
    const { sortBy, orderBy } = this.settings;
    
    this.participants.sort((a, b) => {
      const multiplier = orderBy === 'desc' ? -1 : 1;
      if (sortBy === 'points') {
        return (a.points - b.points) * multiplier;
      }
      // Add other sorting logic here if needed
      return 0;
    });
  }
  next();
});

const Leaderboard = mongoose.model('Leaderboard', leaderboardSchema);
module.exports = Leaderboard;