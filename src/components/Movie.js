import React,{useState,useEffect} from 'react'
import {useParams, useNavigate} from 'react-router-dom'
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import NavBar from './NavBar';
import { getToken } from './auth';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';


function Movie() {

const { id } = useParams()
let [movie,setMovie] = useState({})
let [shows,setShows] = useState([])
let navigate = useNavigate()

// const token = localStorage.getItem("Authorization")

const getMovie = async () => {
  try {
    const API = process.env.REACT_APP_API_URL || "";
    const token = getToken();

    const res = await fetch(`${API}/movies/${id}`, {
      method: 'GET',
      headers: {
        "Authorization": token,
        "Content-Type": "application/json",
      }
    })

    // If response is not OK, log and set empty movie to avoid crashing the UI
    if (!res.ok) {
      console.error('Failed to fetch movie:', res.status, res.statusText)
      setMovie({})
      return
    }

    // Check content-type before parsing JSON to avoid "Unexpected end of JSON input"
    const contentType = res.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      try {
        const data = await res.json()
        setMovie(data || {})
      } catch (err) {
        // JSON parse error (empty body or malformed JSON)
        console.error('Error parsing JSON response for movie:', err)
        setMovie({})
      }
    } else {
      // If backend returned no JSON (empty body or html), handle gracefully
      const text = await res.text()
      if (!text) {
        setMovie({})
      } else {
        try {
          // attempt to parse if it contains JSON-like content
          setMovie(JSON.parse(text))
        } catch (err) {
          console.warn('Received non-JSON response for movie, ignoring body', err)
          setMovie({})
        }
      }
    }
  } catch (err) {
    console.error('Network or fetch error while getting movie:', err)
    setMovie({})
  }
}

const getShows = async () => {
  // Use only the working endpoint: /movies/:id/shows (via API gateway)
  try {
    const token = getToken();
    const API = process.env.REACT_APP_API_URL || "";
    const res = await fetch(`${API}/movies/${id}/shows`, {
      method: "GET",
      headers: {
        "Authorization": token,
        "Content-Type": "application/json"
      }
    });
    if (!res.ok) { setShows([]); return }
    const ct = res.headers.get('content-type') || ''
    if (!ct.includes('application/json')) { setShows([]); return }
    const list = await res.json()
    setShows(Array.isArray(list) ? list : [])
  } catch (err) {
    console.warn('Error fetching shows', err)
    setShows([])
  }
}

useEffect(() => {
  getMovie()
  getShows()
}, [id])


// helper to format show start time to a friendlier label
const formatShowTime = (iso) => {
  if (!iso) return 'TBA'
  const d = new Date(iso)
  try {
    const datePart = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
    const timePart = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })
    return `${datePart} • ${timePart}`
  } catch (e) {
    return d.toString()
  }
}

  return <>
  <NavBar/>
  <Box sx={{background: 'linear-gradient(180deg,#0b0b0b 0%, #070707 100%)',paddingTop:4,pb:6}}>
    <Box sx={{width:{xs:'94%',md:'84%'},margin:"0px auto",display:"flex",flexDirection:{xs:"column",sm:"row"},alignItems:'flex-start',gap:4}}>
      <Box sx={{flex:'0 0 280px'}}>
        <Box
          component="img"
          sx={{
            margin:0,
            objectFit:'cover',
            objectPosition:'center',
            height: { xs: 360, md: 460  },
            width: '100%',
            borderRadius:2,
            boxShadow: '0 18px 40px rgba(2,6,23,0.7)',
            border: '1px solid rgba(255,255,255,0.03)'
          }}
          alt={movie.name || movie.title || 'poster'}
          src={movie.poster || movie.posterUrl || movie.image}
        />
      </Box>

      <Box sx={{flex:1,color:'whitesmoke',pr:2}}>
        <Typography variant="h4" sx={{fontWeight:700,mb:1,letterSpacing:0.2}}>{movie.name || movie.title}</Typography>
        <Stack direction="row" spacing={1} alignItems="center" sx={{mb:1,flexWrap:'wrap'}}>
          <Chip label={movie.language || movie.lang || 'English'} size="small" sx={{background:'#232323',color:'#fff',borderRadius:2}} />
          <Chip label={movie.duration || movie.length || ''} size="small" sx={{background:'#232323',color:'#fff',borderRadius:2}} />
          <Box sx={{display:'flex',alignItems:'center',gap:0.5}}>
            <span style={{color:'#FFD54A',fontSize:16}}>★</span>
            <Typography variant="body2" sx={{color:'whitesmoke'}}>{movie.rating ?? '-'}</Typography>
          </Box>
        </Stack>

        <Typography variant="body1" sx={{color:'#ddd',mb:2,lineHeight:1.6,maxWidth:900}}>{movie.summary || movie.description || ''}</Typography>

        {/* Shows / timings in a Paper card with accent */}
        <Paper elevation={4} sx={{p:0,borderRadius:2,maxWidth:680,overflow:'visible',position:'relative'}}>
          <Box sx={{display:'flex',alignItems:'stretch'}}>
            <Box sx={{width:8,background:'linear-gradient(180deg,#ff3a44,#f8446b)',borderRadius:'8px 0 0 8px'}} />
            <Box sx={{p:2,flex:1,background:'#fff',borderRadius:'0 8px 8px 0'}}>
              <Typography variant="subtitle1" sx={{fontWeight:700,mb:1}}>Shows & Tickets</Typography>
              <Divider sx={{mb:1}} />
              {shows.length === 0 ? (
                <Typography variant="body2" sx={{color:'#666'}}>No scheduled shows available.</Typography>
              ) : (
                <Stack spacing={1}>
                  {shows.map((s) => {
                    const timeLabel = formatShowTime(s.startTime)
                    return (
                      <Box key={s.id} sx={{display:'flex',justifyContent:'space-between',alignItems:'center',gap:2,py:1,px:1,borderRadius:1,'&:hover':{background:'#fafafa'}}}>
                        <Box>
                          <Typography variant="body2" sx={{fontWeight:700}}>{timeLabel}</Typography>
                          <Typography variant="caption" sx={{color:'#666'}}>{s.auditorium || 'Auditorium'}</Typography>
                        </Box>
                        <Box sx={{display:'flex',gap:1,alignItems:'center'}}>
                          <Button size="small" variant="contained" sx={{background:'linear-gradient(90deg,#ff3a44,#f8446b)',textTransform:'none',boxShadow:'0 6px 16px rgba(248,68,107,0.18)'}} onClick={(e)=>{e.stopPropagation(); navigate(`/bookmyshow/seat-layout/${s.id}`)}}>Book</Button>
                        </Box>
                      </Box>
                    )
                  })}
                </Stack>
              )}
            </Box>
          </Box>
        </Paper>

      </Box>
    </Box>
  </Box>

  {/* About + Cast on dark background (no white footer) */}
  <Box sx={{width:{xs:'94%',md:'84%'},margin:'28px auto',color:'whitesmoke'}}>
    <Box sx={{pb:2,borderBottom:'1px solid rgba(255,255,255,0.06)',mb:2}}>
      <Typography variant="h6" sx={{mb:1,color:'#fff'}}>About the Movie</Typography>
      <Typography variant="body2" sx={{fontWeight:400,fontSize:14,color:'rgba(255,255,255,0.85)'}}>{movie.summary || movie.description || ''}</Typography>
    </Box>

    <Box sx={{display:'flex',gap:4,flexWrap:'wrap',pt:3}}>
      {[{img:movie.castimg,name:movie.cast},{img:movie.cast1img,name:movie.cast1},{img:movie.cast2img,name:movie.cast2}].map((c,idx)=> (
        c.name ? (
          <Box key={idx} sx={{textAlign:'center',width:120}}>
            <Box component="img" src={c.img} alt={c.name} sx={{width:110,height:110,objectFit:'cover',borderRadius:'50%',boxShadow:'0 8px 18px rgba(0,0,0,0.6)'}} />
            <Typography variant="body2" sx={{fontWeight:600,mt:1,color:'rgba(255,255,255,0.95)'}}>{c.name}</Typography>
          </Box>
        ) : null
      ))}
    </Box>
  </Box>
  </>
}

// function ParticularMovie({movie}){
// return<>

// </>
// }

export default Movie