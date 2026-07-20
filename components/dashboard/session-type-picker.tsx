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
    description: "Multi-client class booked from a linked group.",
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
  // Arrow-key navigation for the radiogroup (WAI-ARIA radio group pattern).
  const moveSelection = (direction: 1 | -1) => {
    const currentIndex = sessionTypeOptions.findIndex(
      (option) => option.value === value
    );
    const nextIndex =
      (currentIndex + direction + sessionTypeOptions.length) %
      sessionTypeOptions.length;
    onChange(sessionTypeOptions[nextIndex].value);
  };

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
            // Roving tabindex: only the checked radio is in the tab order.
            tabIndex={isActive ? 0 : -1}
            className={cn(
              "dashboard-type-picker__option",
              isActive && "dashboard-type-picker__option--active"
            )}
            onClick={() => onChange(option.value)}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight" || event.key === "ArrowDown") {
                event.preventDefault();
                moveSelection(1);
              } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
                event.preventDefault();
                moveSelection(-1);
              }
            }}
          >
            <strong>{option.label}</strong>
            <span>{option.description}</span>
          </button>
        );
      })}
    </div>
  );
}
