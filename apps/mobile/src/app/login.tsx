import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router } from "expo-router";

import { authClient } from "~/utils/auth";

export default function LoginScreen() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signInWithGoogle() {
    setPending(true);
    setError(null);
    const result = await authClient.signIn.social({
      provider: "google",
      callbackURL: "/",
    });
    setPending(false);
    if (result.error) {
      setError(result.error.message ?? "Sign in failed");
      return;
    }
    // On native, signIn.social doesn't navigate by itself.
    router.back();
  }

  return (
    <View className="flex-1 items-center justify-center gap-4 bg-background p-6">
      <Text className="text-2xl font-semibold text-foreground">
        Welcome to Raahi
      </Text>
      <Pressable
        onPress={() => void signInWithGoogle()}
        disabled={pending}
        className="rounded-lg bg-primary px-5 py-3 disabled:opacity-50"
      >
        <Text className="text-primary-foreground">
          {pending ? "Opening Google…" : "Continue with Google"}
        </Text>
      </Pressable>
      {error ? <Text className="text-destructive">{error}</Text> : null}
    </View>
  );
}
