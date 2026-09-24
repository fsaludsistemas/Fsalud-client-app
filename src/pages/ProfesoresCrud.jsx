import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getProfesores,
  searchProfesores,
  getDependencias,
  getDocentePeriodos,
  createProfesor,
  updateProfesor,
  deleteProfesor,
  uploadStorageFile,
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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import SearchIcon from "@mui/icons-material/Search";
import ProtectedFileLink from "../components/ProtectedFileLink";

const TIPOS_IDENTIFICACION = ["CEDULA", "PASAPORTE", "TARJETA_IDENTIDAD"];
const EMAIL_DOMAIN = "@correounivalle.edu.co";
const ALL_FILTER = "TODOS";

const ProfesoresCrud = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManageDependencies = ["SISTEMAS", "ADMINISTRADOR"].includes(
    user?.permiso,
  );
  const [profesores, setProfesores] = useState([]);
  const [dependencias, setDependencias] = useState([]);
  const [docentePeriodos, setDocentePeriodos] = useState([]);
  const [filters, setFilters] = useState({
    nivel: ALL_FILTER,
    cargo: ALL_FILTER,
    vinculacion: ALL_FILTER,
    dedicacion: ALL_FILTER,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

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
    foto_file: null,
  });
  const [formError, setFormError] = useState("");

  const fetchData = useCallback(
    async (search = searchTerm) => {
      setLoading(true);
      try {
        const [profData, depData, docentePeriodosData] = await Promise.all([
          search.trim() ? searchProfesores(search.trim()) : getProfesores(),
          getDependencias(),
          getDocentePeriodos(),
        ]);
        setProfesores(profData || []);
        setDependencias(depData || []);
        setDocentePeriodos(docentePeriodosData || []);
        setError("");
      } catch (err) {
        console.error(err);
        setError("Error al cargar la información del servidor.");
      } finally {
        setLoading(false);
      }
    },
    [searchTerm],
  );

  useEffect(() => {
    const timeoutId = setTimeout(() => fetchData(searchTerm), 300);
    return () => clearTimeout(timeoutId);
  }, [fetchData, searchTerm]);

  const periodosByProfesor = useMemo(() => {
    return docentePeriodos.reduce((groups, docentePeriodo) => {
      const profesorId = String(docentePeriodo.profesor_id);
      groups[profesorId] ||= [];
      groups[profesorId].push(docentePeriodo);
      return groups;
    }, {});
  }, [docentePeriodos]);

  const filterOptions = useMemo(() => {
    const values = {
      nivel: new Set(),
      cargo: new Set(),
      vinculacion: new Set(),
      dedicacion: new Set(),
    };
    docentePeriodos.forEach((docentePeriodo) => {
      if (docentePeriodo.nivel) values.nivel.add(docentePeriodo.nivel);
      if (docentePeriodo.cargo) values.cargo.add(docentePeriodo.cargo);
      if (docentePeriodo.tipo_vinculacion) {
        values.vinculacion.add(docentePeriodo.tipo_vinculacion);
      }
      if (docentePeriodo.dedicacion) {
        values.dedicacion.add(docentePeriodo.dedicacion);
      }
    });
    return Object.fromEntries(
      Object.entries(values).map(([key, options]) => [
        key,
        [...options].sort(),
      ]),
    );
  }, [docentePeriodos]);

  const filteredProfesores = useMemo(() => {
    const hasActiveFilters = Object.values(filters).some(
      (value) => value !== ALL_FILTER,
    );

    return profesores.filter((profesor) => {
      const periodos = periodosByProfesor[String(profesor.id)] || [];
      if (periodos.length === 0) return !hasActiveFilters;

      return periodos.some(
        (periodo) =>
          (filters.nivel === ALL_FILTER || periodo.nivel === filters.nivel) &&
          (filters.cargo === ALL_FILTER || periodo.cargo === filters.cargo) &&
          (filters.vinculacion === ALL_FILTER ||
            periodo.tipo_vinculacion === filters.vinculacion) &&
          (filters.dedicacion === ALL_FILTER ||
            periodo.dedicacion === filters.dedicacion),
      );
    });
  }, [filters, periodosByProfesor, profesores]);

  const handleFilterChange = (event) => {
    setFilters((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  };

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
      foto_file: null,
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
      foto_file: null,
    });
    setFormError("");
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleOpenDetail = (profId) => navigate(`/profesores/${profId}/datos`);

  const handleFormChange = (e) => {
    const value = e.target.type === "file" ? e.target.files?.[0] || null : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
      ...(e.target.type === "file" ? { [e.target.name]: value } : {}),
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
      foto_url: formData.foto_url || undefined,
      dependencia_actual,
    };

    try {
      if (editingProf) {
        if (formData.foto_file) {
          payload.foto_url = await uploadStorageFile({
            profesor_id: editingProf.id,
            file: formData.foto_file,
            tipo: "FOTO_PROFESOR",
            referencia_id: String(editingProf.id),
          });
        }
        await updateProfesor(editingProf.id, payload);
        setSuccess("Profesor actualizado correctamente.");
      } else {
        const created = await createProfesor(payload);
        if (formData.foto_file && created?.id) {
          const foto_url = await uploadStorageFile({
            profesor_id: created.id,
            file: formData.foto_file,
            tipo: "FOTO_PROFESOR",
            referencia_id: String(created.id),
          });
          await updateProfesor(created.id, { foto_url });
        }
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
      setOpenDialog(false);
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
        <Typography
          variant="h4"
          component="h2"
          sx={{ fontWeight: "bold", color: "#37474f", flexGrow: 1 }}
        >
          Gestión de Profesores
        </Typography>
        <Stack direction="row" spacing={1}>
          {canManageDependencies && (
            <Button
              variant="outlined"
              color="primary"
              startIcon={<CorporateFareIcon />}
              onClick={() => navigate("/dependencias")}
            >
              Gestionar Dependencias
            </Button>
          )}
          <Button
            variant="contained"
            color="success"
            startIcon={<AddIcon />}
            onClick={handleOpenCreate}
          >
            Nuevo Profesor
          </Button>
        </Stack>
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

      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Stack spacing={2}>
          <TextField
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por nombres, apellidos o número de identificación"
            label="Buscar docente"
            fullWidth
            size="small"
            InputProps={{
              startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
            }}
          />
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            {[
              ["nivel", "Nivel"],
              ["cargo", "Cargo"],
              ["vinculacion", "Vinculación"],
              ["dedicacion", "Dedicación"],
            ].map(([name, label]) => (
              <FormControl key={name} size="small" fullWidth>
                <InputLabel id={`${name}-filter-label`}>{label}</InputLabel>
                <Select
                  labelId={`${name}-filter-label`}
                  name={name}
                  value={filters[name]}
                  onChange={handleFilterChange}
                  label={label}
                >
                  <MenuItem value={ALL_FILTER}>Todos</MenuItem>
                  {filterOptions[name].map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            ))}
          </Stack>
        </Stack>
      </Paper>

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
              {filteredProfesores.length === 0 ? (
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
                filteredProfesores.map((prof) => (
                  <TableRow
                    key={prof.id}
                    hover
                    tabIndex={0}
                    onClick={() => handleOpenDetail(prof.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleOpenDetail(prof.id);
                      }
                    }}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell sx={{ fontWeight: 500 }}>
                      {prof.nombres} {prof.apellidos}
                    </TableCell>
                    <TableCell>{prof.numero_identificacion}</TableCell>
                    <TableCell>{prof.email_institucional}</TableCell>
                    <TableCell>
                      {getDependencyText(prof.dependencia_actual)}
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1}>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOpenEdit(prof);
                          }}
                        >
                          <EditIcon sx={{ fontSize: "medium", ml: 5 }} />
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

              <InputLabel sx={{ fontWeight: "bold", color: "#37474f" }}>
                Foto del profesor (Opcional)
              </InputLabel>
              <Button component="label" variant="outlined" fullWidth sx={{ justifyContent: "flex-start", py: 1.5 }}>
                {formData.foto_file?.name || (formData.foto_url ? "Cambiar foto" : "Seleccionar foto")}
                <input hidden type="file" name="foto_file" accept="image/*" onChange={handleFormChange} />
              </Button>
              {formData.foto_url && !formData.foto_file && (
                <Typography variant="caption">
                  Foto actual: <ProtectedFileLink url={formData.foto_url}>ver</ProtectedFileLink>
                </Typography>
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            {editingProf && (
              <Button
                color="error"
                startIcon={<DeleteIcon />}
                onClick={() => handleDelete(editingProf.id)}
                sx={{ mr: "auto" }}
              >
                Eliminar
              </Button>
            )}
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
