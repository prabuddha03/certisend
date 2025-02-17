const Certificate = require('../models/Certificate');
const CertificateTemplate = require('../models/CertificateTemplate');

class CertificateService {
  static async prepareCertificatePayload(certificateId) {
    // Get certificate details
    const certificate = await Certificate.findById(certificateId).lean();
    if (!certificate) throw new Error('Certificate not found');

    // Get template details
    const template = await CertificateTemplate.findById(certificate.templateId).lean();
    if (!template) throw new Error('Template not found');

    // Prepare the payload for certificate generation service
    const payload = {
      // Certificate identification
      certificateId: certificate._id,
      certificateNumber: certificate.certificateNumber,
      
      // Template details
      templateUrl: template.templateUrl,  // S3 URL of the template image
      type: template.type,               // 'appreciation' or 'participation'
      
      // Layout configuration
      config: {
        dimensions: template.config.dimensions,
        format: template.config.format,
        orientation: template.config.orientation
      },
      
      // Text placement configuration
      placeholders: template.placeholders.map(p => ({
        type: p.type,
        x: p.x,
        y: p.y,
        fontSize: p.fontSize,
        fontFamily: p.fontFamily,
        color: p.color,
        customText: p.customText
      })),
      
      // Recipient data to be placed on certificate
      recipientData: {
        name: certificate.recipientData.name,
        position: certificate.recipientData.position,
        // Add any other recipient-specific data
      },
      
      // Event metadata
      metadata: {
        eventName: template.metadata.eventName,
        eventDate: template.metadata.eventDate,
        organizerName: template.metadata.organizerName
      },

      // Output configuration
      output: {
        format: 'pdf',  // or 'jpg', depending on requirements
        quality: 'high',
        compression: 0.8
      }
    };

    return payload;
  }
}

// Example payload structure that will be sent to certificate generation service:
const examplePayload = {
  certificateId: "cert_123",
  certificateNumber: "CERT-ABC-123456",
  templateUrl: "https://your-bucket.s3.region.amazonaws.com/templates/template-123.jpg",
  type: "appreciation",
  config: {
    dimensions: { width: 1920, height: 1080 },
    format: "A4",
    orientation: "landscape"
  },
  placeholders: [
    {
      type: "name",
      x: 960,
      y: 540,
      fontSize: 48,
      fontFamily: "Arial",
      color: "#000000"
    },
    {
      type: "position",
      x: 960,
      y: 640,
      fontSize: 32,
      fontFamily: "Arial",
      color: "#666666"
    },
    // ... other placeholders
  ],
  recipientData: {
    name: "John Doe",
    position: "Team Leader"
  },
  metadata: {
    eventName: "Annual Conference 2024",
    eventDate: "2024-03-15T00:00:00.000Z",
    organizerName: "Tech Company Inc."
  },
  output: {
    format: "pdf",
    quality: "high",
    compression: 0.8
  }
};

module.exports = CertificateService;