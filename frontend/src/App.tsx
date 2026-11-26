import { Route, Routes, Link, useNavigate } from "react-router-dom";
import Home from "./pages/Home";
import Guias from "./pages/Guias";
import ColetaDomiciliar from "./pages/ColetaDomiciliar";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import logo from "./assets/logo.png";

function AreaUsuarioPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="max-w-2xl mx-auto my-8 p-6 card bg-base-100 shadow">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Área do Usuário</h1>
          {user && (
            <p className="text-sm mt-1">
              Olá, {user.nome} ({user.login})
            </p>
          )}
        </div>
        <button type="button" onClick={handleLogout} className="btn btn-outline btn-sm">
          Sair
        </button>
      </div>
    </div>
  );
}

function AppContent() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
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
              <Link to="/denuncias/nova" className="site-nav__link">
                <span>Denunciar</span>
              </Link>
              <Link to="/denuncias/historico" className="site-nav__link">
                <span>Histórico</span>
              </Link>
              <Link to="/denuncia" className="site-nav__link">
                <span>{user?.nome ?? "Conta"}</span>
              </Link>
              <button type="button" onClick={handleLogout} className="site-nav__link">
                <span>Sair</span>
              </button>
            </>
          ) : (
            <Link to="/login" className="site-nav__link">
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

        {/* Rotas protegidas */}
        <Route
          path="/denuncia"
          element={
            <ProtectedRoute>
              <AreaUsuarioPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/denuncias/nova"
          element={
            <ProtectedRoute>
              <div className="max-w-2xl mx-auto my-8 p-6 card bg-base-100 shadow">
                <h1 className="text-xl font-bold">Envio de Denúncia</h1>
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/denuncias/historico"
          element={
            <ProtectedRoute>
              <div className="max-w-2xl mx-auto my-8 p-6 card bg-base-100 shadow">
                <h1 className="text-xl font-bold">Histórico de Denúncias</h1>
              </div>
            </ProtectedRoute>
          }
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