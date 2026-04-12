import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "../stores/authStore";
import { useGroupStore } from "../stores/groupStore";
import { useSessionStore } from "../stores/sessionStore";

export function PublicOnly({ children }: { children: ReactNode }) {
  const ready = useSessionStore((state) => state.ready);
  const userId = useAuthStore((state) => state.userId);
  const groupId = useGroupStore((state) => state.groupId);

  if (!ready) return null;
  if (userId) return <Navigate to={groupId ? "/list" : "/group"} replace />;
  return children;
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const ready = useSessionStore((state) => state.ready);
  const userId = useAuthStore((state) => state.userId);

  if (!ready) return null;
  if (!userId) return <Navigate to="/login" replace />;
  return children;
}

export function RequireGroup({ children }: { children: ReactNode }) {
  const ready = useSessionStore((state) => state.ready);
  const groupId = useGroupStore((state) => state.groupId);

  if (!ready) return null;
  if (!groupId) return <Navigate to="/group" replace />;
  return children;
}
