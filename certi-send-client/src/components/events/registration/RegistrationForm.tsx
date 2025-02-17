import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Event } from '@/types/event.types';
import { participantService } from '@/api/services/participant.service';

interface Props {
  event: Event;
  onSuccess?: () => void;
}

export function RegistrationForm({ event, onSuccess }: Props) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await participantService.register(event._id, formData);
      toast.success('Registration successful!');
      onSuccess?.();
      navigate(`/events/${event._id}/confirmation?registrationId=${response.data._id}`);
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to register');
    } finally {
      setLoading(false);
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
            className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-3 py-2"
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

      case 'date':
        return (
          <Input
            type="date"
            value={formData[field.fieldName] || ''}
            onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
            required={field.required}
          />
        );

      default:
        return (
          <Input
            type={field.type}
            placeholder={`Enter ${field.label.toLowerCase()}`}
            value={formData[field.fieldName] || ''}
            onChange={(e) => handleInputChange(field.fieldName, e.target.value)}
            required={field.required}
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {event.registrationForm.fields.map((field) => (
        <div key={field.fieldName}>
          <Label htmlFor={field.fieldName}>
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </Label>
          {renderField(field)}
        </div>
      ))}

      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? 'Registering...' : 'Register Now'}
      </Button>

      <p className="text-sm text-zinc-400 text-center mt-4">
        By registering, you agree to receive event updates and certificate via email.
      </p>
    </form>
  );
}