import { redirect } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { getCurrentMembership } from "@/lib/workspace";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const auth = await getCurrentMembership();

  if (!auth?.user) {
    redirect("/login");
  }

  return <DashboardShell>{children}</DashboardShell>;
}
