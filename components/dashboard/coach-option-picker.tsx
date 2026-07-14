"use client";

import { useDeferredValue, useMemo, useState } from "react";
import type { AdminSessionCoachOption } from "@/lib/repositories/admin-session-repository";

type CoachOptionPickerProps = {
  value: string;
  onChange: (value: string) => void;
  options: AdminSessionCoachOption[];
};

export function CoachOptionPicker({
  value,
  onChange,
  options,
}: CoachOptionPickerProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const deferredSearchTerm = useDeferredValue(searchTerm);

  const filteredOptions = useMemo(() => {
    const query = deferredSearchTerm.trim().toLowerCase();

    if (query.length === 0) {
      return options;
    }

    return options.filter((option) =>
      option.fullName.toLowerCase().includes(query)
    );
  }, [deferredSearchTerm, options]);

  return (
    <div className="dashboard-coach-picker">
      <input
        className="dashboard-input"
        type="search"
        aria-label="Search coaches by name"
        placeholder="Search coaches by name"
        value={searchTerm}
        onChange={(event) => setSearchTerm(event.target.value)}
      />

      {filteredOptions.length > 0 ? (
        <>
          <select
            className="dashboard-select"
            aria-label="Select coach for assignment"
            value={
              filteredOptions.some((coach) => coach.id === value)
                ? value
                : filteredOptions[0]?.id ?? ""
            }
            onChange={(event) => onChange(event.target.value)}
          >
            {filteredOptions.map((coach) => (
              <option key={coach.id} value={coach.id}>
                {coach.fullName}
              </option>
            ))}
          </select>
          <p className="dashboard-coach-picker__summary">
            Selected coach:{" "}
            <strong>
              {filteredOptions.find((coach) => coach.id === value)?.fullName ??
                filteredOptions[0]?.fullName ??
                "None"}
            </strong>
          </p>
        </>
      ) : (
        <div className="dashboard-empty-state">
          <strong>No coaches match this search</strong>
          <p>Clear the search to see every coach available for assignment.</p>
        </div>
      )}
    </div>
  );
}
