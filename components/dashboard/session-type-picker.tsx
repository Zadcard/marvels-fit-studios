"use client";

import { cn } from "@/lib/utils";

type SessionType = "GROUP" | "PRIVATE";

type SessionTypePickerProps = {
  value: SessionType;
  onChange: (value: SessionType) => void;
};

const sessionTypeOptions: Array<{
  value: SessionType;
  label: string;
  description: string;
}> = [
  {
    value: "GROUP",
    label: "Group",
    description: "Multi-client class with adjustable capacity.",
  },
  {
    value: "PRIVATE",
    label: "Private",
    description: "One-to-one session with a single client slot.",
  },
];

export function SessionTypePicker({
  value,
  onChange,
}: SessionTypePickerProps) {
  return (
    <div className="dashboard-type-picker" role="radiogroup" aria-label="Session type">
      {sessionTypeOptions.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isActive}
            className={cn(
              "dashboard-type-picker__option",
              isActive && "dashboard-type-picker__option--active"
            )}
            onClick={() => onChange(option.value)}
          >
            <strong>{option.label}</strong>
            <span>{option.description}</span>
          </button>
        );
      })}
    </div>
  );
}
