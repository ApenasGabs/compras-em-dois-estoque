import React from "react";
import { Tabs } from "expo-router";

export default function AppLayout() {
    return (
        <Tabs screenOptions={{ headerShown: false }}>
            <Tabs.Screen name="list" options={{ title: "Lista" }} />
            <Tabs.Screen name="history" options={{ title: "Histórico" }} />
            <Tabs.Screen name="profile" options={{ title: "Perfil" }} />
            <Tabs.Screen name="group" options={{ href: null }} />
        </Tabs>
    );
}