import { useEffect, useMemo, useState } from "react";
import { Fragment } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDependencias } from "../context/DependenciasContext";
import {
  getDashboardStats,
  rebuildDashboardStats,
  searchProfesores,
} from "../api/apiClient";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { BarChart, PieChart } from "@mui/x-charts";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import PeopleIcon from "@mui/icons-material/People";
import RefreshIcon from "@mui/icons-material/Refresh";

const ALL = "TODOS";
const CLASSES = {
  1: "Inclusión",
  2: "Reajuste",
  3: "Corrección",
  4: "Ascenso",
  5: "Actualización",
};
const FILTER_LABELS = {
  tipo_vinculacion: "Vinculación",
  dedicacion: "Dedicación",
  cargo: "Cargo",
  nivel: "Nivel",
};
const FACTOR_GROUPS = [
  {
    label: "Títulos universitarios",
    subfactors: [
      { label: "Pregrado", keys: ["pregrado", "titulos_pregrado"] },
      { label: "Posgrado", keys: ["posgrado", "titulos_posgrado"] },
    ],
  },
  {
    label: "Categoría",
    subfactors: [{ label: "Categoría", keys: ["categoria", "historial_categoria"] }],
  },
  {
    label: "Experiencia calificada",
    subfactors: [
      {
        label: "Tiempo parcial",
        keys: ["tiempo_parcial", "exp_tiempo_parcial", "experiencia_tiempo_parcial"],
      },
      {
        label: "Hora cátedra",
        keys: ["hora_catedra", "exp_hora_catedra", "experiencia_hora_catedra"],
      },
    ],
  },
  {
    label: "Productividad académica",
    subfactors: [
      { label: "Productividad académica", keys: ["productividad", "productividad_academica"] },
      { label: "Premios", keys: ["premios", "premios_patentes", "premios_y_patentes"] },
      { label: "Patentes", keys: ["patentes"] },
      { label: "Extensión destacada", keys: ["extension", "extension_destacada"] },
      { label: "Docencia destacada", keys: ["docencia", "docencia_destacada"] },
    ],
  },
];
const entries = (value) =>
  Object.entries(value || {}).filter(([, n]) => Number(n) > 0);

const normalizeText = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const eventValue = (values, key) => {
  const classLabel = CLASSES[key];
  const expected = [key, classLabel, normalizeText(classLabel)];
  const match = Object.entries(values || {}).find(([name]) =>
    expected.some((candidate) => normalizeText(name) === normalizeText(candidate)),
  );
  return Number(match?.[1] || 0);
};

function Donut({ title, data }) {
  const values = entries(data);
  const total = values.reduce((sum, [, n]) => sum + Number(n), 0);
  return (
    <Card sx={{ flex: "1 1 260px", minWidth: 240, height: 390 }}>
      <CardContent sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
        <Typography variant="h6" align="center" sx={{ mb: 1, fontWeight: 700, color: "#37474f", borderBottom: 2, borderColor: "primary.main", pb: 1 }}>
          {title}
        </Typography>
        <PieChart
          height={230}
          series={[
            {
              data: values.map(([label, value], id) => ({
                id,
                label,
                value: Number(value),
              })),
              innerRadius: 48,
              paddingAngle: 2,
              cornerRadius: 4,
              highlightScope: { fade: "global", highlight: "item" },
            },
          ]}
          slotProps={{
            legend: {
              direction: "column",
              position: { vertical: "middle", horizontal: "right" },
            },
          }}
        />
        <Typography align="center" fontWeight="bold" sx={{ mt: "auto" }}>
          Total: {total}
        </Typography>
      </CardContent>
    </Card>
  );
}

function Bars({ data, dependencies }) {
  const values = entries(data).sort(([, a], [, b]) => Number(b) - Number(a));
  const labels = values.map(
    ([id]) =>
      dependencies.find((d) => String(d.id) === String(id))?.nombre || id,
  );
  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="h6">Docentes por escuela</Typography>
        {values.length ? (
          <>
          <BarChart
            height={350}
            margin={{ left: 48, right: 24, top: 24, bottom: 24 }}
            xAxis={[
              {
                scaleType: "band",
                data: labels,
                tickLabelInterval: () => false,
                colorMap: {
                  type: "ordinal",
                  values: labels,
                  colors: [
                    "#1565c0", "#00897b", "#ef6c00", "#8e24aa",
                    "#c62828", "#6d4c41", "#3949ab", "#00838f",
                  ],
                },
              },
            ]}
            series={[
              {
                label: "Docentes",
                data: values.map(([, n]) => Number(n)),
              },
            ]}
            slotProps={{ legend: { hidden: true } }}
          />
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: `repeat(${labels.length}, minmax(0, 1fr))`,
              ml: "48px",
              mr: "24px",
              mt: 1,
              gap: 0.5,
            }}
          >
            {labels.map((label) => (
              <Typography
                key={label}
                variant="caption"
                align="center"
                sx={{ color: "#37474f", fontWeight: 500, lineHeight: 1.15, overflowWrap: "anywhere" }}
              >
                {label}
              </Typography>
            ))}
          </Box>
          </>
        ) : (
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            No hay datos para mostrar.
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

function EventsChart({ rows }) {
  const yearLabels = rows.map(([year, values]) => {
    const total = Object.keys(CLASSES).reduce(
      (sum, key) => sum + eventValue(values, key),
      0,
    );
    return `${year} · Total: ${total}`;
  });
  const classSeries = Object.entries(CLASSES).map(([key, label]) => ({
    label,
    data: rows.map(([, values]) => eventValue(values, key)),
    stack: "eventos",
  }));
  return (
    <BarChart
      height={350}
      margin={{ left: 48, right: 24, top: 36, bottom: 48 }}
      xAxis={[{ scaleType: "band", data: yearLabels, label: "Año · total de eventos" }]}
      yAxis={[{ label: "Cantidad de eventos" }]}
      series={classSeries}
    />
  );
}

function FactorsChart({ data }) {
  const source = data || {};
  const getCount = (keys) => keys.reduce((total, key) => total + Number(source[key] || 0), 0);
  const values = FACTOR_GROUPS.map((group) => ({
    ...group,
    subvalues: group.subfactors.map((subfactor) => [subfactor.label, getCount(subfactor.keys)]),
  }));
  const total = values.reduce(
    (sum, group) => sum + group.subvalues.reduce((groupTotal, [, value]) => groupTotal + value, 0),
    0,
  );

  return (
    <TableContainer
      component={Paper}
      variant="outlined"
      sx={{ borderRadius: 2, overflow: "hidden" }}
    >
      <Table size="small" aria-label="Factores registrados">
        <TableHead sx={{ bgcolor: "#e0f2f1" }}>
          <TableRow>
            <TableCell sx={{ fontWeight: 700, color: "#37474f" }}>
              Factor
            </TableCell>
            <TableCell align="right" sx={{ fontWeight: 700, color: "#37474f" }}>
              Cantidad
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {values.map((group) => (
            <Fragment key={group.label}>
              <TableRow sx={{ bgcolor: "#b2dfdb" }}>
                <TableCell sx={{ fontWeight: 700, color: "#263238" }}>{group.label}</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: "#00695c" }}>
                  {group.subvalues.reduce((sum, [, value]) => sum + value, 0)}
                </TableCell>
              </TableRow>
              {group.subvalues.map(([label, value]) => (
                <TableRow key={`${group.label}-${label}`} sx={{ bgcolor: "#f7fbfb" }}>
                  <TableCell sx={{ pl: 4, color: "#455a64" }}>{label}</TableCell>
                  <TableCell align="right" sx={{ color: "#00897b" }}>{value}</TableCell>
                </TableRow>
              ))}
            </Fragment>
          ))}
          <TableRow sx={{ bgcolor: "#f1f8e9" }}>
            <TableCell sx={{ fontWeight: 700, color: "#37474f" }}>Total</TableCell>
            <TableCell align="right" sx={{ fontWeight: 700, color: "#2e7d32" }}>
              {total}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </TableContainer>
  );
}

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const { dependencias } = useDependencias();
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    escuela_id: "",
    tipo_vinculacion: "",
    dedicacion: "",
    cargo: "",
    nivel: "",
  });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [results, setResults] = useState([]);
  const [rebuilding, setRebuilding] = useState(false);
  const [success, setSuccess] = useState("");
  const roots = useMemo(
    () => dependencias.filter((d) => d.tipo === "ESCUELA"),
    [dependencias],
  );
  const fixedSchool = useMemo(() => {
    const dep = user?.dependencia_actual;
    return dep?.escuela_o_oficina_id || dep?.ancestros?.[0] || "";
  }, [user]);
  const activeFilters = useMemo(
    () => ({ ...filters, escuela_id: fixedSchool || filters.escuela_id }),
    [filters, fixedSchool],
  );
  useEffect(() => {
    if (authLoading || !user) return;
    getDashboardStats(activeFilters)
      .then((data) => {
        setStats(data);
      })
      .catch(() => setError("No fue posible cargar las estadísticas."))
      .finally(() => setLoading(false));
  }, [authLoading, user, activeFilters]);
  useEffect(() => {
    const timer = setTimeout(() => {
      if (search.trim().length >= 2)
        searchProfesores(search.trim())
          .then((data) =>
            setResults(Array.isArray(data) ? data : data?.data || []),
          )
          .catch(() => setResults([]));
      else setResults([]);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);
  const update = (name, value) =>
    setFilters((f) => ({ ...f, [name]: value === ALL ? "" : value }));
  const events = stats?.eventos || {};
  const eventRows = Object.entries(
    events.por_anio_y_clase || events.por_anio_por_clase || {},
  )
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-5);
  const handleRebuild = async () => {
    setRebuilding(true);
    setError("");
    try {
      const data = await rebuildDashboardStats();
      setStats(data);
      setSuccess("Las estadísticas fueron reconstruidas correctamente.");
    } catch (err) {
      setError(err.response?.data?.message || "No fue posible reconstruir las estadísticas.");
    } finally {
      setRebuilding(false);
    }
  };
  if (loading && !stats)
    return (
      <Box sx={{ display: "grid", placeItems: "center", py: 10 }}>
        <CircularProgress />
      </Box>
    );
  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        sx={{ mb: 4 }}
      >
        <Box>
          <Typography variant="h4" component="h2" sx={{ fontWeight: "bold", color: "#37474f", flexGrow: 1 }}>
            Dashboard
          </Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <Stack direction="row" spacing={1}>
          {user?.permiso === "SISTEMAS" && (
            <Button
              variant="outlined"
              color="primary"
              startIcon={<CorporateFareIcon />}
              onClick={() => navigate("/dependencias")}
            >
              Gestionar Dependencias
            </Button>
          )}
          {["SISTEMAS", "ADMINISTRADOR"].includes(user?.permiso) && (
            <Button variant="outlined" color="secondary" startIcon={<PeopleIcon />} onClick={() => navigate("/usuarios")}>
              Gestionar Usuarios
            </Button>
          )}
          {user?.permiso === "SISTEMAS" && (
            <Button variant="contained" color="success" startIcon={<RefreshIcon />} onClick={handleRebuild} disabled={rebuilding}>
              {rebuilding ? "Reconstruyendo..." : "Reconstruir estadísticas"}
            </Button>
          )}
        </Stack>
      </Stack>
      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Resumen del cuerpo docente y credenciales.
      </Typography>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {success && <Alert severity="success" onClose={() => setSuccess("")} sx={{ mb: 3 }}>{success}</Alert>}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Stack spacing={2}>
          <Autocomplete
            freeSolo
            options={results}
            inputValue={search}
            onInputChange={(_, value) => setSearch(value)}
            onChange={(_, professor) => { if (professor?.id) navigate(`/profesores/${professor.id}/datos`); }}
            getOptionLabel={(professor) => typeof professor === "string" ? professor : `${professor.nombres || ""} ${professor.apellidos || ""}`.trim()}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            noOptionsText={search.trim().length < 2 ? "Escribe al menos 2 caracteres" : "No se encontraron profesores"}
            renderOption={(props, professor) => <Box component="li" {...props} key={professor.id}><Box><Typography fontWeight={600}>{professor.nombres} {professor.apellidos}</Typography><Typography variant="caption" color="text.secondary">Identificación: {professor.numero_identificacion}</Typography></Box></Box>}
            renderInput={(params) => <TextField {...params} size="small" label="Buscar docente" placeholder="Buscar por nombres, apellidos o número de identificación" />}
          />
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
          >
            <FormControl
              size="small"
              fullWidth
              disabled={Boolean(fixedSchool)}
            >
              <InputLabel>Escuela</InputLabel>
              <Select
                label="Escuela"
                value={activeFilters.escuela_id || ALL}
                onChange={(e) => update("escuela_id", e.target.value)}
              >
                <MenuItem value={ALL}>Todas las escuelas</MenuItem>
                {roots.map((d) => (
                  <MenuItem key={d.id} value={d.id}>
                    {d.nombre}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {Object.keys(FILTER_LABELS).map((key) => (
              <FormControl key={key} size="small" fullWidth>
                <InputLabel>{FILTER_LABELS[key]}</InputLabel>
                <Select
                  label={FILTER_LABELS[key]}
                  value={filters[key] || ALL}
                  onChange={(e) => update(key, e.target.value)}
                >
                  <MenuItem value={ALL}>Todos</MenuItem>
                  {Object.entries(stats?.profesores?.[`por_${key}`] || {})
                    .filter(([, count]) => Number(count) > 0)
                    .map(([value]) => value)
                    .sort()
                    .map((v) => (
                      <MenuItem key={v} value={v}>
                        {v}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            ))}
          </Stack>
        </Stack>
      </Paper>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mb: 3 }}>
        <Card sx={{ flex: 1, bgcolor: "#e3f2fd" }}>
          <CardContent>
            <Typography color="text.secondary">Total de docentes</Typography>
            <Typography variant="h3" fontWeight="bold">
              {stats?.profesores?.total || 0}
            </Typography>
          </CardContent>
        </Card>
        {entries(stats?.profesores?.por_cargo)
          .slice(0, 4)
          .map(([k, n]) => (
            <Card key={k} sx={{ flex: 1 }}>
              <CardContent>
                <Typography color="text.secondary">{k}</Typography>
                <Typography variant="h4" fontWeight="bold">
                  {n}
                </Typography>
              </CardContent>
            </Card>
          ))}
      </Stack>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <Donut
          title="Por dedicación"
          data={stats?.profesores?.por_dedicacion}
        />
        <Donut title="Por nivel" data={stats?.profesores?.por_nivel} />
        <Donut
          title="Por vinculación"
          data={stats?.profesores?.por_tipo_vinculacion}
        />
      </Stack>
      <Bars data={stats?.profesores?.por_escuela} dependencies={dependencias} />
      <Typography variant="h5" fontWeight="bold" sx={{ mt: 4, mb: 2 }}>
        Credenciales y factores
      </Typography>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6">
              Eventos por clase (últimos 5 años)
            </Typography>
            {eventRows.length ? <EventsChart rows={eventRows} /> : <Typography color="text.secondary" sx={{ py: 8 }}>No hay eventos para mostrar.</Typography>}
          </CardContent>
        </Card>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="h6">Factores registrados</Typography>
            {entries(stats?.factores).length ? <FactorsChart data={stats?.factores} /> : <Typography color="text.secondary" sx={{ py: 8 }}>No hay factores para mostrar.</Typography>}
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
};
export default Dashboard;
