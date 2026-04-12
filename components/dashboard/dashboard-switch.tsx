type DashboardSwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  description: string;
  disabled?: boolean;
};

export function DashboardSwitch({
  checked,
  onCheckedChange,
  label,
  description,
  disabled = false,
}: DashboardSwitchProps) {
  return (
    <div className="dashboard-switch">
      <div className="dashboard-switch__copy">
        <strong>{label}</strong>
        <p>{description}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-disabled={disabled}
        aria-label={`${checked ? "Disable" : "Enable"} ${label}`}
        disabled={disabled}
        className={checked ? "dashboard-switch__control dashboard-switch__control--on" : "dashboard-switch__control"}
        onClick={() => {
          if (!disabled) {
            onCheckedChange(!checked);
          }
        }}
      >
        <span className="dashboard-switch__thumb" />
      </button>
    </div>
  );
}
