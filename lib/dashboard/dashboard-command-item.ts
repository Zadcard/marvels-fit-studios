export type DashboardCommandItem = {
  id: string;
  label: string;
  detail?: string;
  kind: "Client" | "Coach";
  href: string;
  initials: string;
  tone?: "avatar-red" | "avatar-violet" | "avatar-blue";
};
