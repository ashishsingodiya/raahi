import type { ReactNode } from "react";
import type { TextInputProps } from "react-native";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";

export function Screen({ children }: { children: ReactNode }) {
  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="gap-5 px-5 py-6 pb-12"
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

export function Action({
  children,
  onPress,
  disabled,
  secondary,
}: {
  children: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  secondary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      className={
        secondary
          ? "items-center rounded-xl border border-border bg-card px-4 py-3.5 disabled:opacity-50"
          : "items-center rounded-xl bg-primary px-4 py-3.5 disabled:opacity-50"
      }
    >
      <Text
        className={
          secondary
            ? "font-semibold text-foreground"
            : "font-semibold text-primary-foreground"
        }
      >
        {children}
      </Text>
    </Pressable>
  );
}

export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View className="gap-2">
      <Text className="font-semibold text-foreground">{label}</Text>
      <TextInput
        {...props}
        accessibilityLabel={label}
        className="min-h-12 rounded-xl border border-border bg-card px-3 py-3 text-base text-foreground"
        placeholderTextColor="#69766d"
      />
    </View>
  );
}

export function Message({
  children,
  error,
}: {
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <Text
      accessibilityLiveRegion="polite"
      className={
        error
          ? "text-sm text-destructive"
          : "text-sm leading-5 text-muted-foreground"
      }
    >
      {children}
    </Text>
  );
}

export function Loading() {
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator color="#176447" />
    </View>
  );
}
