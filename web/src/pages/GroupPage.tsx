/** @jsxImportSource react */
import { type ChangeEvent, type FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { normalizeInviteCode } from "../domain/listRules";
import {
  createGroupForCurrentUser,
  ensureActiveListForGroup,
  joinGroupByCode,
  leaveGroup,
  loadUserGroups,
} from "../lib/webData";
import { useAuthStore } from "../stores/authStore";
import { useGroupStore } from "../stores/groupStore";

export function GroupPage() {
  const [groupName, setGroupName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successCode, setSuccessCode] = useState<string | null>(null);
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.userId);
  const userName = useAuthStore((state) => state.userName);
  const groupId = useGroupStore((state) => state.groupId);
  const groupNameActive = useGroupStore((state) => state.groupName);
  const groupCode = useGroupStore((state) => state.groupCode);
  const allGroups = useGroupStore((state) => state.allGroups);
  const setGroup = useGroupStore((state) => state.setGroup);
  const setListId = useGroupStore((state) => state.setListId);
  const setAllGroups = useGroupStore((state) => state.setAllGroups);
  const clearGroup = useGroupStore((state) => state.clearGroup);

  useEffect(() => {
    async function syncGroups() {
      if (!userId) return;
      const groups = await loadUserGroups(userId);
      setAllGroups(groups);
    }

    syncGroups().catch((syncError) => setError(syncError.message));
  }, [setAllGroups, userId]);

  async function refreshGroups() {
    if (!userId) return;
    const groups = await loadUserGroups(userId);
    setAllGroups(groups);
  }

  async function handleCreateGroup(e: FormEvent) {
    e.preventDefault();
    if (!groupName.trim() || !userId) return;

    setLoading(true);
    setError(null);

    try {
      const created = await createGroupForCurrentUser(groupName.trim());
      setGroup(created.groupId, created.groupName, created.inviteCode);
      setListId(created.listId);
      setSuccessCode(created.inviteCode);
      await refreshGroups();
    } catch (createError) {
      setError(
        createError instanceof Error
          ? createError.message
          : "Falha ao criar grupo",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleJoinGroup(e: FormEvent) {
    e.preventDefault();
    if (!inviteCode.trim() || !userId) return;

    setLoading(true);
    setError(null);

    try {
      const joined = await joinGroupByCode(
        normalizeInviteCode(inviteCode),
        userId,
      );
      setGroup(joined.groupId, joined.groupName, joined.inviteCode);
      setListId(joined.listId);
      setSuccessCode(null);
      await refreshGroups();
      navigate("/list");
    } catch (joinError) {
      setError(
        joinError instanceof Error
          ? joinError.message
          : "Falha ao entrar no grupo",
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleUseGroup(targetGroupId: string) {
    if (!userId) return;

    const targetGroup = allGroups.find((group) => group.id === targetGroupId);
    if (!targetGroup) return;

    setLoading(true);
    setError(null);

    try {
      setGroup(targetGroup.id, targetGroup.nome, targetGroup.codigo_convite);
      const activeList = await ensureActiveListForGroup(targetGroup.id);
      setListId(activeList.id);
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

  async function handleLeaveGroup() {
    if (!groupId || !userId) return;

    setLoading(true);
    setError(null);

    try {
      await leaveGroup(groupId, userId);
      clearGroup();
      await refreshGroups();
      navigate("/group");
    } catch (leaveError) {
      setError(
        leaveError instanceof Error
          ? leaveError.message
          : "Falha ao sair do grupo",
      );
    } finally {
      setLoading(false);
    }
  }

  async function copyInviteCode() {
    if (!groupCode || !navigator.clipboard) return;
    await navigator.clipboard.writeText(groupCode);
  }

  return (
    <main className="page">
      <h1>Grupo</h1>
      <p>
        {userName
          ? `Olá, ${userName}`
          : "Crie ou entre em um grupo para continuar."}
      </p>

      {error && <p className="error">{error}</p>}

      <section className="card form">
        <p className="section-title">Grupo atual</p>
        <h2>{groupNameActive ?? "Nenhum grupo ativo"}</h2>
        <p className="muted">
          {groupCode
            ? `Código: ${groupCode}`
            : "Nenhum código disponível no momento."}
        </p>
        {groupId && (
          <div className="actions-row">
            <button type="button" onClick={copyInviteCode}>
              Copiar código
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() => navigate("/list")}
            >
              Ir para a lista
            </button>
            <button
              type="button"
              className="danger"
              onClick={handleLeaveGroup}
              disabled={loading}
            >
              Sair do grupo
            </button>
          </div>
        )}
      </section>

      {successCode && (
        <section className="card form">
          <p className="section-title">Convite criado</p>
          <h2>{successCode}</h2>
          <p className="muted">
            Compartilhe este código com quem vai participar do grupo.
          </p>
          <div className="actions-row">
            <button type="button" onClick={copyInviteCode}>
              Copiar código
            </button>
            <button
              type="button"
              className="ghost"
              onClick={() => navigate("/list")}
            >
              Continuar
            </button>
          </div>
        </section>
      )}

      <div className="grid">
        <form className="card form" onSubmit={handleCreateGroup}>
          <h2>Criar grupo</h2>
          <label>
            Nome do grupo
            <input
              value={groupName}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setGroupName(e.target.value)
              }
            />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? "Salvando..." : "Criar"}
          </button>
        </form>

        <form className="card form" onSubmit={handleJoinGroup}>
          <h2>Entrar com código</h2>
          <label>
            Código
            <input
              value={inviteCode}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setInviteCode(e.target.value)
              }
            />
          </label>
          <button type="submit" disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>

      <section className="card form">
        <h2>Meus grupos</h2>
        {allGroups.length === 0 ? (
          <p className="muted">Nenhum grupo encontrado.</p>
        ) : (
          <div className="stack-list">
            {allGroups.map((group) => (
              <article
                key={group.id}
                className={
                  group.id === groupId ? "group-item active" : "group-item"
                }
              >
                <div>
                  <strong>{group.nome}</strong>
                  <p>{group.codigo_convite}</p>
                </div>
                <div className="actions-row">
                  <button
                    type="button"
                    className="ghost"
                    onClick={() => handleUseGroup(group.id)}
                    disabled={loading}
                  >
                    Usar
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <nav className="tabs">
        <button
          type="button"
          className="ghost-link"
          onClick={() => navigate("/list")}
        >
          Lista
        </button>
        <button
          type="button"
          className="ghost-link"
          onClick={() => navigate("/history")}
        >
          Historico
        </button>
        <button
          type="button"
          className="ghost-link"
          onClick={() => navigate("/profile")}
        >
          Perfil
        </button>
      </nav>
    </main>
  );
}
