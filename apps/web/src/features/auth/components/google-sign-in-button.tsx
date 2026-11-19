"use client";

import { useState } from "react";

import { Button } from "@ridemate/ui/components/button";

import { authClient } from "~/auth/client";

export function GoogleSignInButton({ callbackUrl }: { callbackUrl: string }) {
  const [pending, setPending] = useState(false);

  async function signIn() {
    setPending(true);
    const { error } = await authClient.signIn.social({
      provider: "google",
      callbackURL: callbackUrl,
    });
    // On success the browser is redirected to Google, so we only
    // get here (and reset the button) if something went wrong.
    if (error) setPending(false);
  }

  return (
    <Button size="lg" onClick={signIn} disabled={pending}>
      {pending ? "Redirecting…" : "Continue with Google"}
    </Button>
  );
}
