import { useNavigate } from "react-router-dom";
import { Grid, Card, CardContent, CardActionArea, Typography, Box } from "@mui/material";
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
        <Grid item xs={12} sm={6}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: 3,
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: 6,
              },
            }}
          >
            <CardActionArea onClick={() => navigate("/dependencias")} sx={{ p: 4, height: "100%" }}>
              <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                <CorporateFareIcon sx={{ fontSize: 60, color: "#1976d2", mb: 2 }} />
                <CardContent sx={{ p: 0 }}>
                  <Typography variant="h5" component="div" sx={{ fontWeight: "bold", mb: 1, color: "#2c3e50" }}>
                    Dependencias
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Gestione la estructura jerárquica de escuelas, oficinas, departamentos y secciones.
                  </Typography>
                </CardContent>
              </Box>
            </CardActionArea>
          </Card>
        </Grid>

        {/* Profesores Card */}
        <Grid item xs={12} sm={6}>
          <Card
            sx={{
              borderRadius: 3,
              boxShadow: 3,
              transition: "transform 0.2s, box-shadow 0.2s",
              "&:hover": {
                transform: "translateY(-4px)",
                boxShadow: 6,
              },
            }}
          >
            <CardActionArea onClick={() => navigate("/profesores")} sx={{ p: 4, height: "100%" }}>
              <Box display="flex" flexDirection="column" alignItems="center" textAlign="center">
                <SchoolIcon sx={{ fontSize: 60, color: "#388e3c", mb: 2 }} />
                <CardContent sx={{ p: 0 }}>
                  <Typography variant="h5" component="div" sx={{ fontWeight: "bold", mb: 1, color: "#2c3e50" }}>
                    Profesores
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Administre la información del cuerpo docente, vinculaciones y adscripciones.
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
