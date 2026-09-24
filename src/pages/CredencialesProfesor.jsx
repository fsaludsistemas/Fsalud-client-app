import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getProfesorById,
  getCredencialesByProfesor,
  createCredenciales,
  patchCredenciales,
  createCredencialEvento,
  getProximoEvento,
  getDocentePeriodos,
  uploadStorageFile,
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
import ProtectedFileLink from "../components/ProtectedFileLink";

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
    fields: [
      {
        name: "numero_evento",
        label: "Evento N.°",
        type: "number",
      },
      {
        name: "clase",
        label: "Clase",
        type: "select",
        options: [
          "Inclusión",
          "Reajuste",
          "Corrección",
          "Ascenso",
          "Actualización",
        ],
        required: true,
      },
      {
        name: "dedicacion",
        label: "Dedicación",
        type: "select",
        options: ["T.C.", "M.T.", "H.C."],
        required: true,
      },
      {
        name: "categoria",
        label: "Categoría",
        type: "select",
        options: ["A", "B", "C", "D"],
        optionLabels: [
          "A — Auxiliar",
          "B — Asistente",
          "C — Asociado",
          "D — Titular",
        ],
        required: true,
      },
      {
        name: "soporte_acta_ccs",
        path: ["soporte", "acta_ccs"],
        label: "Acta CCS",
      },
      {
        name: "soporte_fecha",
        path: ["soporte", "fecha"],
        label: "Fecha",
        type: "date",
      },
      {
        name: "soporte_url_documento_acta",
        path: ["soporte", "url_documento_acta"],
        label: "Documento del acta",
        type: "file",
        accept: "image/*,application/pdf",
        storageTipo: "ACTA_CCS",
      },
      {
        name: "soporte_firma_presidente_url",
        path: ["soporte", "firma_presidente_url"],
        label: "Firma del presidente",
        type: "file",
        accept: "image/*,application/pdf",
        storageTipo: "FIRMA_PRESIDENTE",
      },
      {
        name: "soporte_correo_presidente",
        path: ["soporte", "correo_presidente"],
        label: "Correo del presidente",
        type: "email",
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

const STORAGE_FACTOR_BY_KEY = {
  titulos_pregrado: "titulos_universitarios",
  titulos_posgrado: "titulos_universitarios",
  categoria: "historial_categoria",
  exp_tiempo_parcial: "experiencia_calificada",
  exp_hora_catedra: "experiencia_calificada",
  productividad: "productividad_academica",
  premios_patentes: "premios_y_patentes",
  docencia: "docencia_destacada",
  extension: "extension_destacada",
};

FACTORES.forEach((factor) => {
  if (!STORAGE_FACTOR_BY_KEY[factor.key]) return;
  factor.columns.push({ key: "url_soporte", label: "Soporte", type: "fileLink" });
  factor.fields.push({
    name: "url_soporte",
    label: "Archivo de soporte",
    type: "file",
    accept: "image/*,application/pdf",
  });
});

const FACTOR_GROUPS = [
  {
    label: "Títulos universitarios",
    keys: ["titulos_pregrado", "titulos_posgrado"],
  },
  { label: "Categoría", keys: ["categoria"] },
  {
    label: "Experiencia calificada",
    keys: ["exp_tiempo_parcial", "exp_hora_catedra"],
  },
  {
    label: "Productividad académica",
    keys: ["productividad", "premios_patentes", "docencia", "extension"],
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
      if (field.type === "email" && typeof value === "string") {
        form[field.name] = value.replace("@correounivalle.edu.co", "");
      } else {
        form[field.name] = String(value);
      }
    }
  });
  return form;
};

const formToItem = (factor, form, existingId) => {
  const item = { id: existingId || newItemId(factor.idPrefix) };
  getVisibleFields(factor, form).forEach((field) => {
    const raw = form[field.name];
    if (field.type === "file") return;
    if (field.path) {
      let target = item;
      field.path.slice(0, -1).forEach((key) => {
        target[key] ||= {};
        target = target[key];
      });
      const key = field.path[field.path.length - 1];
      let val = raw;
      if (field.type === "email" && raw) {
        val = `${raw.trim()}@correounivalle.edu.co`;
      }
      target[key] =
        field.type === "date"
          ? toIsoDate(val)
          : field.type === "number"
            ? toNumber(val)
            : val || undefined;
      return;
    }
    if (field.type === "date") {
      item[field.name] = toIsoDate(raw);
    } else if (field.type === "number") {
      item[field.name] = toNumber(raw);
    } else if (field.type === "email") {
      const text = typeof raw === "string" ? raw.trim() : raw;
      item[field.name] = text ? `${text}@correounivalle.edu.co` : undefined;
    } else {
      const text = typeof raw === "string" ? raw.trim() : raw;
      item[field.name] = text || undefined;
    }
  });
  return item;
};

const EVENT_REFERENCE_FIELDS = new Set([
  "numero_evento",
  "evento_no",
  "inclusion_no",
]);

const getDialogFields = (factor, form, isEventFactor) =>
  getVisibleFields(factor, form).filter(
    (field) => !isEventFactor || !EVENT_REFERENCE_FIELDS.has(field.name),
  );

const buildEventFactorPayload = (factorKey, item) => {
  const factorItem = { ...item };
  EVENT_REFERENCE_FIELDS.forEach((field) => delete factorItem[field]);

  switch (factorKey) {
    case "titulos_pregrado":
      return { titulos_universitarios: { pregrado: [factorItem] } };
    case "titulos_posgrado":
      return { titulos_universitarios: { posgrado: [factorItem] } };
    case "categoria":
      return { historial_categoria: [factorItem] };
    case "exp_tiempo_parcial":
      return { experiencia_calificada: { tiempo_parcial: [factorItem] } };
    case "exp_hora_catedra":
      return { experiencia_calificada: { hora_catedra: [factorItem] } };
    case "productividad":
      return { productividad_academica: [factorItem] };
    case "premios_patentes":
      return { premios_y_patentes: [factorItem] };
    case "docencia":
      return { docencia_destacada: [factorItem] };
    case "extension":
      return { extension_destacada: [factorItem] };
    default:
      return {};
  }
};

const buildEventFactorsPayload = (factorItems) =>
  factorItems.reduce((payload, { factorKey, item }) => {
    const factorPayload = buildEventFactorPayload(factorKey, item);
    Object.entries(factorPayload).forEach(([key, value]) => {
      if (
        key === "titulos_universitarios" ||
        key === "experiencia_calificada"
      ) {
        payload[key] ||= {};
        Object.entries(value).forEach(([nestedKey, nestedItems]) => {
          payload[key][nestedKey] = [
            ...(payload[key][nestedKey] || []),
            ...nestedItems,
          ];
        });
      } else {
        payload[key] = [...(payload[key] || []), ...value];
      }
    });
    return payload;
  }, {});

const formatCell = (column, item) => {
  const value = item[column.key];
  if (value === null || value === undefined || value === "") return "—";
  if (column.type === "date") return toDateInput(value) || "—";
  if (column.type === "fileLink") {
    return <ProtectedFileLink url={value}>Ver archivo</ProtectedFileLink>;
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const formatPts = (value) => {
  if (value === null || value === undefined) return null;
  const n = Number(value);
  if (Number.isNaN(n)) return null;
  return `${n % 1 === 0 ? n : n.toFixed(2)} pts`;
};

const getFieldValue = (item, field) =>
  field.path
    ? field.path.reduce((current, key) => current?.[key], item)
    : item?.[field.name];

const preserveFileValues = (factor, item, previousItem) => {
  if (!previousItem) return item;
  factor.fields.filter((field) => field.type === "file").forEach((field) => {
    if (getFieldValue(item, field)) return;
    const previousValue = getFieldValue(previousItem, field);
    if (!previousValue) return;
    if (!field.path) item[field.name] = previousValue;
    else {
      let target = item;
      field.path.slice(0, -1).forEach((key) => {
        target[key] ||= {};
        target = target[key];
      });
      target[field.path[field.path.length - 1]] = previousValue;
    }
  });
  return item;
};

const EVENT_SCORE_FACTORS = [
  { key: "titulos_universitarios", label: "Títulos" },
  { key: "categoria", label: "Categoría" },
  { key: "experiencia_calificada", label: "Experiencia" },
  { key: "productividad_academica", label: "Productividad" },
];

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
    resumen.puntos_totales ??
    resumen.total_acumulado;
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
  const [selectedFactorKey, setSelectedFactorKey] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [formData, setFormData] = useState({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [eventStep, setEventStep] = useState(null);
  const [eventData, setEventData] = useState(null);
  const [pendingEventFactors, setPendingEventFactors] = useState([]);
  const [editingPendingIndex, setEditingPendingIndex] = useState(null);
  const [nextEventNumber, setNextEventNumber] = useState(null);

  const selectedFactor = useMemo(
    () => FACTORES.find((factor) => factor.key === selectedFactorKey),
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

  const handleOpenCreate = (factorKey) => {
    const factor =
      FACTORES.find((item) => item.key === factorKey) ||
      FACTORES.find((item) => item.key === "eventos_credenciales");
    setSelectedFactorKey(factor.key);
    setEditingItem(null);
    setEditingIndex(null);
    setFormData(defaultFormForFactor(factor));
    setFormError("");
    setEventStep(factor.key === "eventos_credenciales" ? "event" : null);
    setEventData(null);
    setPendingEventFactors([]);
    setEditingPendingIndex(null);
    setNextEventNumber(null);
    if (factor.key === "eventos_credenciales") {
      getProximoEvento(id)
        .then((preview) => setNextEventNumber(preview.proximo_numero_evento))
        .catch(() => setNextEventNumber(null));
    }
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
    setEventStep(null);
    setEventData(null);
    setPendingEventFactors([]);
    setEditingPendingIndex(null);
    setNextEventNumber(null);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingItem(null);
    setEditingIndex(null);
    setFormError("");
    setEventStep(null);
    setEventData(null);
    setPendingEventFactors([]);
    setEditingPendingIndex(null);
    setNextEventNumber(null);
  };

  const handleFormChange = (e) => {
    const value = e.target.type === "file" ? e.target.files?.[0] || null : e.target.value;
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: value,
    }));
  };

  const uploadFiles = async (factor, item) => {
    const nextItem = { ...item };
    for (const field of getVisibleFields(factor, formData)) {
      const file = formData[field.name];
      if (field.type !== "file" || !file) continue;
      const url = await uploadStorageFile({
        profesor_id: id,
        file,
        tipo: field.storageTipo || "SOPORTE_CREDENCIAL",
        factor: field.storageFactor || STORAGE_FACTOR_BY_KEY[factor.key] || "eventos_credenciales",
        referencia_id: String(item.id || eventData?.numero_evento || nextEventNumber || "nuevo"),
      });
      if (field.path) {
        let target = nextItem;
        field.path.slice(0, -1).forEach((key) => {
          target[key] ||= {};
          target = target[key];
        });
        target[field.path[field.path.length - 1]] = url;
      } else nextItem[field.name] = url;
    }
    return nextItem;
  };

  const handleEventFactorChange = (e) => {
    const factor = FACTORES.find((item) => item.key === e.target.value);
    if (!factor) return;
    setSelectedFactorKey(factor.key);
    setFormData(defaultFormForFactor(factor));
    setFormError("");
  };

  const handleEditPendingFactor = (index) => {
    const pendingFactor = pendingEventFactors[index];
    const factor = FACTORES.find(
      (entry) => entry.key === pendingFactor?.factorKey,
    );
    if (!factor) return;

    setEditingPendingIndex(index);
    setSelectedFactorKey(factor.key);
    setFormData(itemToForm(factor, pendingFactor.item));
    setFormError("");
  };

  const handleDeletePendingFactor = (index) => {
    setPendingEventFactors((current) =>
      current.filter((_, factorIndex) => factorIndex !== index),
    );
    if (editingPendingIndex === index) {
      setEditingPendingIndex(null);
      setSelectedFactorKey("");
      setFormData({});
    } else if (editingPendingIndex !== null && editingPendingIndex > index) {
      setEditingPendingIndex((current) => current - 1);
    }
    setFormError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    const dialogFields = selectedFactor
      ? getDialogFields(selectedFactor, formData, eventStep !== null)
      : [];
    const missing = dialogFields.find(
      (field) => field.required && !String(formData[field.name] || "").trim(),
    );
    if (missing) {
      setFormError(`El campo "${missing.label}" es obligatorio.`);
      return;
    }

    if (
      selectedFactor?.key === "premios_patentes" &&
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
      if (eventStep === "event") {
        let nextEvent = formToItem(selectedFactor, formData);
        nextEvent = await uploadFiles(selectedFactor, nextEvent);
        delete nextEvent.id;
        setEventData(nextEvent);
        setSelectedFactorKey("");
        setFormData({});
        setEventStep("factor");
        return;
      }

      if (eventStep === "factor") {
        if (!selectedFactor) {
          setFormError("Seleccione el factor que desea agregar.");
          return;
        }

        const action = e.nativeEvent.submitter?.value || "finalize";

        if (action === "finalize") {
          if (!window.confirm("¿Está seguro de que desea guardar y finalizar el evento?")) {
            return;
          }
        }

        let factorItem = formToItem(selectedFactor, formData);
        const previousPending =
          editingPendingIndex === null
            ? null
            : pendingEventFactors[editingPendingIndex]?.item;
        factorItem = preserveFileValues(selectedFactor, factorItem, previousPending);
        factorItem = await uploadFiles(selectedFactor, factorItem);
        const nextFactor = { factorKey: selectedFactor.key, item: factorItem };
        const nextFactors =
          editingPendingIndex === null
            ? [...pendingEventFactors, nextFactor]
            : pendingEventFactors.map((pendingFactor, index) =>
                index === editingPendingIndex ? nextFactor : pendingFactor,
              );

        if (action === "add") {
          setPendingEventFactors(nextFactors);
          setEditingPendingIndex(null);
          setSelectedFactorKey("");
          setFormData({});
          setFormError("");
          return;
        }

        await ensureCredenciales();
        const response = await createCredencialEvento(id, {
          evento: eventData,
          ...buildEventFactorsPayload(nextFactors),
        });
        setCredenciales(response.credenciales || response);
        setSuccess("Evento y registro del factor agregados correctamente.");
        setOpenDialog(false);
        return;
      }

      const current = credenciales || emptyCredenciales(id);
      const currentItems = getItems(current, selectedFactor.key);
      let nextItem = formToItem(selectedFactor, formData, editingItem?.id);
      nextItem = preserveFileValues(selectedFactor, nextItem, editingItem);
      nextItem = await uploadFiles(selectedFactor, nextItem);
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
            const group = FACTOR_GROUPS.find((entry) =>
              entry.keys.includes(factor.key),
            );
            const isGroupStart = group?.keys[0] === factor.key;
            const ptsValue =
              factor.key === "eventos_credenciales"
                ? getEventsSummaryPoints(resumen)
                : getFactorAccumulatedPoints(factor, items);
            const ptsLabel = formatPts(ptsValue);

            return (
              <Box key={factor.key}>
                {isGroupStart && (
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={2}
                    sx={{ mt: 2, mb: 1 }}
                  >
                    <Typography
                      variant="subtitle1"
                      sx={{
                        fontWeight: 700,
                        color: "#37474f",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {group.label}
                    </Typography>
                    <Box sx={{ flex: 1, borderTop: "1px solid #cfd8dc" }} />
                  </Stack>
                )}
                <Accordion
                  defaultExpanded={factor.key === "eventos_credenciales"}
                  sx={{
                    backgroundColor:
                      factor.key === "eventos_credenciales" ? "#dddddd" : "",
                  }}
                >
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
                      {factor.key === "eventos_credenciales" && (
                        <Button
                          size="small"
                          variant="contained"
                          
                          startIcon={<AddIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCreate(factor.key);
                          }}
                          sx={{ flexShrink: 0 }}
                        >
                          Agregar
                        </Button>
                      )}
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails>
                    {factor.key === "eventos_credenciales" ? (
                      items.length === 0 ? (
                        <Typography
                          color="text.secondary"
                          align="center"
                          sx={{ py: 2 }}
                        >
                          Sin registros en este factor.
                        </Typography>
                      ) : (
                        <Stack spacing={1}>
                          {items.map((item, index) => (
                            <Accordion
                              key={item.id || `${factor.key}-${index}`}
                              sx={{
                                border: "1px solid #cfd8dc",
                                boxShadow: "none",
                                "&:before": { display: "none" },
                              }}
                            >
                              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                <Stack
                                  direction={{ xs: "column", sm: "row" }}
                                  spacing={{ xs: 0.5, sm: 3 }}
                                  sx={{ width: "100%" }}
                                >
                                  <Typography sx={{ fontWeight: 600 }}>
                                    Evento N.° {item.numero_evento || "—"}
                                  </Typography>
                                  <Typography>
                                    Clase: {item.clase || "—"}
                                  </Typography>
                                  <Typography>
                                    Dedicación: {item.dedicacion || "—"}
                                  </Typography>
                                  <Typography>
                                    Categoría: {item.categoria || "—"}
                                  </Typography>
                                </Stack>
                              </AccordionSummary>
                              <AccordionDetails>
                                <TableContainer
                                  component={Paper}
                                  variant="outlined"
                                >
                                  <Table size="small" sx={{ minWidth: 900 }}>
                                    <TableHead sx={{ bgcolor: "#f5f5f5" }}>
                                      <TableRow>
                                        <TableCell sx={{ fontWeight: "bold" }}>
                                          Factores del puntaje
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: "bold" }}>
                                          Puntos del evento
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: "bold" }}>
                                          Acumulado del evento
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: "bold" }}>
                                          Acta CCS
                                        </TableCell>
                                        <TableCell sx={{ fontWeight: "bold" }}>
                                          Firma presidente
                                        </TableCell>
                                        <TableCell
                                          align="center"
                                          sx={{ fontWeight: "bold" }}
                                        >
                                          Acciones
                                        </TableCell>
                                      </TableRow>
                                    </TableHead>
                                    <TableBody>
                                      <TableRow hover>
                                        <TableCell>
                                          <Stack spacing={0.75}>
                                            {EVENT_SCORE_FACTORS.map(
                                              (scoreFactor) => (
                                                <Typography
                                                  key={scoreFactor.key}
                                                  variant="body2"
                                                >
                                                  {scoreFactor.label}
                                                </Typography>
                                              ),
                                            )}
                                          </Stack>
                                        </TableCell>
                                        <TableCell>
                                          <Stack spacing={0.75}>
                                            {EVENT_SCORE_FACTORS.map(
                                              (scoreFactor) => (
                                                <Typography
                                                  key={scoreFactor.key}
                                                  variant="body2"
                                                >
                                                  {formatPts(
                                                    item.factores_puntaje?.[
                                                      scoreFactor.key
                                                    ]?.puntos_evento,
                                                  ) || "—"}
                                                </Typography>
                                              ),
                                            )}
                                            <Typography
                                              sx={{ fontWeight: 600 }}
                                            >
                                              Total:{" "}
                                              {formatPts(item.puntos_evento) ||
                                                "—"}
                                            </Typography>
                                          </Stack>
                                        </TableCell>
                                        <TableCell>
                                          <Stack spacing={0.75}>
                                            {EVENT_SCORE_FACTORS.map(
                                              (scoreFactor) => (
                                                <Typography
                                                  key={scoreFactor.key}
                                                  variant="body2"
                                                >
                                                  {formatPts(
                                                    item.factores_puntaje?.[
                                                      scoreFactor.key
                                                    ]?.total_acumulado,
                                                  ) || "—"}
                                                </Typography>
                                              ),
                                            )}
                                            <Typography
                                              sx={{ fontWeight: 600 }}
                                            >
                                              Total:{" "}
                                              {formatPts(
                                                item.total_acumulado,
                                              ) || "—"}
                                            </Typography>
                                          </Stack>
                                        </TableCell>
                                        <TableCell>
                                          {item.soporte?.acta_ccs || "—"}
                                        </TableCell>
                                        <TableCell>
                                          {item.soporte
                                            ?.firma_presidente_url ? (
                                            <ProtectedFileLink
                                              url={item.soporte.firma_presidente_url}
                                            >
                                              Ver firma
                                            </ProtectedFileLink>
                                          ) : (
                                            "—"
                                          )}
                                        </TableCell>
                                        <TableCell align="center">
                                          <IconButton
                                            size="small"
                                            color="primary"
                                            title="Editar evento"
                                            onClick={() =>
                                              handleOpenEdit(
                                                factor.key,
                                                item,
                                                index,
                                              )
                                            }
                                          >
                                            <EditIcon fontSize="small" />
                                          </IconButton>
                                        </TableCell>
                                      </TableRow>
                                    </TableBody>
                                  </Table>
                                </TableContainer>
                              </AccordionDetails>
                            </Accordion>
                          ))}
                        </Stack>
                      )
                    ) : (
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
                                          handleOpenEdit(
                                            factor.key,
                                            item,
                                            index,
                                          )
                                        }
                                      >
                                        <EditIcon fontSize="small" />
                                      </IconButton>
                                      <IconButton
                                        size="small"
                                        color="error"
                                        title="Eliminar registro"
                                        onClick={() =>
                                          handleDeleteItem(
                                            factor.key,
                                            item,
                                            index,
                                          )
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
                    )}
                  </AccordionDetails>
                </Accordion>
              </Box>
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
            {editingItem
              ? "Editar registro"
              : eventStep === "event"
                ? "Nuevo evento de credenciales"
                : eventStep === "factor"
                  ? "Agregar factor al evento"
                  : "Nuevo registro de credenciales"}
          </DialogTitle>
          <DialogContent dividers>
            {formError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {formError}
              </Alert>
            )}
            <Stack spacing={2} sx={{ mt: 1 }}>
              {eventStep === "factor" && (
                <Stack spacing={2}>
                  <Alert severity="info">
                    Evento N.° {nextEventNumber || "pendiente"} · Clase:{" "}
                    {eventData?.clase || "-"} · Dedicación:{" "}
                    {eventData?.dedicacion || "-"}
                  </Alert>
                  {pendingEventFactors.length > 0 && (
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: 700, color: "#37474f", mb: 1 }}
                      >
                        Factores agregados ({pendingEventFactors.length})
                      </Typography>
                      <Stack spacing={1}>
                        {pendingEventFactors.map((pendingFactor, index) => {
                          const factor = FACTORES.find(
                            (entry) => entry.key === pendingFactor.factorKey,
                          );
                          return (
                            <Stack
                              key={`${pendingFactor.factorKey}-${index}`}
                              direction="row"
                              alignItems="center"
                              spacing={1}
                              sx={{
                                border: "1px solid #e0e0e0",
                                borderRadius: 1,
                                px: 1.5,
                                py: 0.75,
                              }}
                            >
                              <Typography sx={{ flex: 1 }}>
                                {factor?.label || pendingFactor.factorKey}
                              </Typography>
                              <Button
                                size="small"
                                startIcon={<EditIcon />}
                                onClick={() => handleEditPendingFactor(index)}
                              ></Button>
                              <IconButton
                                size="small"
                                color="error"
                                title="Eliminar factor pendiente"
                                onClick={() => handleDeletePendingFactor(index)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Stack>
                          );
                        })}
                      </Stack>
                    </Box>
                  )}
                  <Box>
                    <InputLabel
                      sx={{ fontWeight: "bold", color: "#37474f", mb: 1 }}
                    >
                      Factor que se agregará
                    </InputLabel>
                    <FormControl fullWidth>
                      <Select
                        value={selectedFactorKey}
                        onChange={handleEventFactorChange}
                      >
                        {FACTORES.filter(
                          (factor) => factor.key !== "eventos_credenciales",
                        ).map((factor) => (
                          <MenuItem key={factor.key} value={factor.key}>
                            {factor.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                </Stack>
              )}
              {(selectedFactor
                ? getDialogFields(selectedFactor, formData, eventStep !== null)
                : []
              ).map((field) =>
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
                ) : field.type === "file" ? (
                  <Box key={field.name}>
                    <InputLabel sx={{ fontWeight: "bold", color: "#37474f", mb: 1 }}>
                      {field.label}
                    </InputLabel>
                    <Button component="label" variant="outlined" fullWidth sx={{ justifyContent: "flex-start", py: 1.5 }}>
                      {formData[field.name]?.name || "Seleccionar archivo"}
                      <input hidden type="file" name={field.name} accept={field.accept} onChange={handleFormChange} />
                    </Button>
                    {getFieldValue(editingItem, field) && !formData[field.name] && (
                      <Typography variant="caption">
                        Archivo actual: <ProtectedFileLink url={getFieldValue(editingItem, field)}>ver</ProtectedFileLink>
                      </Typography>
                    )}
                  </Box>
                ) : field.type === "email" ? (
                  <Box key={field.name}>
                    <InputLabel
                      sx={{ fontWeight: "bold", color: "#37474f", mb: 1 }}
                    >
                      {field.label}
                      {field.required ? " *" : ""}
                    </InputLabel>
                    <Stack direction="row" spacing={0} alignItems="stretch">
                      <TextField
                        name={field.name}
                        type="text"
                        value={formData[field.name] || ""}
                        onChange={handleFormChange}
                        placeholder="ej. juan.perez"
                        fullWidth
                        required={field.required}
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
              color="error"
              variant="text"
              disabled={saving}
            >
              Cancelar
            </Button>
            {eventStep === "factor" ? (
              <>
                <Button
                  type="submit"
                  name="factorAction"
                  value="add"
                  variant="contained"
                  color="secondary"
                  disabled={saving || !selectedFactor}
                >
                  Guardar y añadir otro
                </Button>
                <Button
                  type="submit"
                  name="factorAction"
                  value="finalize"
                  variant="contained"
                  color="success"
                  disabled={saving || !selectedFactor}
                >
                  Guardar y finalizar
                </Button>
              </>
            ) : (
              <Button
                type="submit"
                variant="contained"
                color="success"
                disabled={saving}
              >
                {editingItem
                  ? "Guardar cambios"
                  : eventStep === "event"
                    ? "Continuar"
                    : "Agregar"}
              </Button>
            )}
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default CredencialesProfesor;
