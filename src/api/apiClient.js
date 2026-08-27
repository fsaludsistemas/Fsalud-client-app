import axios from "axios";
import { getIdToken } from "../auth/authService";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to add the Firebase ID Token to every request
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await getIdToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      // In case we request before authentication is fully resolved
      console.debug("Request interceptor: no active session token found");
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Dependencias API services
export const getDependencias = async () => {
  const response = await apiClient.get("/dependencias");
  return response.data;
};

export const createDependencia = async (data) => {
  const response = await apiClient.post("/dependencias", data);
  return response.data;
};

export const updateDependencia = async (id, data) => {
  const response = await apiClient.put(`/dependencias/${id}`, data);
  return response.data;
};

export const deleteDependencia = async (id) => {
  const response = await apiClient.delete(`/dependencias/${id}`);
  return response.data;
};

// Profesores API services
export const getProfesores = async () => {
  const response = await apiClient.get("/profesores");
  return response.data;
};

export const getProfesorById = async (id) => {
  const response = await apiClient.get(`/profesores/${id}`);
  return response.data;
};

export const createProfesor = async (data) => {
  const response = await apiClient.post("/profesores", data);
  return response.data;
};

export const updateProfesor = async (id, data) => {
  const response = await apiClient.put(`/profesores/${id}`, data);
  return response.data;
};

export const deleteProfesor = async (id) => {
  const response = await apiClient.delete(`/profesores/${id}`);
  return response.data;
};

// Periodos API services
export const getPeriodos = async () => {
  const response = await apiClient.get("/periodos");
  return response.data;
};

// Docente Periodos API services
export const getDocentePeriodos = async () => {
  const response = await apiClient.get("/docente-periodos");
  return response.data;
};

export const createDocentePeriodo = async (data) => {
  const response = await apiClient.post("/docente-periodos", data);
  return response.data;
};

export const updateDocentePeriodo = async (id, data) => {
  const response = await apiClient.put(`/docente-periodos/${id}`, data);
  return response.data;
};

export const deleteDocentePeriodo = async (id) => {
  const response = await apiClient.delete(`/docente-periodos/${id}`);
  return response.data;
};

// Asignaciones API services
export const getAsignacionesByProfesor = async (profesorId) => {
  const response = await apiClient.get(`/asignaciones/profesor/${profesorId}`);
  return response.data;
};

export const createAsignacion = async (data) => {
  const response = await apiClient.post("/asignaciones", data);
  return response.data;
};

export const updateAsignacion = async (id, data) => {
  const response = await apiClient.put(`/asignaciones/${id}`, data);
  return response.data;
};

export const deleteAsignacion = async (id) => {
  const response = await apiClient.delete(`/asignaciones/${id}`);
  return response.data;
};

export default apiClient;
