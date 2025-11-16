import React,{useState,useEffect} from 'react'
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
// removed email TextField import (no longer collecting email client-side)
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import {useParams, useNavigate, useLocation} from 'react-router-dom'
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import NavBar from './NavBar';
import bms from "../image/bms.png";


function Payment() {
 
  let navigate=useNavigate()

  // params from route: /bookmyshow/payment/:theaterId/:showId/:selected/:total
  const { theaterId, showId, selected, total } = useParams()
  const location = useLocation()
  const [movie, setMovie] = useState(null)
  const [show, setShow] = useState(null)
  const [loading, setLoading] = useState(false)

  const posterFallback = bms

  useEffect(() => {
    if (!showId) return
    let mounted = true
    const load = async () => {
      try {
        const res = await fetch(`/movies/shows/${showId}`)
        if (!res.ok) return
        const ct = res.headers.get('content-type') || ''
        if (!ct.includes('application/json')) return
        const s = await res.json()
        if (!mounted) return
        setShow(s)

        const movieId = s.movieId ?? s.movie_id ?? s.movie
        if (movieId) {
          const mres = await fetch(`/movies/${movieId}`)
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
    // No client-side email collection; backend handles notifications.
    try {
      setLoading(true)
      const seatsRaw = decodeURIComponent(selected || '')
      const seats = seatsRaw ? seatsRaw.split(',').map(s => s.trim()).filter(Boolean) : []
      const payload = { seats, amount: Number(total) }
      // Root-relative so JWT header is injected and proxy routes to gateway
      const res = await fetch(`/movies/shows/${showId}/book`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        toast.error('Failed to complete booking')
        setLoading(false)
        return
      }
      await res.json()
      toast.success('Booking successful — ticket info will be sent to your email')
      setLoading(false)
      navigate('/bookmyshow/movies')
    } catch (err) {
      console.error(err)
      setLoading(false)
      toast.error('Booking error')
    }
  }

  const posterSrc = movie?.poster ?? movie?.posterUrl ?? movie?.image ?? movie?.poster_path ?? posterFallback

  // display seat labels if passed via navigation state (SeatLayout passes labels), otherwise fall back to URL param
  const displaySeatLabels = (() => {
    const sFromState = location?.state?.labels
    if (sFromState && Array.isArray(sFromState) && sFromState.length) return sFromState
    const seatsRaw = decodeURIComponent(selected || '')
    return seatsRaw ? seatsRaw.split(',').map(s => s.trim()).filter(Boolean) : []
  })()

  const formatShowTime = (start) => {
    try {
      const d = new Date(start)
      const datePart = d.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
      const timePart = d.toLocaleTimeString(undefined, { hour: 'numeric', hour12: true }).replace(':00', '')
      return `${datePart}, ${timePart}`
    } catch (e) {
      return start
    }
  }

  return <>
    <NavBar />
    <Box sx={{ backgroundColor: '#f2f2f2', display: 'flex', alignItems: 'center', padding: '40px 20px' }}>
      <Paper sx={{ padding: 3, width: { xs: '92%', sm: 720 }, margin: '0 auto', textAlign: 'left', boxShadow: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <Box component="img" sx={{ height: 46 }} alt="logo" src={bms} />
        </Box>
        <Typography variant="h6" sx={{ mb: 1 }}>Complete your payment</Typography>
        <Typography variant="body2" sx={{ color: '#666', mb: 2 }}>We'll send ticket information to your email after successful booking.</Typography>

        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid item xs={12} sm={4} md={3}>
            <Box component="img" sx={{ width: '100%', maxWidth: 240, borderRadius: 1, objectFit: 'cover', boxShadow: 3 }} alt="poster" src={posterSrc} />
          </Grid>

          <Grid item xs={12} sm={5} md={6}>
            <Typography variant="h6" sx={{ fontWeight: 800, mb: 1 }}>{movie?.name || movie?.title || ''}</Typography>
            <Typography sx={{ color: '#444', mb: 0.6 }}>Show: <strong style={{fontWeight:600}}>{show ? formatShowTime(show.startTime) : ''}</strong></Typography>
            <Typography sx={{ color: '#444', mb: 0.6 }}>Auditorium: <strong style={{fontWeight:600}}>{show?.auditorium ?? theaterId}</strong></Typography>
            <Typography sx={{ color: '#444', mb: 1 }}>Seats: <strong style={{fontWeight:600}}>{displaySeatLabels.join(', ')}</strong></Typography>

            <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
              <Button variant="outlined" onClick={() => navigate(-1)} disabled={loading} sx={{ borderColor: '#bbb', color: '#222', px: 3 }}>Back</Button>
              <Button variant="contained" onClick={movieTicket} disabled={loading} sx={{ backgroundColor: '#f84464', boxShadow: '0 6px 18px rgba(248,68,100,0.22)', px: 3 }}>
                {loading ? 'Processing...' : 'Payment'}
              </Button>
            </Box>
          </Grid>

          <Grid item xs={12} sm={3} md={3}>
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-start' }}>
              <Typography sx={{ color: '#666', mb: 1 }}>Amount</Typography>
              <Typography sx={{ fontSize: 20, fontWeight: 800 }}>₹ {total}</Typography>
            </Box>
          </Grid>
        </Grid>

        <ToastContainer />
      </Paper>
    </Box>
  </>
}

export default Payment