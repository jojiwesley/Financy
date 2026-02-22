"use client";

import { cn } from "@/lib/utils";

interface TimeInputProps {
  value: string;
  onChange: (value: string) => void;
  id?: string;
  className?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

/**
 * Text-based time input with HH:MM auto-mask.
 * Uses inputMode="numeric" so mobile shows a number keyboard
 * instead of the native time wheel/roller picker.
 */
export function TimeInput({
  value,
  onChange,
  id,
  className,
  placeholder = "HH:MM",
  required,
  disabled,
}: TimeInputProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value.replace(/\D/g, "").slice(0, 4);

    if (raw.length === 0) {
      onChange("");
      return;
    }

    if (raw.length <= 2) {
      onChange(raw);
      return;
    }

    const hoursStr = raw.slice(0, 2);
    const minsStr = raw.slice(2, 4);

    const h = parseInt(hoursStr, 10);
    const validHours = h > 23 ? "23" : hoursStr;

    const m = parseInt(minsStr, 10);
    const validMins = m > 59 ? "59" : minsStr;

    onChange(`${validHours}:${validMins}`);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && value.endsWith(":")) {
      e.preventDefault();
      onChange(value.slice(0, -2));
    }
  }

  // Display: if value is raw digits (e.g. "08") show as-is; if complete "HH:MM" show as-is
  const display = value;

  return (
    <input
      type="text"
      inputMode="numeric"
      id={id}
      value={display}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
      maxLength={5}
      autoComplete="off"
      className={cn(className)}
    />
  );
}
