import api from '../axios';

export const certificateService = {
  checkCertificate: (eventId: string, data: { phone: string }) =>
    api.post(`/api/events/${eventId}/certificates/check`, data),

  generateCertificate: (data: {
    certificateId: string;
    certificateNumber: string;
    templateUrl: string;
    type: string;
    config: any;
    placeholders: any[];
    recipientData: any;
    metadata: any;
  }) =>
    api.post(`${process.env.CERTIFICATE_GENERATION_API}/generate`, data, {
      responseType: 'blob'
    }),
};  