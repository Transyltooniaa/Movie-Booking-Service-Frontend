import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { getToken } from './auth';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import StarIcon from '@mui/icons-material/Star';
import Skeleton from '@mui/material/Skeleton';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import NavBar from './NavBar';
import { MyContext } from './Context';

function Movies() {
  const { moviesCache, setMoviesCache } = useContext(MyContext);
  const [movies, setMovies] = useState(moviesCache.data || []);
  const [loading, setLoading] = useState(movies.length === 0);
  const CACHE_TTL_MS = 5 * 60 * 1000;

  useEffect(() => {
    if (
      moviesCache.data.length > 0 &&
      Date.now() - moviesCache.fetchedAt < CACHE_TTL_MS
    ) {
      setMovies(moviesCache.data);
      setLoading(false);
      return;
    }

    const API = process.env.REACT_APP_API_URL || "";
    const token = getToken();

    setLoading(true);

    fetch(`${API}/movies`, {
      headers: {
        "Authorization": token,
        "Content-Type": "application/json"
      }
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        setMovies(data);
        setMoviesCache({ data, fetchedAt: Date.now() });
      })
      .catch(err => console.error("Error fetching movies:", err))
      .finally(() => setLoading(false));
  }, []);

  const nowShowing = movies.filter((m) => m.active);
  const comingSoon = movies.filter((m) => !m.active);

  return (
    <>
      <NavBar />

      <Box sx={{ 
        width: { xs: '94%', sm: '92%', md: '88%', lg: '85%' }, 
        margin: '0 auto',
        pt: 3,
        pb: 6
      }}>
        {/* Hero Section */}
        <Box sx={{ 
          mb: 4,
          p: 3,
          borderRadius: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            right: 0,
            width: '40%',
            height: '100%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
            pointerEvents: 'none'
          }
        }}>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 0.5, position: 'relative', zIndex: 1 }}>
            Movies in Theaters
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.95, position: 'relative', zIndex: 1 }}>
            Book your tickets for the best cinematic experience
          </Typography>
        </Box>

        {/* Now Showing Section */}
        <Box sx={{ mb: 5 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 2.5,
            pb: 1,
            borderBottom: '3px solid',
            borderImage: 'linear-gradient(90deg, #ff3a44, #f8446b) 1'
          }}>
            <Typography 
              variant="h5" 
              component="h2" 
              sx={{ 
                fontWeight: 800,
                color: '#1a1a1a',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              Now Showing
              <Box component="span" sx={{ 
                width: 8, 
                height: 8, 
                borderRadius: '50%', 
                background: '#4caf50',
                animation: 'pulse 2s infinite',
                '@keyframes pulse': {
                  '0%, 100%': { opacity: 1 },
                  '50%': { opacity: 0.5 }
                }
              }} />
            </Typography>
            <Chip 
              label={`${nowShowing.length} movies`} 
              sx={{ 
                background: 'linear-gradient(90deg, #ff3a44, #f8446b)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 13
              }} 
            />
          </Box>

          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(auto-fill, minmax(260px, 1fr))',
              sm: 'repeat(auto-fill, minmax(240px, 1fr))',
              md: 'repeat(auto-fill, minmax(260px, 1fr))'
            },
            gap: 3,
            pb: 2
          }}>
            {loading && Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
            {!loading && nowShowing.map((movie) => (
              <MovieCard key={movie.id} movie={movie} showBook />
            ))}
          </Box>
        </Box>

        <Divider sx={{ 
          my: 4, 
          borderWidth: 2,
          borderColor: '#e0e0e0',
          borderRadius: 1
        }} />

        {/* Coming Soon Section */}
        <Box>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            mb: 2.5,
            pb: 1,
            borderBottom: '3px solid',
            borderImage: 'linear-gradient(90deg, #667eea, #764ba2) 1'
          }}>
            <Typography 
              variant="h5" 
              component="h3" 
              sx={{ 
                fontWeight: 800,
                color: '#1a1a1a',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              Coming Soon
              <Box component="span" sx={{ fontSize: 20 }}>🎬</Box>
            </Typography>
            <Chip 
              label={`${comingSoon.length} upcoming`}
              sx={{ 
                background: 'linear-gradient(90deg, #667eea, #764ba2)',
                color: '#fff',
                fontWeight: 700,
                fontSize: 13
              }}
            />
          </Box>

          <Box sx={{ 
            display: 'grid',
            gridTemplateColumns: {
              xs: 'repeat(auto-fill, minmax(260px, 1fr))',
              sm: 'repeat(auto-fill, minmax(240px, 1fr))',
              md: 'repeat(auto-fill, minmax(260px, 1fr))'
            },
            gap: 3,
            pb: 2
          }}>
            {loading && Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
            {!loading && comingSoon.map((movie) => (
              <MovieCard key={movie.id} movie={movie} showBook={false} />
            ))}
          </Box>
        </Box>
      </Box>
    </>
  );
}

function MovieCard({ movie, showBook = true }) {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <Box
      sx={{
        cursor: showBook ? 'pointer' : 'default',
        borderRadius: 3,
        overflow: 'hidden',
        background: '#fff',
        boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
        transition: 'all 280ms cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        '&:hover': showBook ? { 
          transform: 'translateY(-8px)', 
          boxShadow: '0 16px 40px rgba(0,0,0,0.16)'
        } : undefined,
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.02) 100%)',
          pointerEvents: 'none',
          opacity: 0,
          transition: 'opacity 280ms ease'
        },
        '&:hover::after': showBook ? { opacity: 1 } : undefined
      }}
      onClick={() => {
        // Disable navigation for upcoming movies/cards
        if (!showBook) return;
        const token = getToken();
        if (!token) return navigate('/users/login');
        navigate(`/bookmyshow/movies/${movie.id}`);
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={showBook ? `Open ${movie.title}` : `${movie.title} (coming soon, booking disabled)`}
      tabIndex={showBook ? 0 : -1}
    >
      <Box sx={{ position: 'relative', height: 380, width: '100%', overflow: 'hidden' }}>
        <Box
          component="img"
          src={movie.posterUrl}
          alt={movie.title}
          sx={{ 
            height: '100%', 
            width: '100%', 
            objectFit: 'cover', 
            display: 'block',
            transition: 'transform 320ms ease',
            transform: isHovered && showBook ? 'scale(1.08)' : 'scale(1)'
          }}
        />

        {/* Play button overlay on hover */}
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          opacity: isHovered && showBook ? 1 : 0,
          transition: 'opacity 240ms ease',
          pointerEvents: 'none',
          zIndex: 2
        }}>
          <Box sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.95)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(0,0,0,0.3)'
          }}>
            <PlayArrowIcon sx={{ fontSize: 36, color: '#ff3a44', ml: 0.5 }} />
          </Box>
        </Box>

        {/* Gradient overlay */}
        <Box
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            px: 1.5,
            py: 1.5,
            background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.5) 35%, rgba(0,0,0,0.85) 100%)',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
            <Box sx={{ fontWeight: 800, fontSize: 17, lineHeight: 1.3, flex: 1 }}>
              {movie.title}
            </Box>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 0.5,
              background: 'rgba(255,213,74,0.2)',
              backdropFilter: 'blur(8px)',
              px: 1,
              py: 0.5,
              borderRadius: 2
            }}>
              <StarIcon sx={{ color: '#FFD54A', fontSize: 18 }} />
              <Box sx={{ fontSize: 14, fontWeight: 700 }}>{movie.rating ?? '-'}</Box>
            </Box>
          </Box>
          <Box sx={{ fontSize: 13, color: 'rgba(255,255,255,0.92)', fontWeight: 500 }}>
            {movie.genre}
          </Box>
        </Box>
      </Box>

      <Box sx={{ p: 1.75, background: '#fff' }}>
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1.25 }}>
          <Chip 
            label={movie.language} 
            size="small" 
            sx={{ 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: '#fff',
              fontWeight: 600,
              fontSize: 11
            }} 
          />
          <Chip 
            label={movie.duration} 
            size="small" 
            sx={{ 
              background: '#f5f5f5',
              color: '#444',
              fontWeight: 600,
              fontSize: 11,
              border: '1px solid #e0e0e0'
            }} 
          />
          <Chip 
            label={new Date(movie.releaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} 
            size="small" 
            sx={{ 
              background: '#f5f5f5',
              color: '#444',
              fontWeight: 600,
              fontSize: 11,
              border: '1px solid #e0e0e0'
            }} 
          />
        </Box>

        <Box sx={{ 
          fontSize: 13, 
          color: '#555', 
          minHeight: 42,
          lineHeight: 1.5,
          mb: 1.5
        }}>
          {movie.description ? (
            movie.description.length > 100 
              ? movie.description.slice(0, 100) + '...' 
              : movie.description
          ) : 'Experience an unforgettable cinematic journey.'}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 1 }}>
          {showBook ? (
            <Button
              variant="contained"
              size="medium"
              onClick={(e) => { 
                e.stopPropagation(); 
                const token = getToken(); 
                if (!token) return navigate('/users/login'); 
                navigate(`/bookmyshow/movies/${movie.id}`); 
              }}
              sx={{ 
                textTransform: 'none',
                fontWeight: 700,
                fontSize: 14,
                background: 'linear-gradient(90deg,#ff3a44,#f8446b)',
                boxShadow: '0 4px 14px rgba(248,68,107,0.3)',
                px: 2.5,
                py: 1,
                borderRadius: 2,
                '&:hover': {
                  background: 'linear-gradient(90deg,#e8333d,#e03d5e)',
                  boxShadow: '0 6px 20px rgba(248,68,107,0.4)',
                  transform: 'translateY(-2px)'
                },
                transition: 'all 200ms ease'
              }}
            >
              Book Now
            </Button>
          ) : (
            <Button
              variant="outlined"
              size="medium"
              onClick={(e) => { 
                e.stopPropagation();
              }}
              sx={{ 
                textTransform: 'none',
                fontWeight: 700,
                fontSize: 14,
                color: '#667eea',
                borderColor: '#667eea',
                borderWidth: 2,
                px: 2.5,
                py: 0.75,
                borderRadius: 2,
                '&:hover': {
                  borderWidth: 2,
                  borderColor: '#764ba2',
                  background: 'rgba(102,126,234,0.08)',
                  transform: 'translateY(-2px)'
                },
                transition: 'all 200ms ease'
              }}
            >
              Notify Me
            </Button>
          )}

          <Box sx={{ 
            fontSize: 11, 
            color: '#888',
            fontWeight: 600,
            textAlign: 'right',
            lineHeight: 1.3
          }}>
            {movie.active ? (
              <Box sx={{ color: '#4caf50' }}>● Now Playing</Box>
            ) : (
              <Box>
                Releases<br />
                {new Date(movie.releaseDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

function SkeletonCard() {
  return (
    <Box sx={{ borderRadius: 3, overflow: 'hidden', background: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <Skeleton variant="rectangular" width="100%" height={380} />
      <Box sx={{ p: 1.75 }}>
        <Box sx={{ display: 'flex', gap: 0.75, mb: 1.25 }}>
          <Skeleton width={60} height={24} sx={{ borderRadius: 2 }} />
          <Skeleton width={70} height={24} sx={{ borderRadius: 2 }} />
          <Skeleton width={65} height={24} sx={{ borderRadius: 2 }} />
        </Box>
        <Skeleton width="100%" height={42} sx={{ mb: 1.5 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Skeleton width={100} height={36} sx={{ borderRadius: 2 }} />
          <Skeleton width={80} height={28} />
        </Box>
      </Box>
    </Box>
  );
}

export default Movies;