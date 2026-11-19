import { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { useMutation, useQuery } from "@tanstack/react-query";

import type { Point } from "./map";
import { Action, Field, Message, Screen } from "~/components/ui";
import { apiClient, trpc } from "~/utils/api";
import { RideMap } from "./map";

export interface Place extends Point {
  label: string;
}

export function placeFromPin(point: Point): Place {
  return {
    ...point,
    label: `${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}`,
  };
}

export function PlaceButton({
  label,
  value,
  onChange,
  center,
  route,
}: {
  label: string;
  value?: Place;
  onChange: (place: Place) => void;
  center?: Point;
  route?: Point[];
}) {
  const [open, setOpen] = useState(false);
  return (
    <View className="gap-2">
      <Text className="font-semibold text-foreground">{label}</Text>
      <Action secondary onPress={() => setOpen(true)}>
        {value?.label ?? "Choose on map"}
      </Action>
      {open ? (
        <PlacePicker
          label={label}
          value={value}
          center={center}
          route={route}
          onClose={() => setOpen(false)}
          onChange={(place) => {
            onChange(place);
            setOpen(false);
          }}
        />
      ) : null}
    </View>
  );
}

function PlacePicker({
  label,
  value,
  center,
  route,
  onChange,
  onClose,
}: {
  label: string;
  value?: Place;
  center?: Point;
  route?: Point[];
  onChange: (place: Place) => void;
  onClose: () => void;
}) {
  const [selection, setSelection] = useState(value);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(search.trim()), 450);
    return () => clearTimeout(timer);
  }, [search]);
  const suggestions = useQuery({
    ...trpc.maps.search.queryOptions({ text: debounced, near: center }),
    enabled: debounced.length >= 3,
    retry: false,
  });
  const location = useMutation({
    mutationFn: (suggestion: { id: string; label: string }) =>
      apiClient.maps.location
        .query(suggestion.id)
        .then(({ location: point }) => ({ ...point, label: suggestion.label })),
    onSuccess: (place) => {
      setSelection(place);
      setSearch("");
      setDebounced("");
    },
  });

  return (
    <Modal onRequestClose={onClose} animationType="slide">
      <Screen>
        <Text className="pt-5 text-2xl font-bold text-foreground">{label}</Text>
        <Field
          label="Search places"
          value={search}
          maxLength={100}
          onChangeText={setSearch}
          placeholder="Address or place name"
        />
        {suggestions.data?.map((suggestion) => (
          <Pressable
            key={suggestion.id}
            accessibilityRole="button"
            className="rounded-xl border border-border bg-card p-3"
            disabled={location.isPending}
            onPress={() => location.mutate(suggestion)}
          >
            <Text className="text-foreground">{suggestion.label}</Text>
          </Pressable>
        ))}
        <RideMap
          center={selection ?? center}
          route={route}
          markers={selection ? [{ ...selection, label }] : []}
          onPin={(point) => setSelection(placeFromPin(point))}
        />
        <Message>{selection?.label ?? "Tap the map to drop a pin."}</Message>
        {suggestions.error || location.error ? (
          <Message error>
            {suggestions.error?.message ?? location.error?.message}
          </Message>
        ) : null}
        <Action
          disabled={!selection}
          onPress={() => {
            if (selection) onChange(selection);
          }}
        >
          Use this location
        </Action>
        <Action secondary onPress={onClose}>
          Back
        </Action>
      </Screen>
    </Modal>
  );
}
