import React from 'react';
import { EventForm } from './components/event-form';
import { ParticipantUpload } from './components/participant-upload';
import { CertificateDesign } from './components/certificate-design';

export function CreateEvent() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-8">Create New Event</h1>
      <div className="space-y-8">
        <EventForm />
        <ParticipantUpload />
        <CertificateDesign />
      </div>
    </div>
  );
}