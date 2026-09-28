import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  getUsuarios,
  createUsuario,
  updateUsuario,
  deleteUsuario,
  getDependencias,
} from "../api/apiClient";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

const EMPTY = {
  email: "",
  permiso: "SISTEMAS",
  estado: "ACTIVO",
  dependencyId: "",
};
const PERMISOS = ["SISTEMAS", "ADMINISTRADOR", "PRESIDENTE", "LECTURA"];

export default function UsuariosCrud() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [dependencias, setDependencias] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const allowed = ["SISTEMAS", "ADMINISTRADOR"].includes(user?.permiso);
  const load = async () => {
    try {
      const [users, deps] = await Promise.all([
        getUsuarios(),
        getDependencias(),
      ]);
      setUsuarios(users || []);
      setDependencias(deps || []);
    } catch (e) {
      setError(
        e.response?.data?.message || "No se pudieron cargar los usuarios.",
      );
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (allowed) load();
    else setLoading(false);
  }, [user?.permiso]);
  if (!allowed)
    return (
      <Alert severity="error">No tienes permiso para gestionar usuarios.</Alert>
    );
  const dependencyPayload = (id) => {
    const dep = dependencias.find((item) => item.id === id);
    if (!dep) return {};
    if (["ESCUELA", "OFICINA"].includes(dep.tipo))
      return { escuela_o_oficina_id: dep.id, ancestros: [] };
    if (dep.tipo === "DEPARTAMENTO")
      return {
        escuela_o_oficina_id: dep.padre_id,
        departamento_id: dep.id,
        ancestros: dep.ancestros || [dep.padre_id],
      };
    return {
      escuela_o_oficina_id: dep.ancestros?.[0],
      departamento_id: dep.padre_id,
      seccion_id: dep.id,
      ancestros: dep.ancestros || [],
    };
  };
  const dependencyName = (d) =>
    dependencias.find(
      (item) =>
        item.id ===
        (d?.seccion_id || d?.departamento_id || d?.escuela_o_oficina_id),
    )?.nombre || "—";
  const save = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        email: form.email.trim().toLowerCase(),
        permiso: form.permiso,
        estado: form.estado,
        dependencia_actual: dependencyPayload(form.dependencyId),
      };
      if (editing) await updateUsuario(editing.id, payload);
      else await createUsuario(payload);
      setOpen(false);
      setSuccess(editing ? "Usuario actualizado." : "Usuario creado.");
      load();
    } catch (e) {
      setError(e.response?.data?.message || "No se pudo guardar el usuario.");
    }
  };
  const remove = async (id) => {
    if (!window.confirm("¿Eliminar este usuario?")) return;
    try {
      await deleteUsuario(id);
      setSuccess("Usuario eliminado.");
      load();
    } catch (e) {
      setError(e.response?.data?.message || "No se pudo eliminar el usuario.");
    }
  };
  const edit = (item) => {
    const d = item.dependencia_actual || {};
    setEditing(item);
    setForm({
      email: item.email || "",
      permiso: item.permiso || "SISTEMAS",
      estado: item.estado || "ACTIVO",
      dependencyId:
        d.seccion_id || d.departamento_id || d.escuela_o_oficina_id || "",
    });
    setOpen(true);
  };
  return (
    <Box>
      <Stack direction="row" alignItems="center" sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate("/profesores")}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: "bold", flexGrow: 1 }}>
          Gestión de Usuarios
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditing(null);
            setForm(EMPTY);
            setOpen(true);
          }}
        >
          Nuevo usuario
        </Button>
      </Stack>
      {error && (
        <Alert sx={{ mb: 2 }} severity="error" onClose={() => setError("")}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert sx={{ mb: 2 }} severity="success" onClose={() => setSuccess("")}>
          {success}
        </Alert>
      )}
      <Paper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Correo</TableCell>
              <TableCell>Permiso</TableCell>
              <TableCell>Dependencia</TableCell>
              <TableCell>Estado</TableCell>
              <TableCell align="right">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {!loading &&
              usuarios.map((item) => (
                <TableRow key={item.id || item.email}>
                  <TableCell>{item.email || "—"}</TableCell>
                  <TableCell>{item.permiso || "—"}</TableCell>
                  <TableCell>
                    {dependencyName(item.dependencia_actual)}
                  </TableCell>
                  <TableCell>{item.estado || "—"}</TableCell>
                  <TableCell align="right">
                    <IconButton onClick={() => edit(item)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => remove(item.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            {!loading && !usuarios.length && (
              <TableRow>
                <TableCell colSpan={5}>No hay usuarios registrados.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <Box component="form" onSubmit={save}>
          <DialogTitle>
            {editing ? "Editar usuario" : "Nuevo usuario"}
          </DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <TextField
                required
                label="Correo electrónico"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
              <TextField
                select
                label="Permiso"
                value={form.permiso}
                onChange={(e) => setForm({ ...form, permiso: e.target.value })}
              >
                {PERMISOS.map((x) => (
                  <MenuItem key={x} value={x}>
                    {x}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Dependencia"
                value={form.dependencyId}
                onChange={(e) =>
                  setForm({ ...form, dependencyId: e.target.value })
                }
              >
                <MenuItem value="">Sin dependencia</MenuItem>
                {dependencias.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.nombre} ({item.tipo})
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Estado"
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value })}
              >
                <MenuItem value="ACTIVO">ACTIVO</MenuItem>
                <MenuItem value="INACTIVO">INACTIVO</MenuItem>
              </TextField>
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="submit" variant="contained">
              Guardar
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
