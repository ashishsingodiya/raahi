import { useState } from "react";
import { Alert, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";

import type { RouterOutputs } from "@raahi/api";

import type { Place } from "~/features/rides/place-picker";
import { Action, Loading, Message, Screen } from "~/components/ui";
import { formatTime, readablePrice } from "~/features/rides/date-field";
import { RideMap } from "~/features/rides/map";
import { PlaceButton, placeFromPin } from "~/features/rides/place-picker";
import { queryClient, trpc } from "~/utils/api";

type Ride = RouterOutputs["ride"]["detail"];

function selectedPoint(lat?: string, lng?: string) {
  if (!lat || !lng) return undefined;
  const latitude = Number(lat);
  const longitude = Number(lng);
  return Number.isFinite(latitude) &&
    Math.abs(latitude) <= 90 &&
    Number.isFinite(longitude) &&
    Math.abs(longitude) <= 180
    ? placeFromPin({ latitude, longitude })
    : undefined;
}

export default function RideDetailsScreen() {
  const params = useLocalSearchParams<{
    id: string;
    plat?: string;
    plng?: string;
    dlat?: string;
    dlng?: string;
    time?: string;
  }>();
  const ride = useQuery({
    ...trpc.ride.detail.queryOptions(params.id),
    refetchInterval: 8_000,
  });

  if (ride.isPending) return <Loading />;
  if (ride.isError)
    return (
      <Screen>
        <Message error>{ride.error.message}</Message>
      </Screen>
    );
  const time = params.time ? new Date(params.time) : undefined;

  return (
    <RideDetails
      key={ride.data.id}
      ride={ride.data}
      initialPickup={selectedPoint(params.plat, params.plng)}
      initialDropoff={selectedPoint(params.dlat, params.dlng)}
      preferredPickupTime={
        time && Number.isFinite(time.getTime()) ? time : undefined
      }
    />
  );
}

function RideDetails({
  ride,
  initialPickup,
  initialDropoff,
  preferredPickupTime,
}: {
  ride: Ride;
  initialPickup?: Place;
  initialDropoff?: Place;
  preferredPickupTime?: Date;
}) {
  const [pickup, setPickup] = useState<Place>(
    initialPickup ?? { ...ride.pickup, label: "Driver’s pickup" },
  );
  const [dropoff, setDropoff] = useState<Place>(
    initialDropoff ?? { ...ride.destination, label: ride.destinationLabel },
  );
  const [time, setTime] = useState(preferredPickupTime);

  const cancel = useMutation(
    trpc.ride.cancel.mutationOptions({
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: trpc.ride.pathKey() });
        void queryClient.invalidateQueries({
          queryKey: trpc.request.pathKey(),
        });
      },
    }),
  );
  const submit = useMutation(
    trpc.request.submit.mutationOptions({
      onSuccess: (request) => {
        void queryClient.invalidateQueries({
          queryKey: trpc.request.list.queryKey(),
        });
        router.replace({
          pathname: "/requests/[id]",
          params: { id: request.id },
        });
      },
    }),
  );

  const upcoming = ride.upcoming;
  const trip = { rideId: ride.id, pickup, dropoff, preferredPickupTime: time };
  const estimate = useQuery({
    ...trpc.request.estimate.queryOptions(trip),
    enabled: upcoming && !ride.owner,
    retry: false,
  });
  const customPickup =
    pickup.latitude !== ride.pickup.latitude ||
    pickup.longitude !== ride.pickup.longitude;
  const customDropoff =
    dropoff.latitude !== ride.destination.latitude ||
    dropoff.longitude !== ride.destination.longitude;
  return (
    <Screen>
      <Text className="text-3xl font-bold text-foreground">
        {ride.destinationLabel}
      </Text>
      <Message>
        {ride.cancelled ? "Cancelled" : `Departs ${formatTime(ride.departure)}`}{" "}
        · {ride.vehicle === "bike" ? "Bike" : "Car"} · {ride.availableSeats}{" "}
        available
      </Message>
      <RideMap
        center={pickup}
        route={ride.route ?? []}
        focus={ride.id}
        markers={[
          { ...pickup, label: "Pickup" },
          { ...dropoff, label: "Drop-off" },
        ]}
      />
      <View className="gap-2">
        <Text className="text-lg font-bold text-foreground">
          {readablePrice(ride.pricePaise)}
        </Text>
        {ride.pricePaise > 0 ? (
          <Message>Pay the driver directly.</Message>
        ) : null}
      </View>
      {ride.owner ? (
        <>
          <Action secondary onPress={() => router.navigate("/activity")}>
            View seat requests
          </Action>
          {upcoming ? (
            <Action
              secondary
              disabled={cancel.isPending}
              onPress={() =>
                Alert.alert(
                  "Cancel this ride?",
                  "Any active seat requests will be cancelled.",
                  [
                    { text: "Keep ride", style: "cancel" },
                    {
                      text: "Cancel ride",
                      style: "destructive",
                      onPress: () => cancel.mutate(ride.id),
                    },
                  ],
                )
              }
            >
              Cancel ride
            </Action>
          ) : null}
          {cancel.error ? (
            <Message error>{cancel.error.message}</Message>
          ) : null}
        </>
      ) : upcoming ? (
        <>
          <PlaceButton
            label="Requested pickup"
            value={pickup}
            route={ride.route ?? []}
            onChange={(point) => {
              setPickup(point);
              setTime(undefined);
            }}
          />
          {customPickup ? (
            <Action
              secondary
              onPress={() => {
                setPickup({ ...ride.pickup, label: "Driver’s pickup" });
                setTime(undefined);
              }}
            >
              Use driver’s pickup
            </Action>
          ) : null}
          <PlaceButton
            label="Requested drop-off"
            value={dropoff}
            route={ride.route ?? []}
            onChange={(point) => {
              setDropoff(point);
              setTime(undefined);
            }}
          />
          {customDropoff ? (
            <Action
              secondary
              onPress={() => {
                setDropoff({
                  ...ride.destination,
                  label: ride.destinationLabel,
                });
                setTime(undefined);
              }}
            >
              Use driver’s destination
            </Action>
          ) : null}
          {estimate.data ? (
            <Message>
              Estimated pickup {formatTime(estimate.data.pickupAt)}.
            </Message>
          ) : null}
          {estimate.error ? (
            <Message error>{estimate.error.message}</Message>
          ) : null}
          <Message>The driver will review both points together.</Message>
          {submit.error ? (
            <Message error>{submit.error.message}</Message>
          ) : null}
          <Action
            disabled={
              submit.isPending || !estimate.data || ride.availableSeats === 0
            }
            onPress={() =>
              submit.mutate({
                ...trip,
                expectedPricePaise: ride.pricePaise,
              })
            }
          >
            {ride.availableSeats === 0
              ? "Ride is full"
              : submit.isPending
                ? "Sending…"
                : "Request one seat"}
          </Action>
        </>
      ) : null}
    </Screen>
  );
}
