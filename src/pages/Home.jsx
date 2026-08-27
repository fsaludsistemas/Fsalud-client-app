import { useNavigate } from "react-router-dom";
import {
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Typography,
  Box,
} from "@mui/material";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import SchoolIcon from "@mui/icons-material/School";

const Home = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", mt: 6, px: 2 }}>
      <Typography
        variant="h4"
        component="h2"
        align="center"
        gutterBottom
        sx={{ fontWeight: "bold", color: "#37474f", mb: 5 }}
      >
        Gestión de Facultad
      </Typography>

      <Grid container spacing={4} justifyContent="center">
        {/* Dependencias Card */}
        <Grid item xs={12} sm={6} sx={{ display: "flex" }}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: 3,
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: 6,
              },
              width: "100%",
              maxWidth: 550, // Mismo ancho máximo
              minWidth: 350, // Mismo ancho mínimo
              display: "flex",
              flexDirection: "column",
              mx: "auto", // Centra el card
            }}
          >
            <CardActionArea
              onClick={() => navigate("/dependencias")}
              sx={{
                p: 4,
                height: "100%",
                width: "100%",
              }}
            >
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                textAlign="center"
                sx={{ width: "100%" }}
              >
                <CorporateFareIcon
                  sx={{ fontSize: 60, color: "#1976d2", mb: 2 }}
                />
                <CardContent sx={{ p: 0, width: "100%" }}>
                  <Typography
                    variant="h5"
                    component="div"
                    sx={{ fontWeight: "bold", mb: 1, color: "#2c3e50" }}
                  >
                    Dependencias
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      wordWrap: "break-word", // Permite que el texto baje de línea
                      hyphens: "auto", // Guiones automáticos si es necesario
                    }}
                  >
                    Gestione la estructura jerárquica de escuelas, oficinas,
                    departamentos y secciones.
                  </Typography>
                </CardContent>
              </Box>
            </CardActionArea>
          </Card>
        </Grid>

        {/* Profesores Card */}
        <Grid item xs={12} sm={6} sx={{ display: "flex" }}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: 3,
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: 6,
              },
              width: "100%",
              maxWidth: 550, // Mismo ancho máximo
              minWidth: 350, // Mismo ancho mínimo
              display: "flex",
              flexDirection: "column",
              mx: "auto", // Centra el card
            }}
          >
            <CardActionArea
              onClick={() => navigate("/profesores")}
              sx={{
                p: 4,
                height: "100%",
                width: "100%",
              }}
            >
              <Box
                display="flex"
                flexDirection="column"
                alignItems="center"
                textAlign="center"
                sx={{ width: "100%" }}
              >
                <SchoolIcon sx={{ fontSize: 60, color: "#388e3c", mb: 2 }} />
                <CardContent sx={{ p: 0, width: "100%" }}>
                  <Typography
                    variant="h5"
                    component="div"
                    sx={{ fontWeight: "bold", mb: 1, color: "#2c3e50" }}
                  >
                    Profesores
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      wordWrap: "break-word", // Permite que el texto baje de línea
                      hyphens: "auto", // Guiones automáticos si es necesario
                    }}
                  >
                    Administre la información del cuerpo docente, credenciales,
                    asignaciones y evaluaciones.
                  </Typography>
                </CardContent>
              </Box>
            </CardActionArea>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Home;
