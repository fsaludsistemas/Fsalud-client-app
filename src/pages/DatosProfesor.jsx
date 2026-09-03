import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getProfesorById,
  getDependencias,
  getPeriodos,
  getDocentePeriodos,
  createDocentePeriodo,
  updateDocentePeriodo,
  deleteDocentePeriodo,
} from "../api/apiClient";
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  Stack,
  Avatar,
  Divider,
  Grid,
  Alert,
  CircularProgress,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
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
import EmailIcon from "@mui/icons-material/Email";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import DetailProfesor from "../components/DetailProfesor";

const DetailRow = ({ label, value, action }) => (
  <Grid size={{ xs: 12, sm: 6 }}>
    <Typography variant="caption" color="text.secondary" display="block">
      {label}
    </Typography>
    <Stack direction="row" alignItems="center" spacing={1}>
      <Typography variant="body1" sx={{ fontWeight: 500, color: "#37474f" }}>
        {value || "—"}
      </Typography>
      {action}
    </Stack>
  </Grid>
);

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

const DOCENTE_DEFAULT = {
  periodo_id: "",
  tipo_vinculacion: "",
  dedicacion: "",
  cargo: "",
  estado: "ACTIVO",
  nivel: "",
};

const TIPOS_VINCULACION = [
  "NOMBRADO",
  "CONTRATISTA",
  "AD-HONOREM",
  "ASISTENTE DOC",
];
const DEDICACIONES = ["COMPLETO", "PARCIAL", "H. CATEDRA"];
const CARGOS = ["AUXILIAR", "ASISTENTE", "ASOCIADO", "TITULAR", "SIN CARGO"];
const NIVELES = ["PREGRADO", "MAESTRIA", "DOCTORADO", "ESPECIALIZACION"];
const ESTADOS = ["ACTIVO", "INACTIVO"];

const DatosProfesor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profesor, setProfesor] = useState(null);
  const [dependencias, setDependencias] = useState([]);
  const [periodos, setPeriodos] = useState([]);
  const [docentePeriodos, setDocentePeriodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [docenteError, setDocenteError] = useState("");
  const [docenteSuccess, setDocenteSuccess] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDocentePeriodo, setEditingDocentePeriodo] = useState(null);
  const [docenteForm, setDocenteForm] = useState(DOCENTE_DEFAULT);

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [profData, depData, periodosData, docentePeriodosData] =
        await Promise.all([
          getProfesorById(id),
          getDependencias(),
          getPeriodos(),
          getDocentePeriodos(),
        ]);
      setProfesor(profData);
      setDependencias(depData || []);
      setPeriodos(periodosData || []);
      setDocentePeriodos(
        (docentePeriodosData || []).filter((dp) => dp.profesor_id === id),
      );
    } catch (err) {
      console.error(err);
      setError("Error al cargar la información del profesor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const correoCompleto = profesor?.email_institucional || "";
  const telefono = profesor?.telefono || "";
  const gmailHref = correoCompleto
    ? `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
        correoCompleto,
      )}`
    : "#";
  const whatsappHref = telefono
    ? `https://wa.me/${telefono.replace(/\D/g, "")}`
    : "#";

  const handleOpenCreateDocente = () => {
    setEditingDocentePeriodo(null);
    setDocenteForm(DOCENTE_DEFAULT);
    setDocenteError("");
    setOpenDialog(true);
  };

  const handleOpenEditDocente = (docentePeriodo) => {
    setEditingDocentePeriodo(docentePeriodo);
    setDocenteForm({
      periodo_id: docentePeriodo.periodo_id || "",
      tipo_vinculacion: docentePeriodo.tipo_vinculacion || "",
      dedicacion: docentePeriodo.dedicacion || "",
      cargo: docentePeriodo.cargo || "",
      estado: docentePeriodo.estado || "ACTIVO",
      nivel: docentePeriodo.nivel || "",
    });
    setDocenteError("");
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleDocenteChange = (e) => {
    const { name, value } = e.target;
    setDocenteForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitDocente = async (e) => {
    e.preventDefault();
    setDocenteError("");

    if (!editingDocentePeriodo && !docenteForm.periodo_id) {
      setDocenteError("Debe seleccionar un periodo.");
      return;
    }
    if (
      !docenteForm.tipo_vinculacion ||
      !docenteForm.dedicacion ||
      !docenteForm.cargo
    ) {
      setDocenteError("Complete los campos obligatorios.");
      return;
    }

    const payload = {
      profesor_id: id,
      periodo_id: docenteForm.periodo_id,
      tipo_vinculacion: docenteForm.tipo_vinculacion,
      dedicacion: docenteForm.dedicacion,
      cargo: docenteForm.cargo,
      estado: docenteForm.estado,
      nivel: docenteForm.nivel || undefined,
    };

    try {
      if (editingDocentePeriodo) {
        await updateDocentePeriodo(editingDocentePeriodo.id, {
          tipo_vinculacion: payload.tipo_vinculacion,
          dedicacion: payload.dedicacion,
          cargo: payload.cargo,
          estado: payload.estado,
          nivel: payload.nivel,
        });
        setDocenteSuccess("Registro de periodo actualizado correctamente.");
      } else {
        await createDocentePeriodo(payload);
        setDocenteSuccess("Registro de periodo creado correctamente.");
      }
      setOpenDialog(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setDocenteError(
        err.response?.data?.message ||
          "No fue posible guardar el registro del periodo.",
      );
    }
  };

  const handleDeleteDocente = async (docentePeriodo) => {
    if (
      !window.confirm(
        "¿Está seguro de que desea eliminar este registro de docente por periodo?",
      )
    ) {
      return;
    }
    setDocenteError("");
    try {
      await deleteDocentePeriodo(docentePeriodo.id);
      setDocenteSuccess("Registro de periodo eliminado correctamente.");
      fetchData();
    } catch (err) {
      console.error(err);
      setDocenteError(
        err.response?.data?.message ||
          "No fue posible eliminar el registro del periodo.",
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
          Detalle del Profesor
        </Typography>
      </Stack>

      {!loading && !error && profesor && (
        <DetailProfesor profesor={profesor} docentePeriodos={docentePeriodos} />
      )}

      <ProfesorTabs
        value={`/profesores/${id}/datos`}
        onChange={(_, next) => navigate(next)}
        profesorId={id}
      />

      {loading && (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && !error && profesor && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Stack spacing={3}>

            <Box>
              <Grid container spacing={2}>
                <DetailRow
                  label="Email institucional"
                  value={correoCompleto}
                  action={
                    correoCompleto ? (
                      <IconButton
                        component="a"
                        href={gmailHref}
                        target="_blank"
                        rel="noreferrer"
                        size="small"
                        color="primary"
                        aria-label="Enviar correo"
                      >
                        <EmailIcon fontSize="small" />
                      </IconButton>
                    ) : null
                  }
                />
                <DetailRow
                  label="Teléfono"
                  value={telefono}
                  action={
                    telefono ? (
                      <IconButton
                        component="a"
                        href={whatsappHref}
                        target="_blank"
                        rel="noreferrer"
                        size="small"
                        sx={{ color: "#25D366" }}
                        aria-label="Enviar mensaje por WhatsApp"
                      >
                        <WhatsAppIcon fontSize="small" />
                      </IconButton>
                    ) : null
                  }
                />
              </Grid>
            </Box>
            <Box>
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

            <Box>
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
                sx={{ mb: 2 }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: "#546e7a",
                    fontWeight: "bold",
                    fontSize: "20px",
                  }}
                >
                  Datos docente por periodo
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleOpenCreateDocente}
                  sx={{ ml: 7 }}
                >
                  Nuevo registro
                </Button>
              </Stack>

              {docenteSuccess && (
                <Alert
                  severity="success"
                  onClose={() => setDocenteSuccess("")}
                  sx={{ mb: 2 }}
                >
                  {docenteSuccess}
                </Alert>
              )}
              {docenteError && (
                <Alert
                  severity="error"
                  onClose={() => setDocenteError("")}
                  sx={{ mb: 2 }}
                >
                  {docenteError}
                </Alert>
              )}

              <TableContainer component={Paper} sx={{ boxShadow: 1 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: "#f5f5f5" }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: "bold" }}>Periodo</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        Vinculación
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>
                        Dedicación
                      </TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Cargo</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Nivel Académico</TableCell>
                      <TableCell sx={{ fontWeight: "bold" }}>Estado</TableCell>
                      <TableCell align="center" sx={{ fontWeight: "bold" }}>
                        Acciones
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {docentePeriodos.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center">
                          No hay registros de docente por periodo.
                        </TableCell>
                      </TableRow>
                    ) : (
                      docentePeriodos.map((item) => (
                        <TableRow key={item.id} hover>
                          <TableCell>
                            {item.periodo?.periodo || item.periodo_id || "-"}
                          </TableCell>
                          <TableCell>{item.tipo_vinculacion || "-"}</TableCell>
                          <TableCell>{item.dedicacion || "-"}</TableCell>
                          <TableCell>{item.cargo || "-"}</TableCell>
                          <TableCell>{item.nivel || "-"}</TableCell>
                          <TableCell>{item.estado || "-"}</TableCell>
                          <TableCell align="center">
                            <Stack
                              direction="row"
                              spacing={1}
                              justifyContent="center"
                              sx={{ ml: 7 }}
                            >
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleOpenEditDocente(item)}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteDocente(item)}
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
            </Box>

            <Divider />


          </Stack>
        </Paper>
      )}

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <form onSubmit={handleSubmitDocente}>
          <DialogTitle sx={{ fontWeight: "bold", color: "#37474f" }}>
            {editingDocentePeriodo
              ? "Editar dato de periodo"
              : "Nuevo dato de periodo"}
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <FormControl
                fullWidth
                required
                disabled={!!editingDocentePeriodo}
              >
                <InputLabel id="periodo-label">Periodo</InputLabel>
                <Select
                  labelId="periodo-label"
                  name="periodo_id"
                  value={docenteForm.periodo_id}
                  onChange={handleDocenteChange}
                  label="Periodo"
                >
                  <MenuItem value="" disabled>
                    <em>Seleccione un periodo</em>
                  </MenuItem>
                  {periodos.map((periodo) => (
                    <MenuItem key={periodo.id} value={periodo.id}>
                      {periodo.periodo || periodo.id}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth required>
                <InputLabel id="tipo-vinculacion-label">
                  Tipo de vinculación
                </InputLabel>
                <Select
                  labelId="tipo-vinculacion-label"
                  name="tipo_vinculacion"
                  value={docenteForm.tipo_vinculacion}
                  onChange={handleDocenteChange}
                  label="Tipo de vinculación"
                >
                  <MenuItem value="" disabled>
                    <em>Seleccione una opción</em>
                  </MenuItem>
                  {TIPOS_VINCULACION.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth required>
                <InputLabel id="dedicacion-label">Dedicación</InputLabel>
                <Select
                  labelId="dedicacion-label"
                  name="dedicacion"
                  value={docenteForm.dedicacion}
                  onChange={handleDocenteChange}
                  label="Dedicación"
                >
                  <MenuItem value="" disabled>
                    <em>Seleccione una opción</em>
                  </MenuItem>
                  {DEDICACIONES.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth required>
                <InputLabel id="cargo-label">Cargo</InputLabel>
                <Select
                  labelId="cargo-label"
                  name="cargo"
                  value={docenteForm.cargo}
                  onChange={handleDocenteChange}
                  label="Cargo"
                >
                  <MenuItem value="" disabled>
                    <em>Seleccione una opción</em>
                  </MenuItem>
                  {CARGOS.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel id="nivel-label">Nivel</InputLabel>
                <Select
                  labelId="nivel-label"
                  name="nivel"
                  value={docenteForm.nivel}
                  onChange={handleDocenteChange}
                  label="Nivel"
                >
                  <MenuItem value="">
                    <em>Sin nivel</em>
                  </MenuItem>
                  {NIVELES.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth>
                <InputLabel id="estado-docente-label">Estado</InputLabel>
                <Select
                  labelId="estado-docente-label"
                  name="estado"
                  value={docenteForm.estado}
                  onChange={handleDocenteChange}
                  label="Estado"
                >
                  {ESTADOS.map((item) => (
                    <MenuItem key={item} value={item}>
                      {item}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Profesor"
                value={`${profesor?.nombres || ""} ${profesor?.apellidos || ""}`}
                fullWidth
                disabled
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={handleCloseDialog} color="inherit">
              Cancelar
            </Button>
            <Button type="submit" variant="contained">
              {editingDocentePeriodo ? "Guardar cambios" : "Crear"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default DatosProfesor;
