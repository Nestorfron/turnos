import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import JefeZonaDashboard from "./pages/JefeZonaDashboard";
import EncargadoDependenciaPanel from "./pages/EncargadoDependenciaPanel";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/jefe-zona" element={<JefeZonaDashboard />} />
        <Route path="/dependencia/:id" element={<EncargadoDependenciaPanel />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
