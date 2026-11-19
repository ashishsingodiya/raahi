import { useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { useMutation } from "@tanstack/react-query";

import type { Place } from "~/features/rides/place-picker";
import { Action, Field, Message, Screen } from "~/components/ui";
import { DateField, formatTime } from "~/features/rides/date-field";
import { RideMap } from "~/features/rides/map";
import { PlaceButton, placeFromPin } from "~/features/rides/place-picker";
import { queryClient, trpc } from "~/utils/api";

export default function OfferScreen() {
  const [start, setStart] = useState<Place>();
  const [destination, setDestination] = useState<Place>();
  const [pickup, setPickup] = useState<Place>();
  const [destinationLabel, setDestinationLabel] = useState("");
  const [vehicle, setVehicle] = useState<"bike" | "car">("car");
  const [departure, setDeparture] = useState(
    () => new Date(Date.now() + 60 * 60_000),
  );
  const [seats, setSeats] = useState("1");
  const [paid, setPaid] = useState(false);
  const [price, setPrice] = useState("");
  const [instructions, setInstructions] = useState("");
  const [routeIndex, setRouteIndex] = useState(0);
  const preview = useMutation(trpc.ride.preview.mutationOptions());
  const publish = useMutation(
    trpc.ride.publish.mutationOptions({
      onSuccess: (ride) => {
        if (!ride) return;
        void queryClient.invalidateQueries({
          queryKey: trpc.ride.mine.queryKey(),
        });
        setStart(undefined);
        setDestination(undefined);
        setPickup(undefined);
        setDestinationLabel("");
        setInstructions("");
        preview.reset();
        router.push({ pathname: "/rides/[id]", params: { id: ride.id } });
      },
    }),
  );

  const routes =
    preview.variables?.start === start &&
    preview.variables?.destination === destination &&
    preview.variables?.vehicle === vehicle
      ? preview.data
      : undefined;
  const selected = routes?.[routeIndex];
  const cost = paid ? Math.round(Number(price) * 100) : 0;
  const validCost =
    !paid ||
    (/^\d+(\.\d{1,2})?$/.test(price.trim()) && cost > 0 && cost <= 10_000_000);
  const capacity = vehicle === "bike" ? 1 : Number(seats);
  const canPublish =
    selected &&
    pickup &&
    destinationLabel.trim() &&
    validCost &&
    Number.isInteger(capacity) &&
    capacity >= 1 &&
    capacity <= 8;

  return (
    <Screen>
      <View className="gap-2">
        <Text className="text-3xl font-bold text-foreground">Offer a ride</Text>
        <Message>Choose where you’re going and when you’ll leave.</Message>
      </View>
      <PlaceButton
        label="Start"
        value={start}
        onChange={(place) => {
          setStart(place);
          preview.reset();
        }}
      />
      <PlaceButton
        label="Destination"
        value={destination}
        center={start}
        onChange={(place) => {
          setDestination(place);
          preview.reset();
        }}
      />
      <Field
        label="Destination name for riders"
        value={destinationLabel}
        maxLength={100}
        onChangeText={setDestinationLabel}
        placeholder="For example, Campus main gate"
      />
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Action
            secondary={vehicle !== "car"}
            onPress={() => {
              if (vehicle !== "car") {
                setVehicle("car");
                preview.reset();
              }
            }}
          >
            Car
          </Action>
        </View>
        <View className="flex-1">
          <Action
            secondary={vehicle !== "bike"}
            onPress={() => {
              if (vehicle !== "bike") {
                setVehicle("bike");
                preview.reset();
              }
            }}
          >
            Bike
          </Action>
        </View>
      </View>
      <Action
        secondary
        disabled={!start || !destination || preview.isPending}
        onPress={() => {
          if (start && destination) {
            setRouteIndex(0);
            setPickup(start);
            preview.mutate({ start, destination, vehicle });
          }
        }}
      >
        {preview.isPending ? "Finding routes…" : "Preview routes"}
      </Action>
      {preview.error ? <Message error>{preview.error.message}</Message> : null}
      {routes?.map((route, i) => (
        <Action
          key={route.option}
          secondary={i !== routeIndex}
          onPress={() => setRouteIndex(i)}
        >
          {`Route ${i + 1} · ${(route.distanceMeters / 1000).toFixed(1)} km · about ${Math.ceil(route.durationSeconds / 60)} min`}
        </Action>
      ))}
      {selected ? (
        <>
          <RideMap
            route={selected.points}
            focus={selected.preview.slice(-32)}
            center={start}
            markers={pickup ? [{ ...pickup, label: "Default pickup" }] : []}
            onPin={(point) => setPickup(placeFromPin(point))}
          />
          <PlaceButton
            label="Default pickup"
            value={pickup}
            onChange={setPickup}
            center={start}
            route={selected.points}
          />
        </>
      ) : null}
      <DateField label="Departure" value={departure} onChange={setDeparture} />
      {selected ? (
        <Message>
          Estimated arrival{" "}
          {formatTime(
            new Date(departure.getTime() + selected.durationSeconds * 1000),
          )}
        </Message>
      ) : null}
      {vehicle === "car" ? (
        <Field
          label="Available seats"
          value={seats}
          onChangeText={setSeats}
          keyboardType="number-pad"
          maxLength={1}
        />
      ) : (
        <Message>Bike rides have one available seat.</Message>
      )}
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Action secondary={paid} onPress={() => setPaid(false)}>
            Free
          </Action>
        </View>
        <View className="flex-1">
          <Action secondary={!paid} onPress={() => setPaid(true)}>
            Paid
          </Action>
        </View>
      </View>
      {paid ? (
        <Field
          label="Price per seat in ₹"
          value={price}
          onChangeText={setPrice}
          keyboardType="decimal-pad"
          maxLength={10}
        />
      ) : null}
      <Field
        label="Meeting instructions"
        value={instructions}
        onChangeText={setInstructions}
        placeholder="Optional"
        maxLength={500}
        multiline
      />
      {publish.error ? <Message error>{publish.error.message}</Message> : null}
      <Action
        disabled={!canPublish || publish.isPending}
        onPress={() => {
          if (selected && pickup)
            publish.mutate({
              preview: selected.preview,
              pickup,
              destinationLabel,
              departure,
              capacity,
              pricePaise: cost,
              instructions,
            });
        }}
      >
        {publish.isPending ? "Publishing…" : "Publish ride"}
      </Action>
    </Screen>
  );
}
