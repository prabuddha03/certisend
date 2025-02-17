import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function EventForm() {
  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
      <h2 className="text-lg font-semibold mb-4">Event Details</h2>
      <form className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">
            Event Name
          </label>
          <Input placeholder="Enter event name" />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">
            Event Date
          </label>
          <Input type="date" />
        </div>
        <div>
          <label className="block text-sm font-medium text-zinc-400 mb-1">
            Description
          </label>
          <textarea 
            className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-zinc-50 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400"
            rows={4}
            placeholder="Enter event description"
          />
        </div>
      </form>
    </div>
  );
}