import { useEffect, useState } from "react";
import { Box, Typography, Stack, Avatar, Grid, Paper, Divider } from "@mui/material";
import { getDependencias } from "../api/apiClient";

const DetailRow = ({ label, value }) => (
  <Grid size={{ xs: 6, sm: 3, md: 2.4 }}>
    <Typography variant="body2" sx={{ fontWeight: 500, color: "#37474f" }}>
      {value || "—"}
    </Typography>
  </Grid>
);

const DetailProfesor = ({ profesor, docentePeriodos = [] }) => {
  const [dependencias, setDependencias] = useState([]);

  useEffect(() => {
    const fetchDeps = async () => {
      try {
        const deps = await getDependencias();
        setDependencias(deps || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchDeps();
  }, []);

  if (!profesor) return null;

  let dependenciaText = "—";
  if (profesor.dependencia_actual && dependencias.length > 0) {
    const depActual = profesor.dependencia_actual;
    const depId =
      depActual.seccion_id ||
      depActual.departamento_id ||
      depActual.escuela_o_oficina_id;
    const dep = dependencias.find((d) => d.id === depId);
    if (dep) {
      dependenciaText = `${dep.nombre} (${dep.tipo})`;
    }
  }

  const docenteActivo = docentePeriodos.find((d) => d.estado === "ACTIVO") || docentePeriodos[0];

  const formatIdType = (tipo) => {
    switch (tipo) {
      case 'CEDULA': return 'CC';
      case 'PASAPORTE': return 'PP';
      case 'TARJETA_IDENTIDAD': return 'TI';
      default: return tipo;
    }
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 3, mb: 3, boxShadow: 1 }}>
      <Stack direction="row" spacing={3} alignItems="center">
        <Avatar
          src={profesor.foto_url || undefined}
          alt={`${profesor.nombres} ${profesor.apellidos}`}
          sx={{
            width: 60,
            height: 60,
            bgcolor: "#546e7a",
            fontSize: "2.5rem",
          }}
        >
          {profesor.nombres?.[0]}
          {profesor.apellidos?.[0]}
        </Avatar>
        <Box flex={1}>
          <Typography variant="h5" sx={{ fontWeight: "bold", color: "#37474f", mb: 0.5 }}>
            {profesor.nombres} {profesor.apellidos}
          </Typography>
          
          <Stack direction="column" spacing={0.5} sx={{ mb: 1 }}>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500, color: "#37474f" }}>
                {formatIdType(profesor.tipo_identificacion)} - {profesor.numero_identificacion}
              </Typography>
            </Box>
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 500, color: "#37474f" }}>
                {dependenciaText}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Stack>

      <Divider sx={{ my: 2 }} />

      <Grid container spacing={0.5}>
        <DetailRow label="Vinculación" value={docenteActivo?.tipo_vinculacion} />
        <DetailRow label="Dedicación" value={docenteActivo?.dedicacion} />
        <DetailRow label="Cargo" value={docenteActivo?.cargo} />
        <DetailRow label="Nivel" value={docenteActivo?.nivel} />
        <DetailRow label="Fecha de vinculación" value={profesor.fecha_vinculacion} />
      </Grid>
    </Paper>
  );
};

export default DetailProfesor;
