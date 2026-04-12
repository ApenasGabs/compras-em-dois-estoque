import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import { restoreGroupContext } from "../lib/webData";
import { useAuthStore } from "../stores/authStore";
import { getPersistedGroupSnapshot, useGroupStore } from "../stores/groupStore";
import { useSessionStore } from "../stores/sessionStore";

export function SessionBootstrap() {
  const setUser = useAuthStore((state) => state.setUser);
  const clearUser = useAuthStore((state) => state.clearUser);
  const { setGroup, setListId, setAllGroups, clearGroup } = useGroupStore();
  const setReady = useSessionStore((state) => state.setReady);
  useEffect(() => {
    let active = true;
    let initialNoSessionTimer: ReturnType<typeof setTimeout> | null = null;
    const persistedSnapshot = getPersistedGroupSnapshot();
    const withTimeout = async <T,>(
      promise: Promise<T>,
      timeoutMs: number,
      timeoutMessage: string,
    ): Promise<T> => {
      return await Promise.race<T>([
        promise,
        new Promise<T>((_resolve, reject) => {
          setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
        }),
      ]);
    };

    const finishWithoutSession = (): void => {
      if (!active) return;

      clearUser();
      clearGroup();
      setReady(true);
    };

    const clearInitialTimer = () => {
      if (initialNoSessionTimer) {
        clearTimeout(initialNoSessionTimer);
        initialNoSessionTimer = null;
      }
    };

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;

      if (!session?.user) {
        if (_event === "INITIAL_SESSION") {
          clearInitialTimer();
          initialNoSessionTimer = setTimeout(() => {
            finishWithoutSession();
          }, 400);
          return;
        }

        clearInitialTimer();
        finishWithoutSession();
        return;
      }

      clearInitialTimer();

      setUser(session.user.id, session.user.user_metadata?.nome ?? session.user.email ?? "");

      if (
        persistedSnapshot?.lastGroupId &&
        persistedSnapshot.groupName &&
        persistedSnapshot.groupCode
      ) {
        setGroup(
          persistedSnapshot.lastGroupId,
          persistedSnapshot.groupName,
          persistedSnapshot.groupCode,
        );
        setListId(persistedSnapshot.lastListId ?? persistedSnapshot.listId ?? null);
      }

      if (persistedSnapshot?.allGroups?.length) {
        setAllGroups(persistedSnapshot.allGroups);
      }

      setReady(true);

      try {
        const savedGroupId =
          useGroupStore.getState().groupId ??
          useGroupStore.getState().lastGroupId ??
          persistedSnapshot?.lastGroupId ??
          persistedSnapshot?.groupId ??
          null;
        const { groups, group, listId } = await withTimeout(
          restoreGroupContext(session.user.id, savedGroupId),
          6000,
          "Timeout restaurando contexto do grupo",
        );

        if (!active) return;

        const groupsToStore = groups.length > 0 ? groups : (persistedSnapshot?.allGroups ?? []);
        setAllGroups(groupsToStore);
        if (group) {
          setGroup(group.id, group.nome, group.codigo_convite);
          setListId(listId ?? persistedSnapshot?.lastListId ?? persistedSnapshot?.listId ?? null);
        } else if (
          persistedSnapshot?.lastGroupId &&
          persistedSnapshot.groupName &&
          persistedSnapshot.groupCode
        ) {
          setGroup(
            persistedSnapshot.lastGroupId,
            persistedSnapshot.groupName,
            persistedSnapshot.groupCode,
          );
          setListId(persistedSnapshot.lastListId ?? persistedSnapshot.listId ?? null);
        } else {
          clearGroup();
        }
      } catch (error) {
        console.error(error);
        if (!useGroupStore.getState().groupId) {
          clearGroup();
        }
      }
    });

    return () => {
      active = false;
      clearInitialTimer();
      subscription.unsubscribe();
    };
  }, [clearGroup, clearUser, setGroup, setListId, setReady, setAllGroups, setUser]);

  return null;
}
