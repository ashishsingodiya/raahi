import { useState } from "react";
import { Image, Text, View } from "react-native";
import { useMutation } from "@tanstack/react-query";

import { Action, Field, Message } from "~/components/ui";
import { trpc } from "~/utils/api";

export function Onboarding({
  name,
  email,
  image,
  onComplete,
}: {
  name: string;
  email: string;
  image?: string | null;
  onComplete: () => void;
}) {
  const [displayName, setDisplayName] = useState(name);
  const [mobileNumber, setMobileNumber] = useState("");
  const save = useMutation(
    trpc.student.onboard.mutationOptions({ onSuccess: onComplete }),
  );

  return (
    <View className="gap-5">
      <View className="gap-2">
        {image ? (
          <Image
            source={{ uri: image }}
            className="mb-2 size-14 rounded-full"
          />
        ) : null}
        <Text className="text-3xl font-bold text-foreground">
          Set up your profile
        </Text>
        <Message>{email}</Message>
      </View>
      <Field
        label="Name"
        autoComplete="name"
        maxLength={100}
        value={displayName}
        onChangeText={setDisplayName}
      />
      <Field
        label="Mobile number"
        autoComplete="tel"
        keyboardType="phone-pad"
        maxLength={40}
        value={mobileNumber}
        onChangeText={setMobileNumber}
        placeholder="+91"
      />
      <Message>
        Raahi shares your number with the other student once a driver accepts a
        seat request.
      </Message>
      {save.error ? <Message error>{save.error.message}</Message> : null}
      <Action
        disabled={save.isPending || !displayName.trim() || !mobileNumber.trim()}
        onPress={() => save.mutate({ displayName, mobileNumber })}
      >
        {save.isPending ? "Saving…" : "Continue"}
      </Action>
    </View>
  );
}
