import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { DateTimePicker } from '@/components/ui/date-time-picker';


import { Label } from '@/components/ui/label';
import { Plus, X, ChevronDown, ChevronUp } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FormField } from '@/types/event.types';

interface SubEvent {
  name: string;
  approximateParticipants: number;
  startTime: Date;
  endTime: Date;
  prizeMoney?: number;
  prizes: string[];
  registrationType: 'free' | 'paid';
  registrationFee?: number;
  participationType: 'solo' | 'team';
  teamSize?: {
    min: number;
    max: number;
  };
  eventPOCs: {
    name: string;
    contact: string;
    email: string;
  }[];
  rules: string[];
  judges?: string[];
  speakers?: string[];
  guests?: string[];
  categories: string[];
  description: string;
  specificVenue: string;
  customFields: FormField[];
}

interface Props {
  onSubmit: (subEvents: SubEvent[]) => void;
  eventDates: Date[];
  mainEventPOCs: { name: string; contact: string; email: string; }[];
}

export function SubEventForm({ onSubmit, eventDates, mainEventPOCs }: Props) {
  const [subEvents, setSubEvents] = useState<SubEvent[]>([]);
  const [currentSubEvent, setCurrentSubEvent] = useState<SubEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const EVENT_CATEGORIES = [
    'Quiz', 'Dance', 'Singing', 'Coding', 'Debate', 'Sports',
    'Art', 'Photography', 'Gaming', 'General', 'Conference', 'Other'
  ];

  const handleAddSubEvent = () => {
    setCurrentSubEvent({
      name: '',
      approximateParticipants: 0,
      startTime: eventDates[0],
      endTime: eventDates[0],
      prizes: [],
      registrationType: 'free',
      participationType: 'solo',
      eventPOCs: [],
      rules: [],
      categories: [],
      description: '',
      specificVenue: '',
      customFields: []
    });
    setIsDialogOpen(true);
  };

  const handleSaveSubEvent = () => {
    if (currentSubEvent) {
      setSubEvents([...subEvents, currentSubEvent]);
      setCurrentSubEvent(null);
      setIsDialogOpen(false);
    }
  };

  const handleDeleteSubEvent = (index: number) => {
    setSubEvents(subEvents.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    onSubmit(subEvents);
  };

  console.log('Current state:', { subEvents, currentSubEvent, isDialogOpen, expandedIndex });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Sub Events</h2>
        <Button onClick={handleAddSubEvent}>
          <Plus className="w-4 h-4 mr-2" />
          Add Sub Event
        </Button>
      </div>

      <div className="space-y-4">
        {subEvents.map((subEvent, index) => (
          <div key={index} className="border rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <h3 className="text-lg font-medium">{subEvent.name}</h3>
                <span className="text-sm text-zinc-400">
                  {subEvent.participationType} event
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                >
                  {expandedIndex === index ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteSubEvent(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {expandedIndex === index && (
              <div className="mt-4 space-y-4">
                <p className="text-sm">{subEvent.description}</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Start Time</Label>
                    <div>{subEvent.startTime.toLocaleString()}</div>
                  </div>
                  <div>
                    <Label>End Time</Label>
                    <div>{subEvent.endTime.toLocaleString()}</div>
                  </div>
                </div>
                {/* Add more details as needed */}
              </div>
            )}
          </div>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Sub Event</DialogTitle>
          </DialogHeader>

          {currentSubEvent && (
            <div className="space-y-6">
              <Input
                label="Sub Event Name"
                value={currentSubEvent.name}
                onChange={(e) => setCurrentSubEvent({
                  ...currentSubEvent,
                  name: e.target.value
                })}
              />

              <Input
                type="number"
                label="Approximate Participants"
                value={currentSubEvent.approximateParticipants}
                onChange={(e) => setCurrentSubEvent({
                  ...currentSubEvent,
                  approximateParticipants: parseInt(e.target.value)
                })}
              />

              <div className="grid grid-cols-2 gap-4">
                <DateTimePicker
                  label="Start Time"
                  value={currentSubEvent.startTime}
                  onChange={(date) => setCurrentSubEvent({
                    ...currentSubEvent,
                    startTime: date
                  })}
                  minDate={eventDates[0]}
                  maxDate={eventDates[eventDates.length - 1]}
                />

                <DateTimePicker
                  label="End Time"
                  value={currentSubEvent.endTime}
                  onChange={(date) => setCurrentSubEvent({
                    ...currentSubEvent,
                    endTime: date
                  })}
                  minDate={currentSubEvent.startTime}
                  maxDate={eventDates[eventDates.length - 1]}
                />
              </div>

              {/* Continue with other fields */}
              <div className="flex justify-end space-x-4">
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSaveSubEvent}>
                  Save Sub Event
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => onSubmit([])}>
          Skip Sub Events
        </Button>
        <Button 
          onClick={handleSubmit}
          disabled={subEvents.length === 0}
        >
          Create Event
        </Button>
      </div>
    </div>
  );
}
