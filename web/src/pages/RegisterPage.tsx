import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { restoreGroupContext } from "../lib/webData";
import { useAuthStore } from "../stores/authStore";
import { useGroupStore } from "../stores/groupStore";

export function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nome: name } },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      useAuthStore
        .getState()
        .setUser(
          data.user.id,
          data.user.user_metadata?.nome ?? data.user.email ?? "",
        );

      const context = await restoreGroupContext(
        data.user.id,
        useGroupStore.getState().groupId,
      );
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
        navigate("/group");
      }
    } else {
      navigate("/login");
    }
    setLoading(false);
  }

  return (
    <main className="page auth">
      <h1>Criar conta</h1>
      <p>Cadastro web inicial</p>

      <form onSubmit={onSubmit} className="card form">
        <label>
          Nome
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </label>
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
          {loading ? "Criando..." : "Criar conta"}
        </button>
      </form>

      <p>
        Ja tem conta? <Link to="/login">Entrar</Link>
      </p>
    </main>
  );
}
