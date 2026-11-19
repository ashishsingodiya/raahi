import { useState } from "react";
import { Image, Text, View } from "react-native";
import { useMutation } from "@tanstack/react-query";

import type { RouterOutputs } from "@raahi/api";

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
  onComplete: (profile: RouterOutputs["student"]["onboard"]) => void;
}) {
  const [displayName, setDisplayName] = useState(name);
  const [mobileNumber, setMobileNumber] = useState("");
  const save = useMutation(
    trpc.student.onboard.mutationOptions({ onSuccess: onComplete }),
  );
  const fieldErrors: Record<string, string[] | undefined> | undefined =
    save.error?.data?.zodError?.fieldErrors;
  const nameError = fieldErrors?.displayName?.[0];
  const mobileError = fieldErrors?.mobileNumber?.[0];

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
        editable={!save.isPending}
        maxLength={100}
        value={displayName}
        onChangeText={setDisplayName}
      />
      {nameError ? <Message error>{nameError}</Message> : null}
      <Field
        label="Mobile number"
        autoComplete="tel"
        editable={!save.isPending}
        keyboardType="phone-pad"
        maxLength={40}
        value={mobileNumber}
        onChangeText={setMobileNumber}
        placeholder="+91"
      />
      {mobileError ? <Message error>{mobileError}</Message> : null}
      <Message>
        Raahi shares your number with the other student once a driver accepts a
        seat request.
      </Message>
      {save.error && !nameError && !mobileError ? (
        <Message error>{save.error.message}</Message>
      ) : null}
      <Action
        disabled={save.isPending || !displayName.trim() || !mobileNumber.trim()}
        onPress={() => save.mutate({ displayName, mobileNumber })}
      >
        {save.isPending ? "Saving…" : "Continue"}
      </Action>
    </View>
  );
}
