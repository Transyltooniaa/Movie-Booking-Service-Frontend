import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import NavBar from './NavBar'
import Dialog from '@mui/material/Dialog'
import DialogTitle from '@mui/material/DialogTitle'
import DialogContent from '@mui/material/DialogContent'
import DialogActions from '@mui/material/DialogActions'
import Typography from '@mui/material/Typography'
import { getToken } from "./auth";

function SeatLayout() {
  const { id, showId } = useParams()
  const [movie, setMovie] = useState(null)
  const [selectedSeats, setSelectedSeats] = useState([])
  const [priceRegular, setPriceRegular] = useState(null)
  const [pricePremium, setPricePremium] = useState(null)
  const [show, setShow] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [bookingLoading, setBookingLoading] = useState(false)

  const [bookedSeatIds, setBookedSeatIds] = useState([])
  const [lockedSeatIds, setLockedSeatIds] = useState([])
  const [pendingBooking, setPendingBooking] = useState(null) // 👈 new

  const navigate = useNavigate()

  useEffect(() => {
    if (!showId) return
    let mounted = true

    // Clear any stale selection when revisiting this page
    setSelectedSeats([])

    const loadInitialData = async () => {
      try {
        const results = {}

        // 1) Show
        const API = process.env.REACT_APP_API_URL || "";
        const token = getToken()
        const showRes = await fetch(`${API}/movies/shows/${showId}`, {
          headers: {
            "Authorization": token
          }
        })
        if (showRes && showRes.ok) {
          const ct = showRes.headers.get('content-type') || ''
          if (ct.includes('application/json')) results.show = await showRes.json()
        }

        if (!mounted) return

        if (results.show) {
          setShow(results.show)
          const s = results.show
          setPriceRegular(s.priceRegular ?? s.price_regular ?? s.price ?? null)
          setPricePremium(s.pricePremium ?? s.price_premium ?? s.pricepremium ?? null)
        }

        // 2) Movie
        const movieIdToFetch =
          id ?? results.show?.movieId ?? results.show?.movie_id ?? null
        if (movieIdToFetch) {
          const API = process.env.REACT_APP_API_URL || "";
          const token = getToken()
          const movieRes = await fetch(`${API}/movies/${movieIdToFetch}`, {
            headers: {
              "Authorization": token
            }
          })
          if (movieRes && movieRes.ok) {
            const ct2 = movieRes.headers.get('content-type') || ''
            if (ct2.includes('application/json')) results.movie = await movieRes.json()
          }
        }

        if (!mounted) return

        if (results.movie) setMovie(results.movie)

        // 3) Seat status from booking-service
        try {
          const API = process.env.REACT_APP_API_URL || "";
          const token = getToken()
          const statusRes = await fetch(`${API}/bookings/show/${showId}/seats/status`, {
            headers: {
              "Authorization": token
            }
          })
          if (statusRes && statusRes.ok) {
            const ct3 = statusRes.headers.get('content-type') || ''
            if (ct3.includes('application/json')) {
              const status = await statusRes.json()
              if (!mounted) return
              setBookedSeatIds((status.bookedSeatIds || []).map(Number))
              setLockedSeatIds((status.lockedSeatIds || []).map(Number))
            }
          }
        } catch (e) {
          console.warn('Could not load seat status', e)
        }

        // 4) Check if user already has a PENDING booking for this show
        try {
          const API = process.env.REACT_APP_API_URL || "";
          const token = getToken()
          const myRes = await fetch(`${API}/bookings/my`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json'
              , "Authorization": token
             }
          })
          if (myRes && myRes.ok) {
            const myBookings = await myRes.json()
            if (!mounted) return
            const pb = myBookings.find(
              (b) =>
                String(b.showId) === String(showId) &&
                b.status === 'PENDING_PAYMENT'
            )
            setPendingBooking(pb || null)
          }
        } catch (e) {
          console.warn('Could not load my bookings to check pending one', e)
        }

        console.log('SeatLayout initial load:', results)
      } catch (err) {
        console.warn('Could not load initial data for seat layout', err)
      }
    }

    loadInitialData()
    return () => (mounted = false)
  }, [showId, id])

  const rowsCount = 12
  const seatsPerRow = 14
  const maxRows = Math.min(rowsCount, 26)
  const rows = Array.from({ length: maxRows }, (_, i) =>
    String.fromCharCode(65 + i)
  )

  const premiumCount = Math.min(4, maxRows)

  const isSeatUnavailable = (seatId) =>
    bookedSeatIds.includes(seatId) || lockedSeatIds.includes(seatId)

  const toggleSeat = (r, seatNum, rIdx, sIdx) => {
    const seatId = rIdx * seatsPerRow + (seatNum - 1) + 1
    if (isSeatUnavailable(seatId)) return

    const key = `${r}-${seatNum}`
    setSelectedSeats((prev) =>
      prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]
    )
  }

  const totalPrice = selectedSeats.reduce((acc, key) => {
    const r = key.split('-')[0]
    const rIdx = rows.indexOf(r)
    const isPremiumRow = rIdx >= maxRows - premiumCount
    const seatPrice = Number(isPremiumRow ? (pricePremium ?? 0) : (priceRegular ?? 0))
    return acc + seatPrice
  }, 0)

  const openConfirm = () => setConfirmOpen(true)
  const closeConfirm = () => setConfirmOpen(false)

  const computeSeatIds = () => {
    return selectedSeats.map((key) => {
      const [r, s] = key.split('-')
      const rIdx = rows.indexOf(r)
      const seatNum = Number(s)
      const seatId = rIdx * seatsPerRow + (seatNum - 1) + 1
      return seatId
    })
  }

  const selectedSeatLabels = selectedSeats
    .slice()
    .sort((a, b) => a.localeCompare(b))

  const proceedToPayment = async () => {
    // Guard: don’t create a duplicate booking if one is already pending
    if (pendingBooking) {
      alert(
        'You already have a pending booking for this show. Please complete or cancel it from MyBookings.'
      )
      return
    }

    try {
      setBookingLoading(true)

      // Build CreateBookingRequest
      const seatsPayload = selectedSeats.map((key) => {
        const [rowLabel, seatNumStr] = key.split('-')
        const seatNumber = Number(seatNumStr)
        const rIdx = rows.indexOf(rowLabel)
        const isPremiumRow = rIdx >= maxRows - premiumCount
        const seatId = rIdx * seatsPerRow + (seatNumber - 1) + 1
        const seatType = isPremiumRow ? 'PREMIUM' : 'REGULAR'
        const price = Number(
          isPremiumRow ? (pricePremium ?? 0) : (priceRegular ?? 0)
        )

        return {
          seatId,
          rowLabel,
          seatNumber,
          seatType,
          price
        }
      })

      const payload = {
        showId: Number(showId),
        totalAmount: totalPrice,
        seats: seatsPayload
      }
      const API = process.env.REACT_APP_API_URL || "";
      const token = getToken()
      const res = await fetch(`${API}/bookings/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          "Authorization": token
          // Authorization token is handled globally; X-User-Email injected by gateway
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        console.error('Booking creation failed', res.status)
        alert('Could not create booking. Please try again.')
        setBookingLoading(false)
        return
      }

      const booking = await res.json() // BookingResponse from backend
      setBookingLoading(false)

      const auditorium =
        show?.auditorium ??
        show?.auditoriumName ??
        show?.theater ??
        show?.theatre ??
        show?.theatreId ??
        show?.theaterId ??
        ''

      const selectedParam = encodeURIComponent(computeSeatIds().join(','))
      const totalParam = totalPrice

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
      )
    } catch (err) {
      console.error('Error creating booking', err)
      alert('Error creating booking. Please try again.')
      setBookingLoading(false)
    }
  }

  const movieTitle = movie?.title ?? movie?.name ?? ''
  const movieGenre = movie?.genre ?? movie?.type ?? ''
  const movieDuration = movie?.duration ?? ''
  const showStart = show?.startTime ?? show?.start ?? null
  const showEnd = show?.endTime ?? show?.end ?? null
  const auditoriumName =
    show?.auditorium ??
    show?.auditoriumName ??
    show?.theatre ??
    show?.theatreName ??
    ''

  return (
    <div>
      <NavBar />
      <Box
        sx={{
          width: '92%',
          margin: '30px auto',
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <Box
          sx={{
            display: 'flex',
            gap: 3,
            alignItems: 'flex-start',
            width: '100%',
            maxWidth: 1200
          }}
        >
          <Box sx={{ width: '100%', maxWidth: 920 }}>
            <h3 style={{ textAlign: 'left', marginBottom: 6 }}>
              {movieTitle || 'Select seats'}
            </h3>
            <p
              style={{
                color: '#666',
                marginTop: 0,
                marginBottom: 12
              }}
            >
              {movieGenre || movieDuration
                ? `${movieGenre}${movieDuration ? ' • ' + movieDuration : ''}`
                : ''}
            </p>
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div
                className="screen-bar"
                style={{
                  width: '60%',
                  maxWidth: 680,
                  margin: '0 auto',
                  display: 'block'
                }}
              >
                <strong>Screen</strong>
              </div>
            </div>

            <div
              style={{ textAlign: 'center', marginBottom: 16, color: '#999' }}
            >
              All eyes this way please
            </div>

            <div
              style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}
            >
              <div style={{ display: 'grid', gap: 10 }}>
                {rows.map((r, rIdx) => {
                  const isPremiumRow = rIdx >= maxRows - premiumCount
                  const rowStyle = { display: 'flex', alignItems: 'center', gap: 8 }
                  if (isPremiumRow && rIdx === maxRows - premiumCount)
                    rowStyle.marginTop = 18
                  return (
                    <div key={r} style={rowStyle}>
                      <div
                        style={{
                          width: 34,
                          textAlign: 'center',
                          color: '#333',
                          fontWeight: 600
                        }}
                      >
                        {r}
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          gap: 10,
                          flexWrap: 'wrap',
                          alignItems: 'center'
                        }}
                        data-row={r}
                      >
                        {Array.from({ length: seatsPerRow }).map((_, sIdx) => {
                          const seatNum = sIdx + 1
                          const seatId = rIdx * seatsPerRow + seatNum
                          const unavailable = isSeatUnavailable(seatId)
                          const key = `${r}-${seatNum}`
                          const selected = selectedSeats.includes(key)
                          const isPremium = isPremiumRow

                          const baseStyle = {
                            width: 36,
                            height: 28,
                            borderRadius: 6,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 12,
                            cursor: unavailable ? 'not-allowed' : 'pointer',
                            color: unavailable ? '#999' : '#111',
                            userSelect: 'none',
                            transition:
                              'transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease, border-color 180ms ease'
                          }

                          const availableStyle = isPremium
                            ? {
                                background: selected ? '#d6b3ff' : '#f3e8ff',
                                border: '1px solid #caa7ff'
                              }
                            : {
                                background: selected ? '#f6c84c' : '#fff',
                                border: '1px solid #b7e6bd'
                              }

                          const selectedStyle = selected
                            ? {
                                transform: 'translateY(-6px) scale(1.03)',
                                boxShadow: '0 14px 30px rgba(3,22,61,0.12)'
                              }
                            : {}

                          const soldStyle = unavailable
                            ? {
                                background: '#eee',
                                border: '1px solid #ddd',
                                cursor: 'not-allowed',
                                color: '#999'
                              }
                            : {}

                          const style = Object.assign(
                            {},
                            baseStyle,
                            unavailable ? soldStyle : availableStyle,
                            selectedStyle
                          )

                          const seatClass = `seat ${
                            unavailable ? 'sold' : selected ? 'selected' : ''
                          } ${isPremium ? 'premium' : 'regular'}`

                          return (
                            <div
                              key={key}
                              id={`seat-${seatId}`}
                              data-seat-id={seatId}
                              className={seatClass}
                              style={style}
                              onClick={() => toggleSeat(r, seatNum, rIdx, sIdx)}
                              title={`${r}${seatNum} — id:${seatId}`}
                            >
                              {seatNum}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div
              style={{
                marginTop: 40,
                display: 'flex',
                justifyContent: 'center'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap'
                }}
              >
                <span style={{ display: 'inline-block', marginRight: 8 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 12,
                      height: 12,
                      background: '#f6c84c',
                      marginRight: 6,
                      borderRadius: 2
                    }}
                  ></span>
                  Selected (Regular)
                </span>
                <span style={{ display: 'inline-block', marginRight: 8 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 12,
                      height: 12,
                      background: '#d6b3ff',
                      marginRight: 6,
                      borderRadius: 2
                    }}
                  ></span>
                  Selected (Premium)
                </span>
                <span style={{ display: 'inline-block', marginRight: 8 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 12,
                      height: 12,
                      background: '#b7e6bd',
                      marginRight: 6,
                      borderRadius: 2
                    }}
                  ></span>
                  Available (Regular)
                </span>
                <span style={{ display: 'inline-block', marginRight: 8 }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 12,
                      height: 12,
                      background: '#f3e8ff',
                      marginRight: 6,
                      borderRadius: 2
                    }}
                  ></span>
                  Available (Premium)
                </span>
                <span style={{ display: 'inline-block' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 12,
                      height: 12,
                      background: '#ddd',
                      marginRight: 6,
                      borderRadius: 2
                    }}
                  ></span>
                  Sold
                </span>
              </div>
            </div>
          </Box>

          <Box
            sx={{
              width: 260,
              ml: 3,
              display: 'flex',
              flexDirection: 'column',
              gap: 2
            }}
          >
            {/* Pending booking banner */}
            {pendingBooking && (
              <div
                style={{
                  padding: 12,
                  borderRadius: 8,
                  background: '#fff3cd',
                  border: '1px solid #ffeeba',
                  fontSize: 12,
                  color: '#856404'
                }}
              >
                <div style={{ fontWeight: 600, marginBottom: 4 }}>
                  Pending booking exists
                </div>
                <div style={{ marginBottom: 8 }}>
                  You already have a pending booking for this show (Booking #
                  {pendingBooking.id}). Please complete payment or cancel it
                  from MyBookings.
                </div>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => navigate('/users/bookings')}
                  sx={{ borderColor: '#856404', color: '#856404' }}
                >
                  Go to MyBookings
                </Button>
              </div>
            )}

            <div className="right-panel" style={{ width: '100%' }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8
                }}
              >
                <div style={{ fontSize: 12, color: '#666' }}>Regular</div>
                <div style={{ fontWeight: 700 }}>
                  {priceRegular != null ? `₹${priceRegular}` : '—'}
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div style={{ fontSize: 12, color: '#666' }}>Premium</div>
                <div style={{ fontWeight: 700 }}>
                  {pricePremium != null ? `₹${pricePremium}` : '—'}
                </div>
              </div>
            </div>

            <div
              className="right-panel"
              style={{ width: '100%', textAlign: 'center' }}
            >
              <div
                style={{
                  width: '100%',
                  padding: 16,
                  borderRadius: 8,
                  background: '#fff',
                  textAlign: 'center'
                }}
              >
                <div style={{ fontSize: 24, fontWeight: 800 }}>
                  {selectedSeats.length}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: '#777',
                    marginBottom: 8
                  }}
                >
                  Seats selected
                </div>
                <div style={{ fontSize: 14, color: '#444' }}>Total</div>
                <div
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    marginTop: 6
                  }}
                >
                  {`₹${totalPrice}`}
                </div>
              </div>
            </div>

            <Button
              style={{ position: 'relative', left: 35 }}
              className="proceed-btn"
              variant="contained"
              sx={{ width: '100%' }}
              disabled={
                selectedSeats.length === 0 ||
                bookingLoading ||
                !!pendingBooking
              }
              onClick={openConfirm}
            >
              {bookingLoading ? 'Creating booking...' : 'PROCEED'}
            </Button>

            <Dialog
              open={confirmOpen}
              onClose={closeConfirm}
              aria-labelledby="confirm-dialog-title"
            >
              <DialogTitle id="confirm-dialog-title">
                Confirm Booking
              </DialogTitle>
              <DialogContent>
                <div className="booking-summary">
                  <div className="left">
                    <Typography sx={{ mb: 1 }}>
                      <strong>{movieTitle || 'this movie'}</strong>
                    </Typography>
                    <Typography sx={{ mb: 1, color: '#666' }}>
                      {movieGenre}
                      {movieDuration ? ' • ' + movieDuration : ''}
                    </Typography>
                    <Typography sx={{ mb: 1 }}>
                      <strong>{selectedSeats.length}</strong> seats selected
                    </Typography>
                    <div
                      style={{
                        marginBottom: 12,
                        lineHeight: 1.45
                      }}
                    >
                      <div style={{ color: '#666', marginBottom: 6 }}>Show</div>
                      <div
                        style={{
                          fontWeight: 700,
                          marginBottom: 6
                        }}
                      >
                        Start:{' '}
                        {showStart
                          ? new Date(showStart).toLocaleString()
                          : 'TBA'}
                      </div>
                      {showEnd ? (
                        <div
                          style={{
                            color: '#666',
                            fontSize: 13,
                            marginBottom: 6
                          }}
                        >
                          End: {new Date(showEnd).toLocaleString()}
                        </div>
                      ) : null}
                      {auditoriumName ? (
                        <div
                          style={{
                            marginTop: 6,
                            color: '#444'
                          }}
                        >
                          Auditorium:{' '}
                          <strong>{auditoriumName}</strong>
                        </div>
                      ) : null}
                    </div>
                  </div>

                  <div className="right">
                    <div
                      style={{
                        marginBottom: 10,
                        color: '#666'
                      }}
                    >
                      Seats
                    </div>
                    <div className="seats-list">
                      {selectedSeatLabels.length ? (
                        selectedSeatLabels.map((s) => {
                          const r = s.split('-')[0]
                          const rIdx = rows.indexOf(r)
                          const isP = rIdx >= maxRows - premiumCount
                          const pillClass = `seat-pill ${
                            isP ? 'premium' : 'regular'
                          }`
                          const perPrice = Number(
                            isP ? (pricePremium ?? 0) : (priceRegular ?? 0)
                          )
                          return (
                            <div key={s} className={pillClass}>
                              <span style={{ marginRight: 6 }}>{s}</span>
                              <small
                                style={{
                                  color: '#666',
                                  fontWeight: 500
                                }}
                              >
                                {`₹${perPrice}`}
                              </small>
                            </div>
                          )
                        })
                      ) : (
                        <div style={{ color: '#999' }}>No seats</div>
                      )}
                    </div>

                    <div
                      style={{
                        marginTop: 12,
                        borderTop: '1px solid #eee',
                        paddingTop: 12
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          color: '#666'
                        }}
                      >
                        <div>Per-seat</div>
                        <div>{`₹${priceRegular ?? 0} / ${
                          pricePremium ?? 0
                        }`}</div>
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginTop: 8,
                          fontWeight: 700
                        }}
                      >
                        <div>Total</div>
                        <div>{`₹${totalPrice}`}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button
                  onClick={closeConfirm}
                  sx={{ color: '#1976d2' }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    closeConfirm()
                    proceedToPayment()
                  }}
                  variant="contained"
                  sx={{ backgroundColor: '#f84464' }}
                  disabled={bookingLoading || !!pendingBooking}
                >
                  Proceed to Payment
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
        </Box>
      </Box>
    </div>
  )
}

export default SeatLayout