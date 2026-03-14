import { useEffect, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { supabase } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";
import { View, ActivityIndicator } from "react-native";
import {useAuthStore} from "../stores/useAuthStore";
import {useGroupStore} from "../stores/useGroupStore";

export default function RootLayout() {
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const segments = useSegments();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) {
                useAuthStore.getState().setUser(
                    session.user.id,
                    session.user.user_metadata?.nome ?? session.user.email ?? ""
                );
            }
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session?.user) {
                useAuthStore.getState().setUser(
                    session.user.id,
                    session.user.user_metadata?.nome ?? session.user.email ?? ""
                );
            } else {
                useAuthStore.getState().clearUser();
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (loading) return;

        const inAuthGroup = segments[0] === "(auth)";
        const inAppGroup = segments[0] === "(app)";
        const groupId = useGroupStore.getState().groupId;

        if (!session && !inAuthGroup) {
            router.replace("/(auth)/login");
        } else if (session && inAuthGroup) {
            if (groupId) {
                router.replace("/(app)/list");
            } else {
                router.replace("/(app)/group");
            }
        } else if (session && inAppGroup && !groupId && segments[1] !== "group") {
            router.replace("/(app)/group");
        }
    }, [session, loading, segments]);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator />
            </View>
        );
    }

    return (
        <Stack screenOptions={{ headerShown: false }} />
    );
}