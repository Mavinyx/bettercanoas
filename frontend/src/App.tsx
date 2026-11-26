import { Route, Routes, Link, Navigate, useNavigate } from "react-router-dom";
import Home from "./pages/Home";
import Guias from "./pages/Guias";
import ColetaDomiciliar from "./pages/ColetaDomiciliar";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DenunciasPage from "./pages/DenunciasPage";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import logo from "./assets/logo.png";

function AppContent() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <>
      <header className="site-nav">
        <nav className="site-nav__links">
          <Link to="/" className="site-nav__link">
            <i className="fa-solid fa-house"></i>
            <span>Home</span>
          </Link>
          <Link to="/guias" className="site-nav__link">
            <i className="fa-solid fa-book-open"></i>
            <span>Guias</span>
          </Link>
          <Link to="/coleta-domicialiar" className="site-nav__link">
            <i className="fa-solid fa-truck"></i>
            <span>Coleta</span>
          </Link>

          {isAuthenticated ? (
            <>
              <Link to="/denuncia" className="site-nav__link">
                <i className="fa-solid fa-bullhorn"></i>
                <span>Denúncia</span>
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="site-nav__link cursor-pointer bg-transparent border-0"
              >
                <i className="fa-solid fa-right-from-bracket"></i>
                <span>Sair</span>
              </button>
            </>
          ) : (
            <Link to="/login" className="site-nav__link">
              <i className="fa-solid fa-right-to-bracket"></i>
              <span>Login</span>
            </Link>
          )}
        </nav>
      </header>

      <div id="cabeçalho" className="site-brand">
        <img src={logo} alt="Logo Better Canoas" />
        <span>Better Canoas</span>
      </div>

      <Routes>
        {/* Rotas públicas */}
        <Route path="/" element={<Home />} />
        <Route path="/guias" element={<Guias />} />
        <Route path="/coleta-domicialiar" element={<ColetaDomiciliar />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/cadastro" element={<RegisterPage />} />

        {/* Rota unificada de denúncias e mapa de bosses */}
        <Route
          path="/denuncia"
          element={
            <ProtectedRoute>
              <DenunciasPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/denuncias/nova"
          element={<Navigate to="/denuncia" replace />}
        />
        <Route
          path="/denuncias/historico"
          element={<Navigate to="/denuncia?aba=historico" replace />}
        />
      </Routes>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;