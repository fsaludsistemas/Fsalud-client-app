import { Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
} from "@mui/material";
import ExitToAppIcon from "@mui/icons-material/ExitToApp";
import logoUnivalle from "../assets/logounivalle.svg";

const Layout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        bgcolor: "#fafafa",
      }}
    >
      {/* Light grey header */}
      <AppBar
        position="static"
        sx={{ bgcolor: "#eceff1", color: "#37474f", boxShadow: 1 }}
      >
        <Toolbar sx={{ justifyContent: "space-between", position: "relative" }}>
          <img src={logoUnivalle} alt="Logo" align="start" />
          {/* Placeholder for centering balance */}
          <Box sx={{ display: { xs: "none", sm: "block" } }} />

          {/* Centered Title and User Info */}
          <Box sx={{ textAlign: "center", flexGrow: 1, py: 1 }}>
            <Typography
              variant="h5"
              component="h1"
              sx={{ fontWeight: "bold", letterSpacing: 0.5 }}
            >
              Facultad de salud
            </Typography>
            {user && (
              <Typography
                variant="body2"
                sx={{ color: "#546e7a", mt: 0.5, fontWeight: 500 }}
              >
                {user.displayName} - {user.permiso}
              </Typography>
            )}
          </Box>

          {/* Logout button */}
          <Button
            color="inherit"
            startIcon={<ExitToAppIcon />}
            onClick={handleLogout}
            sx={{
              textTransform: "none",
              color: "#37474f",
              fontWeight: 600,
              width: 120,
              "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
            }}
          >
            Salir
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main page content */}
      <Container component="main" sx={{ flexGrow: 1, py: 4 }}>
        <Outlet />
      </Container>
    </Box>
  );
};

export default Layout;
