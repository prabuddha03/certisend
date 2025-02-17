import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/types/event.types';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';

interface Props {
  field: FormField & { index?: number };
  onSave: (field: FormField, index: number | null) => void;
  onCancel: () => void;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Short Text' },
  { value: 'textarea', label: 'Long Text' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'number', label: 'Number' },
  { value: 'date', label: 'Date' },
  { value: 'select', label: 'Dropdown' },
  { value: 'radio', label: 'Multiple Choice (Single Select)' },
  { value: 'checkbox', label: 'Multiple Choice (Multi Select)' }
];

export function FormFieldEditor({ field, onSave, onCancel }: Props) {
  const [editedField, setEditedField] = useState<FormField>({ ...field });
  const [options, setOptions] = useState<Array<{ id: string; value: string }>>(
    (field.options || []).map(opt => ({
      id: `option-${opt}-${Math.random().toString(36).substr(2, 9)}`,
      value: opt
    }))
  );
  const [newOption, setNewOption] = useState('');

  const handleSave = () => {
    const label = editedField.fieldName
      .split(/(?=[A-Z])|_|-/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    const finalField = {
      ...editedField,
      label,
      options: ['select', 'radio', 'checkbox'].includes(editedField.type) 
        ? options.map(opt => opt.value) 
        : undefined
    };
    onSave(finalField, field.index ?? null);
  };

  const handleAddOption = () => {
    if (newOption && !options.some(opt => opt.value === newOption)) {
      setOptions([...options, {
        id: `option-${newOption}-${Math.random().toString(36).substr(2, 9)}`,
        value: newOption
      }]);
      setNewOption('');
    }
  };

  const handleRemoveOption = (index: number) => {
    setOptions(options.filter((_, i) => i !== index));
  };

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    
    const items = Array.from(options);
    const [removed] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, removed);
    
    setOptions(items);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-medium mb-4 text-zinc-50">
          {field.index !== undefined ? 'Edit Field' : 'Add Field'}
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">
              Field Name
            </label>
            <Input
              value={editedField.fieldName}
              onChange={(e) => setEditedField({
                ...editedField,
                fieldName: e.target.value
              })}
              placeholder="e.g., collegeName"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1 text-zinc-50">
              Field Type
            </label>
            <select
              value={editedField.type}
              onChange={(e) => setEditedField({
                ...editedField,
                type: e.target.value as FormField['type']
              })}
              className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-3 py-2"
            >
              {FIELD_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {['select', 'radio', 'checkbox'].includes(editedField.type) && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Options
              </label>
              <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="options-list">
                  {(provided) => (
                    <div 
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-2"
                    >
                      {options.map((option, index) => (
                        <Draggable 
                          key={option.id}
                          draggableId={option.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`flex items-center space-x-2 ${
                                snapshot.isDragging ? 'opacity-50' : ''
                              }`}
                            >
                              <div 
                                {...provided.dragHandleProps}
                                className="cursor-move p-2"
                              >
                                ⋮
                              </div>
                              <Input value={option.value} disabled />
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRemoveOption(index)}
                              >
                                Remove
                              </Button>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
              
              <div className="flex items-center space-x-2 mt-2">
                <Input
                  value={newOption}
                  onChange={(e) => setNewOption(e.target.value)}
                  placeholder="Add new option"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddOption();
                    }
                  }}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddOption}
                >
                  Add
                </Button>
              </div>
            </div>
          )}

          <label className="flex items-center space-x-2 text-zinc-50">
            <input
              type="checkbox"
              checked={editedField.required}
              onChange={(e) => setEditedField({
                ...editedField,
                required: e.target.checked
              })}
              className="rounded border-zinc-800 bg-zinc-950"
            />
            <span>Required field</span>
          </label>
        </div>

        <div className="flex justify-end space-x-4 mt-6">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save Field
          </Button>
        </div>
      </div>
    </div>
  );
}