import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import React from "react";

interface TimePickerProps {
  value: string;
  setTime: (time: string) => void;
}

export function TimePickerDemo({ value, setTime }: TimePickerProps) {
  const minuteRef = React.useRef<HTMLInputElement>(null);
  const hourRef = React.useRef<HTMLInputElement>(null);
  const [hour, setHour] = React.useState(value ? value.split(":")[0] : "00");
  const [minute, setMinute] = React.useState(value ? value.split(":")[1] : "00");

  const handleHourChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setHour("");
      return;
    }

    const numericValue = parseInt(value);
    if (isNaN(numericValue)) return;

    if (numericValue > 23) {
      setHour("23");
      setTime(`23:${minute}`);
    } else if (numericValue < 0) {
      setHour("00");
      setTime(`00:${minute}`);
    } else {
      const formattedHour = numericValue.toString().padStart(2, "0");
      setHour(formattedHour);
      setTime(`${formattedHour}:${minute}`);
    }

    if (value.length === 2) {
      minuteRef.current?.focus();
    }
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value === "") {
      setMinute("");
      return;
    }

    const numericValue = parseInt(value);
    if (isNaN(numericValue)) return;

    if (numericValue > 59) {
      setMinute("59");
      setTime(`${hour}:59`);
    } else if (numericValue < 0) {
      setMinute("00");
      setTime(`${hour}:00`);
    } else {
      const formattedMinute = numericValue.toString().padStart(2, "0");
      setMinute(formattedMinute);
      setTime(`${hour}:${formattedMinute}`);
    }
  };

  return (
    <div className="flex items-end gap-2">
      <div className="grid gap-1 text-center">
        <Label htmlFor="hours" className="text-xs">
          Hours
        </Label>
        <Input
          ref={hourRef}
          id="hours"
          value={hour}
          onChange={handleHourChange}
          className={cn(
            "w-16 text-center",
            !hour && "text-muted-foreground"
          )}
          maxLength={2}
        />
      </div>
      <div className="grid gap-1 text-center">
        <Label htmlFor="minutes" className="text-xs">
          Minutes
        </Label>
        <Input
          ref={minuteRef}
          id="minutes"
          value={minute}
          onChange={handleMinuteChange}
          className={cn(
            "w-16 text-center",
            !minute && "text-muted-foreground"
          )}
          maxLength={2}
        />
      </div>
    </div>
  );
}