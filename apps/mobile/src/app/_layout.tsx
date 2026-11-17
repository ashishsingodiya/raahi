import "../global.css";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClientProvider } from "@tanstack/react-query";

import { queryClient } from "~/utils/api";

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <Stack>
        <Stack.Screen name="index" options={{ title: "Raahi" }} />
        <Stack.Screen
          name="login"
          options={{ title: "Log in", presentation: "modal" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </QueryClientProvider>
  );
}
