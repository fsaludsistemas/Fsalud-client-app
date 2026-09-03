import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getProfesorById,
  getDocentePeriodos,
  getAsignacionesByProfesor,
  createAsignacion,
  updateAsignacion,
  deleteAsignacion,
} from "../api/apiClient";
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  Stack,
  IconButton,
  CircularProgress,
  Alert,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import DetailProfesor from "../components/DetailProfesor";

const ProfesorTabs = ({ value, onChange, profesorId }) => (
  <Tabs
    value={value}
    onChange={onChange}
    sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
  >
    <Tab label="Datos generales" value={`/profesores/${profesorId}/datos`} />
    <Tab
      label="Asignaciones"
      value={`/profesores/${profesorId}/asignaciones`}
    />
    <Tab
      label="Credenciales"
      value={`/profesores/${profesorId}/credenciales`}
    />
  </Tabs>
);

const FORM_DEFAULT = {
  docente_periodo_id: "",
  tipo_actividad: "",
  actividad: "",
  nombre_actividad: "",
  detalle_actividad: "",
  numero_horas: "",
  categoria: "",
};

const TIPOS_ACTIVIDAD = [
  "Administrativas",
  "Comisión",
  "Complementarias",
  "Docencia",
  "Investigación",
  "Extensión",
  "Intelectual",
  "Sin actividades",
];

const ACTIVIDADES = [
  "ACTIVIDADES ADMINISTRATIVAS",
  "ACTIVIDADES COMPLEMENTARIAS",
  "ACTIVIDADES DE DOCENCIA",
  "ACTIVIDADES DE EXTENSIÓN",
  "ACTIVIDADES DE INVESTIGACIÓN",
  "ACTIVIDADES INTELECTUALES O ARTISTICAS",
  "DOCENTE EN COMISIÓN",
  "SIN ACTIVIDADES",
];

const CATEGORIAS = [
  "DOCENTE",
  "ADMINISTRATIVA",
  "INVESTIGACION",
  "EXTENSION",
  "OTRA",
];

const AsignacionesProfesor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profesor, setProfesor] = useState(null);
  const [docentePeriodos, setDocentePeriodos] = useState([]);
  const [asignaciones, setAsignaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingAsignacion, setEditingAsignacion] = useState(null);
  const [formError, setFormError] = useState("");
  const [formData, setFormData] = useState(FORM_DEFAULT);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [profData, docentePeriodosData, asignacionesData] =
        await Promise.all([
          getProfesorById(id),
          getDocentePeriodos(),
          getAsignacionesByProfesor(id),
        ]);
      setProfesor(profData);
      setDocentePeriodos(
        (docentePeriodosData || []).filter((dp) => dp.profesor_id === id),
      );
      setAsignaciones(asignacionesData || []);
    } catch (err) {
      console.error(err);
      setError("Error al cargar las asignaciones del profesor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const docentePeriodoLabel = useMemo(() => {
    return (docentePeriodoId) => {
      const dp = docentePeriodos.find((item) => item.id === docentePeriodoId);
      if (!dp) return docentePeriodoId || "-";
      return `${dp.periodo?.periodo || dp.periodo_id || dp.id}`.trim();
    };
  }, [docentePeriodos]);

  const handleOpenCreate = () => {
    setEditingAsignacion(null);
    setFormData(FORM_DEFAULT);
    setFormError("");
    setOpenDialog(true);
  };

  const handleOpenEdit = (asignacion) => {
    setEditingAsignacion(asignacion);
    setFormData({
      docente_periodo_id: asignacion.docente_periodo_id || "",
      tipo_actividad: asignacion.tipo_actividad || "",
      actividad: asignacion.actividad || "",
      nombre_actividad: asignacion.nombre_actividad || "",
      detalle_actividad: asignacion.detalle_actividad || "",
      numero_horas: asignacion.numero_horas ?? "",
      categoria: asignacion.categoria || "",
    });
    setFormError("");
    setOpenDialog(true);
  };

  const handleCloseDialog = () => setOpenDialog(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!editingAsignacion && !formData.docente_periodo_id) {
      setFormError("Debe seleccionar un periodo docente.");
      return;
    }
    if (!formData.tipo_actividad || !formData.actividad) {
      setFormError("Complete los campos obligatorios.");
      return;
    }

    const payload = {
      profesor_id: id,
      docente_periodo_id: formData.docente_periodo_id,
      tipo_actividad: formData.tipo_actividad,
      actividad: formData.actividad,
      nombre_actividad: formData.nombre_actividad.trim() || undefined,
      detalle_actividad: formData.detalle_actividad.trim() || undefined,
      numero_horas:
        formData.numero_horas === ""
          ? undefined
          : Number(formData.numero_horas),
      categoria: formData.categoria.trim() || undefined,
    };

    if (
      payload.numero_horas !== undefined &&
      Number.isNaN(payload.numero_horas)
    ) {
      setFormError("El número de horas debe ser numérico.");
      return;
    }

    try {
      if (editingAsignacion) {
        await updateAsignacion(editingAsignacion.id, {
          tipo_actividad: payload.tipo_actividad,
          actividad: payload.actividad,
          nombre_actividad: payload.nombre_actividad,
          detalle_actividad: payload.detalle_actividad,
          numero_horas: payload.numero_horas,
          categoria: payload.categoria,
        });
        setSuccess("Asignación actualizada correctamente.");
      } else {
        await createAsignacion(payload);
        setSuccess("Asignación creada correctamente.");
      }
      setOpenDialog(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setFormError(
        err.response?.data?.message || "No fue posible guardar la asignación.",
      );
    }
  };

  const handleDelete = async (asignacion) => {
    if (
      !window.confirm("¿Está seguro de que desea eliminar esta asignación?")
    ) {
      return;
    }
    setError("");
    setSuccess("");
    try {
      await deleteAsignacion(asignacion.id);
      setSuccess("Asignación eliminada correctamente.");
      fetchData();
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "No fue posible eliminar la asignación.",
      );
    }
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate("/profesores")} color="primary">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: "bold", color: "#37474f" }}>
          Asignaciones del Profesor
        </Typography>
      </Stack>

      {!loading && !error && profesor && (
        <DetailProfesor profesor={profesor} docentePeriodos={docentePeriodos} />
      )}

      <ProfesorTabs
        value={`/profesores/${id}/asignaciones`}
        onChange={(_, next) => navigate(next)}
        profesorId={id}
      />

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 2 }}
          >
            <Box>
              <Typography sx={{ fontWeight: 700, color: "#37474f" }}>
                {profesor
                  ? `${profesor.nombres} ${profesor.apellidos}`
                  : "Profesor"}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Asignaciones asociadas a los periodos docentes del profesor.
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleOpenCreate}
              sx={{ alignSelf: "end", ml: 8 }}
            >
              Nueva asignación
            </Button>
          </Stack>

          {success && (
            <Alert
              severity="success"
              onClose={() => setSuccess("")}
              sx={{ mb: 2 }}
            >
              {success}
            </Alert>
          )}
          {error && (
            <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead sx={{ bgcolor: "#f5f5f5" }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: "bold" }}>Periodo</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Tipo</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Actividad</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Nombre</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Horas</TableCell>
                  <TableCell sx={{ fontWeight: "bold" }}>Categoría</TableCell>
                  <TableCell align="center" sx={{ fontWeight: "bold" }}>
                    Acciones
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {asignaciones.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No hay asignaciones registradas.
                    </TableCell>
                  </TableRow>
                ) : (
                  asignaciones.map((asignacion) => (
                    <TableRow key={asignacion.id} hover>
                      <TableCell>
                        {docentePeriodoLabel(asignacion.docente_periodo_id)}
                      </TableCell>
                      <TableCell>{asignacion.tipo_actividad || "-"}</TableCell>
                      <TableCell>{asignacion.actividad || "-"}</TableCell>
                      <TableCell>
                        {asignacion.nombre_actividad || "-"}
                      </TableCell>
                      <TableCell>{asignacion.numero_horas ?? "-"}</TableCell>
                      <TableCell>{asignacion.categoria || "-"}</TableCell>
                      <TableCell align="center">
                        <Stack
                          direction="row"
                          spacing={1}
                          justifyContent="center"
                        >
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleOpenEdit(asignacion)}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleDelete(asignacion)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: "bold", color: "#37474f" }}>
            {editingAsignacion ? "Editar asignación" : "Nueva asignación"}
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ pt: 1 }}>
              {formError && <Alert severity="error">{formError}</Alert>}

              <FormControl fullWidth required disabled={!!editingAsignacion}>
                <InputLabel id="docente-periodo-label">
                  Periodo docente
                </InputLabel>
                <Select
                  labelId="docente-periodo-label"
                  name="docente_periodo_id"
                  value={formData.docente_periodo_id}
                  onChange={handleChange}
                  label="Periodo docente"
                >
                  <MenuItem value="">
                    <em>Seleccione un periodo</em>
                  </MenuItem>
                  {docentePeriodos.map((dp) => (
                    <MenuItem key={dp.id} value={dp.id}>
                      {dp.periodo?.periodo || dp.periodo_id || dp.id}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth required>
                <InputLabel id="tipo-actividad-label">
                  Tipo de actividad
                </InputLabel>
                <Select
                  labelId="tipo-actividad-label"
                  name="tipo_actividad"
                  value={formData.tipo_actividad}
                  onChange={handleChange}
                  label="Tipo de actividad"
                >
                  <MenuItem value="">
                    <em>Seleccione una opción</em>
                  </MenuItem>
                  {TIPOS_ACTIVIDAD.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth required>
                <InputLabel id="actividad-label">Actividad</InputLabel>
                <Select
                  labelId="actividad-label"
                  name="actividad"
                  value={formData.actividad}
                  onChange={handleChange}
                  label="Actividad"
                >
                  <MenuItem value="">
                    <em>Seleccione una opción</em>
                  </MenuItem>
                  {ACTIVIDADES.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                name="nombre_actividad"
                label="Nombre de la actividad"
                value={formData.nombre_actividad}
                onChange={handleChange}
                fullWidth
              />

              <TextField
                name="detalle_actividad"
                label="Detalle de la actividad"
                value={formData.detalle_actividad}
                onChange={handleChange}
                fullWidth
                multiline
                minRows={3}
              />

              <TextField
                name="numero_horas"
                label="Número de horas"
                type="number"
                value={formData.numero_horas}
                onChange={handleChange}
                fullWidth
                inputProps={{ min: 0 }}
              />

              <TextField
                name="categoria"
                label="Categoría"
                value={formData.categoria}
                onChange={handleChange}
                fullWidth
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={handleCloseDialog} color="inherit">
              Cancelar
            </Button>
            <Button type="submit" variant="contained">
              {editingAsignacion ? "Guardar cambios" : "Crear"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default AsignacionesProfesor;
