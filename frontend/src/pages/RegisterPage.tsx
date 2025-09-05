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
import { apiFetch } from "../utils/api";

const RegisterPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleRegister = async () => {
    setError("");
    if (!username || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch("/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      if (res.ok) {
        setError("");
        setSuccess("Registration successful! Redirecting to login...");
        setTimeout(() => {
          window.location.href = "/login";
        }, 1500);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message || "Registration failed.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  return (
    <Container maxWidth="xs">
      <Box mt={8}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>Register</Typography>
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
          <TextField
            label="Confirm Password"
            type="password"
            fullWidth
            margin="normal"
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
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
            onClick={handleRegister}
            disabled={loading}
          >
            {loading ? "Registering..." : "Register"}
          </Button>
          <Box mt={2} textAlign="center">
            <MuiLink component={Link} to="/second">
              Already have an account? Login
            </MuiLink>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default RegisterPage;
