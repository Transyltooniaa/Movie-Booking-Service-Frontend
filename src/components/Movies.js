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
import NavBar from './NavBar';
import { MyContext } from './Context';

function Movies() {
  const { moviesCache, setMoviesCache } = useContext(MyContext);
  const [movies, setMovies] = useState(moviesCache.data || []);
  const [loading, setLoading] = useState(movies.length === 0);
  const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  useEffect(() => {
  if (
    moviesCache.data.length > 0 &&
    Date.now() - moviesCache.fetchedAt < CACHE_TTL_MS
  ) {
    setMovies(moviesCache.data);
    setLoading(false);
    return;
  }

  const API = process.env.REACT_APP_API_URL;
  const token = getToken(); // <--- GET JWT TOKEN

  setLoading(true);

  fetch(`${API}/movies`, {
    headers: {
      "Authorization": token,      // <--- SEND JWT
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

      <Box sx={{ width: { xs: '92%', sm: '92%', md: '85%' }, margin: '18px auto' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>Now Showing</Typography>
          <Typography variant="body2" sx={{ color: '#666' }}>{nowShowing.length} movies</Typography>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'flex-start', pb: 3 }}>
          {loading && Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
          {!loading && nowShowing.map((movie) => (
            <MovieCard key={movie.id} movie={movie} showBook />
          ))}
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" component="h3" sx={{ fontWeight: 700 }}>Coming Soon</Typography>
          <Typography variant="body2" sx={{ color: '#666' }}>{comingSoon.length} upcoming</Typography>
        </Box>

        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 4, justifyContent: 'flex-start', pb: 4 }}>
          {loading && Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
          {!loading && comingSoon.map((movie) => (
            <MovieCard key={movie.id} movie={movie} showBook={false} />
          ))}
        </Box>
      </Box>
    </>
  );
}

function MovieCard({ movie, showBook = true }) {
  const navigate = useNavigate();
  return (
    <Box
      sx={{
        width: 250,
        cursor: 'pointer',
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: '0 6px 18px rgba(15,15,15,0.12)',
        transition: 'transform 180ms ease, box-shadow 180ms ease',
        '&:hover': { transform: 'translateY(-6px)', boxShadow: '0 12px 30px rgba(15,15,15,0.18)' }
      }}
      onClick={() => {
        const token = getToken()
        if (!token) return navigate('/users/login')
        navigate(`/bookmyshow/movies/${movie.id}`)
      }}
      aria-label={`Open ${movie.title}`}
    >
      <Box sx={{ position: 'relative', height: 360, width: '100%' }}>
        <Box
          component="img"
          src={movie.posterUrl}
          alt={movie.title}
          sx={{ height: '100%', width: '100%', objectFit: 'cover', display: 'block' }}
        />

        <Box
          sx={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            px: 1.2,
            py: 1,
            background: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.45) 40%, rgba(0,0,0,0.75) 100%)',
            color: '#fff',
            display: 'flex',
            flexDirection: 'column',
            gap: 0.5
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ fontWeight: 700, fontSize: 16 }}>{movie.title}</Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <StarIcon sx={{ color: '#FFD54A', fontSize: 20 }} />
              <Box sx={{ fontSize: 13 }}>{movie.rating ?? '-'}</Box>
            </Box>
          </Box>
          <Box sx={{ fontSize: 12, color: 'rgba(255,255,255,0.95)' }}>{movie.genre}</Box>
        </Box>
      </Box>

      <Box sx={{ p: 1.25, background: '#fff' }}>
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 0.5 }}>
          <Chip label={movie.language} size="small" sx={{ background: '#f3f3f3' }} />
          <Chip label={movie.duration} size="small" sx={{ background: '#f3f3f3' }} />
          <Chip label={new Date(movie.releaseDate).toLocaleDateString()} size="small" sx={{ background: '#f3f3f3' }} />
        </Box>

        <Box sx={{ fontSize: 13, color: '#333', minHeight: 46 }}>
          {movie.description ? (movie.description.length > 120 ? movie.description.slice(0, 120) + '...' : movie.description) : ''}
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1 }}>
          {showBook ? (
            <Button
              variant="contained"
              color="error"
              size="small"
              onClick={(e) => { e.stopPropagation(); const token = getToken(); if (!token) return navigate('/users/login'); navigate(`/bookmyshow/movies/${movie.id}`); }}
              sx={{ textTransform: 'none', background: 'linear-gradient(90deg,#ff3a44,#f8446b)' }}
            >
              Book Now
            </Button>
          ) : (
            <Button
              variant="outlined"
              size="small"
              onClick={(e) => { e.stopPropagation(); /* placeholder for notify action */ }}
              sx={{ textTransform: 'none', color: '#555', borderColor: '#ddd' }}
            >
              Notify Me
            </Button>
          )}

          <Box sx={{ fontSize: 12, color: '#666' }}>{movie.active ? 'Now Showing' : `Releases ${new Date(movie.releaseDate).toLocaleDateString()}`}</Box>
        </Box>
      </Box>
    </Box>
  );
}

function SkeletonCard() {
  return (
    <Box sx={{ width: 250 }}>
      <Skeleton variant="rectangular" width={250} height={360} sx={{ borderRadius: 2 }} />
      <Box sx={{ p: 1.25 }}>
        <Skeleton width="60%" height={24} />
        <Skeleton width="80%" height={18} />
        <Skeleton width="100%" height={46} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
          <Skeleton width={80} height={32} />
          <Skeleton width={90} height={20} />
        </Box>
      </Box>
    </Box>
  );
}


export default Movies;

