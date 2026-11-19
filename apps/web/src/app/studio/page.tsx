import type { Metadata } from "next";

import { StudentReview } from "~/features/studio/components/student-review";

export const metadata: Metadata = { title: "Student approvals" };

export default function StudioPage() {
  return (
    <div className="w-full max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Student approvals</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review students who sign in with a personal email.
        </p>
      </div>
      <StudentReview />
    </div>
  );
}
