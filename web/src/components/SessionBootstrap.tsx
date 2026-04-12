import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import { getSessionUser, restoreGroupContext } from "../lib/webData";
import { useAuthStore } from "../stores/authStore";
import { useGroupStore } from "../stores/groupStore";
import { useSessionStore } from "../stores/sessionStore";

export function SessionBootstrap() {
  const setUser = useAuthStore((state) => state.setUser);
  const clearUser = useAuthStore((state) => state.clearUser);
  const { setGroup, setListId, setAllGroups, clearGroup } = useGroupStore();
  const setReady = useSessionStore((state) => state.setReady);

  useEffect(() => {
    let active = true;

    async function restoreFromSession() {
      const sessionUser = await getSessionUser();

      if (!active) return;

      if (!sessionUser) {
        clearUser();
        clearGroup();
        setReady(true);
        return;
      }

      setUser(sessionUser.id, sessionUser.name);

      try {
        const savedGroupId = useGroupStore.getState().groupId;
        const { groups, group, listId } = await restoreGroupContext(
          sessionUser.id,
          savedGroupId,
        );

        if (!active) return;

        setAllGroups(groups);
        if (group) {
          setGroup(group.id, group.nome, group.codigo_convite);
          setListId(listId);
        } else {
          clearGroup();
        }
      } catch (error) {
        console.error(error);
        clearGroup();
      }

      setReady(true);
    }

    restoreFromSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;

      if (!session?.user) {
        clearUser();
        clearGroup();
        setReady(true);
        return;
      }

      setUser(
        session.user.id,
        session.user.user_metadata?.nome ?? session.user.email ?? "",
      );

      try {
        const savedGroupId = useGroupStore.getState().groupId;
        const { groups, group, listId } = await restoreGroupContext(
          session.user.id,
          savedGroupId,
        );

        if (!active) return;

        setAllGroups(groups);
        if (group) {
          setGroup(group.id, group.nome, group.codigo_convite);
          setListId(listId);
        } else {
          clearGroup();
        }
      } catch (error) {
        console.error(error);
        clearGroup();
      }

      setReady(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [
    clearGroup,
    clearUser,
    setGroup,
    setListId,
    setReady,
    setAllGroups,
    setUser,
  ]);

  return null;
}
