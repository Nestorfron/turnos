import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import AdminPanel from "./pages/AdminPanel";
import JefeZonaDashboard from "./pages/JefeZonaDashboard";
import EncargadoDependenciaPanel from "./pages/EncargadoDependenciaPanel";
import Navbar from "./components/Navbar";

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/jefe-zona" element={<JefeZonaDashboard />} />
        <Route path="/dependencia/:id" element={<EncargadoDependenciaPanel />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
