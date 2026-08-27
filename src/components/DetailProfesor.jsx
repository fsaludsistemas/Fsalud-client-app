import { useEffect, useState } from "react";
import { getProfesorById } from "../api/apiClient";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Stack,
  CircularProgress,
  Alert,
  Divider,
  Avatar,
  Grid,
} from "@mui/material";

const DetailRow = ({ label, value }) => (
  <Grid size={{ xs: 12, sm: 6 }}>
    <Typography variant="caption" color="text.secondary" display="block">
      {label}
    </Typography>
    <Typography variant="body1" sx={{ fontWeight: 500, color: "#37474f" }}>
      {value || "—"}
    </Typography>
  </Grid>
);

const DetailProfesor = ({ open, onClose, profesorId, dependencias = [] }) => {
  const [profesor, setProfesor] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getDependenciaNombre = (id) => {
    if (!id) return null;
    const dep = dependencias.find((d) => d.id === id);
    return dep ? `${dep.nombre} (${dep.tipo})` : id;
  };

  const getDependenciaText = (depActual) => {
    if (!depActual) return "—";

    const partes = [];
    const escuela = getDependenciaNombre(depActual.escuela_o_oficina_id);
    const departamento = getDependenciaNombre(depActual.departamento_id);
    const seccion = getDependenciaNombre(depActual.seccion_id);

    if (escuela) partes.push(`Escuela/Oficina: ${escuela}`);
    if (departamento) partes.push(`Departamento: ${departamento}`);
    if (seccion) partes.push(`Sección: ${seccion}`);

    return partes.length > 0 ? partes.join(" · ") : "—";
  };

  useEffect(() => {
    if (!open || !profesorId) {
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError("");
      setProfesor(null);
      try {
        const profData = await getProfesorById(profesorId);
        setProfesor(profData);
      } catch (err) {
        console.error(err);
        setError("Error al cargar la información del profesor.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [open, profesorId]);

  const handleClose = () => {
    setProfesor(null);
    setError("");
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: "bold", color: "#37474f" }}>
        Detalle del Profesor
      </DialogTitle>
      <DialogContent dividers>
        {loading && (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!loading && !error && profesor && (
          <Stack spacing={3}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                src={profesor.foto_url || undefined}
                alt={`${profesor.nombres} ${profesor.apellidos}`}
                sx={{
                  width: 72,
                  height: 72,
                  bgcolor: "#546e7a",
                  fontSize: "1.5rem",
                }}
              >
                {profesor.nombres?.[0]}
                {profesor.apellidos?.[0]}
              </Avatar>
              <Box>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: "bold", color: "#37474f" }}
                >
                  {profesor.nombres} {profesor.apellidos}
                </Typography>
                <Box
                  component="span"
                  sx={{
                    display: "inline-block",
                    mt: 0.5,
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 1,
                    fontSize: "0.75rem",
                    fontWeight: "bold",
                    bgcolor:
                      profesor.estado === "ACTIVO" ? "#e8f5e9" : "#ffebee",
                    color: profesor.estado === "ACTIVO" ? "#2e7d32" : "#c62828",
                  }}
                >
                  {profesor.estado}
                </Box>
              </Box>
            </Stack>

            <Divider />

            <Box>
              <Typography
                variant="subtitle2"
                sx={{ mb: 2, color: "#546e7a", fontWeight: "bold" }}
              >
                Identificación
              </Typography>
              <Grid container spacing={2}>
                <DetailRow
                  label="Tipo de identificación"
                  value={profesor.tipo_identificacion}
                />
                <DetailRow
                  label="Número de identificación"
                  value={profesor.numero_identificacion}
                />
              </Grid>
            </Box>
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ mb: 2, color: "#546e7a", fontWeight: "bold" }}
              >
                Vinculación
              </Typography>
              <Grid container spacing={2}>
                <DetailRow
                  label="Fecha de vinculación"
                  value={profesor.fecha_vinculacion}
                />
                <Grid size={{ xs: 12 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    Dependencia actual
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{ fontWeight: 500, color: "#37474f" }}
                  >
                    {getDependenciaText(profesor.dependencia_actual)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
            <Divider />

            <Box>
              <Typography
                variant="subtitle2"
                sx={{ mb: 2, color: "#546e7a", fontWeight: "bold" }}
              >
                Contacto
              </Typography>
              <Grid container spacing={2}>
                <DetailRow
                  label="Email institucional"
                  value={profesor.email_institucional}
                />
                <DetailRow label="Teléfono" value={profesor.telefono} />
              </Grid>
            </Box>

            <Divider />

            <Box>
              <Typography
                variant="subtitle2"
                sx={{ mb: 2, color: "#546e7a", fontWeight: "bold" }}
              >
                Datos personales
              </Typography>
              <Grid container spacing={2}>
                <DetailRow
                  label="Lugar de nacimiento"
                  value={profesor.lugar_nacimiento}
                />
                <DetailRow
                  label="Fecha de nacimiento"
                  value={profesor.fecha_nacimiento}
                />
              </Grid>
            </Box>

            <Divider />

            {(profesor.createdAt || profesor.updatedAt) && (
              <>
                <Divider />
                {/** 
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 2, color: "#546e7a", fontWeight: "bold" }}>
                    Registro
                  </Typography>
                  <Grid container spacing={2}>
                    <DetailRow
                      label="Fecha de creación"
                      value={profesor.createdAt ? new Date(profesor.createdAt).toLocaleString() : null}
                    />
                    <DetailRow
                      label="Última actualización"
                      value={profesor.updatedAt ? new Date(profesor.updatedAt).toLocaleString() : null}
                    />
                  </Grid>
                </Box>
*/}
              </>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={handleClose} variant="contained" color="primary">
          Cerrar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default DetailProfesor;
