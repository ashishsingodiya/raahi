import { Linking, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useMutation, useQuery } from "@tanstack/react-query";

import { Action, Loading, Message, Screen } from "~/components/ui";
import { formatTime, readablePrice } from "~/features/rides/date-field";
import { RideMap } from "~/features/rides/map";
import { queryClient, trpc } from "~/utils/api";

const statuses = {
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
  cancelled: "Cancelled",
};

export default function RequestDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const detail = useQuery({
    ...trpc.request.detail.queryOptions(id),
    refetchInterval: 3_000,
  });
  const decision = useMutation(
    trpc.request.decide.mutationOptions({
      onSuccess: () =>
        Promise.all([
          queryClient.invalidateQueries({ queryKey: trpc.request.pathKey() }),
          queryClient.invalidateQueries({ queryKey: trpc.ride.pathKey() }),
        ]),
    }),
  );

  if (detail.isPending) return <Loading />;
  if (detail.isError)
    return (
      <Screen>
        <Message error>{detail.error.message}</Message>
      </Screen>
    );

  const request = detail.data;
  const canCancel =
    request.upcoming &&
    (request.status === "accepted" || request.status === "pending");
  const canReview =
    request.role === "driver" && request.status === "pending" && canCancel;
  const number = request.contact?.mobileNumber;

  return (
    <Screen>
      <View className="gap-1">
        <Text className="text-3xl font-bold text-foreground">
          {statuses[request.status]}
        </Text>
        <Text className="text-lg font-semibold text-foreground">
          {request.directedTo}
        </Text>
        <Message>
          {request.role === "driver" ? "Rider" : "Driver"} · {request.otherName}
        </Message>
      </View>
      <RideMap
        center={request.pickup}
        route={request.route ?? []}
        focus={id}
        markers={[
          { ...request.pickup, label: "Pickup" },
          { ...request.dropoff, label: "Drop-off" },
        ]}
      />
      <Text className="font-semibold text-foreground">
        Estimated pickup {formatTime(request.pickupAt)}
      </Text>
      <Message>
        {readablePrice(request.pricePaise)}
        {request.pricePaise ? " · Paid directly to the driver" : ""}
      </Message>
      {number ? (
        <View className="gap-3 rounded-2xl border border-border bg-card p-4">
          <Text className="font-bold text-foreground">
            Contact {request.otherName}
          </Text>
          <Text selectable className="text-foreground">
            {number}
          </Text>
          <Action
            secondary
            onPress={() => void Linking.openURL(`tel:${number}`)}
          >
            Call
          </Action>
          {request.contact?.instructions ? (
            <Message>{request.contact.instructions}</Message>
          ) : null}
        </View>
      ) : null}
      {decision.error ? (
        <Message error>{decision.error.message}</Message>
      ) : null}
      {canReview ? (
        <View className="flex-row gap-2">
          <View className="flex-1">
            <Action
              disabled={decision.isPending}
              onPress={() => decision.mutate({ id, action: "accept" })}
            >
              Accept
            </Action>
          </View>
          <View className="flex-1">
            <Action
              secondary
              disabled={decision.isPending}
              onPress={() => decision.mutate({ id, action: "decline" })}
            >
              Decline
            </Action>
          </View>
        </View>
      ) : null}
      {canCancel && !canReview ? (
        <Action
          secondary
          disabled={decision.isPending}
          onPress={() => decision.mutate({ id, action: "cancel" })}
        >
          Cancel request
        </Action>
      ) : null}
    </Screen>
  );
}
