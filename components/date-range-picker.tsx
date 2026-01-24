"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import {
  format,
  subDays,
  subMonths,
  subYears,
  startOfDay,
  endOfDay,
} from "date-fns";
import { DateRange } from "react-day-picker";

import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface DateRangePickerProps {
  value?: DateRange;
  onChange: (range: DateRange | undefined) => void;
  className?: string;
}

const presets = [
  {
    label: "Last 7 days",
    getValue: () => ({
      from: startOfDay(subDays(new Date(), 7)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "Last 30 days",
    getValue: () => ({
      from: startOfDay(subDays(new Date(), 30)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "Last 3 months",
    getValue: () => ({
      from: startOfDay(subMonths(new Date(), 3)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "Last 6 months",
    getValue: () => ({
      from: startOfDay(subMonths(new Date(), 6)),
      to: endOfDay(new Date()),
    }),
  },
  {
    label: "Last year",
    getValue: () => ({
      from: startOfDay(subYears(new Date(), 1)),
      to: endOfDay(new Date()),
    }),
  },
];

export function DateRangePicker({
  value,
  onChange,
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-mono",
              !value && "text-terminal-text-muted",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, "LLL dd, y")} -{" "}
                  {format(value.to, "LLL dd, y")}
                </>
              ) : (
                format(value.from, "LLL dd, y")
              )
            ) : (
              <span>Pick a date range</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <div className="flex">
            <div className="border-r border-terminal-green/20 p-3 space-y-1">
              <div className="text-xs font-semibold text-terminal-green mb-2">
                Presets
              </div>
              {presets.map((preset) => (
                <Button
                  key={preset.label}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start font-mono text-xs"
                  onClick={() => {
                    onChange(preset.getValue());
                    setIsOpen(false);
                  }}
                >
                  {preset.label}
                </Button>
              ))}
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start font-mono text-xs text-terminal-text-muted"
                onClick={() => {
                  onChange(undefined);
                  setIsOpen(false);
                }}
              >
                Clear
              </Button>
            </div>
            <div>
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={value?.from}
                selected={value}
                onSelect={onChange}
                numberOfMonths={2}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
