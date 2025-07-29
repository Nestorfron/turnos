import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import MiPerfil from "./pages/MiPerfil";
import AdminPanel from "./pages/AdminPanel";
import JefeZonaDashboard from "./pages/JefeZonaDashboard";
import FuncionarioPanel from "./pages/FuncionarioPanel";
import GuardiasPanel from "./pages/GuaridasPanel";
import Navbar from "./components/Navbar";
import EscalafonServicio from "./pages/EscalafonServicio";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mi-perfil" element={<MiPerfil />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/jefe-zona" element={<JefeZonaDashboard />} />
        <Route path="/escalafon-servicio" element={<EscalafonServicio />} />
        <Route path="/funcionario/:id" element={<FuncionarioPanel />} />
        <Route path="/guardias" element={<GuardiasPanel />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
