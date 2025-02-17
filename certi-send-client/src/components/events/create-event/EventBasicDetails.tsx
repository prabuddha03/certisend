import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/date-picker';
import { Select } from '@/components/ui/select';
import { MultiSelect } from '@/components/ui/multi-select';
import { PlacesAutocomplete } from '@/components/ui/places-autocomplete';
import { ImageUpload } from '@/components/ui/image-upload';
import { Label } from '@/components/ui/label';


const eventSchema = z.object({
  name: z.string().min(3, 'Event name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  logo: z.union([z.string(), z.instanceof(File)]).optional(),
  banner: z.union([z.string(), z.instanceof(File)]).optional(),
  approximateParticipants: z.number().min(1),
  eventDates: z.array(z.date()).min(1),
  registrationDeadline: z.date(),
  approvalType: z.enum(['manual', 'automatic']),
  category: z.enum(['corporate', 'school', 'college', 'other']),
  domain: z.array(z.string()).min(1),
  targetGroup: z.array(z.string()).min(1),
  eventMode: z.enum(['online', 'offline', 'hybrid']),
  venue: z.object({
    address: z.string(),
    location: z.object({
      lat: z.number(),
      lng: z.number()
    })
  }).optional(),
  hasTickets: z.boolean(),
  eventPOCs: z.array(z.object({
    name: z.string(),
    contact: z.string(),
    email: z.string().email()
  })).min(1),
  duration: z.enum(['single_day', 'multi_day']),
  eventType: z.enum(['individual', 'mega'])
});

interface EventBasicDetailsProps {
  onSubmit: (data: z.infer<typeof eventSchema>) => void;
  eventType: 'individual' | 'mega';
  durationType: 'single' | 'multi';
}

const DOMAIN_OPTIONS = [
  'Technology', 'Arts', 'Sports', 'Academic', 'Cultural', 'Professional', 'Other'
];

const TARGET_GROUP_OPTIONS = [
  'Students', 'Professionals', 'Children', 'Adults', 'Senior Citizens', 'All'
];

export function EventBasicDetails({ onSubmit, eventType, durationType }: EventBasicDetailsProps) {
  const form = useForm<z.infer<typeof eventSchema>>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      name: '',
      description: '',
      approximateParticipants: 0,
      eventDates: [new Date()],
      registrationDeadline: new Date(),
      approvalType: 'manual',
      category: 'corporate',
      domain: [],
      targetGroup: [],
      eventMode: 'offline',
      venue: {
        address: '',
        location: {
          lat: 0,
          lng: 0
        }
      },
      hasTickets: false,
      eventPOCs: [{
        name: '',
        contact: '',
        email: '',
      }],
      duration: durationType === 'single' ? 'single_day' : 'multi_day',
      eventType: eventType,
      logo: undefined,
      banner: undefined,
    },
  });

  const selectedDomains = form.watch('domain') || [];
  const selectedTargetGroups = form.watch('targetGroup') || [];

  const eventMode = form.watch('eventMode');
  const eventDates = form.watch('eventDates');

  const handleEventDateChange = (date: Date, index: number) => {
    const newDates = [...eventDates];
    newDates[index] = date;
    form.setValue('eventDates', newDates);
  };

  const handleVenueSelect = (place: google.maps.places.PlaceResult) => {
    if (place.geometry?.location) {
      form.setValue('venue', {
        address: place.formatted_address || '',
        location: {
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        }
      });
    }
  };

  const addPOC = () => {
    const currentPOCs = form.watch('eventPOCs');
    form.setValue('eventPOCs', [...currentPOCs, { name: '', contact: '', email: '' }]);
  };

  const removePOC = (index: number) => {
    const currentPOCs = form.watch('eventPOCs');
    form.setValue('eventPOCs', currentPOCs.filter((_, i) => i !== index));
  };

  const handleLogoUpload = (file: File | null) => {
    if (file) {
      form.setValue('logo', file);
    }
  };

  const handleBannerUpload = (file: File | null) => {
    if (file) {
      form.setValue('banner', file);
    }
  };

  const onFormSubmit = (data: z.infer<typeof eventSchema>) => {
    console.log('Form submitted:', data); // Debug log
    onSubmit(data);
  };

  return (
    <form 
      onSubmit={form.handleSubmit(onFormSubmit)} 
      className="space-y-6"
    >
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Input
              {...form.register('name')}
              placeholder="Event Name"
              error={form.formState.errors.name?.message}
            />
          </div>
          
          <div>
            <Input
              type="number"
              {...form.register('approximateParticipants', { valueAsNumber: true })}
              placeholder="Approximate Participants"
              error={form.formState.errors.approximateParticipants?.message}
            />
          </div>
        </div>

        <Textarea
          {...form.register('description')}
          placeholder="Event Description"
          error={form.formState.errors.description?.message}
          className="bg-zinc-900 border border-input text-foreground min-h-[100px]"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <Label>Event Logo</Label>
            <ImageUpload
              onUpload={handleLogoUpload}
              value={form.watch('logo')}
              onChange={(value) => form.setValue('logo', value)}
            />
            {form.formState.errors.logo && (
              <span className="text-red-500">{form.formState.errors.logo.message}</span>
            )}
          </div>

          <div>
            <Label>Event Banner</Label>
            <ImageUpload
              onUpload={handleBannerUpload}
              value={form.watch('banner')}
              onChange={(value) => form.setValue('banner', value)}
            />
            {form.formState.errors.banner && (
              <span className="text-red-500">{form.formState.errors.banner.message}</span>
            )}
          </div>
        </div>
      </div>

      {/* Venue & Mode - Move this section up, right after Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Event Mode & Location</h3>
        
        <div className="space-y-2">
          <Label>How will this event be conducted?</Label>
          <Select
            {...form.register('eventMode')}
            options={[
              { value: 'online', label: 'Online Event (Virtual)' },
              { value: 'offline', label: 'Offline Event (In-Person)' },
              { value: 'hybrid', label: 'Hybrid Event (Both Online & Offline)' }
            ]}
          />
        </div>

        {(eventMode === 'offline' || eventMode === 'hybrid') && (
          <div className="space-y-2">
            <Label>Event Venue</Label>
            <PlacesAutocomplete
              onSelect={handleVenueSelect}
              defaultValue={form.getValues().venue?.address}
              className="relative"
              containerClassName="relative z-50"
            />
            {form.watch('venue.address') && (
              <p className="text-sm text-muted-foreground mt-1">
                Selected: {form.watch('venue.address')}
              </p>
            )}
          </div>
        )}

        {eventMode === 'online' && (
          <p className="text-sm text-muted-foreground">
            Platform details and meeting links can be shared with participants later.
          </p>
        )}
      </div>

      {/* Event Dates */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Event Dates</h3>
        
        {durationType === 'single' ? (
          <DatePicker
            value={eventDates[0]}
            onChange={(date) => handleEventDateChange(date, 0)}
            minDate={new Date()}
          />
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {[0, 1, 2, 3].map((index) => (
              <DatePicker
                key={index}
                value={eventDates[index]}
                onChange={(date) => handleEventDateChange(date, index)}
                minDate={index > 0 ? eventDates[index - 1] : new Date()}
                placeholder={`Day ${index + 1}`}
              />
            ))}
          </div>
        )}

        <DatePicker
          value={form.watch('registrationDeadline')}
          onChange={(date) => form.setValue('registrationDeadline', date)}
          maxDate={eventDates[0]}
          label="Registration Deadline"
        />
      </div>

      {/* Event Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Event Settings</h3>
        
        <Select
          {...form.register('approvalType')}
          options={[
            { value: 'automatic', label: 'Automatic Approval' },
            { value: 'manual', label: 'Manual Approval' }
          ]}
          label="Approval Type"
        />

        <Select
          {...form.register('category')}
          options={[
            { value: 'corporate', label: 'Corporate' },
            { value: 'school', label: 'School' },
            { value: 'college', label: 'College' },
            { value: 'other', label: 'Other' }
          ]}
          label="Event Category"
        />

        <MultiSelect
          options={DOMAIN_OPTIONS.map(d => ({ value: d, label: d }))}
          selected={selectedDomains}
          onChange={(values) => {
            form.setValue('domain', values, { 
              shouldValidate: true,
              shouldDirty: true,
              shouldTouch: true 
            });
          }}
          placeholder="Select Domains"
          error={form.formState.errors.domain?.message}
          label="Event Domains"
        />

        <MultiSelect
          options={TARGET_GROUP_OPTIONS.map(t => ({ value: t, label: t }))}
          selected={selectedTargetGroups}
          onChange={(values) => {
            form.setValue('targetGroup', values, {
              shouldValidate: true,
              shouldDirty: true,
              shouldTouch: true
            });
          }}
          placeholder="Select Target Groups"
          error={form.formState.errors.targetGroup?.message}
          label="Target Groups"
        />
      </div>

      {/* Event POCs */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">Event POCs</h3>
          <Button type="button" onClick={addPOC} variant="outline">
            Add POC
          </Button>
        </div>

        {form.watch('eventPOCs').map((_, index) => (
          <div key={index} className="grid grid-cols-3 gap-4">
            <Input
              {...form.register(`eventPOCs.${index}.name`)}
              placeholder="Name"
            />
            <Input
              {...form.register(`eventPOCs.${index}.contact`)}
              placeholder="Contact"
            />
            <div className="flex gap-2">
              <Input
                {...form.register(`eventPOCs.${index}.email`)}
                placeholder="Email"
              />
              {index > 0 && (
                <Button
                  type="button"
                  onClick={() => removePOC(index)}
                  variant="destructive"
                >
                  Remove
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end space-x-4">
        <Button 
          type="submit"
          onClick={() => {
            if (selectedDomains.length === 0) {
              form.setError('domain', {
                type: 'manual',
                message: 'Please select at least one domain'
              });
            }
            if (selectedTargetGroups.length === 0) {
              form.setError('targetGroup', {
                type: 'manual',
                message: 'Please select at least one target group'
              });
            }
            console.log('Selected domains:', selectedDomains);
            console.log('Selected target groups:', selectedTargetGroups);
          }}
        >
          Continue to Registration Form
        </Button>
      </div>

      {/* Show all form errors */}
      {Object.keys(form.formState.errors).length > 0 && (
        <div className="text-red-500 mt-4 p-4 border border-red-300 rounded">
          <h4 className="font-semibold mb-2">Please fix the following errors:</h4>
          <ul className="list-disc pl-4">
            {Object.entries(form.formState.errors).map(([field, error]) => (
              <li key={field}>
                {field}: {error?.message}
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}