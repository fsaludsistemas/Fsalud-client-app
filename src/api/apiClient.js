import { getIdToken } from "../auth/authService";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

/**
 * Wrapper sobre fetch que incluye automáticamente el Authorization: Bearer <idToken>
 * en cada petición al servidor.
 *
 * Uso:
 *   const data = await apiFetch("/profesores");
 *   const nuevo = await apiFetch("/usuarios", { method: "POST", body: JSON.stringify({...}) });
 */
export const apiFetch = async (path, options = {}) => {
  const token = await getIdToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.message || `Error ${response.status}`;
    throw new Error(message);
  }

  return response.json();
};
