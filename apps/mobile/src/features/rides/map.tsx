import { useEffect, useRef, useState } from "react";
import { AppState, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { WebView } from "react-native-webview";
import Constants from "expo-constants";
import { getForegroundPermissionsAsync } from "expo-location";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

import { Message } from "~/components/ui";
import { env } from "~/env";
import { getBaseUrl } from "~/utils/base-url";

export interface Point {
  latitude: number;
  longitude: number;
}

interface Pin extends Point {
  id?: string;
  label: string;
}

interface MapProps {
  center?: Point;
  markers?: Pin[];
  route?: Point[];
  focus?: string;
  onPin?: (point: Point) => void;
}

export const mapCenter = { latitude: 25.16, longitude: 75.81 };
export const foregroundLocationPermissionKey = [
  "foreground-location-permission",
] as const;
const message = z.discriminatedUnion("type", [
  z.object({ type: z.literal("ready") }),
  z.object({ type: z.literal("error") }),
  z.object({
    type: z.literal("pin"),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
]);

function NativeMap({
  center,
  markers = [],
  route = [],
  focus,
  onPin,
}: MapProps) {
  const mapRef = useRef<MapView>(null);
  const focusedRef = useRef<string | undefined>(undefined);
  const [ready, setReady] = useState(false);
  const { data: permission, refetch: refreshPermission } = useQuery({
    queryKey: foregroundLocationPermissionKey,
    queryFn: getForegroundPermissionsAsync,
    retry: false,
  });
  const showMyLocation = permission?.granted === true;
  const latitude = center?.latitude;
  const longitude = center?.longitude;

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void refreshPermission({ cancelRefetch: false });
    });
    return () => subscription.remove();
  }, [refreshPermission]);

  useEffect(() => {
    if (ready && latitude !== undefined && longitude !== undefined) {
      mapRef.current?.animateToRegion({
        latitude,
        longitude,
        latitudeDelta: 0.025,
        longitudeDelta: 0.025,
      });
    }
  }, [latitude, longitude, ready]);

  useEffect(() => {
    if (
      ready &&
      focus &&
      focusedRef.current !== focus &&
      markers.length + route.length > 1
    ) {
      mapRef.current?.fitToCoordinates([...route, ...markers], {
        edgePadding: { top: 40, bottom: 40, left: 40, right: 40 },
      });
      focusedRef.current = focus;
    }
  }, [focus, markers, ready, route]);

  return (
    <MapView
      ref={mapRef}
      provider={PROVIDER_GOOGLE}
      showsUserLocation={showMyLocation}
      showsMyLocationButton={showMyLocation}
      style={{ flex: 1 }}
      initialRegion={{
        ...(center ?? mapCenter),
        latitudeDelta: 0.025,
        longitudeDelta: 0.025,
      }}
      onMapReady={() => setReady(true)}
      onPress={
        onPin ? ({ nativeEvent }) => onPin(nativeEvent.coordinate) : undefined
      }
    >
      {route.length > 1 ? (
        <Polyline coordinates={route} strokeColor="#176447" strokeWidth={5} />
      ) : null}
      {markers.map((pin) => (
        <Marker
          key={pin.id ?? `${pin.label}-${pin.latitude}-${pin.longitude}`}
          coordinate={pin}
          title={pin.label}
        />
      ))}
    </MapView>
  );
}

function HostedMap({
  center,
  markers = [],
  route = [],
  focus,
  onPin,
}: MapProps) {
  const webRef = useRef<WebView<object>>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(false);
  const url = `${getBaseUrl()}/api/map`;

  useEffect(() => {
    if (ready)
      webRef.current?.injectJavaScript(
        `window.setRaahiMap?.(${JSON.stringify({ center, markers, route, focus })}); true;`,
      );
  }, [center, markers, route, focus, ready]);

  if (error)
    return (
      <View className="flex-1 justify-center px-4">
        <Message error>
          Google Maps couldn’t load. Check the preview map configuration.
        </Message>
      </View>
    );

  return (
    <WebView<object>
      ref={webRef}
      source={{ uri: url }}
      onShouldStartLoadWithRequest={(request) =>
        request.url === url || !request.isTopFrame
      }
      onError={() => setError(true)}
      onHttpError={() => setError(true)}
      onMessage={({ nativeEvent }) => {
        try {
          const parsed = message.safeParse(
            JSON.parse(nativeEvent.data) as unknown,
          );
          if (!parsed.success) return;
          const data = parsed.data;
          if (data.type === "ready") setReady(true);
          if (data.type === "error") setError(true);
          if (data.type === "pin")
            onPin?.({ latitude: data.latitude, longitude: data.longitude });
        } catch {
          return;
        }
      }}
    />
  );
}

export function RideMap(props: MapProps) {
  const useWebView = env.EXPO_PUBLIC_GOOGLE_MAPS_WEBVIEW === "1";
  return (
    <View className="h-64 overflow-hidden rounded-2xl border border-border bg-card">
      {useWebView ? (
        <HostedMap {...props} />
      ) : Constants.expoConfig?.extra?.androidMapsConfigured === true ? (
        <NativeMap {...props} />
      ) : (
        <View className="flex-1 justify-center px-4">
          <Message error>Google Maps is unavailable in this build.</Message>
        </View>
      )}
    </View>
  );
}
