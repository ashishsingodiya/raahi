import { Platform, Text, View } from "react-native";
import { DateTimePickerAndroid } from "@react-native-community/datetimepicker";

import { Action } from "~/components/ui";

export function formatTime(value: Date) {
  return value.toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function DateField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
}) {
  function open(mode: "date" | "time") {
    if (Platform.OS !== "android") return;
    DateTimePickerAndroid.open({
      value,
      mode,
      minimumDate: mode === "date" ? new Date() : undefined,
      onValueChange: (_event, selected) => {
        const next = new Date(value);
        if (mode === "date")
          next.setFullYear(
            selected.getFullYear(),
            selected.getMonth(),
            selected.getDate(),
          );
        else next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);
        onChange(next);
      },
    });
  }

  return (
    <View className="gap-2">
      <Text className="font-semibold text-foreground">{label}</Text>
      <Text className="text-foreground">{formatTime(value)}</Text>
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Action secondary onPress={() => open("date")}>
            Choose date
          </Action>
        </View>
        <View className="flex-1">
          <Action secondary onPress={() => open("time")}>
            Choose time
          </Action>
        </View>
      </View>
    </View>
  );
}

export function readablePrice(paise: number) {
  return paise === 0
    ? "Free"
    : `₹${(paise / 100).toLocaleString("en-IN", { maximumFractionDigits: 2 })} per seat`;
}
