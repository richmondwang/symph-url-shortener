import React from "react";
import { Outlet, useNavigate } from "react-router";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { deleteCookie } from "../utils/auth";

const BasePage = () => {
  const navigate = useNavigate();
  const handleLogout = () => {
    deleteCookie("jwt_token");
    navigate("/login");
  };

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" className="flex-grow">
            URL Shortener
          </Typography>
          <Button color="inherit" component={RouterLink} to="/shortener">
            Shorten a URL
          </Button>
          <Button color="inherit" component={RouterLink} to="/slugs">
            Slugs
          </Button>
          <Button color="inherit" variant="outlined" onClick={handleLogout} className="ml-2">
            Logout
          </Button>
        </Toolbar>
      </AppBar>
      <Box mt={4}>
        <Outlet />
      </Box>
    </Box>
  );
};

export default BasePage;
