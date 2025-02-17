import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'react-hot-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { FormField } from '@/types/event.types';

interface Props {
  onImport: (fields: FormField[]) => void;
}

export function GoogleFormImport({ onImport }: Props) {
  const [formUrl, setFormUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const extractFormId = (url: string) => {
    // Handle viewform URLs
    const viewformMatch = url.match(/\/forms\/d\/e\/([^/]+)\/viewform/);
    if (viewformMatch) {
      let formId = viewformMatch[1];
      // Clean up the form ID
      formId = formId
        .replace('formResponse', '')
        .replace('1FAIpQLSc', '')
        .replace('1FAIpQLSd', '')
        .replace('1FAIpQLSe', '')
        .replace('1FAIpQLSf', '');
      return formId;
    }
    
    // Handle edit URLs
    const editMatch = url.match(/\/forms\/d\/([^/]+)\/edit/);
    if (editMatch) return editMatch[1];
    
    // Handle direct form URLs
    const directMatch = url.match(/\/forms\/([^/]+)/);
    return directMatch ? directMatch[1] : null;
  };

  const handleImport = async () => {
    try {
      setLoading(true);
      const formId = extractFormId(formUrl);
      
      if (!formId) {
        toast.error('Invalid Google Form URL');
        return;
      }

      console.log('Attempting to import form with ID:', formId); // Debug log
      
      const response = await fetch('http://localhost:3000/api/google-forms/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        credentials: 'include',
        body: JSON.stringify({ formUrl })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to import form');
      }

      const data = await response.json();
      
      if (data.success) {
        onImport(data.data.fields);
        setOpen(false);
        toast.success('Form fields imported successfully');
      }
    } catch (error: unknown) {
      console.error('Import error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to import Google Form';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          Import from Google Form
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Google Form Fields</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Google Form URL
            </label>
            <Input
              value={formUrl}
              onChange={(e) => setFormUrl(e.target.value)}
              placeholder="https://docs.google.com/forms/d/..."
            />
          </div>
          <Button
            onClick={handleImport}
            disabled={loading || !formUrl}
            className="w-full"
          >
            {loading ? 'Importing...' : 'Import Fields'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}