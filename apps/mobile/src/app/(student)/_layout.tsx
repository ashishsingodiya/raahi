import { Redirect, Stack } from "expo-router";

import { Loading } from "~/components/ui";
import { useStudent } from "~/features/student/use-student";

export default function StudentLayout() {
  const { session, profile } = useStudent();
  if (session.isPending || (session.data && profile.isPending))
    return <Loading />;
  if (!session.data || profile.data?.status !== "approved")
    return <Redirect href="/" />;
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="rides/[id]" options={{ title: "Ride details" }} />
      <Stack.Screen name="requests/[id]" options={{ title: "Seat request" }} />
    </Stack>
  );
}
