import { Text } from "react-native";
import { Tabs } from "expo-router";

export default function RideTabs() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: "#176447" }}>
      <Tabs.Screen
        name="discover"
        options={{
          title: "Find rides",
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>⌖</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="offer"
        options={{
          title: "Offer a ride",
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>+</Text>
          ),
        }}
      />
      <Tabs.Screen
        name="activity"
        options={{
          title: "My activity",
          tabBarIcon: ({ color }) => (
            <Text style={{ color, fontSize: 20 }}>≡</Text>
          ),
        }}
      />
    </Tabs>
  );
}
