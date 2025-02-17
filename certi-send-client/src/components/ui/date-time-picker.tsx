import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon} from 'lucide-react';
import { TimePickerDemo } from './time-picker';
import { Button } from './button';

interface DateTimePickerProps {
  date?: Date;
  setDate?: (date: Date) => void;
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}

export function DateTimePicker({
  label,
  value,
  onChange,
  minDate,
  maxDate,
}: DateTimePickerProps) {
  const [selectedDateTime, setSelectedDateTime] = useState<Date>(value);

  const handleSelect = (date: Date | undefined) => {
    if (date) {
      const newDateTime = new Date(selectedDateTime);
      newDateTime.setFullYear(date.getFullYear());
      newDateTime.setMonth(date.getMonth());
      newDateTime.setDate(date.getDate());
      setSelectedDateTime(newDateTime);
      onChange(newDateTime);
    }
  };

  const handleTimeChange = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const newDateTime = new Date(selectedDateTime);
    newDateTime.setHours(hours);
    newDateTime.setMinutes(minutes);
    setSelectedDateTime(newDateTime);
    onChange(newDateTime);
  };

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              'w-full justify-start text-left font-normal',
              !value && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, 'PPP HH:mm') : <span>Pick date and time</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            mode="single"
            selected={selectedDateTime}
            onSelect={handleSelect}
            disabled={(date) => {
              if (minDate && date < minDate) return true;
              if (maxDate && date > maxDate) return true;
              return false;
            }}
          />
          <div className="p-4 border-t border-border">
            <TimePickerDemo
              setTime={handleTimeChange}
              value={format(selectedDateTime, 'HH:mm')}
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}