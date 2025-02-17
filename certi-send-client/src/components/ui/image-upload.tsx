import { useState } from 'react';
import { Button } from './button';
import { Label } from './label';
import { Upload, X } from 'lucide-react';

interface ImageUploadProps {
  onUpload: (file: File | null) => void;
  value?: File | string;
  onChange: (value: File | string | undefined) => void;
}

export function ImageUpload({ onUpload, value, onChange }: ImageUploadProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
    }
  };

  const handleRemove = () => {
    onChange(undefined);
    onUpload(null);
  };

  return (
    <div>
      {value ? (
        <div className="relative">
          <img
            src={value instanceof File ? URL.createObjectURL(value) : value}
            alt="Preview"
            className="max-w-xs rounded"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded"
          >
            Remove
          </button>
        </div>
      ) : (
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-primary file:text-white
            hover:file:bg-primary/90"
        />
      )}
    </div>
  );
}