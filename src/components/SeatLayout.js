import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import NavBar from './NavBar';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import CircularProgress from '@mui/material/CircularProgress';
import EventSeatIcon from '@mui/icons-material/EventSeat';
import LocalActivityIcon from '@mui/icons-material/LocalActivity';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TheatersIcon from '@mui/icons-material/Theaters';
import { getToken } from './auth';

function SeatLayout() {
  const { id, showId } = useParams();
  const [movie, setMovie] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [priceRegular, setPriceRegular] = useState(null);
  const [pricePremium, setPricePremium] = useState(null);
  const [show, setShow] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [bookedSeatIds, setBookedSeatIds] = useState([]);
  const [lockedSeatIds, setLockedSeatIds] = useState([]);
  const [pendingBooking, setPendingBooking] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (!showId) return;
    let mounted = true;

    setSelectedSeats([]);
    setInitialLoading(true);

    const loadInitialData = async () => {
      try {
        const results = {};

        // 1) Show
        const API = process.env.REACT_APP_API_URL || '';
        const token = getToken();
        const showRes = await fetch(`${API}/movies/shows/${showId}`, {
          headers: {
            Authorization: token
          }
        });
        if (showRes && showRes.ok) {
          const ct = showRes.headers.get('content-type') || '';
          if (ct.includes('application/json')) results.show = await showRes.json();
        }

        if (!mounted) return;

        if (results.show) {
          setShow(results.show);
          const s = results.show;
          setPriceRegular(s.priceRegular ?? s.price_regular ?? s.price ?? null);
          setPricePremium(s.pricePremium ?? s.price_premium ?? s.pricepremium ?? null);
        }

        // 2) Movie
        const movieIdToFetch =
          id ?? results.show?.movieId ?? results.show?.movie_id ?? null;
        if (movieIdToFetch) {
          const movieRes = await fetch(`${API}/movies/${movieIdToFetch}`, {
            headers: {
              Authorization: token
            }
          });
          if (movieRes && movieRes.ok) {
            const ct2 = movieRes.headers.get('content-type') || '';
            if (ct2.includes('application/json')) results.movie = await movieRes.json();
          }
        }

        if (!mounted) return;

        if (results.movie) setMovie(results.movie);

        // 3) Seat status
        try {
          const statusRes = await fetch(`${API}/bookings/show/${showId}/seats/status`, {
            headers: {
              Authorization: token
            }
          });
          if (statusRes && statusRes.ok) {
            const ct3 = statusRes.headers.get('content-type') || '';
            if (ct3.includes('application/json')) {
              const status = await statusRes.json();
              if (!mounted) return;
              setBookedSeatIds((status.bookedSeatIds || []).map(Number));
              setLockedSeatIds((status.lockedSeatIds || []).map(Number));
            }
          }
        } catch (e) {
          console.warn('Could not load seat status', e);
        }

        // 4) Check pending booking
        try {
          const myRes = await fetch(`${API}/bookings/my`, {
            method: 'GET',
            headers: { 
              'Content-Type': 'application/json',
              Authorization: token
            }
          });
          if (myRes && myRes.ok) {
            const myBookings = await myRes.json();
            if (!mounted) return;
            const pb = myBookings.find(
              (b) =>
                String(b.showId) === String(showId) &&
                b.status === 'PENDING_PAYMENT'
            );
            setPendingBooking(pb || null);
          }
        } catch (e) {
          console.warn('Could not load my bookings to check pending one', e);
        }

        console.log('SeatLayout initial load:', results);
      } catch (err) {
        console.warn('Could not load initial data for seat layout', err);
      } finally {
        if (mounted) setInitialLoading(false);
      }
    };

    loadInitialData();
    return () => (mounted = false);
  }, [showId, id]);

  const rowsCount = 12;
  const seatsPerRow = 14;
  const maxRows = Math.min(rowsCount, 26);
  const rows = Array.from({ length: maxRows }, (_, i) =>
    String.fromCharCode(65 + i)
  );

  const premiumCount = Math.min(4, maxRows);

  const isSeatUnavailable = (seatId) =>
    bookedSeatIds.includes(seatId) || lockedSeatIds.includes(seatId);

  const toggleSeat = (r, seatNum, rIdx, sIdx) => {
    const seatId = rIdx * seatsPerRow + (seatNum - 1) + 1;
    if (isSeatUnavailable(seatId)) return;

    const key = `${r}-${seatNum}`;
    setSelectedSeats((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    );
  };

  const totalPrice = selectedSeats.reduce((acc, key) => {
    const r = key.split('-')[0];
    const rIdx = rows.indexOf(r);
    const isPremiumRow = rIdx >= maxRows - premiumCount;
    const seatPrice = Number(isPremiumRow ? (pricePremium ?? 0) : (priceRegular ?? 0));
    return acc + seatPrice;
  }, 0);

  const openConfirm = () => setConfirmOpen(true);
  const closeConfirm = () => setConfirmOpen(false);

  const computeSeatIds = () => {
    return selectedSeats.map((key) => {
      const [r, s] = key.split('-');
      const rIdx = rows.indexOf(r);
      const seatNum = Number(s);
      const seatId = rIdx * seatsPerRow + (seatNum - 1) + 1;
      return seatId;
    });
  };

  const selectedSeatLabels = selectedSeats
    .slice()
    .sort((a, b) => a.localeCompare(b));

  const proceedToPayment = async () => {
    if (pendingBooking) {
      alert(
        'You already have a pending booking for this show. Please complete or cancel it from MyBookings.'
      );
      return;
    }

    try {
      setBookingLoading(true);

      const seatsPayload = selectedSeats.map((key) => {
        const [rowLabel, seatNumStr] = key.split('-');
        const seatNumber = Number(seatNumStr);
        const rIdx = rows.indexOf(rowLabel);
        const isPremiumRow = rIdx >= maxRows - premiumCount;
        const seatId = rIdx * seatsPerRow + (seatNumber - 1) + 1;
        const seatType = isPremiumRow ? 'PREMIUM' : 'REGULAR';
        const price = Number(
          isPremiumRow ? (pricePremium ?? 0) : (priceRegular ?? 0)
        );

        return {
          seatId,
          rowLabel,
          seatNumber,
          seatType,
          price
        };
      });

      const payload = {
        showId: Number(showId),
        totalAmount: totalPrice,
        seats: seatsPayload
      };
      const API = process.env.REACT_APP_API_URL || '';
      const token = getToken();
      const res = await fetch(`${API}/bookings/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        console.error('Booking creation failed', res.status);
        alert('Could not create booking. Please try again.');
        setBookingLoading(false);
        return;
      }

      const booking = await res.json();
      setBookingLoading(false);

      const auditorium =
        show?.auditorium ??
        show?.auditoriumName ??
        show?.theater ??
        show?.theatre ??
        show?.theatreId ??
        show?.theaterId ??
        '';

      const selectedParam = encodeURIComponent(computeSeatIds().join(','));
      const totalParam = totalPrice;

      navigate(
        `/bookmyshow/payment/${encodeURIComponent(
          auditorium
        )}/${encodeURIComponent(showId)}/${selectedParam}/${encodeURIComponent(
          totalParam
        )}`,
        {
          state: {
            labels: selectedSeatLabels,
            bookingId: booking.id,
            booking
          }
        }
      );
    } catch (err) {
      console.error('Error creating booking', err);
      alert('Error creating booking. Please try again.');
      setBookingLoading(false);
    }
  };

  const movieTitle = movie?.title ?? movie?.name ?? '';
  const movieGenre = movie?.genre ?? movie?.type ?? '';
  const movieDuration = movie?.duration ?? '';
  const showStart = show?.startTime ?? show?.start ?? null;
  const showEnd = show?.endTime ?? show?.end ?? null;
  const auditoriumName =
    show?.auditorium ??
    show?.auditoriumName ??
    show?.theatre ??
    show?.theatreName ??
    '';

  if (initialLoading) {
    return (
      <>
        <NavBar />
        <Box sx={{
          minHeight: '80vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
        }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} thickness={4} sx={{ color: '#ff3a44', mb: 2 }} />
            <Typography variant="h6" sx={{ color: '#555', fontWeight: 600 }}>
              Loading seat layout...
            </Typography>
          </Box>
        </Box>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <Box sx={{
        background: 'linear-gradient(180deg, #f8f9fa 0%, #e9ecef 100%)',
        minHeight: '100vh',
        pb: 6
      }}>
        {/* Movie Header Banner */}
        <Box sx={{
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
          color: 'white',
          py: 3,
          mb: 4,
          boxShadow: '0 4px 20px rgba(0,0,0,0.15)'
        }}>
          <Box sx={{
            width: { xs: '94%', md: '90%' },
            maxWidth: 1400,
            margin: '0 auto'
          }}>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5 }}>
              {movieTitle || 'Select Your Seats'}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              {movieGenre && (
                <Chip 
                  label={movieGenre} 
                  size="small"
                  sx={{
                    background: 'rgba(255,255,255,0.15)',
                    color: 'white',
                    fontWeight: 600
                  }}
                />
              )}
              {movieDuration && (
                <Chip 
                  label={movieDuration} 
                  size="small"
                  sx={{
                    background: 'rgba(255,255,255,0.15)',
                    color: 'white',
                    fontWeight: 600
                  }}
                />
              )}
              {auditoriumName && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TheatersIcon sx={{ fontSize: 18 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {auditoriumName}
                  </Typography>
                </Box>
              )}
              {showStart && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <AccessTimeIcon sx={{ fontSize: 18 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {new Date(showStart).toLocaleString('en-US', { 
                      month: 'short', 
                      day: 'numeric', 
                      hour: 'numeric', 
                      minute: '2-digit' 
                    })}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
        </Box>

        <Box sx={{
          width: { xs: '94%', md: '90%' },
          maxWidth: 1400,
          margin: '0 auto',
          display: 'flex',
          flexDirection: { xs: 'column', lg: 'row' },
          gap: 4,
          alignItems: 'flex-start'
        }}>
          {/* Main Seat Selection Area */}
          <Box sx={{ flex: 1, width: '100%' }}>
            {/* Pending Booking Alert */}
            {pendingBooking && (
              <Alert 
                severity="warning" 
                sx={{ 
                  mb: 3,
                  borderRadius: 2,
                  boxShadow: '0 4px 12px rgba(255,193,7,0.2)'
                }}
              >
                <AlertTitle sx={{ fontWeight: 700 }}>Pending Booking Exists</AlertTitle>
                You already have a pending booking for this show (Booking #{pendingBooking.id}). 
                Please complete payment or cancel it from MyBookings.
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => navigate('/users/bookings')}
                  sx={{ 
                    mt: 1,
                    borderColor: '#ff6f00',
                    color: '#ff6f00',
                    fontWeight: 700
                  }}
                >
                  Go to MyBookings
                </Button>
              </Alert>
            )}

            <Paper sx={{
              p: 4,
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
              background: '#fff'
            }}>
              {/* Screen */}
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Box
                  className="screen-bar"
                  sx={{
                    width: '70%',
                    maxWidth: 700,
                    margin: '0 auto',
                    py: 2,
                    borderRadius: 3,
                    background: 'linear-gradient(180deg, #e1e8f0, #c5d4e8)',
                    boxShadow: '0 8px 24px rgba(3,22,61,0.12)',
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: -8,
                      left: '10%',
                      right: '10%',
                      height: 4,
                      background: 'linear-gradient(90deg, transparent, rgba(99,102,241,0.3), transparent)',
                      borderRadius: 2
                    }
                  }}
                >
                  <Typography sx={{ fontWeight: 700, fontSize: 18, color: '#1a1a2e' }}>
                    🎬 SCREEN
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: '#999', mt: 2, display: 'block' }}>
                  All eyes this way please
                </Typography>
              </Box>

              {/* Seat Grid */}
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'center',
                mt: 4,
                overflowX: 'auto',
                pb: 2
              }}>
                <Box sx={{ display: 'grid', gap: 1.5 }}>
                  {rows.map((r, rIdx) => {
                    const isPremiumRow = rIdx >= maxRows - premiumCount;
                    return (
                      <Box
                        key={r}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          mt: isPremiumRow && rIdx === maxRows - premiumCount ? 3 : 0,
                          position: 'relative',
                          '&::before': isPremiumRow && rIdx === maxRows - premiumCount ? {
                            content: '"PREMIUM SECTION"',
                            position: 'absolute',
                            top: -24,
                            left: 50,
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#764ba2',
                            letterSpacing: 1
                          } : {}
                        }}
                      >
                        {/* Row Label */}
                        <Box
                          sx={{
                            width: 40,
                            height: 36,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 700,
                            fontSize: 16,
                            color: isPremiumRow ? '#764ba2' : '#1a1a2e',
                            background: isPremiumRow ? 'rgba(118,75,162,0.1)' : 'rgba(0,0,0,0.04)',
                            borderRadius: 2
                          }}
                        >
                          {r}
                        </Box>

                        {/* Seats */}
                        <Box sx={{ display: 'flex', gap: 1.25, flexWrap: 'wrap' }}>
                          {Array.from({ length: seatsPerRow }).map((_, sIdx) => {
                            const seatNum = sIdx + 1;
                            const seatId = rIdx * seatsPerRow + seatNum;
                            const unavailable = isSeatUnavailable(seatId);
                            const key = `${r}-${seatNum}`;
                            const selected = selectedSeats.includes(key);
                            const isPremium = isPremiumRow;

                            return (
                              <Box
                                key={key}
                                id={`seat-${seatId}`}
                                data-seat-id={seatId}
                                className={`seat ${
                                  unavailable ? 'sold' : selected ? 'selected' : ''
                                } ${isPremium ? 'premium' : 'regular'}`}
                                onClick={() => toggleSeat(r, seatNum, rIdx, sIdx)}
                                title={`${r}${seatNum}`}
                                sx={{
                                  width: 42,
                                  height: 36,
                                  borderRadius: 2,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: 13,
                                  fontWeight: 600,
                                  cursor: unavailable ? 'not-allowed' : 'pointer',
                                  userSelect: 'none',
                                  transition: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
                                  background: unavailable
                                    ? '#e0e0e0'
                                    : selected
                                    ? isPremium
                                      ? 'linear-gradient(135deg, #d6b3ff 0%, #b794e6 100%)'
                                      : 'linear-gradient(135deg, #ffd93d 0%, #f6c84c 100%)'
                                    : isPremium
                                    ? 'linear-gradient(135deg, #f3e8ff 0%, #e8d9ff 100%)'
                                    : 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                                  border: unavailable
                                    ? '2px solid #bdbdbd'
                                    : selected
                                    ? isPremium
                                      ? '2px solid #9c27b0'
                                      : '2px solid #f57c00'
                                    : isPremium
                                    ? '2px solid #ce93d8'
                                    : '2px solid #81c784',
                                  color: unavailable ? '#999' : '#1a1a2e',
                                  opacity: unavailable ? 0.5 : 1,
                                  boxShadow: selected
                                    ? '0 6px 20px rgba(0,0,0,0.15)'
                                    : '0 2px 8px rgba(0,0,0,0.06)',
                                  transform: selected ? 'translateY(-4px) scale(1.05)' : 'none',
                                  '&:hover': unavailable
                                    ? {}
                                    : {
                                        transform: selected ? 'translateY(-6px) scale(1.08)' : 'translateY(-2px)',
                                        boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
                                      }
                                }}
                              >
                                {seatNum}
                              </Box>
                            );
                          })}
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>

              {/* Legend */}
              <Box sx={{
                mt: 5,
                pt: 3,
                borderTop: '2px solid #f0f0f0',
                display: 'flex',
                justifyContent: 'center',
                flexWrap: 'wrap',
                gap: 2
              }}>
                {[
                  { label: 'Selected (Regular)', color: 'linear-gradient(135deg, #ffd93d, #f6c84c)', border: '#f57c00' },
                  { label: 'Selected (Premium)', color: 'linear-gradient(135deg, #d6b3ff, #b794e6)', border: '#9c27b0' },
                  { label: 'Available (Regular)', color: 'linear-gradient(135deg, #e8f5e9, #c8e6c9)', border: '#81c784' },
                  { label: 'Available (Premium)', color: 'linear-gradient(135deg, #f3e8ff, #e8d9ff)', border: '#ce93d8' },
                  { label: 'Sold', color: '#e0e0e0', border: '#bdbdbd' }
                ].map((item, idx) => (
                  <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: 1,
                        background: item.color,
                        border: `2px solid ${item.border}`,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                      }}
                    />
                    <Typography variant="body2" sx={{ fontSize: 13, fontWeight: 600, color: '#555' }}>
                      {item.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          </Box>

          {/* Right Sidebar */}
          <Box sx={{
            width: { xs: '100%', lg: 340 },
            position: { lg: 'sticky' },
            top: { lg: 100 }
          }}>
            {/* Pricing Info */}
            <Paper sx={{
              p: 3,
              mb: 3,
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocalActivityIcon />
                Ticket Pricing
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1.5 }}>
                <Typography sx={{ fontSize: 14, opacity: 0.9 }}>Regular Seats</Typography>
                <Typography sx={{ fontWeight: 700, fontSize: 18 }}>
                  {priceRegular != null ? `₹${priceRegular}` : '—'}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                <Typography sx={{ fontSize: 14, opacity: 0.9 }}>Premium Seats</Typography>
                <Typography sx={{ fontWeight: 700, fontSize: 18 }}>
                  {pricePremium != null ? `₹${pricePremium}` : '—'}
                </Typography>
              </Box>
            </Paper>

            {/* Booking Summary */}
            <Paper sx={{
              p: 3,
              mb: 3,
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
              background: '#fff'
            }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <EventSeatIcon />
                Your Selection
              </Typography>
              
              <Box sx={{
                textAlign: 'center',
                py: 3,
                mb: 2,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
              }}>
                <Typography sx={{ fontSize: 48, fontWeight: 900, color: '#1a1a2e', lineHeight: 1 }}>
                  {selectedSeats.length}
                </Typography>
                <Typography sx={{ fontSize: 13, color: '#666', fontWeight: 600, mt: 0.5 }}>
                  Seats Selected
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography sx={{ fontSize: 14, color: '#666' }}>Total Amount</Typography>
                <Typography sx={{ fontSize: 28, fontWeight: 800, color: '#ff3a44' }}>
                  ₹{totalPrice}
                </Typography>
              </Box>

              <Button
                className="proceed-btn"
                variant="contained"
                fullWidth
                size="large"
                disabled={
                  selectedSeats.length === 0 ||
                  bookingLoading ||
                  !!pendingBooking
                }
                onClick={openConfirm}
                sx={{
                  mt: 2,
                  py: 1.5,
                  fontSize: 16,
                  fontWeight: 700,
                  background: 'linear-gradient(90deg,#ff3a44,#f8446b)',
                  boxShadow: '0 8px 24px rgba(248,68,107,0.3)',
                  borderRadius: 2,
                  '&:hover': {
                    background: 'linear-gradient(90deg,#e8333d,#e03d5e)',
                    boxShadow: '0 10px 30px rgba(248,68,107,0.4)',
                    transform: 'translateY(-2px)'
                  },
                  '&.Mui-disabled': {
                    background: '#e0e0e0',
                    color: '#888'
                  },
                  transition: 'all 200ms ease'
                }}
              >
                {bookingLoading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />
                    Creating Booking...
                  </>
                ) : (
                  'PROCEED TO PAYMENT'
                )}
              </Button>
            </Paper>
          </Box>
        </Box>
      </Box>

      {/* Confirmation Dialog */}
      <Dialog
        open={confirmOpen}
        onClose={closeConfirm}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }
        }}
      >
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontWeight: 800,
          fontSize: 24,
          py: 2.5
        }}>
          Confirm Your Booking
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2 }} style={{ position: 'relative' , top : '30px'}}>
          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 3 }}>
            {/* Left Column */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, color: '#1a1a2e' }}>
                {movieTitle || 'Movie'}
              </Typography>
              <Typography sx={{ mb: 2, color: '#666', fontSize: 14 }}>
                {movieGenre}
                {movieDuration ? ' • ' + movieDuration : ''}
              </Typography>

              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ color: '#999', mb: 0.5 }}>Show Details</Typography>
                <Paper sx={{ p: 2, background: '#f8f9fa', borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <AccessTimeIcon sx={{ fontSize: 18, color: '#667eea' }} />
                    <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                      {showStart ? new Date(showStart).toLocaleString() : 'TBA'}
                    </Typography>
                  </Box>
                  {auditoriumName && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <TheatersIcon sx={{ fontSize: 18, color: '#667eea' }} />
                      <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                        {auditoriumName}
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Box>

              <Typography sx={{ fontSize: 18, fontWeight: 700, color: '#1a1a2e' }}>
                {selectedSeats.length} Seats Selected
              </Typography>
            </Box>

            {/* Right Column - Seats */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" sx={{ color: '#999', mb: 1.5 }}>
                Your Seats
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                {selectedSeatLabels.length ? (
                  selectedSeatLabels.map((s) => {
                    const r = s.split('-')[0];
                    const rIdx = rows.indexOf(r);
                    const isP = rIdx >= maxRows - premiumCount;
                    const perPrice = Number(
                      isP ? (pricePremium ?? 0) : (priceRegular ?? 0)
                    );
                    return (
                      <Chip
                        key={s}
                        label={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{s}</span>
                            <span style={{ fontSize: 11, opacity: 0.8 }}>₹{perPrice}</span>
                          </Box>
                        }
                        sx={{
                          background: isP
                            ? 'linear-gradient(135deg, #d6b3ff, #b794e6)'
                            : 'linear-gradient(135deg, #ffd93d, #f6c84c)',
                          color: '#1a1a2e',
                          fontWeight: 700,
                          border: isP ? '2px solid #9c27b0' : '2px solid #f57c00'
                        }}
                      />
                    );
                  })
                ) : (
                  <Typography sx={{ color: '#999' }}>No seats selected</Typography>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              <Box sx={{
                p: 2,
                borderRadius: 2,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white'
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography sx={{ fontSize: 13, opacity: 0.9 }}>Regular / Premium</Typography>
                  <Typography sx={{ fontSize: 13, fontWeight: 600 }}>
                    ₹{priceRegular ?? 0} / ₹{pricePremium ?? 0}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography sx={{ fontSize: 18, fontWeight: 700 }}>Total Amount</Typography>
                  <Typography sx={{ fontSize: 28, fontWeight: 900 }}>₹{totalPrice}</Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
          <Button
            onClick={closeConfirm}
            variant="outlined"
            sx={{
              borderColor: '#ddd',
              color: '#666',
              fontWeight: 700,
              px: 3,
              '&:hover': {
                borderColor: '#bbb',
                background: '#f5f5f5'
              }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              closeConfirm();
              proceedToPayment();
            }}
            variant="contained"
            disabled={bookingLoading || !!pendingBooking}
            sx={{
              background: 'linear-gradient(90deg,#ff3a44,#f8446b)',
              fontWeight: 700,
              px: 4,
              boxShadow: '0 6px 20px rgba(248,68,107,0.3)',
              '&:hover': {
                background: 'linear-gradient(90deg,#e8333d,#e03d5e)',
                boxShadow: '0 8px 24px rgba(248,68,107,0.4)'
              }
            }}
          >
            Proceed to Payment
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default SeatLayout;