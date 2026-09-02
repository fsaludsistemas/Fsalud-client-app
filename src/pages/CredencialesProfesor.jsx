import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getProfesorById,
  getCredencialesByProfesor,
  createCredenciales,
  updateCredenciales,
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
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";

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

const emptyCredenciales = (profesorId) => ({
  profesor_id: profesorId,
  titulos_universitarios: { pregrado: [], posgrado: [] },
  historial_categoria: [],
  experiencia_calificada: { tiempo_parcial: [], hora_catedra: [] },
  productividad_academica: [],
  premios_y_patentes: [],
  docencia_destacada: [],
  extension_destacada: [],
});

const toDateInput = (value) => {
  if (!value) return "";
  const str = String(value);
  if (str.length >= 10) return str.slice(0, 10);
  return "";
};

const toIsoDate = (value) => {
  if (!value) return undefined;
  if (String(value).includes("T")) return value;
  return `${value}T00:00:00Z`;
};

const toNumber = (value) => {
  if (value === "" || value === null || value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const newItemId = (prefix) => `${prefix}_${Date.now()}`;

const FACTORES = [
  {
    key: "titulos_pregrado",
    label: "Títulos universitarios — Pregrado",
    idPrefix: "tit",
    columns: [
      { key: "evento_no", label: "Evento N.°" },
      { key: "fecha_inicio", label: "Fecha inicio", type: "date" },
      { key: "fecha_fin", label: "Fecha fin", type: "date" },
      { key: "titulo", label: "Título" },
      { key: "institucion_lugar", label: "Institución / lugar" },
      { key: "fecha_grado", label: "Fecha de grado", type: "date" },
      { key: "puntos", label: "Puntos" },
      { key: "acumulado", label: "Acumulado" },
    ],
    fields: [
      { name: "evento_no", label: "Evento N.°", type: "number" },
      { name: "titulo", label: "Título", required: true },
      { name: "institucion_lugar", label: "Institución / lugar", required: true },
      { name: "fecha_inicio", label: "Fecha inicio", type: "date" },
      { name: "fecha_fin", label: "Fecha fin", type: "date" },
      { name: "fecha_grado", label: "Fecha de grado", type: "date" },
      { name: "puntos", label: "Puntos", type: "number" },
      { name: "acumulado", label: "Acumulado", type: "number" },
    ],
  },
  {
    key: "titulos_posgrado",
    label: "Títulos universitarios — Posgrado",
    idPrefix: "tit",
    columns: [
      { key: "evento_no", label: "Evento N.°" },
      { key: "fecha_inicio", label: "Fecha inicio", type: "date" },
      { key: "fecha_fin", label: "Fecha fin", type: "date" },
      { key: "titulo", label: "Título" },
      { key: "institucion_lugar", label: "Institución / lugar" },
      { key: "fecha_grado", label: "Fecha de grado", type: "date" },
      { key: "puntos", label: "Puntos" },
      { key: "acumulado", label: "Acumulado" },
    ],
    fields: [
      { name: "evento_no", label: "Evento N.°", type: "number" },
      { name: "titulo", label: "Título", required: true },
      { name: "institucion_lugar", label: "Institución / lugar", required: true },
      { name: "fecha_inicio", label: "Fecha inicio", type: "date" },
      { name: "fecha_fin", label: "Fecha fin", type: "date" },
      { name: "fecha_grado", label: "Fecha de grado", type: "date" },
      { name: "puntos", label: "Puntos", type: "number" },
      { name: "acumulado", label: "Acumulado", type: "number" },
    ],
  },
  {
    key: "categoria",
    label: "Categoría",
    idPrefix: "cat",
    columns: [
      { key: "inclusion_no", label: "Inclusión N.°" },
      { key: "fecha", label: "Fecha", type: "date" },
      { key: "categoria", label: "Categoría" },
      { key: "puntos", label: "Puntos" },
    ],
    fields: [
      { name: "inclusion_no", label: "Inclusión N.°", required: true },
      { name: "fecha", label: "Fecha", type: "date", required: true },
      {
        name: "categoria",
        label: "Categoría",
        type: "select",
        options: ["A", "B", "C", "D"],
        required: true,
      },
      { name: "puntos", label: "Puntos", type: "number" },
    ],
  },
  {
    key: "exp_tiempo_parcial",
    label: "Experiencia calificada — Tiempo parcial",
    idPrefix: "exp_tp",
    columns: [
      { key: "inclusion_no", label: "Inclusión N.°" },
      { key: "cargo", label: "Cargo" },
      { key: "institucion_lugar", label: "Institución / lugar" },
      { key: "fecha_inicio", label: "Fecha inicio", type: "date" },
      { key: "fecha_fin", label: "Fecha fin", type: "date" },
      { key: "codigo_dedicacion", label: "Código dedicación" },
      { key: "anios_o_meses", label: "Años o meses" },
      { key: "puntos", label: "Puntos" },
      { key: "total_acumulado", label: "Total acumulado" },
      { key: "total_con_tope", label: "Total con tope" },
    ],
    fields: [
      { name: "inclusion_no", label: "Inclusión N.°", type: "number" },
      { name: "cargo", label: "Cargo", required: true },
      { name: "institucion_lugar", label: "Institución / lugar", required: true },
      { name: "fecha_inicio", label: "Fecha inicio", type: "date" },
      { name: "fecha_fin", label: "Fecha fin", type: "date" },
      {
        name: "codigo_dedicacion",
        label: "Código dedicación",
        type: "select",
        options: ["1", "2"],
      },
      { name: "anios_o_meses", label: "Años o meses (ej. 6M)" },
      { name: "puntos", label: "Puntos", type: "number" },
      { name: "total_acumulado", label: "Total acumulado", type: "number" },
      { name: "total_con_tope", label: "Total con tope", type: "number" },
    ],
  },
  {
    key: "exp_hora_catedra",
    label: "Experiencia calificada — Hora cátedra",
    idPrefix: "exp_hc",
    columns: [
      { key: "evento_no", label: "Evento N.°" },
      { key: "cargo", label: "Cargo" },
      { key: "institucion_lugar", label: "Institución / lugar" },
      { key: "fecha_inicio", label: "Fecha inicio", type: "date" },
      { key: "fecha_fin", label: "Fecha fin", type: "date" },
      { key: "puntos_h_s_s", label: "Puntos H.S.S." },
      { key: "total_h_s_s_periodo", label: "Total H.S.S. periodo" },
      { key: "puntos", label: "Puntos" },
      { key: "total_acumulado", label: "Total acumulado" },
      { key: "total_con_tope", label: "Total con tope" },
    ],
    fields: [
      { name: "evento_no", label: "Evento N.°", type: "number" },
      { name: "cargo", label: "Cargo", required: true },
      { name: "institucion_lugar", label: "Institución / lugar", required: true },
      { name: "fecha_inicio", label: "Fecha inicio", type: "date" },
      { name: "fecha_fin", label: "Fecha fin", type: "date" },
      { name: "puntos_h_s_s", label: "Puntos H.S.S.", type: "number" },
      { name: "total_h_s_s_periodo", label: "Total H.S.S. periodo", type: "number" },
      { name: "puntos", label: "Puntos", type: "number" },
      { name: "total_acumulado", label: "Total acumulado", type: "number" },
      { name: "total_con_tope", label: "Total con tope", type: "number" },
    ],
  },
  {
    key: "productividad",
    label: "Productividad académica",
    idPrefix: "prod",
    columns: [
      { key: "inclusion_no", label: "Inclusión N.°" },
      { key: "trabajo_no", label: "Trabajo N.°" },
      { key: "titulo", label: "Título" },
      { key: "publicacion_detalle", label: "Detalle de publicación" },
      { key: "clase", label: "Clase" },
      { key: "tipo_texto", label: "Tipo de texto" },
      { key: "articulo_revista", label: "Artículo / revista" },
      { key: "puntaje_acumulado", label: "Puntaje acumulado" },
    ],
    fields: [
      { name: "inclusion_no", label: "Inclusión N.°", type: "number" },
      { name: "trabajo_no", label: "Trabajo N.°", type: "number" },
      { name: "titulo", label: "Título", required: true },
      { name: "publicacion_detalle", label: "Detalle de publicación" },
      { name: "clase", label: "Clase" },
      {
        name: "tipo_texto",
        label: "Tipo de texto",
        type: "select",
        options: ["L", "AL", "Ar", "T"],
      },
      { name: "articulo_revista", label: "Artículo / revista" },
      { name: "puntaje_acumulado", label: "Puntaje acumulado", type: "number" },
    ],
  },
  {
    key: "premios_patentes",
    label: "Premios y patentes",
    idPrefix: "pre",
    columns: [
      { key: "inclusion_no", label: "Inclusión N.°" },
      { key: "tipo", label: "Tipo" },
      { key: "titulo", label: "Título" },
      { key: "institucion_lugar", label: "Institución / lugar" },
      { key: "fecha", label: "Fecha", type: "date" },
      { key: "puntaje_acumulado", label: "Puntaje acumulado" },
    ],
    fields: [
      { name: "inclusion_no", label: "Inclusión N.°", type: "number" },
      {
        name: "tipo",
        label: "Tipo",
        type: "select",
        options: ["PREMIO", "PATENTE"],
        required: true,
      },
      { name: "titulo", label: "Título", required: true },
      { name: "institucion_lugar", label: "Institución / lugar" },
      { name: "fecha", label: "Fecha", type: "date" },
      { name: "puntaje_acumulado", label: "Puntaje acumulado", type: "number" },
    ],
  },
  {
    key: "docencia",
    label: "Docencia destacada",
    idPrefix: "doc",
    columns: [
      { key: "evento_no", label: "Evento N.°" },
      { key: "asignatura", label: "Asignatura" },
      { key: "anio", label: "Año" },
      { key: "semestre", label: "Semestre" },
      { key: "fecha_solicitud", label: "Fecha de solicitud", type: "date" },
      { key: "puntos_evento", label: "Puntos del evento" },
      { key: "acumulado_puntos", label: "Acumulado de puntos" },
    ],
    fields: [
      { name: "evento_no", label: "Evento N.°", type: "number" },
      { name: "asignatura", label: "Asignatura", required: true },
      { name: "anio", label: "Año", type: "number", required: true },
      { name: "semestre", label: "Semestre", type: "number", required: true },
      { name: "fecha_solicitud", label: "Fecha de solicitud", type: "date" },
      { name: "puntos_evento", label: "Puntos del evento", type: "number" },
      { name: "acumulado_puntos", label: "Acumulado de puntos", type: "number" },
    ],
  },
  {
    key: "extension",
    label: "Extensión destacada",
    idPrefix: "ext",
    columns: [
      { key: "evento_no", label: "Evento N.°" },
      { key: "actividad", label: "Actividad" },
      { key: "anio", label: "Año" },
      { key: "semestre", label: "Semestre" },
      { key: "fecha_solicitud", label: "Fecha de solicitud", type: "date" },
      { key: "puntos_evento", label: "Puntos del evento" },
      { key: "acumulado_puntos", label: "Acumulado de puntos" },
    ],
    fields: [
      { name: "evento_no", label: "Evento N.°", type: "number" },
      { name: "actividad", label: "Actividad", required: true },
      { name: "anio", label: "Año", type: "number", required: true },
      { name: "semestre", label: "Semestre", type: "number", required: true },
      { name: "fecha_solicitud", label: "Fecha de solicitud", type: "date" },
      { name: "puntos_evento", label: "Puntos del evento", type: "number" },
      { name: "acumulado_puntos", label: "Acumulado de puntos", type: "number" },
    ],
  },
];

const getItems = (credenciales, factorKey) => {
  if (!credenciales) return [];
  switch (factorKey) {
    case "titulos_pregrado":
      return credenciales.titulos_universitarios?.pregrado || [];
    case "titulos_posgrado":
      return credenciales.titulos_universitarios?.posgrado || [];
    case "categoria":
      return credenciales.historial_categoria || [];
    case "exp_tiempo_parcial":
      return credenciales.experiencia_calificada?.tiempo_parcial || [];
    case "exp_hora_catedra":
      return credenciales.experiencia_calificada?.hora_catedra || [];
    case "productividad":
      return credenciales.productividad_academica || [];
    case "premios_patentes":
      return credenciales.premios_y_patentes || [];
    case "docencia":
      return credenciales.docencia_destacada || [];
    case "extension":
      return credenciales.extension_destacada || [];
    default:
      return [];
  }
};

const buildPayloadForFactor = (credenciales, factorKey, items) => {
  const current = credenciales || emptyCredenciales(credenciales?.profesor_id);
  switch (factorKey) {
    case "titulos_pregrado":
      return {
        titulos_universitarios: {
          pregrado: items,
          posgrado: current.titulos_universitarios?.posgrado || [],
        },
      };
    case "titulos_posgrado":
      return {
        titulos_universitarios: {
          pregrado: current.titulos_universitarios?.pregrado || [],
          posgrado: items,
        },
      };
    case "categoria":
      return { historial_categoria: items };
    case "exp_tiempo_parcial":
      return {
        experiencia_calificada: {
          tiempo_parcial: items,
          hora_catedra: current.experiencia_calificada?.hora_catedra || [],
        },
      };
    case "exp_hora_catedra":
      return {
        experiencia_calificada: {
          tiempo_parcial: current.experiencia_calificada?.tiempo_parcial || [],
          hora_catedra: items,
        },
      };
    case "productividad":
      return { productividad_academica: items };
    case "premios_patentes":
      return { premios_y_patentes: items };
    case "docencia":
      return { docencia_destacada: items };
    case "extension":
      return { extension_destacada: items };
    default:
      return {};
  }
};

const defaultFormForFactor = (factor) =>
  Object.fromEntries(factor.fields.map((field) => [field.name, ""]));

const itemToForm = (factor, item) => {
  const form = defaultFormForFactor(factor);
  factor.fields.forEach((field) => {
    const value = item[field.name];
    if (field.type === "date") {
      form[field.name] = toDateInput(value);
    } else if (value === null || value === undefined) {
      form[field.name] = "";
    } else {
      form[field.name] = String(value);
    }
  });
  return form;
};

const formToItem = (factor, form, existingId) => {
  const item = { id: existingId || newItemId(factor.idPrefix) };
  factor.fields.forEach((field) => {
    const raw = form[field.name];
    if (field.type === "date") {
      item[field.name] = toIsoDate(raw);
    } else if (field.type === "number") {
      item[field.name] = toNumber(raw);
    } else {
      const text = typeof raw === "string" ? raw.trim() : raw;
      item[field.name] = text || undefined;
    }
  });
  return item;
};

const formatCell = (column, item) => {
  const value = item[column.key];
  if (value === null || value === undefined || value === "") return "—";
  if (column.type === "date") return toDateInput(value) || "—";
  return String(value);
};

const CredencialesProfesor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profesor, setProfesor] = useState(null);
  const [credenciales, setCredenciales] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedFactorKey, setSelectedFactorKey] = useState(FACTORES[0].key);
  const [editingItem, setEditingItem] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState(defaultFormForFactor(FACTORES[0]));
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const selectedFactor = useMemo(
    () => FACTORES.find((factor) => factor.key === selectedFactorKey) || FACTORES[0],
    [selectedFactorKey],
  );

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const profData = await getProfesorById(id);
      setProfesor(profData);
      try {
        const credData = await getCredencialesByProfesor(id);
        setCredenciales(credData);
      } catch (credErr) {
        if (credErr.response?.status === 404) {
          setCredenciales(null);
        } else {
          throw credErr;
        }
      }
    } catch (err) {
      console.error(err);
      setError("Error al cargar las credenciales del profesor.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchData();
  }, [id]);

  const ensureCredenciales = async () => {
    if (credenciales) return credenciales;
    const created = await createCredenciales({ profesor_id: id });
    setCredenciales(created);
    return created;
  };

  const persistFactorItems = async (factorKey, items) => {
    const current = await ensureCredenciales();
    const payload = buildPayloadForFactor(current, factorKey, items);
    const updated = await updateCredenciales(id, payload);
    setCredenciales(updated);
  };

  const handleOpenCreate = (factorKey = FACTORES[0].key) => {
    const factor = FACTORES.find((item) => item.key === factorKey) || FACTORES[0];
    setSelectedFactorKey(factor.key);
    setEditingItem(null);
    setEditingIndex(null);
    setFormData(defaultFormForFactor(factor));
    setFormError("");
    setOpenDialog(true);
  };

  const handleOpenEdit = (factorKey, item, index) => {
    const factor = FACTORES.find((entry) => entry.key === factorKey) || FACTORES[0];
    setSelectedFactorKey(factor.key);
    setEditingItem(item);
    setEditingIndex(index);
    setFormData(itemToForm(factor, item));
    setFormError("");
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingItem(null);
    setEditingIndex(null);
    setFormError("");
  };

  const handleFactorChange = (nextKey) => {
    if (editingItem) return;
    const factor = FACTORES.find((item) => item.key === nextKey) || FACTORES[0];
    setSelectedFactorKey(factor.key);
    setFormData(defaultFormForFactor(factor));
    setFormError("");
  };

  const handleFormChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const missing = selectedFactor.fields.find(
      (field) => field.required && !String(formData[field.name] || "").trim(),
    );
    if (missing) {
      setFormError(`El campo "${missing.label}" es obligatorio.`);
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const current = credenciales || emptyCredenciales(id);
      const currentItems = getItems(current, selectedFactor.key);
      const nextItem = formToItem(selectedFactor, formData, editingItem?.id);
      const nextItems =
        editingIndex !== null
          ? currentItems.map((item, index) =>
              index === editingIndex ? { ...item, ...nextItem } : item,
            )
          : [...currentItems, nextItem];

      await persistFactorItems(selectedFactor.key, nextItems);
      setSuccess(
        editingItem
          ? "Registro actualizado correctamente."
          : "Registro agregado correctamente.",
      );
      setOpenDialog(false);
    } catch (err) {
      console.error(err);
      setFormError(
        err.response?.data?.message || "Error al guardar el registro de credenciales.",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (factorKey, item, index) => {
    if (!window.confirm("¿Está seguro de que desea eliminar este registro?")) {
      return;
    }
    setError("");
    setSuccess("");
    try {
      const currentItems = getItems(credenciales, factorKey);
      const nextItems = currentItems.filter((entry, entryIndex) =>
        item.id ? entry.id !== item.id : entryIndex !== index,
      );
      await persistFactorItems(factorKey, nextItems);
      setSuccess("Registro eliminado correctamente.");
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || "Error al eliminar el registro de credenciales.",
      );
    }
  };

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate("/profesores")} color="primary">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: "bold", color: "#37474f", flexGrow: 1 }}>
          Credenciales del Profesor
        </Typography>
        <Button
          variant="contained"
          color="success"
          startIcon={<AddIcon />}
          onClick={() => handleOpenCreate()}
          disabled={loading}
        >
          Agregar registro
        </Button>
      </Stack>

      {profesor && (
        <Typography variant="subtitle1" sx={{ mb: 2, color: "#546e7a" }}>
          {profesor.nombres} {profesor.apellidos}
        </Typography>
      )}

      <ProfesorTabs
        value={`/profesores/${id}/credenciales`}
        onChange={(_, next) => navigate(next)}
        profesorId={id}
      />

      {success && (
        <Alert severity="success" onClose={() => setSuccess("")} sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}
      {error && (
        <Alert severity="error" onClose={() => setError("")} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : (
        <Stack spacing={2}>
          {!credenciales && (
            <Alert severity="info">
              Este profesor aún no tiene hoja de credenciales. Al agregar el primer
              registro se creará automáticamente.
            </Alert>
          )}

          {FACTORES.map((factor) => {
            const items = getItems(credenciales, factor.key);
            return (
              <Accordion key={factor.key} defaultExpanded={items.length > 0}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack direction="row" alignItems="center" spacing={2} sx={{ width: "100%", pr: 2 }}>
                    <Typography sx={{ fontWeight: 600, color: "#37474f", flexGrow: 1 }}>
                      {factor.label}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {items.length} registro{items.length === 1 ? "" : "s"}
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenCreate(factor.key);
                      }}
                    >
                      Agregar
                    </Button>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 1 }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: "#f5f5f5" }}>
                        <TableRow>
                          {factor.columns.map((column) => (
                            <TableCell key={column.key} sx={{ fontWeight: "bold", color: "#37474f" }}>
                              {column.label}
                            </TableCell>
                          ))}
                          <TableCell align="center" sx={{ fontWeight: "bold", color: "#37474f", width: 120 }}>
                            Acciones
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {items.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={factor.columns.length + 1} align="center" sx={{ py: 3, color: "#9e9e9e" }}>
                              Sin registros en este factor.
                            </TableCell>
                          </TableRow>
                        ) : (
                          items.map((item, index) => (
                            <TableRow key={item.id || `${factor.key}-${index}`} hover>
                              {factor.columns.map((column) => (
                                <TableCell key={column.key}>{formatCell(column, item)}</TableCell>
                              ))}
                              <TableCell align="center">
                                <Stack direction="row" spacing={1} justifyContent="center">
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    title="Editar registro"
                                    onClick={() => handleOpenEdit(factor.key, item, index)}
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    title="Eliminar registro"
                                    onClick={() => handleDeleteItem(factor.key, item, index)}
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
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Stack>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <form onSubmit={handleSubmit}>
          <DialogTitle sx={{ fontWeight: "bold", color: "#37474f" }}>
            {editingItem ? "Editar registro" : "Nuevo registro de credenciales"}
          </DialogTitle>
          <DialogContent dividers>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}
            <Stack spacing={2} sx={{ mt: 1 }}>
              <FormControl fullWidth required disabled={Boolean(editingItem)}>
                <InputLabel id="factor-select-label">Factor</InputLabel>
                <Select
                  labelId="factor-select-label"
                  value={selectedFactorKey}
                  label="Factor"
                  onChange={(e) => handleFactorChange(e.target.value)}
                >
                  {FACTORES.map((factor) => (
                    <MenuItem key={factor.key} value={factor.key}>
                      {factor.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedFactor.fields.map((field) =>
                field.type === "select" ? (
                  <FormControl key={field.name} fullWidth required={field.required}>
                    <InputLabel id={`${field.name}-label`}>{field.label}</InputLabel>
                    <Select
                      labelId={`${field.name}-label`}
                      name={field.name}
                      value={formData[field.name] || ""}
                      label={field.label}
                      onChange={handleFormChange}
                    >
                      {(field.options || []).map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                ) : (
                  <TextField
                    key={field.name}
                    name={field.name}
                    label={field.label}
                    type={field.type === "date" ? "date" : field.type === "number" ? "number" : "text"}
                    value={formData[field.name] || ""}
                    onChange={handleFormChange}
                    fullWidth
                    required={field.required}
                    InputLabelProps={field.type === "date" ? { shrink: true } : undefined}
                    inputProps={field.type === "number" ? { step: "any" } : undefined}
                  />
                ),
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={handleCloseDialog} color="inherit" disabled={saving}>
              Cancelar
            </Button>
            <Button type="submit" variant="contained" color="success" disabled={saving}>
              {editingItem ? "Guardar cambios" : "Agregar"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default CredencialesProfesor;
