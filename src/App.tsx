import { Route, Routes, Link } from "react-router-dom"
import Home from "./pages/Home"
import Guias from "./pages/Guias"
import ColetaDomiciliar from "./pages/ColetaDomiciliar"
import logo from "./assets/logo.png"
function App() {
  return (
    <>
      <header className="site-nav">
          <nav className="site-nav__links">
            <Link to="/" className="site-nav__link"><i className="fa-solid fa-house"></i><span>Home</span></Link>
            <Link to="/guias" className="site-nav__link"><i className="fa-solid fa-book-open"></i><span>Guias</span></Link>
            <Link to="/coleta-domicialiar" className="site-nav__link"><i className="fa-solid fa-truck"></i><span>Coleta</span></Link>
          </nav>
      </header>
      <div id="cabeçalho" className="site-brand"><img src={logo} alt="Logo Better Canoas" /><span>Better Canoas</span></div>
      
      <Routes>
        <Route path="/"  element={<Home/>} />
        <Route path="/guias" element={<Guias/>} />
        <Route path="/coleta-domicialiar" element={<ColetaDomiciliar/>} />
      </Routes>
    </>
  )
}

export default App
