// All dashboard pages query the database — never statically generate them.
export const dynamic = "force-dynamic";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
