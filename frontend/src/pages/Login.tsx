import React, { useState } from "react";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Link as MuiLink
} from "@mui/material";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router";
import { setCookie, getCookie, isJwtValid } from "../utils/auth";
import { apiFetch } from "../utils/api";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  React.useEffect(() => {
    const token = getCookie("jwt_token");
    if (token && isJwtValid(token)) {
      navigate("/shortener");
    }
  }, [navigate]);

  const handleLogin = async () => {
    setError("");
    if (!username || !password) {
      setError("Please enter both username and password.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        const data = await res.json();
        setCookie("jwt_token", data.token, 1);
        setSuccess("Login successful! Redirecting to shortener...");
        setTimeout(() => {
          navigate("/shortener");
        }, 1500);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Login failed.");
        setLoading(false);
      }
    } catch (err) {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="xs">
      <Box mt={8}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <form
            onSubmit={e => {
              e.preventDefault();
              handleLogin();
            }}
            autoComplete="off"
          >
            <Typography variant="h5" gutterBottom>Login</Typography>
            <TextField
              label="Username"
              fullWidth
              margin="normal"
              value={username}
              onChange={e => setUsername(e.target.value)}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            {error && (
              <Typography variant="body2" className="error-text mt-2">{error}</Typography>
            )}
            {success && (
              <Typography variant="body2" className="success-text mt-2">{success}</Typography>
            )}
            <Button
              variant="contained"
              color="primary"
              fullWidth
              sx={{ mt: 2 }}
              onClick={handleLogin}
              disabled={loading}
              type="submit"
            >
              {loading ? "Logging in..." : "Login"}
            </Button>
            <Box mt={2} textAlign="center">
              <MuiLink component={Link} to="/register">
                Don't have an account? Register
              </MuiLink>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default LoginPage;
