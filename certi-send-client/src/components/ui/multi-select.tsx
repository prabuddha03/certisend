import * as React from "react";
import { X } from "lucide-react";
import { Badge } from "./badge";
import { Command, CommandGroup, CommandItem } from "./command";
import { Command as CommandPrimitive } from "cmdk";

interface MultiSelectProps {
  options: { value: string; label: string }[];
  selected: string[];
  onChange: (selected: string[]) => void;
  placeholder?: string;
  className?: string;
  error?: string;
  label?: string;
}

export const MultiSelect = React.forwardRef<HTMLDivElement, MultiSelectProps>(
  ({ options, selected = [], onChange, placeholder = "Select items...", className, error, label }, ref) => {
    const inputRef = React.useRef<HTMLInputElement>(null);
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState("");

    const handleUnselect = (item: string) => {
      onChange(selected.filter((i) => i !== item));
    };

    const handleSelect = (value: string) => {
      setInputValue("");
      onChange([...selected, value]);
      // Keep the dropdown open after selection
      setOpen(true);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      const input = inputRef.current;
      if (input) {
        if (e.key === "Delete" || e.key === "Backspace") {
          if (input.value === "" && selected.length > 0) {
            handleUnselect(selected[selected.length - 1]);
          }
        }
        if (e.key === "Escape") {
          input.blur();
          setOpen(false);
        }
      }
    };

    const selectables = options.filter((item) => !selected.includes(item.value));

    return (
      <div className="space-y-1 relative">
        {label && <label className="text-sm font-medium">{label}</label>}
        <Command
          onKeyDown={handleKeyDown}
          className="overflow-visible bg-transparent"
        >
          <div
            className={`group rounded-md border border-input px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${error ? 'border-red-500' : ''}`}
            onClick={() => setOpen(true)}
          >
            <div className="flex flex-wrap gap-1">
              {selected.map((item) => (
                <Badge key={item} variant="secondary">
                  {item}
                  <button
                    type="button"
                    className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleUnselect(item);
                      }
                    }}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleUnselect(item);
                    }}
                  >
                    <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                  </button>
                </Badge>
              ))}
              <CommandPrimitive.Input
                ref={inputRef}
                value={inputValue}
                onValueChange={setInputValue}
                onBlur={() => setTimeout(() => setOpen(false), 200)}
                onFocus={() => setOpen(true)}
                placeholder={selected.length === 0 ? placeholder : undefined}
                className="ml-2 bg-transparent outline-none placeholder:text-muted-foreground flex-1"
              />
            </div>
          </div>
          {open && selectables.length > 0 && (
            <div className="absolute w-full mt-2 rounded-md border bg-white dark:bg-gray-800 shadow-lg z-50">
              <CommandGroup className="max-h-[200px] overflow-auto p-1">
                {selectables.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.value}
                    onSelect={() => handleSelect(option.value)}
                    className="cursor-pointer px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground rounded-sm"
                  >
                    {option.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </div>
          )}
        </Command>
        {error && (
          <p className="text-sm text-red-500 mt-1">{error}</p>
        )}
      </div>
    );
  }
);

MultiSelect.displayName = "MultiSelect";