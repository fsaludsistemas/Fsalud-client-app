import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Stack,
  Avatar,
  Paper,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { getDependencias } from "../api/apiClient";

const getPeriodLabel = (docentePeriodo) =>
  docentePeriodo?.periodo?.periodo || docentePeriodo?.periodo_id || "";

const getPeriodOrder = (docentePeriodo) => {
  const label = String(getPeriodLabel(docentePeriodo));
  const match = label.match(/(\d{4})\D*([12])/);
  if (match) return Number(match[1]) * 10 + Number(match[2]);

  const year = Number(
    docentePeriodo?.periodo?.anio || docentePeriodo?.periodo?.año,
  );
  const semester = Number(
    docentePeriodo?.periodo?.semestre || docentePeriodo?.periodo?.semester,
  );
  return Number.isFinite(year) && Number.isFinite(semester)
    ? year * 10 + semester
    : -1;
};

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
      const tipo = dep.tipo
        ? dep.tipo.charAt(0).toUpperCase() + dep.tipo.slice(1).toLowerCase()
        : "Dependencia";
      dependenciaText = `${tipo} de ${dep.nombre}`;
    }
  }

  const docenteActivo = [...docentePeriodos].sort(
    (left, right) => getPeriodOrder(right) - getPeriodOrder(left),
  )[0];

  const formatIdType = (tipo) => {
    switch (tipo) {
      case "CEDULA":
        return "CC";
      case "PASAPORTE":
        return "PP";
      case "TARJETA_IDENTIDAD":
        return "TI";
      default:
        return tipo;
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
          <Typography
            variant="h5"
            sx={{ fontWeight: "bold", color: "#37474f", mb: 0.5 }}
          >
            {profesor.nombres} {profesor.apellidos}
          </Typography>

          <Stack direction="column" spacing={0.5} sx={{ mb: 1 }}>
            <Box>
              <Typography
                variant="body2"
                sx={{ fontWeight: 500, color: "#37474f" }}
              >
                {formatIdType(profesor.tipo_identificacion)} -{" "}
                {profesor.numero_identificacion}
              </Typography>
            </Box>
            <Box>
              <Typography
                variant="body2"
                sx={{ fontWeight: 500, color: "#37474f" }}
              >
                {dependenciaText}
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Stack>

      <Divider sx={{ my: 2 }} />

      <TableContainer component={Paper} sx={{ boxShadow: 1 }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: "#f5f5f5" }}>
            <TableRow>
              <TableCell sx={{ fontWeight: "bold" }}>Periodo</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Vinculación</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Dedicación</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Cargo</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Nivel Académico</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>
                {docenteActivo?.periodo?.periodo ||
                  docenteActivo?.periodo_id ||
                  "-"}
              </TableCell>
              <TableCell>{docenteActivo?.tipo_vinculacion || "-"}</TableCell>
              <TableCell>{docenteActivo?.dedicacion || "-"}</TableCell>
              <TableCell>{docenteActivo?.cargo || "-"}</TableCell>
              <TableCell>{docenteActivo?.nivel || "-"}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default DetailProfesor;
