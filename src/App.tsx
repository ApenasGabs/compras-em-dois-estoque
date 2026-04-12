import { Navigate, Route, Routes, useNavigate } from "react-router-dom";
import { Button } from "./components/Button/Button";
import { Navbar } from "./components/Navbar/Navbar";
import { Footer } from "./components/Footer/Footer";
import ThemeSelector from "./components/ThemeSelector/ThemeSelector";
import { PublicOnly, RequireAuth, RequireGroup } from "./components/RouteGuards";
import { useAuthStore } from "./stores/authStore";
import { useGroupStore } from "./stores/groupStore";
import { GroupPage } from "./pages/GroupPage";
import { HistoryPage } from "./pages/HistoryPage";
import { ListPage } from "./pages/ListPage";
import { LoginPage } from "./pages/LoginPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { ProfilePage } from "./pages/ProfilePage";
import { RegisterPage } from "./pages/RegisterPage";

const App = () => {
  const navigate = useNavigate();
  const userName = useAuthStore((state) => state.userName);
  const groupName = useGroupStore((state) => state.groupName);

  return (
    <div className="min-h-screen bg-base-200 flex flex-col">
      <Navbar title="Compras em Dois">
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Button variant="ghost" size="sm" onClick={() => navigate("/group")}>
            Grupo
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate("/list")}>
            Lista
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/history")}
          >
            Histórico
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("/profile")}
          >
            Perfil
          </Button>
          <div className="ml-2 flex items-center gap-2">
            <span className="hidden sm:inline text-sm text-base-content/70">
              {groupName ? `Grupo: ${groupName}` : userName ?? "Visitante"}
            </span>
            <ThemeSelector />
          </div>
        </div>
      </Navbar>

      <main className="flex-1">
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
                <ProfilePage />
              </RequireAuth>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
};

export default App;
