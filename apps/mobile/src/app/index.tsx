import { Text, View } from "react-native";
import { Redirect, router } from "expo-router";

import { Action, Loading, Message, Screen } from "~/components/ui";
import { Onboarding } from "~/features/student/onboarding";
import { useStudent } from "~/features/student/use-student";
import { queryClient } from "~/utils/api";
import { authClient } from "~/utils/auth";

export default function HomeScreen() {
  const { session, profile, profileKey } = useStudent();

  async function signOut() {
    const result = await authClient.signOut();
    if (!result.error) queryClient.clear();
  }

  if (session.isPending || (session.data && profile.isPending))
    return <Loading />;
  if (profile.data?.status === "approved" && session.data)
    return <Redirect href="/discover" />;

  const user = session.data?.user;
  return (
    <Screen>
      {!user ? (
        <View className="gap-5 py-12">
          <Text className="text-4xl font-bold text-foreground">RideMate</Text>
          <Message>Find and share local rides with verified students.</Message>
          <Action onPress={() => router.push("/login")}>Log in</Action>
        </View>
      ) : (
        <>
          {profile.isError ? (
            <>
              <Message error>We couldn’t load your profile.</Message>
              <Action onPress={() => void profile.refetch()}>Try again</Action>
            </>
          ) : profile.data ? (
            <>
              <Text className="text-3xl font-bold text-foreground">
                {profile.data.status === "pending"
                  ? "Approval pending"
                  : "Profile rejected"}
              </Text>
              <Message>
                {profile.data.status === "pending"
                  ? "An admin will review your profile before you can offer or request rides."
                  : "An admin rejected your profile. You can still sign in to see this decision."}
              </Message>
              <Action
                disabled={profile.isFetching}
                onPress={() => void profile.refetch()}
              >
                Check status
              </Action>
            </>
          ) : (
            <Onboarding
              key={user.id}
              name={user.name}
              email={user.email}
              image={user.image}
              onComplete={(saved) => {
                if (saved) queryClient.setQueryData(profileKey, saved);
                else void profile.refetch();
              }}
            />
          )}
          <Action secondary onPress={() => void signOut()}>
            Sign out
          </Action>
        </>
      )}
    </Screen>
  );
}
