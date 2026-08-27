import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Tabs,
  Tab,
  Typography,
  Paper,
  Stack,
  IconButton,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

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

const CredencialesProfesor = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  return (
    <Box>
      <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
        <IconButton onClick={() => navigate("/profesores")} color="primary">
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" sx={{ fontWeight: "bold", color: "#37474f" }}>
          Credenciales del Profesor
        </Typography>
      </Stack>

      <ProfesorTabs
        value={`/profesores/${id}/credenciales`}
        onChange={(_, next) => navigate(next)}
        profesorId={id}
      />

      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Typography variant="body1">Módulo en desarrollo</Typography>
      </Paper>
    </Box>
  );
};

export default CredencialesProfesor;
