import React from "react";
import { Image } from "react-native";
import { Tabs } from "expo-router";

const tabIcons = {
    list: require("../../assets/list.png"),
    history: require("../../assets/history.png"),
    user: require("../../assets/user.png"),
};

export default function AppLayout() {
    return (
        <Tabs screenOptions={{ headerShown: false }}>
            <Tabs.Screen
                name="list"
                options={{
                    title: "Lista",
                    tabBarIcon: ({ focused }) => (
                        <Image
                            source={tabIcons.list}
                            style={{
                                width: 22,
                                height: 22,
                                tintColor: focused ? "#2A2A2A" : "#9A9590",
                            }}
                            resizeMode="contain"
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="history"
                options={{
                    title: "Histórico",
                    tabBarIcon: ({ focused }) => (
                        <Image
                            source={tabIcons.history}
                            style={{
                                width: 22,
                                height: 22,
                                tintColor: focused ? "#2A2A2A" : "#9A9590",
                            }}
                            resizeMode="contain"
                        />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: "Perfil",
                    tabBarIcon: ({ focused }) => (
                        <Image
                            source={tabIcons.user}
                            style={{
                                width: 22,
                                height: 22,
                                tintColor: focused ? "#2A2A2A" : "#9A9590",
                            }}
                            resizeMode="contain"
                        />
                    ),
                }}
            />
            <Tabs.Screen name="group" options={{ href: null }} />
        </Tabs>
    );
}