import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { FormFieldEditor } from './FormFieldEditor';
import { FormField } from '@/types/event.types';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { GripVertical } from 'lucide-react';
import { toast } from 'react-hot-toast';


interface Props {
  onSubmit: (fields: FormField[]) => void;
  fields: FormField[];
  onFieldsChange: (fields: FormField[]) => void;
  isSubmitting: boolean;
}

const DEFAULT_FIELDS: FormField[] = [
  {
    fieldName: 'name',
    label: 'Full Name',
    type: 'text',
    required: true,
    isDefault: true,
  },
  {
    fieldName: 'email',
    label: 'Email Address',
    type: 'email',
    required: true,
    isDefault: true,
  },
  {
    fieldName: 'phone',
    label: 'Phone Number',
    type: 'phone',
    required: true,
    isDefault: true,
  },
];

export function RegistrationForm({ onSubmit, fields, onFieldsChange, isSubmitting }: Props) {
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (fields.length === 0) {
      onFieldsChange(DEFAULT_FIELDS);
    }
    return () => setMounted(false);
  }, []);

  const generateFieldId = (field: FormField, index: number) => {
    return `draggable-field-${index}`;
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;

    if (fields[sourceIndex].isDefault || fields[destinationIndex].isDefault) {
      return;
    }

    const reorderedFields = Array.from(fields);
    const [removed] = reorderedFields.splice(sourceIndex, 1);
    reorderedFields.splice(destinationIndex, 0, removed);

    onFieldsChange(reorderedFields);
  };

  const handleAddField = () => {
    setEditingField({
      fieldName: '',
      label: '',
      type: 'text',
      required: false,
      isDefault: false,
    });
  };

  const handleFieldSave = (field: FormField, index: number | null) => {
    const newFields = [...fields];
    const fieldWithoutId = {
      ...field
    };

    if (index !== null) {
      newFields[index] = fieldWithoutId;
    } else {
      newFields.push(fieldWithoutId);
    }
    onFieldsChange(newFields);
    setEditingField(null);
  };

  const handleFieldEdit = (field: FormField, index: number) => {
    if (field.isDefault) return;
    setEditingField({ ...field, index});
  };

  const handleFieldDelete = (index: number) => {
    const field = fields[index];
    if (field.isDefault) return;
    const newFields = fields.filter((_, i) => i !== index);
    onFieldsChange(newFields);
  };

  const handleCreateEvent = async () => {
    try {
      // Validate fields before submission
      if (fields.length === 0) {
        toast.error('Please add at least one field to the registration form');
        return;
      }

      // Make sure required fields have values
      const missingRequiredFields = fields.filter(
        field => field.required && (!field.fieldName || !field.label)
      );

      if (missingRequiredFields.length > 0) {
        toast.error('Please fill in all required fields');
        return;
      }

      // Submit the form
      await onSubmit(fields);
      //navigate('/dashboard');
      
    } catch (error: any) {
      console.error('Error creating event:', error);
      toast.error(error.message || 'Failed to create event. Please try again.');
    }
  };

  if (!mounted) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Registration Form</h2>
        <Button onClick={handleAddField} variant="outline">
          Add Field
        </Button>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="registration-form-fields">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-4"
            >
              {fields.map((field, index) => (
                <Draggable
                  key={generateFieldId(field, index)}
                  draggableId={generateFieldId(field, index)}
                  index={index}
                  isDragDisabled={field.isDefault}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`border rounded-lg p-4 ${
                        field.isDefault 
                          ? 'bg-zinc-800/50 border-zinc-700' 
                          : 'bg-transparent border-zinc-800 hover:border-zinc-700'
                      } ${snapshot.isDragging ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          {!field.isDefault && (
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="h-5 w-5 text-zinc-500 cursor-move" />
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-medium">{field.label}</h3>
                              {field.isDefault && (
                                <span className="text-xs px-2 py-0.5 bg-zinc-700 text-zinc-300 rounded">
                                  Default
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-zinc-400">
                              Type: {field.type} | {field.required ? 'Required' : 'Optional'}
                            </p>
                          </div>
                        </div>
                        {!field.isDefault && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleFieldEdit(field, index)}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleFieldDelete(index)}
                            >
                              Delete
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {editingField && (
        <FormFieldEditor
          field={editingField}
          onSave={handleFieldSave}
          onCancel={() => setEditingField(null)}
        />
      )}

      <div className="flex justify-end space-x-4">
        <Button 
          onClick={handleCreateEvent}
          disabled={isSubmitting || fields.length === 0}
        >
          {isSubmitting ? 'Creating Event...' : 'Create Event'}
        </Button>
      </div>
    </div>
  );
}