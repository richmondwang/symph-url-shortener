import { useEffect, useState } from "react";
import {
  Container,
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Collapse,
  CircularProgress,
  Button,
  Link as MuiLink,
  IconButton,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import OpenInNewIcon from "@mui/icons-material/OpenInNew";
import { apiFetch } from "../utils/api";
import { getCookie, isJwtValid } from "../utils/auth";
import { useNavigate } from "react-router";



const SlugsPage = () => {
  const [openDetails, setOpenDetails] = useState<{ [slug: string]: boolean }>({});
  const handleToggleDetails = (slug: string) => {
    setOpenDetails(prev => ({ ...prev, [slug]: !prev[slug] }));
  };
  const [slugs, setSlugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [size] = useState(20);
  const [includeExpired, setIncludeExpired] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = getCookie("jwt_token");
    if (!token || !isJwtValid(token)) {
      navigate("/login");
      return;
    }
    const fetchSlugs = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await apiFetch(`/slugs?page=${page}&size=${size}&includeExpired=${includeExpired}`, {
          headers: {
            "Authorization": `Bearer ${token}`,
          },
        });
        if (res.ok) {
          const data = await res.json();
          setSlugs(data.slugs || []);
        } else {
          setError("Failed to fetch slugs.");
        }
      } catch {
        setError("Network error.");
      }
      setLoading(false);
    };
    fetchSlugs();
    }, [navigate, page, size, includeExpired]);

  const handlePrev = () => {
    if (page > 1) setPage(page - 1);
  };
  const handleNext = () => {
    if (slugs.length === size) setPage(page + 1);
  };

  return (
    <Container maxWidth="md">
      <Box mt={6}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom>My Shortened URLs</Typography>
          <Box mb={2} display="flex" justifyContent="space-between" alignItems="center">
              <FormControlLabel
                control={
                  <Checkbox
                    checked={includeExpired}
                    onChange={(_, checked) => setIncludeExpired(checked)}
                    color="primary"
                  />
                }
                label="Include expired links"
              />
          </Box>
          {loading ? (
            <Box display="flex" justifyContent="center" mt={2}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Typography color="error" mt={2}>{error}</Typography>
          ) : slugs.length === 0 ? (
            <Typography mt={2}>No shortened URLs found.</Typography>
          ) : (
            <List>
              {slugs.map((slug: any) => {
                const now = Date.now();
                const expireAt = slug.expiration ? new Date(slug.expiration).getTime() : null;
                const isExpired = expireAt !== null && expireAt < now;
                // Extract base URL/domain from destination
                let baseDomain = slug.destination;
                try {
                  const urlObj = new URL(slug.destination);
                  baseDomain = urlObj.hostname;
                } catch {}
                return (
                  <ListItem key={slug.slug} alignItems="flex-start" sx={{ flexDirection: 'column', alignItems: 'stretch' }}>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
                      <Box>
                        <Typography variant="subtitle1" className={isExpired ? "error-text" : ""}>
                          {slug.shortLink}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Destination: {baseDomain}
                        </Typography>
                        <Typography variant="body2" className={isExpired ? "error-text" : "text-secondary"}>
                          Expires: {slug.expiration ? new Date(slug.expiration).toLocaleString() : "Never"}
                          {isExpired ? " (Expired)" : ""}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Clicks: {slug.trackClicks !== true ? "Not Tracked" : (slug.redirectCount ?? 0)}
                        </Typography>
                      </Box>
                      <Box>
                        <IconButton
                          href={slug.shortLink}
                          target="_blank"
                          rel="noopener"
                          aria-label="Open in new tab"
                          sx={{ ml: 2 }}
                        >
                          <OpenInNewIcon />
                        </IconButton>
                        <IconButton
                          aria-label="Show details"
                          onClick={() => handleToggleDetails(slug.slug)}
                        >
                          {openDetails[slug.slug] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      </Box>
                    </Box>
                    <Collapse in={!!openDetails[slug.slug]} timeout="auto" unmountOnExit>
                      <Box mt={1} ml={2} sx={{ maxHeight: 120, overflowY: 'auto', overflowX: 'auto', pr: 1 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                          Full Destination: {slug.destination}
                        </Typography>
                        {slug.utms && Object.keys(slug.utms).length > 0 && (
                          <Typography variant="body2" color="text.secondary">
                            UTM Params: {Object.entries(slug.utms).map(([k, v]) => `${k}: ${v}`).join(", ")}
                          </Typography>
                        )}
                      </Box>
                    </Collapse>
                  </ListItem>
                );
              })}
            </List>
          )}
          <Box display="flex" justifyContent="space-between" mt={2}>
            <Button onClick={handlePrev} disabled={page === 1}>Previous</Button>
            <Typography variant="body2">Page {page}</Typography>
            <Button onClick={handleNext} disabled={slugs.length < size}>Next</Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default SlugsPage;
