import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getDependencias } from "../api/apiClient";

const DependenciasContext = createContext(null);

export const DependenciasProvider = ({ children }) => {
  const [dependencias, setDependencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestRef = useRef(null);

  const refreshDependencias = useCallback(async () => {
    if (requestRef.current) return requestRef.current;

    const request = getDependencias()
      .then((data) => {
        setDependencias(data || []);
        setError("");
        return data || [];
      })
      .catch((err) => {
        console.error(err);
        setError("Error al cargar las dependencias.");
        throw err;
      })
      .finally(() => {
        setLoading(false);
        requestRef.current = null;
      });

    requestRef.current = request;
    return request;
  }, []);

  useEffect(() => {
    refreshDependencias().catch(() => {});
  }, [refreshDependencias]);

  return (
    <DependenciasContext.Provider
      value={{ dependencias, loading, error, refreshDependencias }}
    >
      {children}
    </DependenciasContext.Provider>
  );
};

export const useDependencias = () => {
  const context = useContext(DependenciasContext);
  if (!context) {
    throw new Error("useDependencias must be used within a DependenciasProvider");
  }
  return context;
};
