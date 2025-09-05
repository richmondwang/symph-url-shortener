import React, { useState } from "react";
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  IconButton,
  Tooltip,
  Grid,
  Link,
} from "@mui/material";
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import DeleteIcon from '@mui/icons-material/Delete';
import dayjs from 'dayjs';
import { apiFetch } from "../utils/api";
import { useNavigate } from "react-router";

import { getCookie, isJwtValid } from "../utils/auth";

const ShortenerPage = () => {
  const navigate = useNavigate();
  React.useEffect(() => {
    const token = getCookie("jwt_token");
    if (!token || !isJwtValid(token)) {
      navigate("/login");
    }
  }, [navigate]);
  const [url, setUrl] = useState("");
  const [expiration, setExpiration] = useState("");
  const [utmParams, setUtmParams] = useState([
    { key: "utm_source", value: "" },
    { key: "utm_medium", value: "" },
    { key: "utm_campaign", value: "" },
  ]);
  const [slug, setSlug] = useState("");
  const [shortenedUrl, setShortenedUrl] = useState("");
  const [showForm, setShowForm] = useState(true);
  const [copied, setCopied] = useState(false);
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [urlError, setUrlError] = useState("");
  const [slugError, setSlugError] = useState("");
  const [trackClicks, setTrackClicks] = useState(false);

  const resetForm = () => {
    setShowForm(true);
    setShortenedUrl("");
    setSuccess("");
    setUrl("");
    setExpiration("");
    setUtmParams([
      { key: "utm_source", value: "" },
      { key: "utm_medium", value: "" },
      { key: "utm_campaign", value: "" },
    ]);
    setSlug("");
    setTrackClicks(false);
    setUrlError("");
    setSlugError("");
    setError("");
  };

  const handleUtmChange = (idx: number, field: "key" | "value", value: string) => {
    setUtmParams((prev: { key: string; value: string }[]) => {
      const copy = [...prev];
      copy[idx][field] = value;
      return copy;
    });
  } 

  const handleAddUtm = () => {
    setUtmParams([...utmParams, { key: "", value: "" }]);
  };

  const handleRemoveUtm = (idx: number) => {
    setUtmParams(utmParams.filter((_param: { key: string; value: string }, i: number) => i !== idx));
  };

  const buildFinalUrl = () => {
    let finalUrl = url;
    const params = utmParams.filter((p: { key: string; value: string }) => p.key && p.value);
    if (params.length) {
      const urlObj = new URL(url);
      params.forEach(({ key, value }: { key: string; value: string }) => {
        urlObj.searchParams.set(key, value);
      });
      finalUrl = urlObj.toString();
    }
    return finalUrl;
  };

  // Validation handlers
  const validateUrl = (value: string) => {
    if (!value) return "Please enter a valid URL.";
    try {
      new URL(value);
      return "";
    } catch {
      return "Destination URL must be a valid URL (e.g. https://example.com)";
    }
  };
  const validateSlug = (value: string) => {
    if (!value) return "";
    if (!/^[a-zA-Z0-9-_]+$/.test(value)) return "Slug can only contain letters, numbers, hyphens, and underscores.";
    if (value.length < 8 || value.length > 16) return "Custom slug must be between 8 and 16 characters.";
    return "";
  };

  const handleUrlBlur = () => {
    setUrlError(validateUrl(url));
  };
  const handleSlugBlur = async () => {
    const err = validateSlug(slug);
    setSlugError(err);
    if (!err && slug) {
      try {
        const token = getCookie("jwt_token");
        const res = await apiFetch("/checkSlug", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { "Authorization": `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ slug }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setSlugError(data.error || data.message || "Failed to check slug availability.");
        } else if (!data.available) {
          setSlugError("Slug is already taken");
        }
      } catch {
        setSlugError("Failed to check slug availability.");
      }
    }
  };

  const handleShorten = async () => {
    setError("");
    setShortenedUrl("");
    setSuccess("");
    setUrlError("");
    setSlugError("");
    // Validate Destination URL
    const urlErr = validateUrl(url);
    if (urlErr) {
      setUrlError(urlErr);
      return;
    }
    // Validate slug
    const slugErr = validateSlug(slug);
    if (slugErr) {
      setSlugError(slugErr);
      return;
    }
    // Block if slugError is set and slug is not empty
    if (slug && slugError) {
      return;
    }
    setLoading(true);
    try {
      const payload = {
        url: buildFinalUrl(),
        expiration: expiration ? dayjs(expiration).toISOString() : undefined,
        utms: Object.fromEntries(utmParams.map(({ key, value }) => [key, value])),
        slug: slug || undefined,
        trackClicks,
      };
      const token = getCookie("jwt_token");
      const res = await apiFetch("/shorten", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setShortenedUrl(data.shortLink);
        setSuccess("URL shortened successfully!");
        setShowForm(false);
      } else {
        // Prefer backend error message if present
        setError(data.error || data.message || "Failed to shorten URL.");
      }
    } catch (e) {
      setError("Failed to shorten URL.");
    }
    setLoading(false);
  };

  return (
    <Container maxWidth="sm">
      <Box mt={6}>
  <Paper elevation={3} className="p-4">
          {!showForm && shortenedUrl && (
            <Box mb={3} display="flex" alignItems="center" justifyContent="space-between">
              <Box flexGrow={1}>
                <Typography variant="subtitle1">Shortened URL:</Typography>
                  <Link href={shortenedUrl} underline="hover">{shortenedUrl}</Link>
                  <Tooltip title={copied ? "Copied!" : "Copy URL"}>
                    <IconButton
                      aria-label="copy"
                      onClick={() => {
                        navigator.clipboard.writeText(shortenedUrl);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 1500);
                      }}
                      className={copied ? "success-text ml-2" : "ml-2"}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" height="24" viewBox="0 0 24 24" width="24"><path d="M0 0h24v24H0V0z" fill="none"/><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/></svg>
                    </IconButton>
                  </Tooltip>
              </Box>
            </Box>
          )}
          {!showForm && shortenedUrl && (
            <Button variant="outlined" fullWidth className="mt-2" onClick={resetForm}>
              Create another one
            </Button>
          )}
          {showForm && (
            <>
              <Box mb={2}>
                <TextField
                  label="Destination URL"
                  fullWidth
                  value={url}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setUrl(e.target.value)}
                  onBlur={handleUrlBlur}
                  required
                  placeholder="https://example.com"
                  margin="normal"
                  error={!!urlError}
                  className={urlError ? "input-error" : ""}
                />
                {urlError && (
                  <Typography variant="body2" className="error-text mt-2">{urlError}</Typography>
                )}
                <Tooltip title="Track the number of times this short URL is used">
                  <Box display="flex" alignItems="center" mb={2}>
                    <input
                      type="checkbox"
                      id="trackClicks"
                      checked={trackClicks}
                      onChange={e => setTrackClicks(e.target.checked)}
                      style={{ marginRight: 8 }}
                    />
                    <label htmlFor="trackClicks" style={{ cursor: 'pointer' }}>
                      Track Clicks (for analytics; may slightly slow down redirection)
                    </label>
                  </Box>
                </Tooltip>
                <TextField
                  label="Custom Slug (optional)"
                  fullWidth
                  value={slug}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSlug(e.target.value)}
                  onBlur={handleSlugBlur}
                  margin="normal"
                  placeholder="e.g. my-custom-link"
                  error={!!slugError}
                  helperText={slugError ? slugError : "Customize your short URL (letters, numbers, hyphens, underscores)"}
                  className={slugError ? "input-error" : ""}
                />
                <TextField
                  label="Expiration (optional)"
                  type="datetime-local"
                  fullWidth
                  value={expiration}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExpiration(e.target.value)}
                  margin="normal"
                  InputLabelProps={{ shrink: true }}
                />
              </Box>
              <Box mb={2}>
                <Typography variant="subtitle1">UTM Parameters (optional)</Typography>
                {utmParams.map((param: { key: string; value: string }, idx: number) => (
                  <Grid container spacing={1} alignItems="center" key={idx}>
                    <Grid size={5}>
                      <TextField
                        value={param.key}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUtmChange(idx, "key", e.target.value)}
                        size="small"
                        placeholder="Parameter"
                        variant="standard"
                        fullWidth
                      />
                    </Grid>
                    <Grid size={5}>
                      <TextField
                        value={param.value}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUtmChange(idx, "value", e.target.value)}
                        size="small"
                        placeholder="Value"
                        variant="standard"
                        fullWidth
                      />
                    </Grid>
                    <Grid size={2}>
                      <Tooltip title="Remove">
                        <IconButton onClick={() => handleRemoveUtm(idx)} size="small" color="error">
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </Grid>
                  </Grid>
                ))}
                <Button
                  startIcon={<AddCircleOutlineIcon />}
                  onClick={handleAddUtm}
                  className="mt-1"
                  variant="outlined"
                >
                  Add UTM Parameter
                </Button>
              </Box>
              {error && (
                <Typography variant="body2" className="error-text mb-2">{error}</Typography>
              )}
              {success && (
                <Typography variant="body2" className="success-text mb-2">{success}</Typography>
              )}
              <Button
                variant="contained"
                color="primary"
                onClick={handleShorten}
                disabled={!!loading || (!!slug && !!slugError)}
                fullWidth
                className="mb-2"
              >
                {loading ? "Shortening..." : "Shorten URL"}
              </Button>
            </>
          )}
        </Paper>
      </Box>
    </Container>
  );
};

export default ShortenerPage;
