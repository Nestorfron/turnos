// src/App.jsx
import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import JefeZonaDashboard from "./pages/JefeZonaDashboard";
import EncargadoDependenciaPanel from "./pages/EncargadoDependenciaPanel";
import "./styles/App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<JefeZonaDashboard />} />
          <Route path="/dependencia/:dependenciaId" element={<EncargadoDependenciaPanel />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
