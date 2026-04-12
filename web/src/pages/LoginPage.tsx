import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { restoreGroupContext } from "../lib/webData";
import { useAuthStore } from "../stores/authStore";
import { useGroupStore } from "../stores/groupStore";

export function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      const userName = data.user.user_metadata?.nome ?? data.user.email ?? "";
      useAuthStore.getState().setUser(data.user.id, userName);

      const currentGroupId = useGroupStore.getState().groupId;
      const context = await restoreGroupContext(data.user.id, currentGroupId);
      useGroupStore.getState().setAllGroups(context.groups);

      if (context.group) {
        useGroupStore
          .getState()
          .setGroup(
            context.group.id,
            context.group.nome,
            context.group.codigo_convite,
          );
        useGroupStore.getState().setListId(context.listId);
        navigate("/list");
      } else {
        useGroupStore.getState().clearGroup();
        navigate("/group");
      }
    }

    setLoading(false);
  }

  return (
    <main className="page auth">
      <h1>Compras em Dois</h1>
      <p>Entrar na sua conta</p>

      <form onSubmit={onSubmit} className="card form">
        <label>
          E-mail
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            required
          />
        </label>
        <label>
          Senha
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
          />
        </label>

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <p>
        Nao tem conta? <Link to="/register">Criar conta</Link>
      </p>
    </main>
  );
}
