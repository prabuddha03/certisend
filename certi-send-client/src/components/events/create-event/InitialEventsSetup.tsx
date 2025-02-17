// src/components/events/create-event/InitialEventSetup.tsx

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

interface EventSetupData {
  eventType: 'individual' | 'mega';
  durationType: 'single' | 'multi';
  isTicketed: boolean;
}

export function InitialEventSetup({ onNext }: { onNext: (data: EventSetupData) => void }) {
  const [eventType, setEventType] = useState<'individual' | 'mega'>();
  const [durationType, setDurationType] = useState<'single' | 'multi'>();
  const [isTicketed, setIsTicketed] = useState(false);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">Select Event Type</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card
            className={`p-6 cursor-pointer ${
              eventType === 'individual' ? 'border-primary' : ''
            }`}
            onClick={() => setEventType('individual')}
          >
            <Users className="w-8 h-8 mb-2" />
            <h3 className="font-medium">Individual Event</h3>
            <p className="text-sm text-zinc-400">
              Single event with one registration form
            </p>
          </Card>
          <Card
            className={`p-6 cursor-pointer ${
              eventType === 'mega' ? 'border-primary' : ''
            }`}
            onClick={() => setEventType('mega')}
          >
            <Calendar className="w-8 h-8 mb-2" />
            <h3 className="font-medium">Mega Event</h3>
            <p className="text-sm text-zinc-400">
              Multiple sub-events under one main event
            </p>
          </Card>
        </div>
      </div>

      {eventType && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Select Duration Type</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card
              className={`p-6 cursor-pointer ${
                durationType === 'single' ? 'border-primary' : ''
              }`}
              onClick={() => setDurationType('single')}
            >
              <Calendar className="w-8 h-8 mb-2" />
              <h3 className="font-medium">Single Day</h3>
              <p className="text-sm text-zinc-400">
                Event happens on a single day
              </p>
            </Card>
            <Card
              className={`p-6 cursor-pointer ${
                durationType === 'multi' ? 'border-primary' : ''
              }`}
              onClick={() => setDurationType('multi')}
            >
              <Calendar className="w-8 h-8 mb-2" />
              <h3 className="font-medium">Multi Day</h3>
              <p className="text-sm text-zinc-400">
                Event spans multiple days (up to 4)
              </p>
            </Card>
          </div>
        </div>
      )}

      {eventType && durationType && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Ticketing</h2>
          <Card
            className={`p-6 cursor-pointer ${
              isTicketed ? 'border-primary' : ''
            }`}
            onClick={() => setIsTicketed(!isTicketed)}
          >
            <div className="flex items-center space-x-2">
              <Switch checked={isTicketed} />
              <div>
                <h3 className="font-medium">Enable Ticketing</h3>
                <p className="text-sm text-zinc-400">
                  Collect payment for event tickets
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {eventType && durationType && (
        <div className="flex justify-end">
          <Button
            onClick={() => onNext({ eventType, durationType, isTicketed })}
          >
            Continue
          </Button>
        </div>
      )}
    </div>
  );
}