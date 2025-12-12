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
import { motion, AnimatePresence } from "framer-motion";
import { getToken } from "./auth";

// Approximate lock TTL (same as backend BookingService.LOCK_TTL)
const LOCK_TTL_SECONDS = 600; // 10 minutes

// Seat layout assumptions (same as SeatLayout)
const SEATS_PER_ROW = 14;
const ROWS_COUNT = 12; // A-L

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // No network polling; manual refresh only
  const [now, setNow] = useState(Date.now());
  const [createdMap, setCreatedMap] = useState({});
  const [showInfoMap, setShowInfoMap] = useState({}); // showId -> show details (with movieTitle etc.)
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);

  const navigate = useNavigate();

  // Load locally stored created-at timestamps for countdowns
  useEffect(() => {
    try {
      // const raw = localStorage.getItem("bms_bookingCreatedAtMap");
      const raw = sessionStorage.getItem("bms_bookingCreatedAtMap");
      if (raw) {
        setCreatedMap(JSON.parse(raw));
      }
    } catch (e) {
      console.warn("Could not read bookingCreatedAtMap", e);
    }
  }, []);

  const persistCreatedMap = (map) => {
    try {
      // localStorage.setItem("bms_bookingCreatedAtMap", JSON.stringify(map));
      sessionStorage.setItem("bms_bookingCreatedAtMap", JSON.stringify(map));
    } catch (e) {
      console.warn("Could not persist bookingCreatedAtMap", e);
    }
  };

  const loadBookings = useCallback(async () => {
    try {
      setError(null);
      const API = process.env.REACT_APP_API_URL || "";
      const token = getToken()
      const res = await fetch(`${API}/bookings/my`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token, 
        },
      });

      if (!res.ok) {
        setError("Failed to load bookings");
        setLoading(false);
        return;
      }

      const data = await res.json();

      // Keep / assign local created timestamps for pending bookings so we can show a countdown
      const updatedMap = { ...createdMap };
      const nowMs = Date.now();
      data.forEach((b) => {
        if (b.status === "PENDING_PAYMENT" && !updatedMap[b.id]) {
          updatedMap[b.id] = nowMs;
        }
      });
      setCreatedMap(updatedMap);
      persistCreatedMap(updatedMap);

      // Sort by createdAt descending (latest first)
      const sorted = Array.isArray(data)
        ? [...data].sort((a, b) => {
            const tsA = Date.parse(a?.createdAt) || 0;
            const tsB = Date.parse(b?.createdAt) || 0;
            return tsB - tsA;
          })
        : [];

      setBookings(sorted);
      setLoading(false);
      setLastRefreshedAt(Date.now());
    } catch (err) {
      console.error("ERROR FETCHING BOOKINGS", err);
      setError("Something went wrong while loading your bookings.");
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadBookings();
  }, [loadBookings]);



  // Tick every second for countdown display
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch show/movie info for each unique showId so we can display movieTitle/auditorium instead of bare showId
  useEffect(() => {
    const uniqueShowIds = Array.from(new Set(bookings.map((b) => b.showId))).filter(
      (id) => id != null
    );

    uniqueShowIds.forEach((showId) => {
      if (showInfoMap[showId]) return; // already loaded

      (async () => {
        try {
          const API = process.env.REACT_APP_API_URL || "";
          const token = getToken()
          const res = await fetch(`${API}/movies/shows/${showId}`, {
            headers: {
              "Authorization": token, 
            }
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
          console.warn("Failed to load show info for showId", showId, e);
        }
      })();
    });
  }, [bookings, showInfoMap]);

  const formatDateTime = (ts) => {
    if (!ts) return "";
    try {
      const d = new Date(ts);
      const date = d.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const time = d
        .toLocaleTimeString(undefined, {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })
        .toLowerCase();
      return `${date} • ${time}`;
    } catch {
      return ts;
    }
  };

  const statusColor = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "success";
      case "PENDING_PAYMENT":
        return "warning";
      case "CANCELLED":
        return "default";
      case "EXPIRED":
        return "error";
      default:
        return "default";
    }
  };

  const statusLabel = (status) => {
    switch (status) {
      case "CONFIRMED":
        return "Confirmed";
      case "PENDING_PAYMENT":
        return "Pending Payment";
      case "CANCELLED":
        return "Cancelled";
      case "EXPIRED":
        return "Expired";
      default:
        return status;
    }
  };

  const secondsLeft = (bookingId) => {
    const createdAt = createdMap[bookingId];
    if (!createdAt) return null;
    const elapsedSec = Math.floor((now - createdAt) / 1000);
    const remaining = LOCK_TTL_SECONDS - elapsedSec;
    return remaining > 0 ? remaining : 0;
  };

  const formatCountdown = (bookingId) => {
    const sec = secondsLeft(bookingId);
    if (sec == null) return null;
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const handleCancel = async (bookingId) => {
    const confirm = window.confirm("Are you sure you want to cancel this booking?");
    if (!confirm) return;

    try {
      const API = process.env.REACT_APP_API_URL || "";
      const token = getToken()
      const res = await fetch(`${API}/bookings/${bookingId}/cancel`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token, 
        },
      });

      if (!res.ok) {
        alert("Failed to cancel booking. Please try again.");
        return;
      }

      await loadBookings();
    } catch (err) {
      console.error("Error cancelling booking", err);
      alert("Error cancelling booking.");
    }
  };

  const goToPayment = (b) => {
    const showInfo = showInfoMap[b.showId] || {};
    const auditorium =
      showInfo.auditorium || showInfo.auditoriumName || showInfo.theatre || showInfo.theatreName || '';
    const labels = Array.isArray(b.seats) ? b.seats.map((s) => buildSeatLabel(s)) : [];
    const selectedParam = encodeURIComponent(labels.join(','));
    const totalParam = encodeURIComponent(b.totalAmount ?? 0);

    navigate(
      `/bookmyshow/payment/${encodeURIComponent(auditorium)}/${encodeURIComponent(
        b.showId
      )}/${selectedParam}/${totalParam}`,
      { state: { labels, bookingId: b.id, booking: b } }
    );
  };

  const hasBookings = bookings && bookings.length > 0;

  // Derive a label for each seat: prefer label/row+number if backend provides; otherwise fallback to generic
  const buildSeatLabel = (seat) => {
    if (!seat) return "Seat";
    if (seat.label) return seat.label; // if backend ever sends label directly
    if (seat.seatLabel) return seat.seatLabel;

    // If backend later includes rowLabel and seatNumber
    if (seat.rowLabel && seat.seatNumber != null) {
      return `${seat.rowLabel}${seat.seatNumber}`;
    }

    // Fallback: just show seatNumber
    if (seat.seatNumber != null) {
      return `Seat ${seat.seatNumber}`;
    }

    return "Seat";
  };

  return (
    <>
      <NavBar />
      <Box
        sx={{
          backgroundColor: "#f5f5f5",
          minHeight: "100vh",
          padding: { xs: "18px", sm: "30px" },
        }}
      >
        <Box sx={{ maxWidth: 960, margin: "0 auto" }}>
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              {lastRefreshedAt && (
                <Typography sx={{ fontSize: 12, color: "#777" }}>
                  Last updated: {new Date(lastRefreshedAt).toLocaleTimeString()}
                </Typography>
              )}
              <Button
                size="small"
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={() => loadBookings()}
                disabled={loading}
                sx={{ borderColor: '#b0bec5', color: '#37474f' }}
              >
                Refresh
              </Button>
            </Box>
          </Box>

          {loading ? (
            <Box sx={{ textAlign: "center", mt: 6 }}>
              <CircularProgress />
              <Typography sx={{ mt: 2, color: "#666" }}>
                Loading your bookings…
              </Typography>
            </Box>
          ) : error ? (
            <Typography sx={{ textAlign: "center", color: "#c62828", mt: 5 }}>
              {error}
            </Typography>
          ) : !hasBookings ? (
            <Box sx={{ textAlign: "center", mt: 6 }}>
              <Typography sx={{ color: "#666", mb: 2 }}>
                You don't have any bookings yet.
              </Typography>
              <Button
                variant="contained"
                sx={{ backgroundColor: "#f84464" }}
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
                    b.status === "PENDING_PAYMENT"
                      ? formatCountdown(b.id)
                      : null;

                  const showInfo = showInfoMap[b.showId] || {};
                  const movieTitle =
                    showInfo.movieTitle ||
                    showInfo.movieName ||
                    showInfo.title ||
                    "Movie";
                  const showTime = formatDateTime(showInfo.startTime);
                  const auditorium = showInfo.auditorium || showInfo.auditoriumName;

                  return (
                    <motion.div
                      key={b.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Paper
                        sx={{
                          padding: 2.2,
                          borderRadius: 2,
                          boxShadow: 2,
                          backgroundColor: "#ffffff",
                          borderLeft: "4px solid",
                          borderColor:
                            b.status === "CONFIRMED"
                              ? "#2e7d32"
                              : b.status === "PENDING_PAYMENT"
                              ? "#f9a825"
                              : b.status === "EXPIRED"
                              ? "#c62828"
                              : "#b0bec5",
                        }}
                      >
                        <Box
                          sx={{
                            display: "flex",
                            flexDirection: { xs: "column", sm: "row" },
                            justifyContent: "space-between",
                            gap: 2,
                          }}
                        >
                          <Box sx={{ flex: 1 }}>
                            <Typography
                              variant="subtitle2"
                              sx={{
                                fontWeight: 600,
                                color: "#777",
                                letterSpacing: 0.5,
                                textTransform: "uppercase",
                                mb: 0.5,
                              }}
                            >
                              Booking #{b.id}
                            </Typography>

                            <Typography
                              variant="h6"
                              sx={{ fontWeight: 800, mb: 0.4 }}
                            >
                              {movieTitle}
                            </Typography>

                            {showTime && (
                              <Typography sx={{ fontSize: 13.5, color: "#555" }}>
                                {showTime}
                              </Typography>
                            )}
                            {auditorium && (
                              <Typography
                                sx={{ fontSize: 13.5, color: "#555", mb: 0.6 }}
                              >
                                Auditorium: <strong>{auditorium}</strong>
                              </Typography>
                            )}

                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                              sx={{ my: 1 }}
                            >
                              <Chip
                                size="small"
                                color={statusColor(b.status)}
                                label={statusLabel(b.status)}
                              />
                              {b.paymentId && (
                                <Typography
                                  sx={{ fontSize: 12, color: "#555" }}
                                >
                                  Payment ID: {b.paymentId}
                                </Typography>
                              )}
                            </Stack>

                            <Typography sx={{ fontSize: 14, mb: 0.4 }}>
                              <strong>Total:</strong> ₹{b.totalAmount}
                            </Typography>

                            {countdown && (
                              <Typography
                                sx={{
                                  mt: 0.5,
                                  fontSize: 13,
                                  color: "#f57c00",
                                  fontWeight: 500,
                                }}
                              >
                                Time left to complete payment: {countdown}
                              </Typography>
                            )}
                          </Box>

                          <Divider
                            orientation="vertical"
                            flexItem
                            sx={{
                              display: { xs: "none", sm: "block" },
                              mx: 2,
                            }}
                          />

                          <Box sx={{ flex: 1.1 }}>
                            <Typography
                              sx={{
                                fontSize: 13,
                                color: "#777",
                                mb: 0.5,
                                fontWeight: 500,
                              }}
                            >
                              Seats
                            </Typography>
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                              {b.seats?.length ? (
                                b.seats.map((s, idx) => (
                                  <Chip
                                    key={idx}
                                    size="small"
                                    label={`${buildSeatLabel(s)} • ₹${s.price}`}
                                    sx={{
                                      backgroundColor: "#f5f5f5",
                                      fontSize: 12,
                                    }}
                                  />
                                ))
                              ) : (
                                <Typography sx={{ fontSize: 13, color: "#888" }}>
                                  Seat details not available.
                                </Typography>
                              )}
                            </Box>

                            <Box
                              sx={{
                                display: "flex",
                                justifyContent: "flex-end",
                                mt: 2,
                                gap: 1,
                              }}
                            >
                              {b.status === "PENDING_PAYMENT" && secondsLeft(b.id) > 0 && (
                                <Tooltip title="Continue to payment">
                                  <Button
                                    size="small"
                                    variant="contained"
                                    sx={{
                                      backgroundColor: "#1976d2",
                                      ":hover": { backgroundColor: "#115293" },
                                    }}
                                    onClick={() => goToPayment(b)}
                                  >
                                    Pay Now
                                  </Button>
                                </Tooltip>
                              )}
                              <Button
                                size="small"
                                variant="outlined"
                                sx={{
                                  borderColor: "#b0bec5",
                                  color: "#37474f",
                                }}
                                onClick={() => navigate("/bookmyshow/movies")}
                              >
                                Book Again
                              </Button>

                              {(b.status === "CONFIRMED" ||
                                b.status === "PENDING_PAYMENT") && (
                                <Tooltip title="Cancel this booking">
                                  <Button
                                    size="small"
                                    variant="contained"
                                    sx={{
                                      backgroundColor: "#f84464",
                                      ":hover": { backgroundColor: "#d81b60" },
                                    }}
                                    onClick={() => handleCancel(b.id)}
                                  >
                                    Cancel
                                  </Button>
                                </Tooltip>
                              )}
                            </Box>
                          </Box>
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