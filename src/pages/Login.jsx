import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Navigate } from "react-router-dom";
import { Box, Card, CardContent, Typography, Button, Alert, CircularProgress } from "@mui/material";

// Custom Google SVG Icon
const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" style={{ marginRight: 8 }}>
    <path
      fill="#4285F4"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="#34A853"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="#FBBC05"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
    />
    <path
      fill="#EA4335"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
    />
  </svg>
);

const Login = () => {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // If already logged in, redirect to home
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleLogin = async () => {
    setError("");
    setSubmitting(true);
    try {
      await login();
      navigate("/");
    } catch (err) {
      setError(err.message || "Ocurrió un error al iniciar sesión.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #eceff1 0%, #cfd8dc 100%)",
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 400, width: "100%", boxShadow: 6, borderRadius: 3 }}>
        <CardContent sx={{ p: 4, textAlign: "center" }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: "bold", color: "#37474f" }}>
            Faculta de salud
          </Typography>
          <Typography variant="body1" sx={{ color: "#78909c", mb: 4 }}>
            Inicia sesión para acceder al sistema de gestión
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3, textAlign: "left" }}>
              {error}
            </Alert>
          )}

          <Button
            variant="outlined"
            size="large"
            fullWidth
            onClick={handleLogin}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={20} /> : <GoogleIcon />}
            sx={{
              py: 1.5,
              borderColor: "#cfd8dc",
              color: "#37474f",
              textTransform: "none",
              fontSize: "1rem",
              fontWeight: "bold",
              borderRadius: 2,
              boxShadow: "0px 1px 3px rgba(0,0,0,0.08)",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                borderColor: "#b0bec5",
                bgcolor: "#f5f7f8",
                boxShadow: "0px 2px 5px rgba(0,0,0,0.12)",
              },
            }}
          >
            {submitting ? "Cargando..." : "Iniciar sesión con Google"}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;
