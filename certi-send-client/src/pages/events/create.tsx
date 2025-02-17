import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { EventTypeSelector } from '@/components/events/create-event/EventTypeSelector';
import { EventBasicDetails } from '@/components/events/create-event/EventBasicDetails';
import { RegistrationForm } from '@/components/events/create-event/RegistrationForm';
import { EventCreationStepper } from '@/components/events/create-event/EventCreationStepper';
import { eventService } from '@/api/services/event.service';
import { CreateEventDTO, FormField } from '@/types/event.types';
import { toast } from 'react-hot-toast';
import { useAuth } from '@/contexts/auth';

type EventType = 'scratch' | 'post-registration' | 'certification';

export function CreateEvent() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [eventType, setEventType] = useState<EventType | null>(null);
  const [step, setStep] = useState(0);
  const [eventData, setEventData] = useState<CreateEventDTO | null>(null);
  const [formFields, setFormFields] = useState<FormField[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    console.log('Current user:', user);
  }, [user]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  const handleEventTypeSelect = (type: EventType) => {
    console.log('Event type selected:', type);
    setEventType(type);
    setStep(1);
  };

  const handleBasicDetailsSubmit = async (data: CreateEventDTO) => {
    if (!user?._id) {
      toast.error('You must be logged in to create an event');
      return;
    }

    try {
      setEventData({
        ...data,
        organizerId: user._id
      });
      setStep(2);
    } catch (error) {
      console.error('Error in basic details submission:', error);
      toast.error('Failed to process form data');
    }
  };

  const handleFormFieldsSubmit = async (fields: FormField[]) => {
    if (!eventData || !user?._id) {
      toast.error('Missing event data or user information');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const eventPayload: CreateEventDTO = {
        ...eventData,
        organizerId: user._id,
        registrationForm: {
          fields: fields
        }
      };

      console.log('Submitting event with payload:', eventPayload);
      
      const createdEvent = await eventService.createEvent(eventPayload);
      
      if (createdEvent && createdEvent._id) {
        toast.success('Event created successfully!');
        navigate(`/events/${createdEvent._id}`);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      console.error('Failed to create event:', error);
      toast.error(error.message || 'Failed to create event');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold mb-8">Create New Event</h1>

      {eventType && <EventCreationStepper currentStep={step} />}

      <div className="mt-8">
        {!eventType && (
          <EventTypeSelector onSelect={handleEventTypeSelect} />
        )}

        {eventType === 'scratch' && step === 1 && (
          <EventBasicDetails 
            onSubmit={handleBasicDetailsSubmit}
            initialData={eventData || undefined}
          />
        )}

        {eventType === 'scratch' && step === 2 && (
          <RegistrationForm
            fields={formFields}
            onFieldsChange={setFormFields}
            onSubmit={handleFormFieldsSubmit}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    </div>
  );
}