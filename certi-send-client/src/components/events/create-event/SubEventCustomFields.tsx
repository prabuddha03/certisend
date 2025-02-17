import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { FormField } from '@/types/event.types';
import { Plus, X } from 'lucide-react';

interface Props {
  existingFields: FormField[];
  onFieldsChange: (fields: FormField[]) => void;
  maxFields?: number;
}

export function SubEventCustomFields({ existingFields, onFieldsChange, maxFields = 10 }: Props) {
  const [fields, setFields] = useState<FormField[]>(existingFields);

  const FIELD_TYPES = [
    { value: 'text', label: 'Short Text' },
    { value: 'textarea', label: 'Long Text' },
    { value: 'number', label: 'Number' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'select', label: 'Dropdown' },
    { value: 'radio', label: 'Single Choice' },
    { value: 'checkbox', label: 'Multiple Choice' },
  ];

  const handleAddField = () => {
    if (fields.length >= maxFields) {
      return;
    }

    const newField: FormField = {
      fieldName: '',
      label: '',
      type: 'text',
      required: false,
      options: [],
    };

    const updatedFields = [...fields, newField];
    setFields(updatedFields);
    onFieldsChange(updatedFields);
  };

  const handleRemoveField = (index: number) => {
    const updatedFields = fields.filter((_, i) => i !== index);
    setFields(updatedFields);
    onFieldsChange(updatedFields);
  };

  const handleFieldChange = (index: number, field: Partial<FormField>) => {
    const updatedFields = fields.map((f, i) => {
      if (i === index) {
        return { ...f, ...field };
      }
      return f;
    });
    setFields(updatedFields);
    onFieldsChange(updatedFields);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Label>Custom Registration Fields</Label>
        <Button
          onClick={handleAddField}
          disabled={fields.length >= maxFields}
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Field
        </Button>
      </div>

      <div className="space-y-4">
        {fields.map((field, index) => (
          <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg">
            <div className="flex-1 space-y-4">
              <Input
                value={field.fieldName}
                onChange={(e) => handleFieldChange(index, { fieldName: e.target.value })}
                placeholder="Field Name"
              />

              <Select
                value={field.type}
                onValueChange={(value) => handleFieldChange(index, { type: value })}
                options={FIELD_TYPES}
              />

              {['select', 'radio', 'checkbox'].includes(field.type) && (
                <div className="space-y-2">
                  <Label>Options (one per line)</Label>
                  <textarea
                    value={field.options?.join('\n')}
                    onChange={(e) => handleFieldChange(index, {
                      options: e.target.value.split('\n').filter(Boolean)
                    })}
                    className="w-full min-h-[100px] p-2 rounded-md border"
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Switch
                  checked={field.required}
                  onCheckedChange={(checked) => handleFieldChange(index, { required: checked })}
                />
                <Label>Required</Label>
              </div>
            </div>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => handleRemoveField(index)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}