import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getProfesores,
  getDependencias,
  createProfesor,
  updateProfesor,
  deleteProfesor,
} from "../api/apiClient";
import {
  Box,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  CircularProgress,
  Stack,
  InputAdornment,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import VisibilityIcon from "@mui/icons-material/Visibility";

const TIPOS_IDENTIFICACION = ["CEDULA", "PASAPORTE", "TARJETA_IDENTIDAD"];
const EMAIL_DOMAIN = "@correounivalle.edu.co";

const ProfesoresCrud = () => {
  const navigate = useNavigate();
  const [profesores, setProfesores] = useState([]);
  const [dependencias, setDependencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Dialog State
  const [openDialog, setOpenDialog] = useState(false);
  const [editingProf, setEditingProf] = useState(null); // null = creating
  const [selectedDepId, setSelectedDepId] = useState("");
  const [formData, setFormData] = useState({
    tipo_identificacion: "CEDULA",
    numero_identificacion: "",
    nombres: "",
    apellidos: "",
    email_institucional: "",
    lugar_nacimiento: "",
    fecha_nacimiento: "",
    telefono: "",
    fecha_vinculacion: "",
    foto_url: "",
  });
  const [formError, setFormError] = useState("");

  const [openDetail, setOpenDetail] = useState(false);
  const [selectedProfId, setSelectedProfId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [profData, depData] = await Promise.all([
        getProfesores(),
        getDependencias(),
      ]);
      setProfesores(profData || []);
      setDependencias(depData || []);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Error al cargar la información del servidor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenCreate = () => {
    setEditingProf(null);
    setSelectedDepId("");
    setFormData({
      tipo_identificacion: "CEDULA",
      numero_identificacion: "",
      nombres: "",
      apellidos: "",
      email_institucional: "",
      lugar_nacimiento: "",
      fecha_nacimiento: "",
      telefono: "",
      fecha_vinculacion: "",
      foto_url: "",
    });
    setFormError("");
    setOpenDialog(true);
  };

  const handleOpenEdit = (prof) => {
    setEditingProf(prof);

    // Determine the selected dependency ID to pre-populate the form
    let depId = "";
    if (prof.dependencia_actual) {
      depId =
        prof.dependencia_actual.seccion_id ||
        prof.dependencia_actual.departamento_id ||
        prof.dependencia_actual.escuela_o_oficina_id ||
        "";
    }
    setSelectedDepId(depId);

    setFormData({
      tipo_identificacion: prof.tipo_identificacion || "CEDULA",
      numero_identificacion: prof.numero_identificacion || "",
      nombres: prof.nombres || "",
      apellidos: prof.apellidos || "",
      email_institucional: prof.email_institucional
        ? prof.email_institucional.replace(EMAIL_DOMAIN, "")
        : "",
      lugar_nacimiento: prof.lugar_nacimiento || "",
      fecha_nacimiento: prof.fecha_nacimiento || "",
      telefono: prof.telefono || "",
      fecha_vinculacion: prof.fecha_vinculacion || "",
      foto_url: prof.foto_url || "",
    });
    setFormError("");
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleOpenDetail = (profId) => {
    navigate(`/profesores/${profId}/datos`);
  };

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!selectedDepId) {
      setFormError("Debe seleccionar una dependencia para el profesor.");
      return;
    }

    // Build the dependencia_actual object based on hierarchy
    const selectedDep = dependencias.find((d) => d.id === selectedDepId);
    if (!selectedDep) {
      setFormError("La dependencia seleccionada no es válida.");
      return;
    }

    let dependencia_actual = {};

    if (selectedDep.tipo === "ESCUELA" || selectedDep.tipo === "OFICINA") {
      dependencia_actual = {
        escuela_o_oficina_id: selectedDep.id,
        ancestros: [],
      };
    } else if (selectedDep.tipo === "DEPARTAMENTO") {
      dependencia_actual = {
        escuela_o_oficina_id: selectedDep.padre_id,
        departamento_id: selectedDep.id,
        ancestros: selectedDep.ancestros || [selectedDep.padre_id],
      };
    } else if (selectedDep.tipo === "SECCION") {
      const escuelaId =
        (selectedDep.ancestros && selectedDep.ancestros[0]) || undefined;
      dependencia_actual = {
        escuela_o_oficina_id: escuelaId,
        departamento_id: selectedDep.padre_id,
        seccion_id: selectedDep.id,
        ancestros: selectedDep.ancestros || [],
      };
    }

    const payload = {
      tipo_identificacion: formData.tipo_identificacion,
      numero_identificacion: formData.numero_identificacion.trim(),
      nombres: formData.nombres.trim().toUpperCase(),
      apellidos: formData.apellidos.trim().toUpperCase(),
      email_institucional: `${formData.email_institucional.trim()}${EMAIL_DOMAIN}`,
      lugar_nacimiento: formData.lugar_nacimiento.trim() || undefined,
      fecha_nacimiento: formData.fecha_nacimiento || undefined,
      telefono: formData.telefono.trim() || undefined,
      fecha_vinculacion: formData.fecha_vinculacion || undefined,
      foto_url: null,
      dependencia_actual,
    };

    try {
      if (editingProf) {
        await updateProfesor(editingProf.id, payload);
        setSuccess("Profesor actualizado correctamente.");
      } else {
        await createProfesor(payload);
        setSuccess("Profesor creado correctamente.");
      }
      setOpenDialog(false);
      fetchData();
    } catch (err) {
      console.error(err);
      const apiMessage =
        err.response?.data?.message ||
        "Error al guardar la información del profesor.";
      setFormError(apiMessage);
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm("¿Está seguro de que desea eliminar a este profesor?")
    ) {
      return;
    }
    setError("");
    setSuccess("");
    try {
      await deleteProfesor(id);
      setSuccess("Profesor eliminado correctamente.");
      fetchData();
    } catch (err) {
      console.error(err);
      const apiMessage =
        err.response?.data?.message || "Error al eliminar al profesor.";
      setError(apiMessage);
    }
  };

  // Helper to get dependency text for table
  const getDependencyText = (depActual) => {
    if (!depActual) return "-";
    const depId =
      depActual.seccion_id ||
      depActual.departamento_id ||
      depActual.escuela_o_oficina_id;
    const dep = dependencias.find((d) => d.id === depId);
    return dep ? `${dep.nombre} (${dep.tipo})` : "-";
  };

  return (
    <Box>
      {/* Navigation and Title */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <IconButton onClick={() => navigate("/")} color="primary">
          <ArrowBackIcon />
        </IconButton>
        <Typography
          variant="h4"
          component="h2"
          sx={{ fontWeight: "bold", color: "#37474f", flexGrow: 1 }}
        >
          Gestión de Profesores
        </Typography>
        <Button
          variant="contained"
          color="success"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
        >
          Nuevo Profesor
        </Button>
      </Stack>

      {/* Notifications */}
      {success && (
        <Alert severity="success" onClose={() => setSuccess("")} sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" onClose={() => setError("")} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Main Table */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer
          component={Paper}
          sx={{ borderRadius: 3, boxShadow: 2 }}
        >
          <Table>
            <TableHead sx={{ bgcolor: "#f5f5f5" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold", color: "#37474f" }}>
                  Nombre Completo
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "#37474f" }}>
                  Identificación
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "#37474f" }}>
                  Email Institucional
                </TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "#37474f" }}>
                  Dependencia
                </TableCell>
                <TableCell
                  align="center"
                  sx={{ fontWeight: "bold", color: "#37474f", width: 150 }}
                >
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {profesores.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    align="center"
                    sx={{ py: 4, color: "#9e9e9e" }}
                  >
                    No se encontraron profesores registrados.
                  </TableCell>
                </TableRow>
              ) : (
                profesores.map((prof) => (
                  <TableRow key={prof.id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>
                      {prof.nombres} {prof.apellidos}
                    </TableCell>
                    <TableCell>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 600, color: "#546e7a" }}
                      >
                        {prof.tipo_identificacion}
                      </Typography>
                      {prof.numero_identificacion}
                    </TableCell>
                    <TableCell>{prof.email_institucional}</TableCell>
                    <TableCell>
                      {getDependencyText(prof.dependencia_actual)}
                    </TableCell>
                    <TableCell align="center">
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="center"
                      >
                        <IconButton
                          size="small"
                          color="info"
                          title="Ver detalle"
                          onClick={() => handleOpenDetail(prof.id)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenEdit(prof)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDelete(prof.id)}
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
      )}

      {/* Dialog for Create/Edit */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: "bold", color: "#37474f" }}>
            {editingProf ? "Editar Profesor" : "Nuevo Profesor"}
          </DialogTitle>
          <DialogContent dividers>
            {formError && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {formError}
              </Alert>
            )}

            <Stack spacing={1} sx={{ my: 1 }}>
              {/* Identificación */}
              <FormControl fullWidth required>
                <InputLabel id="tipo-ident-label">
                  Tipo Identificación
                </InputLabel>
                <Select
                  labelId="tipo-ident-label"
                  name="tipo_identificacion"
                  value={formData.tipo_identificacion}
                  onChange={handleFormChange}
                  label="Tipo Identificación"
                >
                  {TIPOS_IDENTIFICACION.map((t) => (
                    <MenuItem key={t} value={t}>
                      {t}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <InputLabel sx={{ fontWeight: "bold", color: "#37474f" }}>
                Numero Identificacion
              </InputLabel>
              <TextField
                name="numero_identificacion"
                label="3212xxx"
                value={formData.numero_identificacion}
                sx={{ marginTop: 1 }}
                onChange={handleFormChange}
                fullWidth
                required
              />

              {/* Nombres y Apellidos */}
              <InputLabel sx={{ fontWeight: "bold", color: "#37474f" }}>
                Nombres
              </InputLabel>
              <TextField
                name="nombres"
                label="Nombres"
                value={formData.nombres.toUpperCase()}
                onChange={handleFormChange}
                fullWidth
                required
              />

              <InputLabel sx={{ fontWeight: "bold", color: "#37474f" }}>
                Apellidos
              </InputLabel>
              <TextField
                name="apellidos"
                label="Apellidos"
                value={formData.apellidos.toUpperCase()}
                onChange={handleFormChange}
                fullWidth
                required
              />

              {/* Email */}
              <Box>
                <InputLabel
                  sx={{ fontWeight: "bold", color: "#37474f", mb: 1 }}
                >
                  Email Institucional
                </InputLabel>
                <Stack direction="row" spacing={0} alignItems="stretch">
                  <TextField
                    name="email_institucional"
                    value={formData.email_institucional}
                    onChange={handleFormChange}
                    placeholder="juan.perez"
                    fullWidth
                    required
                    helperText="Solo escriba la parte antes del dominio."
                    sx={{
                      flex: 1,
                      "& .MuiFormHelperText-root": {
                        marginLeft: 0,
                      },
                      "& .MuiOutlinedInput-root": {
                        borderTopRightRadius: 0,
                        borderBottomRightRadius: 0,
                        height: 56,
                      },
                    }}
                  />
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      px: 2,
                      border: "1px solid #c4c4c4",
                      borderLeft: "none",
                      borderTopRightRadius: 4,
                      borderBottomRightRadius: 4,
                      bgcolor: "#eef3f7",
                      color: "#37474f",
                      fontWeight: 700,
                      whiteSpace: "nowrap",
                      height: 56,
                      boxSizing: "border-box",
                    }}
                  >
                    @correounivalle.edu.co
                  </Box>
                </Stack>
              </Box>
              {/* Dependencia Adscrita */}
              <InputLabel sx={{ fontWeight: "bold", color: "#37474f" }}>
                Dependencia Adscrita
              </InputLabel>
              <FormControl fullWidth required>
                <InputLabel id="dep-select-label">
                  Dependencia Adscrita
                </InputLabel>
                <Select
                  labelId="dep-select-label"
                  value={selectedDepId}
                  onChange={(e) => setSelectedDepId(e.target.value)}
                  label="Dependencia Adscrita"
                >
                  <MenuItem value="" disabled>
                    <em>Seleccione una dependencia...</em>
                  </MenuItem>
                  {dependencias.map((dep) => (
                    <MenuItem key={dep.id} value={dep.id}>
                      {dep.nombre} ({dep.tipo})
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Optional Fields (Lugar nacimiento, fecha nacimiento, teléfono, fecha vinculación, foto) */}
              <InputLabel sx={{ fontWeight: "bold", color: "#37474f" }}>
                Lugar de Nacimiento (Opcional)
              </InputLabel>
              <TextField
                name="lugar_nacimiento"
                label="Lugar de Nacimiento (Opcional)"
                value={formData.lugar_nacimiento}
                onChange={handleFormChange}
                fullWidth
              />

              <InputLabel sx={{ fontWeight: "bold", color: "#37474f" }}>
                Fecha de Nacimiento (Opcional)
              </InputLabel>
              <TextField
                name="fecha_nacimiento"
                type="date"
                value={formData.fecha_nacimiento}
                onChange={handleFormChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />

              <InputLabel sx={{ fontWeight: "bold", color: "#37474f" }}>
                Telefono
              </InputLabel>
              <TextField
                name="telefono"
                label="Teléfono (Opcional)"
                value={formData.telefono}
                onChange={handleFormChange}
                fullWidth
              />

              <InputLabel sx={{ fontWeight: "bold", color: "#37474f" }}>
                Fecha de Vinculacion
              </InputLabel>
              <TextField
                name="fecha_vinculacion"
                type="date"
                value={formData.fecha_vinculacion}
                onChange={handleFormChange}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={handleCloseDialog} color="inherit">
              Cancelar
            </Button>
            <Button type="submit" variant="contained" color="success">
              {editingProf ? "Guardar Cambios" : "Crear"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default ProfesoresCrud;
