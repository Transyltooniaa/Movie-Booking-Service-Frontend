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

// Simple seat layout mock similar to BookMyShow
function SeatLayout() {
  // read both movie id and show id from route params
  const { id, showId } = useParams()
  const [movie, setMovie] = useState(null)
  const [selectedSeats, setSelectedSeats] = useState([])
  const [priceRegular, setPriceRegular] = useState(null)
  const [pricePremium, setPricePremium] = useState(null)
  const [show, setShow] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const navigate = useNavigate()

  // Consolidated initial load: fetch movie, show and pricing once and log the returned objects
  useEffect(() => {
    // run when we have a showId; movie id is optional because show contains movieId
    if (!showId) return
    let mounted = true

    const loadInitialData = async () => {
      try {
        const results = {}

        // fetch show first (contains pricing and movieId)
        const showRes = await fetch(`/shows/${showId}`)
        if (showRes && showRes.ok) {
          const ct = showRes.headers.get('content-type') || ''
          if (ct.includes('application/json')) results.show = await showRes.json()
        }

        if (!mounted) return

        // set show and pricing immediately
        if (results.show) {
          setShow(results.show)
          const s = results.show
          setPriceRegular(s.priceRegular ?? s.price_regular ?? s.price ?? null)
          setPricePremium(s.pricePremium ?? s.price_premium ?? s.pricepremium ?? null)
        }

        // determine which movie id to fetch: prefer `id` param, otherwise use show.movieId
        const movieIdToFetch = id ?? results.show?.movieId ?? results.show?.movie_id ?? null
        if (movieIdToFetch) {
          const movieRes = await fetch(`/movies/${movieIdToFetch}`)
          if (movieRes && movieRes.ok) {
            const ct2 = movieRes.headers.get('content-type') || ''
            if (ct2.includes('application/json')) results.movie = await movieRes.json()
          }
        }

        if (!mounted) return

        if (results.movie) setMovie(results.movie)

        // log everything once so the developer can inspect fields
        console.log('SeatLayout initial load:', results)
      } catch (err) {
        console.warn('Could not load initial data for seat layout', err)
      }
    }

    loadInitialData()
    return () => (mounted = false)
  }, [showId, id])

  // Seat map configuration: rows are letters (A..Z) and columns are integers
  const rowsCount = 12 // change this number to show more/less rows (max 26)
  const seatsPerRow = 14 // number of seats per row
  const maxRows = Math.min(rowsCount, 26)
  const rows = Array.from({ length: maxRows }, (_, i) => String.fromCharCode(65 + i)) // ['A','B',...]

  // Exactly 4 rows are premium at the back (per request)
  const premiumCount = Math.min(4, maxRows)

  // helper to check sold seats (randomized but stable for the session)
  const isSold = (rIndex, sIndex) => {
    // Deterministic pseudo-random so layout looks realistic for the demo
    return (rIndex * 31 + sIndex * 17 + (id ? id.length : 0)) % 7 === 0
  }

  const toggleSeat = (r, seatNum, rIdx, sIdx) => {
    const key = `${r}-${seatNum}`
    if (isSold(rIdx, sIdx)) return
    setSelectedSeats((prev) => (prev.includes(key) ? prev.filter((p) => p !== key) : [...prev, key]))
  }

  // compute running total using pricing and whether selected seats are premium
  const totalPrice = selectedSeats.reduce((acc, key) => {
    const r = key.split('-')[0]
    const rIdx = rows.indexOf(r)
    const isPremiumRow = rIdx >= maxRows - premiumCount
    const seatPrice = isPremiumRow ? (pricePremium ?? 0) : (priceRegular ?? 0)
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

  const selectedSeatIds = computeSeatIds()
  const selectedSeatLabels = selectedSeats.slice().sort((a,b)=>a.localeCompare(b))

  const proceedToPayment = () => {
    // gather params expected by Payment: id, theaterId (use auditorium), showId, selected, total
    const auditorium = show?.auditorium ?? show?.auditoriumName ?? show?.theater ?? show?.theatre ?? show?.theatreId ?? show?.theaterId ?? ''
    const selectedParam = encodeURIComponent(computeSeatIds().join(','))
    const totalParam = totalPrice
    // navigate to payment route
    navigate(
      `/bookmyshow/payment/${encodeURIComponent(auditorium)}/${encodeURIComponent(showId)}/${selectedParam}/${encodeURIComponent(totalParam)}`,
      { state: { labels: selectedSeatLabels } }
    )
  }

  // Derived, readable variables for UI
  const movieTitle = movie?.title ?? movie?.name ?? ''
  const movieGenre = movie?.genre ?? movie?.type ?? ''
  const movieDuration = movie?.duration ?? ''
  const showStart = show?.startTime ?? show?.start ?? null
  const showEnd = show?.endTime ?? show?.end ?? null
  const auditoriumName = show?.auditorium ?? show?.auditoriumName ?? show?.theatre ?? show?.theatreName ?? ''

  return (
      <div>
      <NavBar />
      <Box sx={{ width: '92%', margin: '30px auto', display: 'flex', justifyContent: 'center' }}>
        <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start', width: '100%', maxWidth: 1200 }}>
          <Box sx={{ width: '100%', maxWidth: 920 }}>
            <h3 style={{ textAlign: 'left', marginBottom: 6 }}>{movieTitle || 'Select seats'}</h3>
            <p style={{ color: '#666', marginTop: 0, marginBottom: 12 }}>{movieGenre || movieDuration ? `${movieGenre}${movieDuration ? ' • ' + movieDuration : ''}` : ''}</p>
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <div className="screen-bar" style={{ width: '60%', maxWidth: 680, margin: '0 auto', display: 'block' }}>
                <strong>Screen</strong>
              </div>
            </div>

            <div style={{ textAlign: 'center', marginBottom: 16, color: '#999' }}>All eyes this way please</div>


            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
              <div style={{ display: 'grid', gap: 10 }}>
                {rows.map((r, rIdx) => {
                const isPremiumRow = rIdx >= maxRows - premiumCount
                const rowStyle = { display: 'flex', alignItems: 'center', gap: 8 }
                // add extra top gap where premium rows start
                if (isPremiumRow && rIdx === maxRows - premiumCount) rowStyle.marginTop = 18
                return (
                  <div key={r} style={rowStyle}>
                    <div style={{ width: 34, textAlign: 'center', color: '#333', fontWeight: 600 }}>{r}</div>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }} data-row={r}>
                      {Array.from({ length: seatsPerRow }).map((_, sIdx) => {
                        const seatNum = sIdx + 1
                        const sold = isSold(rIdx, sIdx)
                        const key = `${r}-${seatNum}`
                        // integer seat id (unique across layout)
                        const seatId = rIdx * seatsPerRow + sIdx + 1
                        const selected = selectedSeats.includes(key)

                        // styling: premium seats have a subtle different look
                        const baseStyle = {
                          width: 36,
                          height: 28,
                          borderRadius: 6,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          cursor: sold ? 'not-allowed' : 'pointer',
                          color: sold ? '#999' : '#111',
                          userSelect: 'none',
                          // smooth transitions
                          transition: 'transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease, border-color 180ms ease',
                        }

                        const availableStyle = isPremiumRow
                          ? { background: selected ? '#d6b3ff' : '#f3e8ff', border: '1px solid #caa7ff' }
                          : { background: selected ? '#f6c84c' : '#fff', border: '1px solid #b7e6bd' }

                        // selected/toggled appearance
                        const selectedStyle = selected ? { transform: 'translateY(-6px) scale(1.03)', boxShadow: '0 14px 30px rgba(3,22,61,0.12)' } : {}
                        const soldStyle = sold ? { background: '#eee', border: '1px solid #ddd', cursor: 'not-allowed', color: '#999' } : {}

                        const style = Object.assign({}, baseStyle, sold ? soldStyle : availableStyle, selectedStyle)

                        const seatClass = `seat ${sold ? 'sold' : selected ? 'selected' : ''} ${isPremiumRow ? 'premium' : 'regular'}`

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

            <div style={{ marginTop: 40 , display: 'flex', justifyContent: 'center'}}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-block', marginRight: 8 }}>
                  <span style={{ display: 'inline-block', width: 12, height: 12, background: '#f6c84c', marginRight: 6, borderRadius: 2 }}></span>
                  Selected (Regular)
                </span>
                <span style={{ display: 'inline-block', marginRight: 8 }}>
                  <span style={{ display: 'inline-block', width: 12, height: 12, background: '#d6b3ff', marginRight: 6, borderRadius: 2 }}></span>
                  Selected (Premium)
                </span>
                <span style={{ display: 'inline-block', marginRight: 8 }}>
                  <span style={{ display: 'inline-block', width: 12, height: 12, background: '#b7e6bd', marginRight: 6, borderRadius: 2 }}></span>
                  Available (Regular)
                </span>
                <span style={{ display: 'inline-block', marginRight: 8 }}>
                  <span style={{ display: 'inline-block', width: 12, height: 12, background: '#f3e8ff', marginRight: 6, borderRadius: 2 }}></span>
                  Available (Premium)
                </span>
                <span style={{ display: 'inline-block' }}>
                  <span style={{ display: 'inline-block', width: 12, height: 12, background: '#ddd', marginRight: 6, borderRadius: 2 }}></span>
                  Sold
                </span>
              </div>
            </div>
          </Box>

          <Box sx={{ width: 260, ml: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div className="right-panel" style={{ width: '100%' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <div style={{ fontSize: 12, color: '#666' }}>Regular</div>
                <div style={{ fontWeight: 700 }}>{priceRegular != null ? `₹${priceRegular}` : '—'}</div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontSize: 12, color: '#666' }}>Premium</div>
                <div style={{ fontWeight: 700 }}>{pricePremium != null ? `₹${pricePremium}` : '—'}</div>
              </div>
            </div>

            <div className="right-panel" style={{ width: '100%', textAlign: 'center' }}>
              <div style={{ width: '100%', padding: 16, borderRadius: 8, background: '#fff', textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{selectedSeats.length}</div>
                <div style={{ fontSize: 12, color: '#777', marginBottom: 8 }}>Seats selected</div>
                <div style={{ fontSize: 14, color: '#444' }}>Total</div>
                <div style={{ fontSize: 18, fontWeight: 700, marginTop: 6 }}>{`₹${totalPrice}`}</div>
              </div>
            </div>

            <Button style={{ position: 'relative', left: 35}} className="proceed-btn" variant="contained" sx={{ width: '100%' }} disabled={selectedSeats.length === 0} onClick={openConfirm}>
              PROCEED
            </Button>
            <Dialog open={confirmOpen} onClose={closeConfirm} aria-labelledby="confirm-dialog-title">
              <DialogTitle id="confirm-dialog-title">Confirm Booking</DialogTitle>
              <DialogContent>
                <div className="booking-summary">
                  <div className="left">
                    <Typography sx={{ mb: 1 }}>
                      <strong>{movieTitle || 'this movie'}</strong>
                    </Typography>
                    <Typography sx={{ mb: 1, color: '#666' }}>
                      {movieGenre}{movieDuration ? ' • ' + movieDuration : ''}
                    </Typography>
                    <Typography sx={{ mb: 1 }}>
                      <strong>{selectedSeats.length}</strong> seats selected
                    </Typography>
                    <div style={{ marginBottom: 12, lineHeight: 1.45 }}>
                      <div style={{ color: '#666', marginBottom: 6 }}>Show</div>
                      <div style={{ fontWeight: 700, marginBottom: 6 }}>Start: {showStart ? new Date(showStart).toLocaleString() : 'TBA'}</div>
                      {showEnd ? (
                        <div style={{ color: '#666', fontSize: 13, marginBottom: 6 }}>End: {new Date(showEnd).toLocaleString()}</div>
                      ) : null}
                      {auditoriumName ? (
                        <div style={{ marginTop: 6, color: '#444' }}>Auditorium: <strong>{auditoriumName}</strong></div>
                      ) : null}
                    </div>
                  </div>

                  <div className="right">
                    <div style={{ marginBottom: 10, color: '#666' }}>Seats</div>
                    <div className="seats-list">
                      {selectedSeatLabels.length ? selectedSeatLabels.map((s) => {
                        const r = s.split('-')[0]
                        const rIdx = rows.indexOf(r)
                        const isP = rIdx >= maxRows - premiumCount
                        const pillClass = `seat-pill ${isP ? 'premium' : 'regular'}`
                        const perPrice = isP ? (pricePremium ?? 0) : (priceRegular ?? 0)
                        return (
                          <div key={s} className={pillClass}>
                            <span style={{ marginRight: 6 }}>{s}</span>
                            <small style={{ color: '#666', fontWeight: 500 }}>{`₹${perPrice}`}</small>
                          </div>
                        )
                      }) : <div style={{ color: '#999' }}>No seats</div>}
                    </div>

                    <div style={{ marginTop: 12, borderTop: '1px solid #eee', paddingTop: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#666' }}>
                        <div>Per-seat</div>
                        <div>{`₹${priceRegular ?? 0} / ${pricePremium ?? 0}`}</div>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontWeight: 700 }}>
                        <div>Total</div>
                        <div>{`₹${totalPrice}`}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </DialogContent>
              <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={closeConfirm} sx={{ color: '#1976d2' }}>Cancel</Button>
                <Button onClick={() => { closeConfirm(); proceedToPayment() }} variant="contained" sx={{ backgroundColor: '#f84464' }}>
                  Proceed to Payment
                </Button>
              </DialogActions>
            </Dialog>
          </Box>
          </Box>
        </Box>
      {/* </Box> */}
      </div>
  )
}

export default SeatLayout
