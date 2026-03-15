import { useEffect, useRef, useState } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { supabase } from "../lib/supabase";
import { Session } from "@supabase/supabase-js";
import { View, ActivityIndicator } from "react-native";
import { useAuthStore } from "../stores/useAuthStore";
import { useGroupStore } from "../stores/useGroupStore";

export default function RootLayout() {
    const [session, setSession] = useState<Session | null>(null);
    const [ready, setReady] = useState(false);
    const [restoring, setRestoring] = useState(false);
    const router = useRouter();
    const segments = useSegments();
    const restoringRef = useRef(false);

    async function restoreGroup(userId: string) {
        const savedGroupId = useGroupStore.getState().groupId;

        const { data } = await supabase
            .from("groups")
            .select("id, nome, codigo_convite, group_members!inner(user_id)")
            .eq("group_members.user_id", userId);

        if (data && data.length > 0) {
            useGroupStore.getState().setAllGroups(data.map(g => ({
                id: g.id,
                nome: g.nome,
                codigo_convite: g.codigo_convite,
            })));

            const current = savedGroupId ? data.find(g => g.id === savedGroupId) : data[0];
            if (current) {
                const { data: list } = await supabase
                    .from("shopping_lists")
                    .select("id")
                    .eq("group_id", current.id)
                    .eq("ativa", true)
                    .single();

                useGroupStore.getState().setGroup(current.id, current.nome, current.codigo_convite);
                if (list) useGroupStore.getState().setListId(list.id);
            }
        } else {
            useGroupStore.getState().clearGroup();
        }
    }

    useEffect(() => {

        let initialized = false;

        supabase.auth.getSession().then(async ({ data: { session } }) => {
            initialized = true;
            setSession(session);

            if (session?.user) {
                useAuthStore.getState().setUser(
                    session.user.id,
                    session.user.user_metadata?.nome ?? session.user.email ?? ""
                );
                await restoreGroup(session.user.id);
            }

            setReady(true);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!initialized) return;

            setSession(session);

            if (session?.user) {
                useAuthStore.getState().setUser(
                    session.user.id,
                    session.user.user_metadata?.nome ?? session.user.email ?? ""
                );
                if (!restoringRef.current) {
                    restoringRef.current = true;
                    setRestoring(true);
                    await restoreGroup(session.user.id);
                    restoringRef.current = false;
                    setRestoring(false);
                }
            } else {
                useAuthStore.getState().clearUser();
                useGroupStore.getState().clearGroup();
            }

            setReady(true);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (!ready || restoring) return;
        const currentGroupId = useGroupStore.getState().groupId;

        const inAuthGroup = segments[0] === "(auth)";
        const inAppGroup = segments[0] === "(app)";

        if (!session && !inAuthGroup) {
            router.replace("/(auth)/login");
        } else if (session && inAuthGroup) {
            if (currentGroupId) {
                router.replace("/(app)/list");
            } else {
                router.replace("/(app)/group");
            }
        } else if (session && inAppGroup && !currentGroupId && segments[1] !== "group") {
            router.replace("/(app)/group");
        }
    }, [session, ready, restoring, segments]);

    if (!ready || restoring) {
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