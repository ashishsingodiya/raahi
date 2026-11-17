import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function StudioDashboardPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Overview of your workspace and platform activity.
      </p>
      <div className="mt-8 rounded-xl border border-dashed bg-card/50 p-12 text-center text-sm text-muted-foreground">
        Dashboard analytics and recent activity coming soon.
      </div>
    </div>
  );
}
