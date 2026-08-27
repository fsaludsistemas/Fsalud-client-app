
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Home from "./pages/Home";
import DependenciasCrud from "./pages/DependenciasCrud";
import ProfesoresCrud from "./pages/ProfesoresCrud";
import DatosProfesor from "./pages/DatosProfesor";
import AsignacionesProfesor from "./pages/AsignacionesProfesor";
import CredencialesProfesor from "./pages/CredencialesProfesor";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes (nested inside ProtectedRoute & Layout) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Home />} />
              <Route path="/dependencias" element={<DependenciasCrud />} />
              <Route path="/profesores" element={<ProfesoresCrud />} />
              <Route path="/profesores/:id/datos" element={<DatosProfesor />} />
              <Route path="/profesores/:id/asignaciones" element={<AsignacionesProfesor />} />
              <Route path="/profesores/:id/credenciales" element={<CredencialesProfesor />} />
            </Route>
          </Route>

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
