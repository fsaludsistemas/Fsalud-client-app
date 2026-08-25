import  { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getDependencias,
  createDependencia,
  updateDependencia,
  deleteDependencia
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
  Stack
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";

const TIPOS_VALIDOS = ["ESCUELA", "OFICINA", "DEPARTAMENTO", "SECCION"];

const DependenciasCrud = () => {
  const navigate = useNavigate();
  const [dependencias, setDependencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Dialog State
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDep, setEditingDep] = useState(null); // null = creating
  const [formData, setFormData] = useState({
    nombre: "",
    tipo: "ESCUELA",
    padre_id: ""
  });
  const [formError, setFormError] = useState("");

  const fetchDependencias = async () => {
    setLoading(true);
    try {
      const data = await getDependencias();
      setDependencias(data || []);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Error al cargar las dependencias.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDependencias();
  }, []);

  const handleOpenCreate = () => {
    setEditingDep(null);
    setFormData({ nombre: "", tipo: "ESCUELA", padre_id: "" });
    setFormError("");
    setOpenDialog(true);
  };

  const handleOpenEdit = (dep) => {
    setEditingDep(dep);
    setFormData({
      nombre: dep.nombre,
      tipo: dep.tipo,
      padre_id: dep.padre_id || ""
    });
    setFormError("");
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleFormChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!formData.nombre.trim()) {
      setFormError("El nombre es requerido.");
      return;
    }

    const payload = {
      nombre: formData.nombre.trim(),
      tipo: formData.tipo,
      padre_id: formData.padre_id || null
    };

    // Validation: cannot select itself as parent
    if (editingDep && editingDep.id === payload.padre_id) {
      setFormError("Una dependencia no puede ser su propio padre.");
      return;
    }

    try {
      if (editingDep) {
        // Update
        await updateDependencia(editingDep.id, payload);
        setSuccess("Dependencia actualizada correctamente.");
      } else {
        // Create
        await createDependencia(payload);
        setSuccess("Dependencia creada correctamente.");
      }
      setOpenDialog(false);
      fetchDependencias();
    } catch (err) {
      console.error(err);
      const apiMessage = err.response?.data?.message || "Ocurrió un error al guardar la dependencia.";
      setFormError(apiMessage);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("¿Está seguro de que desea eliminar esta dependencia?")) {
      return;
    }
    setError("");
    setSuccess("");
    try {
      await deleteDependencia(id);
      setSuccess("Dependencia eliminada correctamente.");
      fetchDependencias();
    } catch (err) {
      console.error(err);
      const apiMessage = err.response?.data?.message || "Error al eliminar la dependencia.";
      setError(apiMessage);
    }
  };

  // Helper to find parent name
  const getParentName = (padreId) => {
    if (!padreId) return "-";
    const parent = dependencias.find((d) => d.id === padreId);
    return parent ? `${parent.nombre} (${parent.tipo})` : padreId;
  };

  return (
    <Box>
      {/* Navigation and Title */}
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 4 }}>
        <IconButton onClick={() => navigate("/")} color="primary">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h2" sx={{ fontWeight: "bold", color: "#37474f", flexGrow: 1 }}>
          Gestión de Dependencias
        </Typography>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleOpenCreate}>
          Nueva Dependencia
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
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 2 }}>
          <Table>
            <TableHead sx={{ bgcolor: "#f5f5f5" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold", color: "#37474f" }}>Nombre</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "#37474f" }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: "bold", color: "#37474f" }}>Dependencia Padre</TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold", color: "#37474f", width: 120 }}>
                  Acciones
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {dependencias.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4, color: "#9e9e9e" }}>
                    No se encontraron dependencias registradas.
                  </TableCell>
                </TableRow>
              ) : (
                dependencias.map((dep) => (
                  <TableRow key={dep.id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{dep.nombre}</TableCell>
                    <TableCell>{dep.tipo}</TableCell>
                    <TableCell>{getParentName(dep.padre_id)}</TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={1} justifyContent="center">
                        <IconButton size="small" color="primary" onClick={() => handleOpenEdit(dep)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDelete(dep.id)}>
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
      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: "bold", color: "#37474f" }}>
            {editingDep ? "Editar Dependencia" : "Nueva Dependencia"}
          </DialogTitle>
          <DialogContent dividers>
            <Stack spacing={3} sx={{ my: 1 }}>
              {formError && <Alert severity="error">{formError}</Alert>}

              <TextField
                name="nombre"
                label="Nombre"
                value={formData.nombre}
                onChange={handleFormChange}
                fullWidth
                required
                variant="outlined"
              />

              <FormControl fullWidth>
                <InputLabel id="tipo-label">Tipo</InputLabel>
                <Select
                  labelId="tipo-label"
                  name="tipo"
                  value={formData.tipo}
                  onChange={handleFormChange}
                  label="Tipo"
                >
                  {TIPOS_VALIDOS.map((tipo) => (
                    <MenuItem key={tipo} value={tipo}>
                      {tipo}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth disabled={formData.tipo == "ESCUELA" || formData.tipo == "OFICINA"} >
                <InputLabel id="padre-label">Dependencia Padre (Opcional)</InputLabel>
                <Select
                  labelId="padre-label"
                  name="padre_id"
                  value={formData.padre_id}
                  onChange={handleFormChange}
                  label="Dependencia Padre (Opcional)"
                >
                  <MenuItem value="">
                    <em>Ninguna (Raíz)</em>
                  </MenuItem>
                  {dependencias
                    .filter((dep) => !editingDep || dep.id !== editingDep.id) // Cannot be own parent
                    .map((dep) => (
                      <MenuItem key={dep.id} value={dep.id}>
                        {dep.nombre} ({dep.tipo})
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={handleCloseDialog} color="inherit">
              Cancelar
            </Button>
            <Button type="submit" variant="contained" color="primary">
              {editingDep ? "Guardar Cambios" : "Crear"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default DependenciasCrud;
