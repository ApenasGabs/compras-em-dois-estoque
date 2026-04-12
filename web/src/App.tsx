import { Navigate, Route, Routes } from "react-router-dom";
import {
  PublicOnly,
  RequireAuth,
  RequireGroup,
} from "./components/RouteGuards";
import { GroupPage } from "./pages/GroupPage";
import { HistoryPage } from "./pages/HistoryPage";
import { ListPage } from "./pages/ListPage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ProfilePage } from "./pages/ProfilePage";
import { RegisterPage } from "./pages/RegisterPage";
import { useSessionStore } from "./stores/sessionStore";

function App() {
  const ready = useSessionStore((state) => state.ready);

  if (!ready) {
    return (
      <main className="page auth">
        <h1>Carregando</h1>
        <p>Restaurando sua sessão e grupo ativo...</p>
      </main>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route
        path="/login"
        element={
          <PublicOnly>
            <LoginPage />
          </PublicOnly>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnly>
            <RegisterPage />
          </PublicOnly>
        }
      />
      <Route
        path="/group"
        element={
          <RequireAuth>
            <GroupPage />
          </RequireAuth>
        }
      />
      <Route
        path="/list"
        element={
          <RequireAuth>
            <RequireGroup>
              <ListPage />
            </RequireGroup>
          </RequireAuth>
        }
      />
      <Route
        path="/history"
        element={
          <RequireAuth>
            <RequireGroup>
              <HistoryPage />
            </RequireGroup>
          </RequireAuth>
        }
      />
      <Route
        path="/profile"
        element={
          <RequireAuth>
            <RequireGroup>
              <ProfilePage />
            </RequireGroup>
          </RequireAuth>
        }
      />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

export default App;
