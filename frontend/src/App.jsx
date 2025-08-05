import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import MiPerfil from "./pages/MiPerfil";
import AdminPanel from "./pages/AdminPanel";
import JefeZonaDashboard from "./pages/JefeZonaDashboard";
import FuncionarioPanel from "./pages/FuncionarioPanel";
import GuardiasPanel from "./pages/GuaridasPanel";
import Navbar from "./components/Navbar";
import EscalafonServicio from "./pages/EscalafonServicio";
import FuncionarioDetallePanel from "./pages/FuncionarioDetallePanel";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/mi-perfil" element={<MiPerfil />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/jefe-zona" element={<JefeZonaDashboard />} />
        <Route path="/escalafon-servicio" element={<EscalafonServicio />} />
        <Route path="/funcionario/:id" element={<FuncionarioPanel />} />
        <Route path="/funcionario/:id/detalle" element={<FuncionarioDetallePanel />} />
        <Route path="/guardias" element={<GuardiasPanel />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
