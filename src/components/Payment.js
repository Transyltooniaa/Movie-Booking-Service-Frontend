import React,{useState,useEffect} from 'react'
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import {useParams, useNavigate, useLocation} from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import NavBar from './NavBar';
import { getToken } from './auth';
import bms from "../image/bms.png";

function Payment() {
  let navigate = useNavigate()

  const { theaterId, showId, selected, total } = useParams()
  const location = useLocation()
  const [movie, setMovie] = useState(null)
  const [show, setShow] = useState(null)
  const [loading, setLoading] = useState(false)

  const posterFallback = bms

  const bookingIdFromState =
    location?.state?.bookingId ||
    location?.state?.booking?.id ||
    null

  const amountFromState =
    location?.state?.booking?.totalAmount != null
      ? Number(location.state.booking.totalAmount)
      : Number(total)

  useEffect(() => {
    if (!showId) return
    let mounted = true
    const load = async () => {
      try {
        const API = process.env.REACT_APP_API_URL;
        const token = getToken();  // <-- add this above
        const res = await fetch(`${API}/movies/shows/${showId}`, {
          headers: {
            "Authorization": token,
            "Content-Type": "application/json"
          }
        });

        if (!res.ok) return;

        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) return;

        const s = await res.json();
        if (!mounted) return;

        const movieId = s.movieId ?? s.movie_id ?? s.movie
        if (movieId) {
          const API = process.env.REACT_APP_API_URL;
          const token = getToken();
          const mres = await fetch(`${API}/movies/${movieId}`, {
            headers: {
              "Authorization": token,
              "Content-Type": "application/json"
            }
          });
          if (mres && mres.ok) {
            const mct = mres.headers.get('content-type') || ''
            if (mct.includes('application/json')) {
              const m = await mres.json()
              if (!mounted) return
              setMovie(m)
            }
          }
        }
      } catch (err) {
        console.warn('Error loading show/movie for payment', err)
      }
    }
    load()
    return () => (mounted = false)
  }, [showId])

  const movieTicket = async () => {
    if (!bookingIdFromState) {
      toast.error('Missing booking information. Please try booking again.')
      return
    }

    try {
      setLoading(true)

      const payload = {
        bookingId: bookingIdFromState,
        amount: amountFromState
      }
      const API = process.env.REACT_APP_API_URL;
      const token = getToken();
      const res = await fetch(`${API}/payment/pay`, {
        method: 'POST',
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        toast.error('Failed to start payment')
        setLoading(false)
        return
      }

      await res.text() // "Payment started"
      toast.success('Payment started! Your booking will be confirmed shortly.')
      setLoading(false)

      // After some time user can view status in My Bookings
      navigate('/users/bookings')
    } catch (err) {
      console.error(err)
      setLoading(false)
      toast.error('Payment error')
    }
  }

  const posterSrc =
    movie?.poster ??
    movie?.posterUrl ??
    movie?.image ??
    movie?.poster_path ??
    posterFallback

  const displaySeatLabels = (() => {
    const sFromState = location?.state?.labels
    if (sFromState && Array.isArray(sFromState) && sFromState.length) return sFromState
    const seatsRaw = decodeURIComponent(selected || '')
    return seatsRaw
      ? seatsRaw
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : []
  })()

  const formatShowTime = (start) => {
    try {
      const d = new Date(start)
      const datePart = d.toLocaleDateString(undefined, {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
      })
      const timePart = d
        .toLocaleTimeString(undefined, { hour: 'numeric', hour12: true })
        .replace(':00', '')
      return `${datePart}, ${timePart}`
    } catch (e) {
      return start
    }
  }

  return (
    <>
      <NavBar />
      <Box
        sx={{
          backgroundColor: '#f2f2f2',
          display: 'flex',
          alignItems: 'center',
          padding: '40px 20px'
        }}
      >
        <Paper
          sx={{
            padding: 3,
            width: { xs: '92%', sm: 720 },
            margin: '0 auto',
            textAlign: 'left',
            boxShadow: 3
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              mb: 1
            }}
          >
            <Box component="img" sx={{ height: 46 }} alt="logo" src={bms} />
          </Box>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Complete your payment
          </Typography>
          <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>
            We'll send ticket information to your email after successful booking.
          </Typography>

          <Grid container spacing={2} sx={{ alignItems: 'center' }}>
            <Grid item xs={12} sm={4} md={3}>
              <Box
                component="img"
                sx={{
                  width: '100%',
                  maxWidth: 240,
                  borderRadius: 1,
                  objectFit: 'cover',
                  boxShadow: 3
                }}
                alt="poster"
                src={posterSrc}
              />
            </Grid>

            <Grid item xs={12} sm={5} md={6}>
              <Typography
                variant="h6"
                sx={{ fontWeight: 800, mb: 1 }}
              >
                {movie?.name || movie?.title || ''}
              </Typography>
              <Typography sx={{ color: '#444', mb: 0.6 }}>
                Show:{' '}
                <strong style={{ fontWeight: 600 }}>
                  {show ? formatShowTime(show.startTime) : ''}
                </strong>
              </Typography>
              <Typography sx={{ color: '#444', mb: 0.6 }}>
                Auditorium:{' '}
                <strong style={{ fontWeight: 600 }}>
                  {show?.auditorium ?? theaterId}
                </strong>
              </Typography>
              <Typography sx={{ color: '#444', mb: 1 }}>
                Seats:{' '}
                <strong style={{ fontWeight: 600 }}>
                  {displaySeatLabels.join(', ')}
                </strong>
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                  sx={{ borderColor: '#bbb', color: '#222', px: 3 }}
                >
                  Back
                </Button>
                <Button
                  variant="contained"
                  onClick={movieTicket}
                  disabled={loading}
                  sx={{
                    backgroundColor: '#f84464',
                    boxShadow: '0 6px 18px rgba(248,68,100,0.22)',
                    px: 3
                  }}
                >
                  {loading ? 'Processing...' : 'Payment'}
                </Button>
              </Box>
            </Grid>

            <Grid item xs={12} sm={3} md={3}>
              <Box
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'flex-start'
                }}
              >
                <Typography sx={{ color: '#666', mb: 1 }}>Amount</Typography>
                <Typography sx={{ fontSize: 20, fontWeight: 800 }}>
                  ₹ {amountFromState}
                </Typography>
              </Box>
            </Grid>
          </Grid>

          <ToastContainer />
        </Paper>
      </Box>
    </>
  )
}

export default Payment
