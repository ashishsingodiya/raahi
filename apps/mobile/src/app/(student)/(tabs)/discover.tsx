import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";
import * as Location from "expo-location";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import type { Place } from "~/features/rides/place-picker";
import { Action, Message, Screen } from "~/components/ui";
import {
  DateField,
  formatTime,
  readablePrice,
} from "~/features/rides/date-field";
import {
  foregroundLocationPermissionKey,
  mapCenter,
  RideMap,
} from "~/features/rides/map";
import { PlaceButton, placeFromPin } from "~/features/rides/place-picker";
import { queryClient, trpc } from "~/utils/api";

export default function DiscoverScreen() {
  const [pickup, setPickup] = useState<Place>();
  const [dropoff, setDropoff] = useState<Place>();
  const [time, setTime] = useState(() => new Date(Date.now() + 60 * 60_000));
  const [filterTime, setFilterTime] = useState(false);
  const [locationMessage, setLocationMessage] = useState("");
  const locationRequestedRef = useRef(false);
  const locationIntentRef = useRef(0);

  const locate = useCallback(async () => {
    setLocationMessage("");
    const requestId = ++locationIntentRef.current;
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      await queryClient.cancelQueries({
        queryKey: foregroundLocationPermissionKey,
        exact: true,
      });
      queryClient.setQueryData(foregroundLocationPermissionKey, permission);
      if (requestId !== locationIntentRef.current) return;
      if (!permission.granted) {
        setLocationMessage(
          "Choose a pickup pin to search without location permission.",
        );
        return;
      }
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      if (requestId === locationIntentRef.current)
        setPickup({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
          label: "Current location",
        });
    } catch {
      if (requestId === locationIntentRef.current)
        setLocationMessage(
          "Your location is unavailable. You can choose a pickup pin.",
        );
    }
  }, []);

  useEffect(() => {
    if (!locationRequestedRef.current) {
      locationRequestedRef.current = true;
      void locate();
    }
  }, [locate]);

  const rides = useQuery({
    ...trpc.ride.discover.queryOptions({
      pickup: pickup ?? mapCenter,
      dropoff,
      pickupTime: filterTime ? time : undefined,
    }),
    enabled: Boolean(pickup),
    refetchInterval: 10_000,
  });

  function choosePickup(place: Place) {
    locationIntentRef.current++;
    setPickup(place);
    setLocationMessage("");
  }

  return (
    <Screen>
      <View className="gap-2">
        <Text className="text-3xl font-bold text-foreground">
          Find your ride
        </Text>
        <Message>
          See upcoming rides near you or search for a specific trip.
        </Message>
      </View>
      <RideMap
        center={pickup}
        markers={[
          ...(pickup ? [{ ...pickup, label: "Your pickup" }] : []),
          ...(!dropoff
            ? (rides.data?.map((ride) => ({
                ...ride.pickup,
                label: ride.destinationLabel,
                id: ride.id,
              })) ?? [])
            : [{ ...dropoff, label: "Your drop-off" }]),
        ]}
        onPin={(pin) => choosePickup(placeFromPin(pin))}
      />
      {locationMessage ? <Message>{locationMessage}</Message> : null}
      <Action secondary onPress={() => void locate()}>
        Use current location
      </Action>
      <PlaceButton label="Pickup" value={pickup} onChange={choosePickup} />
      <PlaceButton
        label="Drop-off"
        value={dropoff}
        center={pickup}
        onChange={setDropoff}
      />
      {dropoff ? (
        <Action secondary onPress={() => setDropoff(undefined)}>
          Clear drop-off
        </Action>
      ) : null}
      {filterTime ? (
        <DateField
          label="Preferred pickup time"
          value={time}
          onChange={setTime}
        />
      ) : null}
      <Action secondary onPress={() => setFilterTime(!filterTime)}>
        {filterTime ? "Show all upcoming times" : "Choose a pickup time"}
      </Action>
      <View className="gap-3">
        <Text className="text-xl font-bold text-foreground">
          {dropoff ? "Matching rides" : "Upcoming nearby"}
        </Text>
        {pickup && rides.isPending ? (
          <Message>Looking for rides…</Message>
        ) : null}
        {rides.error ? <Message error>{rides.error.message}</Message> : null}
        {rides.data?.length === 0 ? (
          <Message>No rides match these locations and times.</Message>
        ) : null}
        {rides.data?.map((ride) => (
          <Pressable
            accessibilityRole="button"
            key={ride.id}
            className="gap-2 rounded-2xl border border-border bg-card p-4"
            onPress={() => {
              router.push({
                pathname: "/rides/[id]",
                params: {
                  id: ride.id,
                  time: filterTime ? time.toISOString() : undefined,
                  ...(pickup && dropoff
                    ? {
                        plat: String(pickup.latitude),
                        plng: String(pickup.longitude),
                        dlat: String(dropoff.latitude),
                        dlng: String(dropoff.longitude),
                      }
                    : {}),
                },
              });
            }}
          >
            <Text className="text-lg font-bold text-foreground">
              {ride.destinationLabel}
            </Text>
            <Message>Estimated pickup {formatTime(ride.pickupAt)}</Message>
            <Message>
              {dropoff ? pickup?.label : "Driver’s pickup pin"} ·{" "}
              {ride.vehicle === "bike" ? "Bike" : "Car"} · {ride.availableSeats}{" "}
              available
            </Message>
            <Text className="font-semibold text-foreground">
              {readablePrice(ride.pricePaise)}
            </Text>
          </Pressable>
        ))}
      </View>
    </Screen>
  );
}
