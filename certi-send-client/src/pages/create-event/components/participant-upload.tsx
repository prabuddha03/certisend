import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export function ParticipantUpload() {
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'text/csv': ['.csv']
    },
    onDrop: (files) => console.log(files)
  });

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
      <h2 className="text-lg font-semibold mb-4">Participants</h2>
      
      <div {...getRootProps()} className="border-2 border-dashed border-zinc-800 rounded-lg p-8 text-center mb-6">
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 mx-auto mb-4 text-zinc-400" />
        <p className="text-sm text-zinc-400">
          Drag and drop your CSV file here, or click to select
        </p>
        <p className="text-xs text-zinc-500 mt-2">
          Supported format: CSV with name and contact columns
        </p>
      </div>

      <div className="border-t border-zinc-800 pt-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-medium">Manual Entry</h3>
          <Button size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Add Participant
          </Button>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input placeholder="Name" />
            <Input placeholder="Contact Number" />
          </div>
        </div>
      </div>
    </div>
  );
}