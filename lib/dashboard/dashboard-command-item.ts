export type DashboardCommandItem = {
  id: string;
  label: string;
  detail?: string;
  kind: "Client" | "Coach" | "Lead" | "Group";
  href: string;
  initials: string;
  tone?: "avatar-red" | "avatar-violet" | "avatar-blue";
};
