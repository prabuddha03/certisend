import React from 'react';
import { Calendar, Users, MoreVertical } from 'lucide-react';

export function EventList() {
  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800">
      <div className="p-6">
        <h2 className="text-lg font-semibold mb-4">Recent Events</h2>
        <div className="space-y-4">
          <div className="text-center text-zinc-400 py-8">
            <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No events created yet</p>
            <p className="text-sm">Create your first event to get started</p>
          </div>
        </div>
      </div>
    </div>
  );
}