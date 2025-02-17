const express = require('express');
const router = express.Router();
const googleFormsController = require('../controllers/googleFormsController');
const auth = require('../middleware/auth');

router.post('/import', auth, googleFormsController.importGoogleForm);

module.exports = router;