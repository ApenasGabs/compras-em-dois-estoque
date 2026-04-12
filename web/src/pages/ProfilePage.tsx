import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  ensureActiveListForGroup,
  loadMembers,
  loadUserGroups,
  type MemberRecord,
} from "../lib/webData";
import { useAuthStore } from "../stores/authStore";
import { useGroupStore } from "../stores/groupStore";

export function ProfilePage() {
  const navigate = useNavigate();
  const userName = useAuthStore((state) => state.userName);
  const userId = useAuthStore((state) => state.userId);
  const groupId = useGroupStore((state) => state.groupId);
  const groupName = useGroupStore((state) => state.groupName);
  const groupCode = useGroupStore((state) => state.groupCode);
  const allGroups = useGroupStore((state) => state.allGroups);
  const setGroup = useGroupStore((state) => state.setGroup);
  const setListId = useGroupStore((state) => state.setListId);
  const setAllGroups = useGroupStore((state) => state.setAllGroups);
  const clearGroup = useGroupStore((state) => state.clearGroup);
  const [members, setMembers] = useState<MemberRecord[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadProfileData() {
      if (!userId) return;

      try {
        const groups = await loadUserGroups(userId);
        setAllGroups(groups);
        if (groupId) {
          const groupMembers = await loadMembers(groupId);
          setMembers(groupMembers);
        } else {
          setMembers([]);
        }
      } catch (profileError) {
        setError(
          profileError instanceof Error
            ? profileError.message
            : "Falha ao carregar perfil",
        );
      }
    }

    void loadProfileData();
  }, [groupId, setAllGroups, userId]);

  async function handleSwitchGroup(targetGroupId: string) {
    const targetGroup = allGroups.find((group) => group.id === targetGroupId);
    if (!targetGroup) return;

    setLoading(true);
    setError(null);

    try {
      setGroup(targetGroup.id, targetGroup.nome, targetGroup.codigo_convite);
      const list = await ensureActiveListForGroup(targetGroup.id);
      setListId(list.id);
      navigate("/list");
    } catch (switchError) {
      setError(
        switchError instanceof Error
          ? switchError.message
          : "Falha ao trocar de grupo",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCopyCode() {
    if (!groupCode || !navigator.clipboard) return;
    await navigator.clipboard.writeText(groupCode);
  }

  async function handleLogout() {
    setLoading(true);
    setError(null);

    try {
      await supabase.auth.signOut();
      useAuthStore.getState().clearUser();
      clearGroup();
      navigate("/login");
    } catch (logoutError) {
      setError(
        logoutError instanceof Error ? logoutError.message : "Falha ao sair",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <h1>Perfil</h1>
          <p>{userName ?? "Usuário autenticado"}</p>
        </div>
        <button
          type="button"
          className="ghost-link"
          onClick={() => navigate("/list")}
        >
          Voltar
        </button>
      </header>

      {error && <p className="error">{error}</p>}

      <section className="card form">
        <p className="section-title">Grupo ativo</p>
        <h2>{groupName ?? "Sem grupo"}</h2>
        <p className="muted">{groupCode ?? "Sem código"}</p>
        <div className="actions-row">
          <button type="button" onClick={handleCopyCode} disabled={!groupCode}>
            Copiar código
          </button>
          <button
            type="button"
            className="danger"
            onClick={handleLogout}
            disabled={loading}
          >
            Sair da conta
          </button>
        </div>
      </section>

      <section className="card form">
        <h2>Membros</h2>
        {members.length === 0 ? (
          <p className="muted">Nenhum membro encontrado.</p>
        ) : (
          <div className="stack-list">
            {members.map((member) => (
              <article key={member.id} className="member-item">
                <strong>{member.nome}</strong>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="card form">
        <h2>Trocar grupo</h2>
        {allGroups.length === 0 ? (
          <p className="muted">Nenhum grupo disponível.</p>
        ) : (
          <div className="stack-list">
            {allGroups.map((group) => (
              <article key={group.id} className="group-item">
                <div>
                  <strong>{group.nome}</strong>
                  <p>{group.codigo_convite}</p>
                </div>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => handleSwitchGroup(group.id)}
                  disabled={loading}
                >
                  Usar
                </button>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
