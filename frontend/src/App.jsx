import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import MiPerfil from "./pages/MiPerfil";
import AdminPanel from "./pages/AdminPanel";
import JefeZonaDashboard from "./pages/JefeZonaDashboard";
import DetalleDependencia from "./pages/DetalleDependencia";
import EncargadoDependenciaPanel from "./pages/EncargadoDependenciaPanel";
import GuardiasPanel from "./pages/GuaridasPanel";
import Navbar from "./components/Navbar";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/mi-perfil" element={<MiPerfil />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/jefe-zona" element={<JefeZonaDashboard />} />
        <Route path="/detalle-dependencia/:id" element={<DetalleDependencia />} />
        <Route path="/dependencia/:id" element={<EncargadoDependenciaPanel />} />
        <Route path="/guardias" element={<GuardiasPanel />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
