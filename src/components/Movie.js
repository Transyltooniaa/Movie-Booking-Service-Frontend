import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import CircularProgress from '@mui/material/CircularProgress';
import NavBar from './NavBar';
import { getToken } from './auth';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';

function Movie() {
  const { id } = useParams();
  const [movie, setMovie] = useState({});
  const [shows, setShows] = useState([]);
  const [loadingMovie, setLoadingMovie] = useState(true);
  const [loadingShows, setLoadingShows] = useState(true);
  const navigate = useNavigate();

  const getMovie = async () => {
    setLoadingMovie(true);
    try {
      const API = process.env.REACT_APP_API_URL || "";
      const token = getToken();

      const res = await fetch(`${API}/movies/${id}`, {
        method: 'GET',
        headers: {
          "Authorization": token,
          "Content-Type": "application/json",
        }
      });

      if (!res.ok) {
        console.error('Failed to fetch movie:', res.status, res.statusText);
        setMovie({});
        return;
      }

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        try {
          const data = await res.json();
          setMovie(data || {});
        } catch (err) {
          console.error('Error parsing JSON response for movie:', err);
          setMovie({});
        }
      } else {
        const text = await res.text();
        if (!text) {
          setMovie({});
        } else {
          try {
            setMovie(JSON.parse(text));
          } catch (err) {
            console.warn('Received non-JSON response for movie, ignoring body', err);
            setMovie({});
          }
        }
      }
    } catch (err) {
      console.error('Network or fetch error while getting movie:', err);
      setMovie({});
    } finally {
      setLoadingMovie(false);
    }
  };

  const getShows = async () => {
    setLoadingShows(true);
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
      
      if (!res.ok) {
        setShows([]);
        return;
      }
      
      const ct = res.headers.get('content-type') || '';
      if (!ct.includes('application/json')) {
        setShows([]);
        return;
      }
      
      const list = await res.json();
      setShows(Array.isArray(list) ? list : []);
    } catch (err) {
      console.warn('Error fetching shows', err);
      setShows([]);
    } finally {
      setLoadingShows(false);
    }
  };

  useEffect(() => {
    getMovie();
    getShows();
  }, [id]);

  const formatShowTime = (iso) => {
    if (!iso) return 'TBA';
    const d = new Date(iso);
    try {
      const datePart = d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
      const timePart = d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
      return `${datePart} • ${timePart}`;
    } catch (e) {
      return d.toString();
    }
  };

  return (
    <>
      <NavBar />
      
      {/* Hero Section with Backdrop */}
      <Box sx={{
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f0f1e 100%)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundImage: loadingMovie ? 'none' : `url(${movie.poster || movie.posterUrl || movie.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.08,
          filter: 'blur(40px)',
          transform: 'scale(1.1)'
        }
      }}>
        <Box sx={{
          width: { xs: '94%', sm: '90%', md: '88%', lg: '84%' },
          margin: "0px auto",
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          alignItems: 'flex-start',
          gap: 4,
          pt: 5,
          pb: 6,
          position: 'relative',
          zIndex: 1
        }}>
          {/* Poster */}
          <Box sx={{ flex: '0 0 auto', width: { xs: '100%', sm: 320, md: 300 } }}>
            {loadingMovie ? (
              <Skeleton 
                variant="rectangular" 
                width="100%" 
                height={450} 
                sx={{ borderRadius: 3, background: 'rgba(255,255,255,0.05)' }} 
              />
            ) : (
              <Box
                component="img"
                sx={{
                  objectFit: 'cover',
                  objectPosition: 'center',
                  height: { xs: 400, md: 480 },
                  width: '100%',
                  borderRadius: 3,
                  boxShadow: '0 20px 60px rgba(0,0,0,0.8)',
                  border: '2px solid rgba(255,255,255,0.1)',
                  transition: 'transform 320ms ease',
                  '&:hover': {
                    transform: 'scale(1.02) translateY(-4px)',
                    boxShadow: '0 24px 70px rgba(0,0,0,0.9)'
                  }
                }}
                alt={movie.name || movie.title || 'poster'}
                src={movie.poster || movie.posterUrl || movie.image}
              />
            )}
          </Box>

          {/* Movie Info */}
          <Box sx={{ flex: 1, color: 'whitesmoke', pr: { xs: 0, md: 2 } }}>
            {loadingMovie ? (
              <>
                <Skeleton variant="text" width="70%" height={56} sx={{ mb: 2, background: 'rgba(255,255,255,0.05)' }} />
                <Skeleton variant="text" width="50%" height={32} sx={{ mb: 2, background: 'rgba(255,255,255,0.05)' }} />
                <Skeleton variant="rectangular" width="100%" height={120} sx={{ mb: 3, borderRadius: 2, background: 'rgba(255,255,255,0.05)' }} />
              </>
            ) : (
              <>
                <Typography 
                  variant="h3" 
                  sx={{ 
                    fontWeight: 800, 
                    mb: 1.5, 
                    letterSpacing: 0.5,
                    background: 'linear-gradient(135deg, #fff 0%, #e0e0e0 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 2px 20px rgba(255,255,255,0.1)',
                    fontSize: { xs: 28, sm: 36, md: 42 }
                  }}
                >
                  {movie.name || movie.title}
                </Typography>

                <Stack 
                  direction="row" 
                  spacing={1.5} 
                  alignItems="center" 
                  sx={{ mb: 2.5, flexWrap: 'wrap', gap: 1 }}
                >
                  <Chip 
                    label={movie.language || movie.lang || 'English'} 
                    size="medium" 
                    sx={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: '#fff',
                      borderRadius: 2,
                      fontWeight: 700,
                      fontSize: 13,
                      px: 0.5,
                      boxShadow: '0 4px 14px rgba(102,126,234,0.3)'
                    }} 
                  />
                  <Chip 
                    label={movie.duration || movie.length || ''} 
                    size="medium" 
                    sx={{ 
                      background: 'rgba(255,255,255,0.15)',
                      backdropFilter: 'blur(10px)',
                      color: '#fff',
                      borderRadius: 2,
                      fontWeight: 700,
                      fontSize: 13,
                      border: '1px solid rgba(255,255,255,0.2)',
                      px: 0.5
                    }} 
                  />
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 0.5,
                    background: 'rgba(255,213,74,0.2)',
                    backdropFilter: 'blur(10px)',
                    px: 1.5,
                    py: 0.5,
                    borderRadius: 2,
                    border: '1px solid rgba(255,213,74,0.3)'
                  }}>
                    <span style={{ color: '#FFD54A', fontSize: 20 }}>★</span>
                    <Typography variant="body1" sx={{ color: '#FFD54A', fontWeight: 700 }}>
                      {movie.rating ?? '-'}
                    </Typography>
                  </Box>
                </Stack>

                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: 'rgba(255,255,255,0.9)', 
                    mb: 3.5, 
                    lineHeight: 1.8,
                    maxWidth: 900,
                    fontSize: { xs: 14, sm: 15, md: 16 },
                    fontWeight: 400
                  }}
                >
                  {movie.summary || movie.description || ''}
                </Typography>
              </>
            )}

            {/* Shows / Tickets Section */}
            <Paper 
              elevation={0} 
              sx={{ 
                p: 0, 
                borderRadius: 3, 
                maxWidth: 720, 
                overflow: 'visible', 
                position: 'relative',
                background: 'rgba(255,255,255,0.98)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255,255,255,0.2)',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'stretch' }}>
                <Box sx={{ 
                  width: 6, 
                  background: 'linear-gradient(180deg,#ff3a44,#f8446b)', 
                  borderRadius: '12px 0 0 12px' 
                }} />
                <Box sx={{ p: 3, flex: 1, background: 'transparent' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Typography 
                      variant="h6" 
                      sx={{ 
                        fontWeight: 800, 
                        color: '#1a1a1a',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      🎬 Shows & Tickets
                    </Typography>
                    {loadingShows && (
                      <CircularProgress size={20} sx={{ color: '#ff3a44' }} />
                    )}
                  </Box>
                  
                  <Divider sx={{ mb: 2, borderColor: 'rgba(0,0,0,0.08)' }} />
                  
                  {loadingShows ? (
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 4, gap: 2 }}>
                      <CircularProgress size={40} thickness={4} sx={{ color: '#ff3a44' }} />
                      <Typography variant="body2" sx={{ color: '#666', fontWeight: 600 }}>
                        Loading available shows...
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {[...Array(3)].map((_, i) => (
                          <Box
                            key={i}
                            sx={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: '#ff3a44',
                              animation: 'bounce 1.4s infinite ease-in-out',
                              animationDelay: `${i * 0.16}s`,
                              '@keyframes bounce': {
                                '0%, 80%, 100%': { transform: 'scale(0)' },
                                '40%': { transform: 'scale(1)' }
                              }
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  ) : shows.length === 0 ? (
                    <Box sx={{ 
                      textAlign: 'center', 
                      py: 4,
                      px: 2,
                      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
                      borderRadius: 2
                    }}>
                      <Typography variant="h6" sx={{ mb: 1, color: '#555', fontWeight: 700 }}>
                        😔 No Shows Available
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#777' }}>
                        Check back soon for upcoming showtimes
                      </Typography>
                    </Box>
                  ) : (
                    <Stack spacing={1.5}>
                      {shows.map((s, idx) => {
                        const timeLabel = formatShowTime(s.startTime);
                        return (
                          <Box 
                            key={s.id} 
                            sx={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center', 
                              gap: 2, 
                              py: 1.5, 
                              px: 2, 
                              borderRadius: 2,
                              background: idx % 2 === 0 ? 'rgba(102,126,234,0.04)' : 'rgba(248,68,107,0.04)',
                              border: '1px solid',
                              borderColor: idx % 2 === 0 ? 'rgba(102,126,234,0.1)' : 'rgba(248,68,107,0.1)',
                              transition: 'all 200ms ease',
                              '&:hover': { 
                                background: idx % 2 === 0 ? 'rgba(102,126,234,0.08)' : 'rgba(248,68,107,0.08)',
                                transform: 'translateX(4px)',
                                boxShadow: '0 4px 12px rgba(0,0,0,0.08)'
                              }
                            }}
                          >
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body1" sx={{ fontWeight: 700, color: '#1a1a1a', mb: 0.25 }}>
                                {timeLabel}
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#666', fontWeight: 600 }}>
                                {s.auditorium || 'Auditorium'} • {s.seatsAvailable || 'Seats'} available
                              </Typography>
                            </Box>
                            <Button 
                              size="medium" 
                              variant="contained" 
                              sx={{ 
                                background: 'linear-gradient(90deg,#ff3a44,#f8446b)',
                                textTransform: 'none',
                                fontWeight: 700,
                                boxShadow: '0 6px 20px rgba(248,68,107,0.3)',
                                px: 3,
                                py: 1,
                                borderRadius: 2,
                                '&:hover': {
                                  background: 'linear-gradient(90deg,#e8333d,#e03d5e)',
                                  boxShadow: '0 8px 24px rgba(248,68,107,0.4)',
                                  transform: 'translateY(-2px)'
                                },
                                transition: 'all 200ms ease'
                              }} 
                              onClick={(e) => {
                                e.stopPropagation(); 
                                navigate(`/bookmyshow/seat-layout/${s.id}`);
                              }}
                            >
                              Book Seats
                            </Button>
                          </Box>
                        );
                      })}
                    </Stack>
                  )}
                </Box>
              </Box>
            </Paper>
          </Box>
        </Box>
      </Box>

      {/* About Section */}
      <Box sx={{ 
        background: 'linear-gradient(180deg, #0f0f1e 0%, #1a1a2e 100%)',
        py: 6
      }}>
        <Box sx={{ 
          width: { xs: '94%', sm: '90%', md: '88%', lg: '84%' }, 
          margin: '0 auto', 
          color: 'whitesmoke' 
        }}>
          <Box sx={{ 
            pb: 3, 
            mb: 4,
            borderBottom: '2px solid',
            borderImage: 'linear-gradient(90deg, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0.05) 100%) 1'
          }}>
            <Typography 
              variant="h5" 
              sx={{ 
                mb: 2, 
                color: '#fff', 
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
              }}
            >
              <Box sx={{ 
                width: 4, 
                height: 28, 
                background: 'linear-gradient(180deg,#ff3a44,#f8446b)',
                borderRadius: 1
              }} />
              About the Movie
            </Typography>
            {loadingMovie ? (
              <>
                <Skeleton variant="text" width="100%" sx={{ background: 'rgba(255,255,255,0.05)' }} />
                <Skeleton variant="text" width="95%" sx={{ background: 'rgba(255,255,255,0.05)' }} />
                <Skeleton variant="text" width="90%" sx={{ background: 'rgba(255,255,255,0.05)' }} />
              </>
            ) : (
              <Typography 
                variant="body1" 
                sx={{ 
                  fontWeight: 400, 
                  fontSize: { xs: 14, md: 15 }, 
                  color: 'rgba(255,255,255,0.85)',
                  lineHeight: 1.8,
                  maxWidth: 1000
                }}
              >
                {movie.summary || movie.description || ''}
              </Typography>
            )}
          </Box>

          {/* Cast Section */}
          <Box>
            <Typography 
              variant="h5" 
              sx={{ 
                mb: 3, 
                color: '#fff', 
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5
              }}
            >
              <Box sx={{ 
                width: 4, 
                height: 28, 
                background: 'linear-gradient(180deg,#667eea,#764ba2)',
                borderRadius: 1
              }} />
              Cast & Crew
            </Typography>
            
            <Box sx={{ 
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
              gap: 3,
              pt: 2
            }}>
              {loadingMovie ? (
                [...Array(3)].map((_, i) => (
                  <Box key={i} sx={{ textAlign: 'center' }}>
                    <Skeleton 
                      variant="circular" 
                      width={130} 
                      height={130} 
                      sx={{ margin: '0 auto', background: 'rgba(255,255,255,0.05)' }} 
                    />
                    <Skeleton 
                      variant="text" 
                      width="80%" 
                      sx={{ margin: '12px auto 0', background: 'rgba(255,255,255,0.05)' }} 
                    />
                  </Box>
                ))
              ) : (
                [
                  { img: movie.castimg, name: movie.cast },
                  { img: movie.cast1img, name: movie.cast1 },
                  { img: movie.cast2img, name: movie.cast2 }
                ].map((c, idx) => (
                  c.name ? (
                    <Box 
                      key={idx} 
                      sx={{ 
                        textAlign: 'center',
                        transition: 'transform 280ms ease',
                        '&:hover': {
                          transform: 'translateY(-8px)'
                        }
                      }}
                    >
                      <Box 
                        component="img" 
                        src={c.img} 
                        alt={c.name} 
                        sx={{ 
                          width: 130, 
                          height: 130, 
                          objectFit: 'cover', 
                          borderRadius: '50%', 
                          boxShadow: '0 8px 24px rgba(0,0,0,0.6)',
                          border: '3px solid rgba(255,255,255,0.1)',
                          transition: 'all 280ms ease',
                          '&:hover': {
                            boxShadow: '0 12px 32px rgba(0,0,0,0.8)',
                            borderColor: 'rgba(255,255,255,0.2)'
                          }
                        }} 
                      />
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: 700, 
                          mt: 1.5, 
                          color: 'rgba(255,255,255,0.95)',
                          fontSize: 14
                        }}
                      >
                        {c.name}
                      </Typography>
                    </Box>
                  ) : null
                ))
              )}
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
}

export default Movie;