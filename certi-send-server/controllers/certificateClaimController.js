const Certificate = require('../models/Certificate');

exports.verifyCertificateEligibility = async (req, res) => {
  try {
    const { eventId, phone, name } = req.body;

    // Find certificate
    const certificate = await Certificate.findOne({
      eventId,
      'recipientData.phone': phone,
      'recipientData.name': name,
      status: 'pending'
    }).lean();

    if (!certificate) {
      return res.status(404).json({
        success: false,
        message: 'No certificate found for provided details'
      });
    }

    // Prepare payload for certificate generation service
    const generationPayload = {
      certificateId: certificate._id,
      certificateNumber: certificate.certificateNumber,
      recipientData: certificate.recipientData,
      eventId: certificate.eventId
    };

    // Return payload that will be sent to certificate generation service
    res.json({
      success: true,
      payload: generationPayload,
      // Include URL to certificate generation service
      generationUrl: process.env.CERTIFICATE_GENERATION_SERVICE_URL
    });

  } catch (error) {
    console.error('Certificate verification failed:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};