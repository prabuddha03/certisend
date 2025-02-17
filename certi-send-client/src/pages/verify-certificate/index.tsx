import React from 'react';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export function VerifyCertificate() {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Verify Certificate</h1>
        <p className="text-zinc-400">
          Enter your name and contact number to verify your certificate
        </p>
      </div>

      <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
        <form className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Name
            </label>
            <Input placeholder="Enter your full name" />
          </div>
          <div>
            <label className="block text-sm font-medium text-zinc-400 mb-1">
              Contact Number
            </label>
            <Input placeholder="Enter your contact number" />
          </div>
          <Button className="w-full">
            <Search className="h-4 w-4 mr-2" />
            Verify Certificate
          </Button>
        </form>
      </div>
    </div>
  );
}