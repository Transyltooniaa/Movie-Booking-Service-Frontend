import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import Divider from "@mui/material/Divider";
import Tooltip from "@mui/material/Tooltip";
import RefreshIcon from "@mui/icons-material/Refresh";
import NavBar from "./NavBar";
import { getToken } from "./auth";
import { motion, AnimatePresence } from "framer-motion";

// Lock TTL (same as backend)
const LOCK_TTL_SECONDS = 600;

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [now, setNow] = useState(Date.now());
  const [createdMap, setCreatedMap] = useState({});
  const [showInfoMap, setShowInfoMap] = useState({});
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);

  const navigate = useNavigate();

  // Restore saved timestamps for countdown
  useEffect(() => {
    try {
      const raw = localStorage.getItem("bms_bookingCreatedAtMap");
      if (raw) setCreatedMap(JSON.parse(raw));
    } catch (e) {
      console.warn("Could not read bookingCreatedAtMap", e);
    }
  }, []);

  const persistCreatedMap = (map) => {
    try {
      localStorage.setItem("bms_bookingCreatedAtMap", JSON.stringify(map));
    } catch {}
  };

  // Load bookings (WITH JWT)
  const loadBookings = useCallback(async () => {
    try {
      setError(null);
      const API = process.env.REACT_APP_API_URL;
      const token = getToken();

      const res = await fetch(`${API}/bookings/my`, {
        method: "GET",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        setError("Failed to load bookings");
        setLoading(false);
        return;
      }

      const data = await res.json();

      // Track countdown start time
      const updatedMap = { ...createdMap };
      const nowMs = Date.now();

      data.forEach((b) => {
        if (b.status === "PENDING_PAYMENT" && !updatedMap[b.id]) {
          updatedMap[b.id] = nowMs;
        }
      });

      setCreatedMap(updatedMap);
      persistCreatedMap(updatedMap);

      setBookings(data);
      setLoading(false);
      setLastRefreshedAt(Date.now());
    } catch (err) {
      console.error("ERROR FETCHING BOOKINGS", err);
      setError("Something went wrong while loading bookings.");
      setLoading(false);
    }
  }, [createdMap]);

  // Initial load
  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  // Tick every second for countdown text
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  // Load show info (WITH JWT)
  useEffect(() => {
    const uniqueShowIds = Array.from(new Set(bookings.map((b) => b.showId))).filter(
      (id) => id != null
    );

    uniqueShowIds.forEach((showId) => {
      if (showInfoMap[showId]) return;

      (async () => {
        try {
          const API = process.env.REACT_APP_API_URL;
          const token = getToken();

          const res = await fetch(`${API}/movies/shows/${showId}`, {
            headers: {
              Authorization: token,
              "Content-Type": "application/json",
            },
          });

          if (!res.ok) return;
          const ct = res.headers.get("content-type") || "";
          if (!ct.includes("application/json")) return;

          const show = await res.json();

          setShowInfoMap((prev) => ({
            ...prev,
            [showId]: show,
          }));
        } catch (e) {
          console.warn("Failed to load show info", showId, e);
        }
      })();
    });
  }, [bookings, showInfoMap]);

  const formatDateTime = (ts) => {
    if (!ts) return "";
    try {
      const d = new Date(ts);
      return (
        d.toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        }) +
        " • " +
        d
          .toLocaleTimeString(undefined, {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })
          .toLowerCase()
      );
    } catch {
      return ts;
    }
  };

  const secondsLeft = (bookingId) => {
    const createdAt = createdMap[bookingId];
    if (!createdAt) return null;
    const elapsed = Math.floor((now - createdAt) / 1000);
    const remain = LOCK_TTL_SECONDS - elapsed;
    return remain > 0 ? remain : 0;
  };

  const formatCountdown = (bookingId) => {
    const sec = secondsLeft(bookingId);
    if (sec == null) return null;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleCancel = async (bookingId) => {
    if (!window.confirm("Cancel this booking?")) return;

    try {
      const API = process.env.REACT_APP_API_URL;
      const token = getToken();

      const res = await fetch(`${API}/bookings/${bookingId}/cancel`, {
        method: "PUT",
        headers: {
          Authorization: token,
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        alert("Failed to cancel.");
        return;
      }

      await loadBookings();
    } catch (err) {
      console.error("Error cancelling booking", err);
    }
  };

  const buildSeatLabel = (seat) => {
    if (seat.label) return seat.label;
    if (seat.seatLabel) return seat.seatLabel;
    if (seat.rowLabel && seat.seatNumber != null)
      return `${seat.rowLabel}${seat.seatNumber}`;
    if (seat.seatNumber != null) return `Seat ${seat.seatNumber}`;
    return "Seat";
  };

  const goToPayment = (b) => {
    const showInfo = showInfoMap[b.showId] || {};
    const auditorium =
      showInfo.auditorium ||
      showInfo.auditoriumName ||
      showInfo.theatreName ||
      "";

    const labels = b.seats?.map((s) => buildSeatLabel(s)) || [];

    navigate(
      `/bookmyshow/payment/${encodeURIComponent(auditorium)}/${b.showId}/${encodeURIComponent(
        labels.join(",")
      )}/${encodeURIComponent(b.totalAmount)}`,
      { state: { labels, bookingId: b.id, booking: b } }
    );
  };

  const hasBookings = bookings.length > 0;

  return (
    <>
      <NavBar />

      <Box sx={{ backgroundColor: "#f5f5f5", minHeight: "100vh", p: 3 }}>
        <Box sx={{ maxWidth: 960, mx: "auto" }}>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 3,
            }}
          >
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              My Bookings
            </Typography>

            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={loadBookings}
              disabled={loading}
            >
              Refresh
            </Button>
          </Box>

          {/* Content */}
          {loading ? (
            <Box sx={{ textAlign: "center", mt: 6 }}>
              <CircularProgress />
              <Typography sx={{ mt: 2 }}>Loading your bookings…</Typography>
            </Box>
          ) : error ? (
            <Typography sx={{ textAlign: "center", color: "red" }}>
              {error}
            </Typography>
          ) : !hasBookings ? (
            <Box sx={{ textAlign: "center", mt: 6 }}>
              <Typography>You have no bookings yet.</Typography>
              <Button
                sx={{ mt: 2 }}
                variant="contained"
                onClick={() => navigate("/bookmyshow/movies")}
              >
                Browse Movies
              </Button>
            </Box>
          ) : (
            <AnimatePresence>
              <Stack spacing={2.5}>
                {bookings.map((b) => {
                  const countdown =
                    b.status === "PENDING_PAYMENT" ? formatCountdown(b.id) : null;

                  const showInfo = showInfoMap[b.showId] || {};
                  const movieTitle =
                    showInfo.movieTitle ||
                    showInfo.movieName ||
                    showInfo.title ||
                    "Movie";

                  const auditorium =
                    showInfo.auditorium || showInfo.auditoriumName || "";

                  const showTime = formatDateTime(showInfo.startTime);

                  return (
                    <motion.div
                      key={b.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                    >
                      <Paper sx={{ p: 2, borderRadius: 2 }}>
                        <Typography sx={{ fontSize: 13, opacity: 0.7 }}>
                          Booking #{b.id}
                        </Typography>

                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {movieTitle}
                        </Typography>

                        {showTime && <Typography>{showTime}</Typography>}
                        {auditorium && (
                          <Typography sx={{ mb: 1 }}>
                            Auditorium: <strong>{auditorium}</strong>
                          </Typography>
                        )}

                        {/* Status */}
                        <Chip
                          size="small"
                          color={
                            b.status === "CONFIRMED"
                              ? "success"
                              : b.status === "PENDING_PAYMENT"
                              ? "warning"
                              : "default"
                          }
                          label={b.status.replace("_", " ")}
                        />

                        {/* Countdown */}
                        {countdown && (
                          <Typography sx={{ mt: 1, color: "#f57c00" }}>
                            Time left: {countdown}
                          </Typography>
                        )}

                        {/* Seats */}
                        <Box sx={{ mt: 2 }}>
                          {b.seats?.map((s, idx) => (
                            <Chip
                              key={idx}
                              size="small"
                              label={`${buildSeatLabel(s)} • ₹${s.price}`}
                              sx={{ mr: 1, mb: 1 }}
                            />
                          ))}
                        </Box>

                        {/* Actions */}
                        <Box sx={{ display: "flex", gap: 1, mt: 2 }}>
                          {b.status === "PENDING_PAYMENT" &&
                            secondsLeft(b.id) > 0 && (
                              <Button
                                variant="contained"
                                onClick={() => goToPayment(b)}
                              >
                                Pay Now
                              </Button>
                            )}

                          <Button
                            variant="outlined"
                            onClick={() => navigate("/bookmyshow/movies")}
                          >
                            Book Again
                          </Button>

                          {(b.status === "CONFIRMED" ||
                            b.status === "PENDING_PAYMENT") && (
                            <Button
                              variant="contained"
                              color="error"
                              onClick={() => handleCancel(b.id)}
                            >
                              Cancel
                            </Button>
                          )}
                        </Box>
                      </Paper>
                    </motion.div>
                  );
                })}
              </Stack>
            </AnimatePresence>
          )}
        </Box>
      </Box>
    </>
  );
}
