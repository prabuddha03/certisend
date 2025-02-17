import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Event } from '@/types/event.types';
import { eventService } from '@/api/services/event.service';
import { participantService } from '@/api/services/participant.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';

export function EventRegistration() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    if (id) {
      loadEvent(id);
    }
  }, [id]);

  const loadEvent = async (eventId: string) => {
    try {
      const response = await eventService.getEventById(eventId);
      setEvent(response.data.data);
    } catch (error) {
      console.error('Error loading event:', error);
      toast.error('Failed to load event details');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !id) return;

    setSubmitting(true);
    try {
      const response = await participantService.register(id, formData);
      toast.success('Registration successful!');
      navigate(`/events/${id}`);
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to register for the event');
    } finally {
      setSubmitting(false);
    }
  };

  const handleInputChange = (fieldName: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const renderField = (field: any) => {
    switch (field.type) {
      case 'select':
        return (
          <select
            id={field.fieldName}
            className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2 mt-2"
            value={formData[field.fieldName] || ''}
            onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
            required={field.required}
          >
            <option value="">Select {field.label}</option>
            {field.options?.map((option: string) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      case 'radio':
        return (
          <div className="space-y-2 mt-2">
            {field.options?.map((option: string) => (
              <label key={option} className="flex items-center space-x-2">
                <input
                  type="radio"
                  name={field.fieldName}
                  value={option}
                  checked={formData[field.fieldName] === option}
                  onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
                  required={field.required}
                  className="rounded-full border-zinc-800 bg-zinc-900"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div className="space-y-2 mt-2">
            {field.options?.map((option: string) => (
              <label key={option} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  value={option}
                  checked={formData[field.fieldName]?.includes(option)}
                  onChange={(e) => {
                    const currentValues = formData[field.fieldName] 
                      ? formData[field.fieldName].split(',') 
                      : [];
                    
                    let newValues;
                    if (e.target.checked) {
                      newValues = [...currentValues, option];
                    } else {
                      newValues = currentValues.filter((value: string) => value !== option);
                    }
                    
                    handleInputChange(field.fieldName, newValues.join(','));
                  }}
                  className="rounded border-zinc-800 bg-zinc-900"
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        );

      default:
        return (
          <Input
            id={field.fieldName}
            type={field.type}
            placeholder={`Enter your ${field.label.toLowerCase()}`}
            value={formData[field.fieldName] || ''}
            onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
            required={field.required}
            className="mt-2"
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="container max-w-2xl mx-auto py-8">
        <div className="text-center">Loading registration form...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="container max-w-2xl mx-auto py-8">
        <div className="text-center">Event not found</div>
      </div>
    );
  }

  // Check if registration is allowed
  const isRegistrationOpen = event.status === 'registration_open';
  const registrationDeadline = event.settings?.registrationDeadline 
    ? new Date(event.settings.registrationDeadline) 
    : null;
  const isDeadlinePassed = registrationDeadline ? registrationDeadline < new Date() : false;
  const isFull = (event.stats?.registeredCount || 0) >= (event.settings?.maxParticipants || 0);

  if (!isRegistrationOpen || isDeadlinePassed || (isFull && !event.settings?.allowWaitlist)) {
    return (
      <div className="container max-w-2xl mx-auto py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to={`/events/${id}`} className="flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Event Details
          </Link>
        </Button>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Registration Unavailable</h1>
          <p className="text-zinc-400">
            {!isRegistrationOpen
              ? 'Registration is currently closed for this event.'
              : isDeadlinePassed
              ? 'Registration deadline has passed.'
              : 'This event is fully booked.'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-2xl mx-auto py-8">
      <Button variant="ghost" asChild className="mb-6">
        <Link to={`/events/${id}`} className="flex items-center">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Event Details
        </Link>
      </Button>

      <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-8">
        <h1 className="text-2xl font-bold mb-2">{event.name}</h1>
        <p className="text-zinc-400 mb-6">Complete the registration form below</p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {event.registrationForm?.fields?.map((field) => (
            <div key={field.fieldName}>
              <Label htmlFor={field.fieldName}>
                {field.label}
                {field.required && <span className="text-red-500 ml-1">*</span>}
              </Label>
              {renderField(field)}
            </div>
          ))}

          <Button type="submit" className="w-full" disabled={submitting}>
            {submitting ? 'Registering...' : isFull ? 'Join Waitlist' : 'Complete Registration'}
          </Button>
        </form>
      </div>
    </div>
  );
}