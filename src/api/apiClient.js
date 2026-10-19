import axios from "axios";
import { getIdToken } from "../auth/authService";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Catálogos que cambian poco: evita repetir la misma petición entre pantallas
// y deduplica solicitudes simultáneas (por ejemplo, con StrictMode en desarrollo).
const GET_CACHE_TTL = 60_000;
const getCache = new Map();

const cachedGet = (key, request) => {
  const cached = getCache.get(key);
  if (cached && Date.now() - cached.timestamp < GET_CACHE_TTL) {
    return cached.promise;
  }

  const promise = request().catch((error) => {
    getCache.delete(key);
    throw error;
  });
  getCache.set(key, { promise, timestamp: Date.now() });
  return promise;
};

const invalidateGetCache = (...keys) => {
  keys.forEach((key) => getCache.delete(key));
};

// Interceptor to add the Firebase ID Token to every request
apiClient.interceptors.request.use(
  async (config) => {
    const token = await getIdToken();

    if (!token) {
      return Promise.reject(new Error("No hay usuario autenticado"));
    }

    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Dependencias API services
export const getDependencias = async () => {
  return cachedGet("dependencias", async () => {
    const response = await apiClient.get("/dependencias");
    return response.data;
  });
};

export const createDependencia = async (data) => {
  const response = await apiClient.post("/dependencias", data);
  invalidateGetCache("dependencias");
  return response.data;
};

export const updateDependencia = async (id, data) => {
  const response = await apiClient.put(`/dependencias/${id}`, data);
  invalidateGetCache("dependencias");
  return response.data;
};

export const deleteDependencia = async (id) => {
  const response = await apiClient.delete(`/dependencias/${id}`);
  invalidateGetCache("dependencias");
  return response.data;
};

// Profesores API services
export const getUsuarios = async () => (await apiClient.get("/usuarios")).data;
export const getUsuarioById = async (id) => (await apiClient.get(`/usuarios/${id}`)).data;
export const createUsuario = async (data) => (await apiClient.post("/usuarios", data)).data;
export const updateUsuario = async (id, data) => (await apiClient.put(`/usuarios/${id}`, data)).data;
export const deleteUsuario = async (id) => (await apiClient.delete(`/usuarios/${id}`)).data;

export const getProfesores = async ({ limit = 10, pageToken } = {}) => {
  const response = await apiClient.get("/profesores", {
    params: {
      limit,
      ...(pageToken ? { pageToken } : {}),
    },
  });
  return response.data;
};

export const searchProfesores = async (search) => {
  const response = await apiClient.get("/profesores/buscar", {
    params: { search },
  });
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
  return cachedGet("periodos", async () => {
    const response = await apiClient.get("/periodos");
    return response.data;
  });
};

// Docente Periodos API services
export const getDocentePeriodos = async () => {
  return cachedGet("docente-periodos", async () => {
    const response = await apiClient.get("/docente-periodos");
    return response.data;
  });
};

export const getDashboardStats = async (filters = {}) => {
  const response = await apiClient.get("/estadisticas/dashboard", {
    params: Object.fromEntries(Object.entries(filters).filter(([, value]) => value !== "" && value != null)),
  });
  return response.data;
};

export const rebuildDashboardStats = async () => {
  const response = await apiClient.post("/estadisticas/dashboard/reconstruir");
  return response.data;
};

export const createDocentePeriodo = async (data) => {
  const response = await apiClient.post("/docente-periodos", data);
  invalidateGetCache("docente-periodos");
  return response.data;
};

export const updateDocentePeriodo = async (id, data) => {
  const response = await apiClient.put(`/docente-periodos/${id}`, data);
  invalidateGetCache("docente-periodos");
  return response.data;
};

export const deleteDocentePeriodo = async (id) => {
  const response = await apiClient.delete(`/docente-periodos/${id}`);
  invalidateGetCache("docente-periodos");
  return response.data;
};

// Asignaciones API services
export const getAsignacionesByProfesor = async (profesorId) => {
  const response = await apiClient.get(`/asignaciones/profesor/${profesorId}`);
  return response.data;
};

export const getResumenHoras = async (docentePeriodoId, filters = {}) => {
  const response = await apiClient.get("/asignaciones/resumen-horas", {
    params: {
      docente_periodo_id: docentePeriodoId,
      ...filters,
    },
  });
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

// Credenciales API services
export const getCredencialesByProfesor = async (profesorId) => {
  const response = await apiClient.get(`/credenciales/${profesorId}`);
  return response.data;
};

export const createCredenciales = async (data) => {
  const response = await apiClient.post("/credenciales", data);
  return response.data;
};

export const updateCredenciales = async (profesorId, data) => {
  const response = await apiClient.put(`/credenciales/${profesorId}`, data);
  return response.data;
};

export const patchCredenciales = async (profesorId, data) => {
  const response = await apiClient.patch(`/credenciales/${profesorId}`, data);
  return response.data;
};

export const createCredencialEvento = async (profesorId, data) => {
  const response = await apiClient.post(
    `/credenciales/${profesorId}/eventos`,
    data,
  );
  return response.data;
};

export const addFirmaPresidente = async (profesorId, numeroEvento, firmaPresidenteUrl) => {
  const response = await apiClient.patch(
    `/credenciales/${profesorId}/eventos/${numeroEvento}/firma`,
    { firma_presidente_url: firmaPresidenteUrl },
  );
  return response.data;
};

export const getProximoEvento = async (profesorId) => {
  const response = await apiClient.get(
    `/credenciales/${profesorId}/proximo-evento`,
  );
  return response.data;
};

export const uploadStorageFile = async ({
  profesor_id,
  file,
  tipo,
  factor,
  referencia_id,
}) => {
  const content_type = file.type || "application/octet-stream";
  const targetResponse = await apiClient.post("/storage/upload-target", {
    profesor_id,
    nombre_archivo: file.name,
    content_type,
    tipo,
    factor,
    referencia_id,
  });
  const target = targetResponse.data;
  const token = await getIdToken();
  const uploadResponse = await fetch(target.uploadUrl, {
    method: target.method || "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": content_type,
    },
    body: file,
  });
  if (!uploadResponse.ok) {
    throw new Error("No se pudo subir el archivo al bucket.");
  }
  return target.downloadUrl;
};

export const deleteCredenciales = async (profesorId) => {
  const response = await apiClient.delete(`/credenciales/${profesorId}`);
  return response.data;
};

export default apiClient;
