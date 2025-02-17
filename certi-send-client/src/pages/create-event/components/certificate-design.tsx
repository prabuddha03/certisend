import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function CertificateDesign() {
  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg']
    },
    maxFiles: 1,
    onDrop: (files) => console.log(files)
  });

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
      <h2 className="text-lg font-semibold mb-4">Certificate Design</h2>
      
      <div {...getRootProps()} className="border-2 border-dashed border-zinc-800 rounded-lg p-8 text-center">
        <input {...getInputProps()} />
        <Upload className="h-8 w-8 mx-auto mb-4 text-zinc-400" />
        <p className="text-sm text-zinc-400">
          Drag and drop your certificate template here, or click to select
        </p>
        <p className="text-xs text-zinc-500 mt-2">
          Supported formats: PNG, JPG (Recommended size: 1920x1080px)
        </p>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-medium mb-4">Preview</h3>
        <div className="aspect-video bg-zinc-800 rounded-lg flex items-center justify-center">
          <p className="text-zinc-400 text-sm">Certificate preview will appear here</p>
        </div>
      </div>
    </div>
  );
}