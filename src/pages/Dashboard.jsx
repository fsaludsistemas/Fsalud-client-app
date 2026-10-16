import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useDependencias } from "../context/DependenciasContext";
import {
  getDashboardStats,
  getDocentePeriodos,
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
    <Card sx={{ flex: "1 1 260px", minWidth: 240 }}>
      <CardContent>
        <Typography variant="h6">{title}</Typography>
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
        <Typography align="center" fontWeight="bold">
          Total: {total}
        </Typography>
      </CardContent>
    </Card>
  );
}

function Bars({ data, dependencies }) {
  const values = entries(data);
  const labels = values.map(
    ([id]) =>
      dependencies.find((d) => String(d.id) === String(id))?.nombre || id,
  );
  return (
    <Card sx={{ mt: 2 }}>
      <CardContent>
        <Typography variant="h6">Docentes por escuela</Typography>
        {values.length ? (
          <BarChart
            height={400}
            margin={{ left: 48, right: 24, top: 24, bottom: 125 }}
            xAxis={[
              {
                scaleType: "band",
                data: labels,
                tickLabelStyle: { angle: -42, textAnchor: "end", fontSize: 11 },
              },
            ]}
            series={[
              {
                label: "Docentes",
                data: values.map(([, n]) => Number(n)),
                color: "#1565c0",
              },
            ]}
            slotProps={{ legend: { hidden: true } }}
          />
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
  const values = entries(data);
  return <BarChart layout="horizontal" height={Math.max(300, values.length * 38)} margin={{ left: 165, right: 32, top: 24, bottom: 24 }} yAxis={[{ scaleType: "band", data: values.map(([key]) => key.replaceAll("_", " ")) }]} series={[{ label: "Registros", data: values.map(([, value]) => Number(value)), color: "#00897b" }]} />;
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
  const [periodData, setPeriodData] = useState([]);
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
    Promise.all([getDashboardStats(activeFilters), getDocentePeriodos()])
      .then(([data, periods]) => {
        setStats(data);
        setPeriodData(periods || []);
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
                  {[...new Set(periodData.map((p) => p[key]).filter(Boolean))]
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
