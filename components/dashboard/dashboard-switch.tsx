type DashboardSwitchProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  description: string;
};

export function DashboardSwitch({
  checked,
  onCheckedChange,
  label,
  description,
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
        aria-label={`${checked ? "Disable" : "Enable"} ${label}`}
        className={checked ? "dashboard-switch__control dashboard-switch__control--on" : "dashboard-switch__control"}
        onClick={() => onCheckedChange(!checked)}
      >
        <span className="dashboard-switch__thumb" />
      </button>
    </div>
  );
}
