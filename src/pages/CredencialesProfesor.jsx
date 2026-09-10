import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getProfesorById,
  getCredencialesByProfesor,
  createCredenciales,
  patchCredenciales,
  getDocentePeriodos,
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
  Chip,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
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

const emptyCredenciales = (profesorId) => ({
  profesor_id: profesorId,
  eventos_credenciales: [],
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

// resumenKey → campo en credenciales.resumen_puntos que corresponde a cada factor
const FACTORES = [
  {
    key: "eventos_credenciales",
    label: "Eventos de credenciales",
    idPrefix: "evento",
    accumulatedKey: "total_puntos_acumulado",
    columns: [
      { key: "numero_evento", label: "Evento N.°" },
      { key: "clase", label: "Clase" },
      { key: "dedicacion", label: "Dedicación" },
      { key: "factores_puntaje", label: "Factores de puntaje" },
      { key: "puntos_del_evento", label: "Puntos del evento" },
      { key: "total_puntos_acumulado", label: "Total acumulado" },
      { key: "soporte", label: "Soporte" },
    ],
    fields: [
      {
        name: "numero_evento",
        label: "Evento N.°",
        type: "number",
        required: true,
      },
      {
        name: "clase",
        label: "Clase",
        type: "select",
        options: ["Inclusión", "Ascenso", "Actualización"],
        required: true,
      },
      { name: "dedicacion", label: "Dedicación", required: true },
      {
        name: "soporte_acta_ccs",
        path: ["soporte", "acta_ccs"],
        label: "Acta CCS",
      },
      {
        name: "soporte_fecha",
        path: ["soporte", "fecha"],
        label: "Fecha del soporte",
        type: "date",
      },
      {
        name: "soporte_firma_presidente_url",
        path: ["soporte", "firma_presidente_url"],
        label: "URL firma del presidente",
      },
    ],
  },
  {
    key: "titulos_pregrado",
    label: "Títulos universitarios — Pregrado",
    idPrefix: "tit",
    accumulatedKey: "acumulado",
    // columns: todo lo que el backend devuelve (incluye puntos calculados)
    columns: [
      { key: "evento_no", label: "Evento N.°" },
      { key: "fecha_inicio", label: "Fecha de inicio", type: "date" },
      { key: "fecha_fin", label: "Fecha de fin", type: "date" },
      { key: "titulo", label: "Título" },
      { key: "institucion_lugar", label: "Institución / lugar" },
      { key: "fecha_grado", label: "Fecha de grado", type: "date" },
      { key: "puntos", label: "Puntos" },
    ],
    // fields: solo lo que el usuario ingresa (SIN campos de puntaje)
    fields: [
      { name: "evento_no", label: "Evento N.°", type: "number" },
      {
        name: "tipo_pregrado",
        label: "Tipo de pregrado",
        type: "select",
        options: ["MEDICINA_O_MUSICA", "OTROS_PROFESIONALES"],
        optionLabels: [
          "Medicina o composición musical (183 pts)",
          "Otras profesiones (178 pts)",
        ],
        required: true,
      },
      { name: "titulo", label: "Título", required: true },
      {
        name: "institucion_lugar",
        label: "Institución / lugar",
        required: true,
      },
      { name: "fecha_inicio", label: "Fecha inicio", type: "date" },
      { name: "fecha_fin", label: "Fecha fin", type: "date" },
      { name: "fecha_grado", label: "Fecha de grado", type: "date" },
    ],
  },
  {
    key: "titulos_posgrado",
    label: "Títulos universitarios — Posgrado",
    idPrefix: "tit",
    accumulatedKey: "acumulado",
    columns: [
      { key: "evento_no", label: "Evento N.°" },
      { key: "fecha_inicio", label: "Fecha de inicio", type: "date" },
      { key: "fecha_fin", label: "Fecha de fin", type: "date" },
      { key: "titulo", label: "Título" },
      { key: "institucion_lugar", label: "Institución / lugar" },
      { key: "fecha_grado", label: "Fecha de grado", type: "date" },
      { key: "puntos", label: "Puntos" },
    ],
    fields: [
      { name: "evento_no", label: "Evento N.°", type: "number" },
      {
        name: "tipo_posgrado",
        label: "Tipo de posgrado",
        type: "select",
        options: [
          "ESPECIALIZACION",
          "ESPECIALIZACION_CLINICA",
          "MAESTRIA",
          "DOCTORADO",
        ],
        optionLabels: [
          "Especialización",
          "Especialización clínica (Medicina/Odontología)",
          "Maestría",
          "Doctorado / PhD",
        ],
        required: true,
      },
      { name: "titulo", label: "Título", required: true },
      {
        name: "institucion_lugar",
        label: "Institución / lugar",
        required: true,
      },
      { name: "fecha_inicio", label: "Fecha inicio", type: "date" },
      { name: "fecha_fin", label: "Fecha fin", type: "date" },
      { name: "fecha_grado", label: "Fecha de grado", type: "date" },
    ],
  },
  {
    key: "categoria",
    label: "Categoría",
    idPrefix: "cat",
    accumulatedKey: "puntos",
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
        optionLabels: [
          "A — Auxiliar (37 pts)",
          "B — Asistente (58 pts)",
          "C — Asociado (74 pts)",
          "D — Titular (96 pts)",
        ],
        required: true,
      },
    ],
  },
  {
    key: "exp_tiempo_parcial",
    label: "Experiencia calificada — Tiempo parcial",
    idPrefix: "exp_tp",
    accumulatedKey: ["total_acumulado", "total_con_tope"],
    columns: [
      { key: "inclusion_no", label: "Inclusión N.°" },
      { key: "tipo_experiencia", label: "Tipo" },
      { key: "cargo", label: "Cargo" },
      { key: "institucion_lugar", label: "Institución / lugar" },
      { key: "fecha_inicio", label: "Fecha inicio", type: "date" },
      { key: "fecha_fin", label: "Fecha fin", type: "date" },
      { key: "codigo_dedicacion", label: "Cod. dedicación" },
      { key: "anios_o_meses", label: "Años o meses" },
      { key: "puntos_anio", label: "Puntos por año" },
      { key: "puntos", label: "Puntos" },
      { key: "total_acumulado", label: "Total acumulado" },
      { key: "total_con_tope", label: "Total con tope" },
    ],
    fields: [
      { name: "inclusion_no", label: "Inclusión N.°", type: "number" },
      {
        name: "tipo_experiencia",
        label: "Tipo de experiencia",
        type: "select",
        options: ["INVESTIGACION", "DOCENCIA", "DIRECCION", "OTRA_PROFESIONAL"],
        optionLabels: [
          "Investigación (hasta 6 pts/año)",
          "Docencia universitaria (hasta 4 pts/año)",
          "Cargo de dirección académica (hasta 4 pts/año)",
          "Otra experiencia profesional (hasta 3 pts/año)",
        ],
        required: true,
      },
      { name: "cargo", label: "Cargo", required: true },
      {
        name: "institucion_lugar",
        label: "Institución / lugar",
        required: true,
      },
      { name: "fecha_inicio", label: "Fecha inicio", type: "date" },
      { name: "fecha_fin", label: "Fecha fin", type: "date" },
      {
        name: "codigo_dedicacion",
        label: "Código dedicación",
        type: "select",
        options: ["1", "2"],
        optionLabels: ["1 — Tiempo completo", "2 — Medio tiempo"],
      },
    ],
  },
  {
    key: "exp_hora_catedra",
    label: "Experiencia calificada — Hora cátedra",
    idPrefix: "exp_hc",
    accumulatedKey: ["total_acumulado", "total_con_tope"],
    columns: [
      { key: "evento_no", label: "Evento N.°" },
      { key: "institucion_lugar", label: "Institución / lugar" },
      { key: "fecha_inicio", label: "Fecha inicio", type: "date" },
      { key: "fecha_fin", label: "Fecha fin", type: "date" },
      { key: "puntos_h_s_s", label: "Pts H.S.S." },
      { key: "total_h_s_s_periodo", label: "Total H.S.S." },
      { key: "puntos", label: "Puntos" },
      { key: "total_acumulado", label: "Total acumulado" },
      { key: "total_con_tope", label: "Total con tope" },
    ],
    fields: [
      { name: "evento_no", label: "Evento N.°", type: "number" },
      {
        name: "institucion_lugar",
        label: "Institución / lugar",
        required: true,
      },
      { name: "fecha_inicio", label: "Fecha inicio", type: "date" },
      { name: "fecha_fin", label: "Fecha fin", type: "date" },
    ],
  },
  {
    key: "productividad",
    label: "Productividad académica",
    idPrefix: "prod",
    accumulatedKey: "puntaje_acumulado",
    columns: [
      { key: "inclusion_no", label: "Inclusión N.°" },
      { key: "trabajo_no", label: "Trabajo N.°" },
      { key: "titulo", label: "Título" },
      { key: "publicacion_detalle", label: "Detalle publicación" },
      { key: "clase", label: "Clase" },
      { key: "tipo_texto", label: "Tipo texto" },
      { key: "articulo_revista", label: "Artículo / revista" },
      { key: "numero_autores", label: "N.° autores" },
      { key: "libro", label: "Libro" },
      { key: "puntaje_acumulado", label: "Puntaje acumulado" },
    ],
    fields: [
      { name: "inclusion_no", label: "Inclusión N.°", type: "number" },
      { name: "trabajo_no", label: "Trabajo N.°", type: "number" },
      { name: "titulo", label: "Título", required: true },
      { name: "publicacion_detalle", label: "Detalle de publicación" },
      { name: "clase", label: "Clase (ej. 1, 2, 3)" },
      {
        name: "tipo_texto",
        label: "Tipo de texto",
        type: "select",
        options: ["L", "AL", "Ar", "T"],
        optionLabels: [
          "L — Libro",
          "AL — Artículo de libro",
          "Ar — Artículo de revista",
          "T — Traducción",
        ],
      },
      { name: "articulo_revista", label: "Artículo / revista (ej. A1, B)" },
      {
        name: "numero_autores",
        label: "N.° de autores",
        type: "number",
        required: true,
      },
      { name: "libro", label: "Libro", type: "number" },
    ],
  },
  {
    key: "premios_patentes",
    label: "Premios y patentes",
    idPrefix: "pre",
    accumulatedKey: "puntaje_acumulado",
    columns: [
      { key: "evento_no", label: "Evento N.°" },
      { key: "tipo", label: "Tipo" },
      { key: "premio_no", label: "Premio N.°" },
      { key: "descripcion", label: "Descripción" },
      { key: "fecha", label: "Fecha", type: "date" },
      { key: "puntaje_parcial", label: "Puntaje parcial" },
      { key: "puntaje_acumulado", label: "Puntaje acumulado" },
    ],
    fields: [
      {
        name: "evento_no",
        label: "Evento N.°",
        type: "number",
        required: true,
      },
      {
        name: "tipo",
        label: "Tipo",
        type: "select",
        options: ["PREMIO", "PATENTE"],
        optionLabels: ["Premio (hasta 15 pts)", "Patente (hasta 25 pts)"],
        required: true,
      },
      {
        name: "premio_no",
        label: "Premio N.°",
        type: "number",
        condition: (form) => form.tipo === "PREMIO",
      },
      {
        name: "patente_no",
        label: "Patente N.°",
        type: "number",
        condition: (form) => form.tipo === "PATENTE",
      },
      { name: "descripcion", label: "Descripción", required: true },
      { name: "fecha", label: "Fecha", type: "date" },
    ],
  },
  {
    key: "docencia",
    label: "Docencia destacada",
    idPrefix: "doc",
    accumulatedKey: "acumulado_puntos",
    columns: [
      { key: "evento_no", label: "Evento N.°" },
      { key: "asignatura", label: "Asignatura" },
      { key: "anio", label: "Año" },
      { key: "semestre", label: "Semestre" },
      { key: "fecha_solicitud", label: "Fecha solicitud", type: "date" },
      { key: "puntos_evento", label: "Puntos evento" },
      { key: "acumulado_puntos", label: "Acumulado" },
    ],
    fields: [
      { name: "evento_no", label: "Evento N.°", type: "number" },
      { name: "asignatura", label: "Asignatura", required: true },
      { name: "anio", label: "Año", type: "number", required: true },
      { name: "semestre", label: "Semestre", type: "number", required: true },
      { name: "fecha_solicitud", label: "Fecha de solicitud", type: "date" },
    ],
  },
  {
    key: "extension",
    label: "Extensión destacada",
    idPrefix: "ext",
    accumulatedKey: "acumulado_puntos",
    columns: [
      { key: "evento_no", label: "Evento N.°" },
      { key: "actividad", label: "Actividad" },
      { key: "anio", label: "Año" },
      { key: "semestre", label: "Semestre" },
      { key: "fecha_solicitud", label: "Fecha solicitud", type: "date" },
      { key: "puntos_evento", label: "Puntos evento" },
      { key: "acumulado_puntos", label: "Acumulado" },
    ],
    fields: [
      { name: "evento_no", label: "Evento N.°", type: "number" },
      { name: "actividad", label: "Actividad", required: true },
      { name: "anio", label: "Año", type: "number", required: true },
      { name: "semestre", label: "Semestre", type: "number", required: true },
      { name: "fecha_solicitud", label: "Fecha de solicitud", type: "date" },
    ],
  },
];

const getItems = (credenciales, factorKey) => {
  if (!credenciales) return [];
  switch (factorKey) {
    case "eventos_credenciales":
      return credenciales.eventos_credenciales || [];
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
    case "eventos_credenciales":
      return { eventos_credenciales: items };
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

const getVisibleFields = (factor, form) =>
  factor.fields.filter((field) => !field.condition || field.condition(form));

const itemToForm = (factor, item) => {
  const form = defaultFormForFactor(factor);
  factor.fields.forEach((field) => {
    const value = field.path
      ? field.path.reduce((current, key) => current?.[key], item)
      : item[field.name];
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
  getVisibleFields(factor, form).forEach((field) => {
    const raw = form[field.name];
    if (field.path) {
      let target = item;
      field.path.slice(0, -1).forEach((key) => {
        target[key] ||= {};
        target = target[key];
      });
      const key = field.path[field.path.length - 1];
      target[key] =
        field.type === "date"
          ? toIsoDate(raw)
          : field.type === "number"
            ? toNumber(raw)
            : raw || undefined;
      return;
    }
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
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const formatPts = (value) => {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  return `${n % 1 === 0 ? n : n.toFixed(2)} pts`;
};

const getFactorAccumulatedPoints = (factor, items) => {
  if (!factor.accumulatedKey || items.length === 0) return null;

  // Each backend record contains the accumulated total up to that record.
  const lastItem = items[items.length - 1];
  const keys = Array.isArray(factor.accumulatedKey)
    ? factor.accumulatedKey
    : [factor.accumulatedKey];
  return keys
    .map((key) => lastItem?.[key])
    .find((value) => value !== null && value !== undefined);
};

const getEventsSummaryPoints = (resumen) => {
  if (!resumen) return null;
  const value =
    resumen.eventos_credenciales ??
    resumen.eventos_credenciales_total ??
    resumen.puntos_totales;
  return value === null || value === undefined ? null : value;
};

const CredencialesProfesor = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profesor, setProfesor] = useState(null);
  const [credenciales, setCredenciales] = useState(null);
  const [docentePeriodos, setDocentePeriodos] = useState([]);
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
    () =>
      FACTORES.find((factor) => factor.key === selectedFactorKey) ||
      FACTORES[0],
    [selectedFactorKey],
  );

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [profData, docentePeriodosData] = await Promise.all([
        getProfesorById(id),
        getDocentePeriodos(),
      ]);
      setProfesor(profData);
      setDocentePeriodos(
        (docentePeriodosData || []).filter((dp) => dp.profesor_id === id),
      );
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
    const updated = await patchCredenciales(id, payload);
    setCredenciales(updated);
  };

  const handleOpenCreate = (factorKey = FACTORES[0].key) => {
    const factor =
      FACTORES.find((item) => item.key === factorKey) || FACTORES[0];
    setSelectedFactorKey(factor.key);
    setEditingItem(null);
    setEditingIndex(null);
    setFormData(defaultFormForFactor(factor));
    setFormError("");
    setOpenDialog(true);
  };

  const handleOpenEdit = (factorKey, item, index) => {
    const factor =
      FACTORES.find((entry) => entry.key === factorKey) || FACTORES[0];
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

  const handleFormChange = (e) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const missing = getVisibleFields(selectedFactor, formData).find(
      (field) => field.required && !String(formData[field.name] || "").trim(),
    );
    if (missing) {
      setFormError(`El campo "${missing.label}" es obligatorio.`);
      return;
    }

    if (
      selectedFactor.key === "premios_patentes" &&
      !String(
        formData[formData.tipo === "PREMIO" ? "premio_no" : "patente_no"] || "",
      ).trim()
    ) {
      setFormError(
        formData.tipo === "PREMIO"
          ? 'El campo "Premio N.°" es obligatorio.'
          : 'El campo "Patente N.°" es obligatorio.',
      );
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
        err.response?.data?.message ||
          "Error al guardar el registro de credenciales.",
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
        err.response?.data?.message ||
          "Error al eliminar el registro de credenciales.",
      );
    }
  };

  const resumen = credenciales?.resumen_puntos;

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate("/profesores")} color="primary">
          <ArrowBackIcon />
        </IconButton>
        <Typography
          variant="h4"
          sx={{ fontWeight: "bold", color: "#37474f", flexGrow: 1 }}
        >
          Credenciales del Profesor
        </Typography>
      </Stack>

      {!loading && !error && profesor && (
        <DetailProfesor profesor={profesor} docentePeriodos={docentePeriodos} />
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
              Este profesor aún no tiene hoja de credenciales. Al agregar el
              primer registro se creará automáticamente.
            </Alert>
          )}

          {FACTORES.map((factor) => {
            const items = getItems(credenciales, factor.key);
            const ptsValue =
              factor.key === "eventos_credenciales"
                ? getEventsSummaryPoints(resumen)
                : getFactorAccumulatedPoints(factor, items);
            const ptsLabel = formatPts(ptsValue);

            return (
              <Accordion key={factor.key} defaultExpanded={items.length > 0}>
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={2}
                    sx={{ width: "100%", pr: 2 }}
                  >
                    <Stack
                      direction="row"
                      alignItems="center"
                      spacing={1.25}
                      sx={{ minWidth: 0, flex: 1 }}
                    >
                      <Typography
                        sx={{
                          fontWeight: 600,
                          color: "#37474f",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {factor.label}
                      </Typography>
                      {ptsLabel && (
                        <Chip
                          label={ptsLabel}
                          size="small"
                          color="primary"
                          variant="outlined"
                          sx={{
                            fontWeight: 600,
                            fontSize: "0.78rem",
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </Stack>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ flexShrink: 0 }}
                    >
                      {items.length} registro{items.length === 1 ? "" : "s"}
                    </Typography>
                    <Button
                      size="small"
                      startIcon={<AddIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenCreate(factor.key);
                      }}
                      sx={{ flexShrink: 0 }}
                    >
                      Agregar
                    </Button>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails>
                  <TableContainer
                    component={Paper}
                    sx={{ borderRadius: 2, boxShadow: 1 }}
                  >
                    <Table size="small">
                      <TableHead sx={{ bgcolor: "#f5f5f5" }}>
                        <TableRow>
                          {factor.columns.map((column) => (
                            <TableCell
                              key={column.key}
                              sx={{ fontWeight: "bold", color: "#37474f" }}
                            >
                              {column.label}
                            </TableCell>
                          ))}
                          <TableCell
                            align="center"
                            sx={{
                              fontWeight: "bold",
                              color: "#37474f",
                              width: 120,
                            }}
                          >
                            Acciones
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {items.length === 0 ? (
                          <TableRow>
                            <TableCell
                              colSpan={factor.columns.length + 1}
                              align="center"
                              sx={{ py: 3, color: "#9e9e9e" }}
                            >
                              Sin registros en este factor.
                            </TableCell>
                          </TableRow>
                        ) : (
                          items.map((item, index) => (
                            <TableRow
                              key={item.id || `${factor.key}-${index}`}
                              hover
                            >
                              {factor.columns.map((column) => (
                                <TableCell key={column.key}>
                                  {formatCell(column, item)}
                                </TableCell>
                              ))}
                              <TableCell align="center">
                                <Stack
                                  direction="row"
                                  spacing={1}
                                  justifyContent="center"
                                >
                                  <IconButton
                                    size="small"
                                    color="primary"
                                    title="Editar registro"
                                    onClick={() =>
                                      handleOpenEdit(factor.key, item, index)
                                    }
                                  >
                                    <EditIcon fontSize="small" />
                                  </IconButton>
                                  <IconButton
                                    size="small"
                                    color="error"
                                    title="Eliminar registro"
                                    onClick={() =>
                                      handleDeleteItem(factor.key, item, index)
                                    }
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

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        fullWidth
        maxWidth="sm"
      >
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
              {getVisibleFields(selectedFactor, formData).map((field) =>
                field.type === "select" ? (
                  <Box key={field.name}>
                    <InputLabel
                      sx={{ fontWeight: "bold", color: "#37474f", mb: 1 }}
                    >
                      {field.label}
                      {field.required ? " *" : ""}
                    </InputLabel>
                    <FormControl fullWidth required={field.required}>
                      <Select
                        name={field.name}
                        value={formData[field.name] || ""}
                        onChange={handleFormChange}
                      >
                        {(field.options || []).map((option, i) => (
                          <MenuItem key={option} value={option}>
                            {field.optionLabels?.[i] ?? option}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                ) : (
                  <Box key={field.name}>
                    <InputLabel
                      sx={{ fontWeight: "bold", color: "#37474f", mb: 1 }}
                    >
                      {field.label}
                      {field.required ? " *" : ""}
                    </InputLabel>
                    <TextField
                      name={field.name}
                      type={
                        field.type === "date"
                          ? "date"
                          : field.type === "number"
                            ? "number"
                            : "text"
                      }
                      value={formData[field.name] || ""}
                      onChange={handleFormChange}
                      fullWidth
                      required={field.required}
                      inputProps={
                        field.type === "number"
                          ? {
                              step: "any",
                              min:
                                field.name === "numero_autores" ? 1 : undefined,
                            }
                          : undefined
                      }
                    />
                  </Box>
                ),
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button
              onClick={handleCloseDialog}
              color="inherit"
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="success"
              disabled={saving}
            >
              {editingItem ? "Guardar cambios" : "Agregar"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default CredencialesProfesor;
