import { Text, View } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";

import { Action, Message, Screen } from "~/components/ui";
import { formatTime, readablePrice } from "~/features/rides/date-field";
import { queryClient, trpc } from "~/utils/api";
import { authClient } from "~/utils/auth";

export default function ActivityScreen() {
  const rides = useQuery({
    ...trpc.ride.mine.queryOptions(),
    refetchInterval: 8_000,
  });
  const requests = useQuery({
    ...trpc.request.list.queryOptions(),
    refetchInterval: 5_000,
  });

  async function signOut() {
    const result = await authClient.signOut();
    if (!result.error) {
      queryClient.clear();
      router.replace("/");
    }
  }

  return (
    <Screen>
      <Text className="text-3xl font-bold text-foreground">My activity</Text>
      <Text className="text-xl font-bold text-foreground">Seat requests</Text>
      {requests.isPending ? <Message>Loading requests…</Message> : null}
      {requests.error ? (
        <Message error>{requests.error.message}</Message>
      ) : null}
      {requests.data?.length === 0 ? (
        <Message>
          Your incoming and outgoing seat requests will appear here.
        </Message>
      ) : null}
      {requests.data?.map((request) => (
        <View
          key={request.id}
          className="gap-2 rounded-2xl border border-border bg-card p-4"
        >
          <Text className="font-semibold text-foreground">
            {request.directedTo}
          </Text>
          <Message>
            {request.role === "driver" ? "Incoming" : "Requested"} ·{" "}
            {request.rideCancelled && request.status === "cancelled"
              ? "Ride cancelled"
              : request.status}{" "}
            · {formatTime(request.pickupAt)}
          </Message>
          <Action
            secondary
            onPress={() =>
              router.push({
                pathname: "/requests/[id]",
                params: { id: request.id },
              })
            }
          >
            View request
          </Action>
        </View>
      ))}
      <Text className="text-xl font-bold text-foreground">
        Rides you posted
      </Text>
      {rides.isPending ? <Message>Loading rides…</Message> : null}
      {rides.error ? <Message error>{rides.error.message}</Message> : null}
      {rides.data?.length === 0 ? (
        <Message>Your published rides will appear here.</Message>
      ) : null}
      {rides.data?.map((ride) => (
        <View
          key={ride.id}
          className="gap-2 rounded-2xl border border-border bg-card p-4"
        >
          <Text className="font-semibold text-foreground">
            {ride.destinationLabel}
          </Text>
          <Message>
            {ride.cancelled ? "Cancelled" : formatTime(ride.departure)} ·{" "}
            {readablePrice(ride.pricePaise)}
          </Message>
          <Action
            secondary
            onPress={() =>
              router.push({ pathname: "/rides/[id]", params: { id: ride.id } })
            }
          >
            View ride
          </Action>
        </View>
      ))}
      <Action secondary onPress={() => void signOut()}>
        Sign out
      </Action>
    </Screen>
  );
}
