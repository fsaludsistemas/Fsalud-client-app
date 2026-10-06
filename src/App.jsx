import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { DependenciasProvider } from "./context/DependenciasContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import DependenciasCrud from "./pages/DependenciasCrud";
import ProfesoresCrud from "./pages/ProfesoresCrud";
import DatosProfesor from "./pages/DatosProfesor";
import AsignacionesProfesor from "./pages/AsignacionesProfesor";
import CredencialesProfesor from "./pages/CredencialesProfesor";
import UsuariosCrud from "./pages/UsuariosCrud";
import { useAuth } from "./context/AuthContext";

function NonPresidentProfessorPage({ children }) {
  const { user } = useAuth();
  return user?.permiso === "PRESIDENTE" ? <Navigate to="/profesores" replace /> : children;
}

function App() {
  return (
    <AuthProvider>
      <DependenciasProvider>
        <BrowserRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />

          {/* Protected Routes (nested inside ProtectedRoute & Layout) */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<ProfesoresCrud />} />
              <Route path="/dependencias" element={<DependenciasCrud />} />
              <Route path="/usuarios" element={<UsuariosCrud />} />
              <Route path="/profesores" element={<ProfesoresCrud />} />
              <Route path="/profesores/:id/datos" element={<NonPresidentProfessorPage><DatosProfesor /></NonPresidentProfessorPage>} />
              <Route
                path="/profesores/:id/asignaciones"
                element={<NonPresidentProfessorPage><AsignacionesProfesor /></NonPresidentProfessorPage>}
              />
              <Route
                path="/profesores/:id/credenciales"
                element={<CredencialesProfesor />}
              />
              {/* Alias para enlaces enviados por correo */}
              <Route
                path="/credenciales/:id"
                element={<CredencialesProfesor />}
              />
            </Route>
          </Route>

          {/* Catch-all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </BrowserRouter>
      </DependenciasProvider>
    </AuthProvider>
  );
}

export default App;
