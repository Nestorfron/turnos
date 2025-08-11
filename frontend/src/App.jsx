import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { registerSW } from "virtual:pwa-register";

import Home from "./pages/Home";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import MiPerfil from "./pages/MiPerfil";
import AdminPanel from "./pages/AdminPanel";
import JefeZonaDashboard from "./pages/JefeZonaDashboard";
import FuncionarioPanel from "./pages/FuncionarioPanel";
import GuardiasPanel from "./pages/GuardiasPanel";
import Navbar from "./components/Navbar";
import EscalafonServicio from "./pages/EscalafonServicio";
import FuncionarioDetallePanel from "./pages/FuncionarioDetallePanel";
import SolicitudesLicencia from "./pages/SolicitudesLicencia";

function App() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updateSW, setUpdateSW] = useState(() => () => {});

  useEffect(() => {
    const updateServiceWorker = registerSW({
      onNeedRefresh() {
        setUpdateAvailable(true);
      },
      onOfflineReady() {
        console.log("App lista para funcionar offline 🚀");
      },
    });

    setUpdateSW(() => updateServiceWorker);
  }, []);

  const handleUpdate = () => {
    updateSW();
    setUpdateAvailable(false);
    window.location.reload();
  };

  return (
    <>
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
          <Route path="/solicitudes-licencia" element={<SolicitudesLicencia />} />
        </Routes>
      </BrowserRouter>

      {updateAvailable && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: "#333",
            color: "#fff",
            padding: "1rem",
            textAlign: "center",
            zIndex: 9999,
          }}
        >
          🔄 Nueva versión disponible.&nbsp;
          <button
            onClick={handleUpdate}
            style={{
              cursor: "pointer",
              background: "#fff",
              color: "#333",
              border: "none",
              padding: "0.5rem 1rem",
              borderRadius: "4px",
            }}
          >
            Actualizar
          </button>
        </div>
      )}
    </>
  );
}

export default App;
