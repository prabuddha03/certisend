import * as React from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  minDate?: Date;
  maxDate?: Date;
}

export function DatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  ...props
}: DatePickerProps): JSX.Element {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline" 
          className={cn(
            "w-full justify-start text-left font-normal",
            !value && "text-muted-foreground"
          )}
          {...props}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "PPP") : <span>Pick a date</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={onChange}
          initialFocus
          minDate={minDate}
          maxDate={maxDate}
        />
      </PopoverContent>
    </Popover>
  );
}