"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@ridemate/ui/components/avatar";
import { Button } from "@ridemate/ui/components/button";

import { useTRPC } from "~/trpc/react";

export function StudentReview() {
  const trpc = useTRPC();
  const client = useQueryClient();
  const pending = useQuery(trpc.student.pending.queryOptions());
  const review = useMutation(
    trpc.student.review.mutationOptions({
      onSettled: () =>
        client.invalidateQueries({ queryKey: trpc.student.pending.queryKey() }),
    }),
  );

  if (pending.isPending)
    return <p className="text-muted-foreground">Loading profiles…</p>;
  if (pending.isError)
    return (
      <p role="alert" className="text-destructive">
        {pending.error.message}
      </p>
    );

  return (
    <section className="space-y-3" aria-label="Pending profiles">
      {review.error ? (
        <p role="alert" className="text-destructive">
          {review.error.message}
        </p>
      ) : null}
      {pending.data.length === 0 ? (
        <p className="text-muted-foreground">
          No profiles are waiting for review.
        </p>
      ) : null}
      {pending.data.map((student) => (
        <article
          className="flex flex-wrap items-center justify-between gap-4 rounded-xl border bg-card p-4"
          key={student.userId}
        >
          <div className="flex items-center gap-3">
            <Avatar size="lg">
              {student.image ? (
                <AvatarImage src={student.image} alt="" />
              ) : null}
              <AvatarFallback>
                {student.displayName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{student.displayName}</p>
              <p className="text-sm break-all text-muted-foreground">
                {student.email}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={review.isPending}
              onClick={() =>
                review.mutate({ userId: student.userId, status: "rejected" })
              }
            >
              Reject
            </Button>
            <Button
              disabled={review.isPending}
              onClick={() =>
                review.mutate({ userId: student.userId, status: "approved" })
              }
            >
              Approve
            </Button>
          </div>
        </article>
      ))}
    </section>
  );
}
