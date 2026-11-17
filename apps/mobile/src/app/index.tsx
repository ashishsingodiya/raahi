import { Pressable, Text, View } from "react-native";
import { Link } from "expo-router";

import { authClient } from "~/utils/auth";

export default function HomeScreen() {
  const { data: session } = authClient.useSession();

  return (
    <View className="flex-1 items-center justify-center gap-6 bg-background p-6">
      <View className="items-center gap-2">
        <Text className="text-3xl font-bold text-foreground">Raahi</Text>
        <Text className="text-center text-muted-foreground">
          {session ? `Signed in as ${session.user.name}` : "Not signed in"}
        </Text>
      </View>

      {session ? (
        <Pressable
          onPress={() => void authClient.signOut()}
          className="rounded-lg border border-border px-5 py-2.5"
        >
          <Text className="font-medium text-foreground">Sign out</Text>
        </Pressable>
      ) : (
        <Link href="/login" asChild>
          <Pressable className="rounded-lg bg-primary px-5 py-2.5">
            <Text className="font-medium text-primary-foreground">Log in</Text>
          </Pressable>
        </Link>
      )}
    </View>
  );
}
