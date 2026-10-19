import { Link, useLocation } from "react-router-dom";
import { Tab, Tabs } from "@mui/material";

const ProfesorTabs = ({ profesorId, isPresident = false }) => {
  const location = useLocation();

  const tabs = [
    !isPresident && {
      label: "Datos generales",
      to: `/profesores/${profesorId}/datos`,
    },
    !isPresident && {
      label: "Asignaciones",
      to: `/profesores/${profesorId}/asignaciones`,
    },
    {
      label: "Credenciales",
      to: `/profesores/${profesorId}/credenciales`,
    },
    {
      label: "Autoevaluación",
      to: `/profesores/${profesorId}/autoevaluacion`,
    },
    {
      label: "Evaluación",
      to: `/profesores/${profesorId}/evaluacion`,
    },
  ].filter(Boolean);

  return (
    <Tabs
      value={location.pathname}
      sx={{ mb: 3, borderBottom: 1, borderColor: "divider" }}
    >
      {tabs.map(({ label, to }) => (
        <Tab key={to} component={Link} to={to} label={label} value={to} />
      ))}
    </Tabs>
  );
};

export default ProfesorTabs;
