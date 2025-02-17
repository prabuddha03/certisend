const EventUpdate = require('../models/EventUpdate');
const factory = require('../utils/handlerFactory');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

exports.setEventUserIds = (req, res, next) => {
  // Allow nested routes
  if (!req.body.eventId) req.body.eventId = req.params.eventId;
  if (!req.body.createdBy) req.body.createdBy = req.user._id;
  next();
};

// Use the factory functions for basic CRUD
exports.getAllEventUpdates = factory.getAll(EventUpdate);
exports.getEventUpdate = factory.getOne(EventUpdate);
exports.createEventUpdate = factory.createOne(EventUpdate);
exports.updateEventUpdate = factory.updateOne(EventUpdate);
exports.deleteEventUpdate = factory.deleteOne(EventUpdate);

// Custom controllers
exports.getUpdatesByEvent = catchAsync(async (req, res, next) => {
  const updates = await EventUpdate.find({ eventId: req.params.eventId })
    .sort('-pinned -createdAt')
    .populate('createdBy', 'name photo');

  res.status(200).json({
    status: 'success',
    results: updates.length,
    data: {
      data: updates
    }
  });
});

exports.togglePinUpdate = catchAsync(async (req, res, next) => {
  const update = await EventUpdate.findById(req.params.id);

  if (!update) {
    return next(new AppError('No update found with that ID', 404));
  }

  update.pinned = !update.pinned;
  await update.save();

  res.status(200).json({
    status: 'success',
    data: {
      data: update
    }
  });
});