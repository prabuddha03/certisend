const express = require('express');
const  auth  = require('../middleware/auth');
const eventUpdateController = require('../controllers/eventUpdateController');

const router = express.Router({ mergeParams: true }); // Enable params merging for nested routes

// Protect all routes after this middleware
router.use(auth);

router
  .route('/')
  .get(eventUpdateController.getUpdatesByEvent)
  .post(
    eventUpdateController.setEventUserIds,
    eventUpdateController.createEventUpdate
  );

router
  .route('/:id')
  .get(eventUpdateController.getEventUpdate)
  .patch(eventUpdateController.updateEventUpdate)
  .delete(eventUpdateController.deleteEventUpdate);

router
  .route('/:id/toggle-pin')
  .patch(eventUpdateController.togglePinUpdate);

module.exports = router;