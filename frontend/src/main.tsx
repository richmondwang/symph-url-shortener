import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import { BrowserRouter, Route, Routes, Navigate } from "react-router";
import ShortenerPage from "./pages/Shortener";
import LoginPage from "./pages/Login";
import RegisterPage from "./pages/RegisterPage";
import SlugsPage from "./pages/SlugsPage";
import BasePage from "./pages/BasePage";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route element={<BasePage />}>
          <Route path="/shortener" element={<ShortenerPage />} />
          <Route path="/slugs" element={<SlugsPage />} />
        </Route>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
);
