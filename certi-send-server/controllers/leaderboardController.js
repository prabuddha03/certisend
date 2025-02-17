const Leaderboard = require('../models/Leaderboard');
const factory = require('../utils/handlerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.setEventId = (req, res, next) => {
  // Allow nested routes
  if (!req.body.eventId) req.body.eventId = req.params.eventId;
  next();
};

exports.getEventLeaderboard = catchAsync(async (req, res, next) => {
  const leaderboard = await Leaderboard.findOne({ eventId: req.params.eventId });

  if (!leaderboard) {
    return next(new AppError('No leaderboard found for this event', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      data: leaderboard
    }
  });
});

exports.createLeaderboard = catchAsync(async (req, res, next) => {
  // Check if leaderboard already exists
  const existingLeaderboard = await Leaderboard.findOne({ eventId: req.params.eventId });
  if (existingLeaderboard) {
    return next(new AppError('Leaderboard already exists for this event', 400));
  }

  const leaderboard = await Leaderboard.create({
    eventId: req.params.eventId,
    participants: req.body.participants,
    settings: req.body.settings
  });

  res.status(201).json({
    status: 'success',
    data: {
      data: leaderboard
    }
  });
});

exports.publishLeaderboard = catchAsync(async (req, res, next) => {
  const leaderboard = await Leaderboard.findOneAndUpdate(
    { eventId: req.params.eventId },
    { isPublished: true },
    { new: true }
  );

  if (!leaderboard) {
    return next(new AppError('No leaderboard found for this event', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      data: leaderboard
    }
  });
});

exports.exportLeaderboard = catchAsync(async (req, res, next) => {
  const leaderboard = await Leaderboard.findOne({ eventId: req.params.eventId });

  if (!leaderboard) {
    return next(new AppError('No leaderboard found for this event', 404));
  }

  // Convert to CSV format
  const fields = ['rank', 'name', 'points', ...leaderboard.settings.displayFields];
  const csv = [
    fields.join(','), // Header
    ...leaderboard.participants.map(p => {
      const row = [p.rank, p.name, p.points];
      leaderboard.settings.displayFields.forEach(field => {
        row.push(p.metrics?.get(field) || '');
      });
      return row.join(',');
    })
  ].join('\n');

  res.set('Content-Type', 'text/csv');
  res.set('Content-Disposition', `attachment; filename=leaderboard-${req.params.eventId}.csv`);
  res.send(csv);
});

// Use the factory handlers for standard operations
exports.getAllLeaderboards = factory.getAll(Leaderboard);
exports.updateLeaderboard = catchAsync(async (req, res, next) => {
    const leaderboard = await Leaderboard.findOneAndUpdate(
      { eventId: req.params.eventId },
      req.body,
      { new: true }
    );
  
    if (!leaderboard) {
      return next(new AppError('No leaderboard found for this event', 404));
    }
  
    res.status(200).json({
      status: 'success',
      data: {
        data: leaderboard
      }
    });
  });
exports.deleteLeaderboard = factory.deleteOne(Leaderboard);