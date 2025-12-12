import React, { useContext } from 'react';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Menu from '@mui/material/Menu';
import MenuIcon from '@mui/icons-material/Menu';
import Container from '@mui/material/Container';
import Button from '@mui/material/Button';
import MenuItem from '@mui/material/MenuItem';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import MovieIcon from '@mui/icons-material/Movie';
import ConfirmationNumberIcon from '@mui/icons-material/ConfirmationNumber';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { MyContext } from "../components/Context";
import { clearToken, getToken } from './auth';
import bms from "../image/bms.png";

function NavBar() {
  const { user } = useContext(MyContext);
  const [anchorElNav, setAnchorElNav] = React.useState(null);
  const token = getToken();
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (pathPrefix) => location.pathname.startsWith(pathPrefix);

  const logOut = () => {
    clearToken();
    sessionStorage.removeItem("email");
    sessionStorage.removeItem("role");
    navigate('/users/login');
  };

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  const getUserInitials = () => {
    const name = user?.fullname || user?.fullName || user?.email || 'U';
    return name.charAt(0).toUpperCase();
  };

  return (
    <AppBar 
      sx={{ 
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
        backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.1)'
      }} 
      position="sticky"
    >
      <Container maxWidth="xl">
        <Toolbar disableGutters sx={{ minHeight: { xs: 64, md: 72 } }}>
          {/* Desktop Logo */}
          <Box
            component="a"
            href="/"
            sx={{
              mr: 4,
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              textDecoration: 'none',
              transition: 'transform 200ms ease',
              '&:hover': {
                transform: 'scale(1.05)'
              }
            }}
          >
            <Box
              component="img"
              sx={{
                height: 42,
                width: 'auto',
                filter: 'drop-shadow(0 2px 8px rgba(248,68,107,0.3))'
              }}
              alt="BookMyShow"
              src={bms}
            />
          </Box>

          {/* Mobile Menu Icon */}
          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="menu"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              sx={{ 
                color: 'white',
                '&:hover': {
                  background: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              <MenuIcon />
            </IconButton>
            <Menu
              id="menu-appbar"
              anchorEl={anchorElNav}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              open={Boolean(anchorElNav)}
              onClose={handleCloseNavMenu}
              sx={{
                display: { xs: 'block', md: 'none' },
                '& .MuiPaper-root': {
                  background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
                  color: 'white',
                  minWidth: 220,
                  mt: 1,
                  borderRadius: 2,
                  boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                }
              }}
            >
              <Box sx={{ px: 2, py: 1.5 }}>
                {/* User Info in Mobile Menu */}
                {token && (
                  <>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      <Avatar 
                        sx={{ 
                          width: 40, 
                          height: 40,
                          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                          fontWeight: 700
                        }}
                      >
                        {getUserInitials()}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontSize: 14, fontWeight: 700 }}>
                          {user?.fullname || user?.fullName || 'User'}
                        </Typography>
                        <Typography sx={{ fontSize: 11, opacity: 0.7 }}>
                          {user?.email}
                        </Typography>
                      </Box>
                    </Box>
                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 1.5 }} />
                  </>
                )}

                {/* Movies */}
                <MenuItem 
                  onClick={() => { 
                    handleCloseNavMenu(); 
                    navigate('/bookmyshow/movies'); 
                  }}
                  sx={{
                    borderRadius: 1.5,
                    mb: 0.5,
                    background: isActive('/bookmyshow/movies') ? 'rgba(248,68,107,0.15)' : 'transparent',
                    '&:hover': {
                      background: 'rgba(248,68,107,0.1)'
                    }
                  }}
                >
                  <MovieIcon sx={{ mr: 1.5, fontSize: 20, color: isActive('/bookmyshow/movies') ? '#f84464' : 'white' }} />
                  <Typography sx={{ 
                    fontSize: 14, 
                    fontWeight: 600, 
                    color: isActive('/bookmyshow/movies') ? '#f84464' : 'white'
                  }}>
                    Movies
                  </Typography>
                </MenuItem>

                {/* My Bookings */}
                {token && (
                  <MenuItem 
                    onClick={() => { 
                      handleCloseNavMenu(); 
                      navigate('/users/bookings'); 
                    }}
                    sx={{
                      borderRadius: 1.5,
                      mb: 0.5,
                      background: isActive('/users/bookings') ? 'rgba(248,68,107,0.15)' : 'transparent',
                      '&:hover': {
                        background: 'rgba(248,68,107,0.1)'
                      }
                    }}
                  >
                    <ConfirmationNumberIcon sx={{ mr: 1.5, fontSize: 20, color: isActive('/users/bookings') ? '#f84464' : 'white' }} />
                    <Typography sx={{ 
                      fontSize: 14, 
                      fontWeight: 600,
                      color: isActive('/users/bookings') ? '#f84464' : 'white'
                    }}>
                      My Bookings
                    </Typography>
                  </MenuItem>
                )}

                {!token && (
                  <>
                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 1.5 }} />
                    
                    {/* Signup */}
                    <MenuItem 
                      onClick={() => { 
                        handleCloseNavMenu(); 
                        navigate('/users/signup'); 
                      }}
                      sx={{
                        borderRadius: 1.5,
                        mb: 0.5,
                        background: isActive('/users/signup') ? 'rgba(248,68,107,0.15)' : 'transparent',
                        '&:hover': {
                          background: 'rgba(248,68,107,0.1)'
                        }
                      }}
                    >
                      <PersonAddIcon sx={{ mr: 1.5, fontSize: 20, color: isActive('/users/signup') ? '#f84464' : 'white' }} />
                      <Typography sx={{ 
                        fontSize: 14, 
                        fontWeight: 600,
                        color: isActive('/users/signup') ? '#f84464' : 'white'
                      }}>
                        Signup
                      </Typography>
                    </MenuItem>

                    {/* Login */}
                    <MenuItem 
                      onClick={() => { 
                        handleCloseNavMenu(); 
                        navigate('/users/login'); 
                      }}
                      sx={{
                        borderRadius: 1.5,
                        background: isActive('/users/login') ? 'rgba(248,68,107,0.15)' : 'transparent',
                        '&:hover': {
                          background: 'rgba(248,68,107,0.1)'
                        }
                      }}
                    >
                      <LoginIcon sx={{ mr: 1.5, fontSize: 20, color: isActive('/users/login') ? '#f84464' : 'white' }} />
                      <Typography sx={{ 
                        fontSize: 14, 
                        fontWeight: 600,
                        color: isActive('/users/login') ? '#f84464' : 'white'
                      }}>
                        Login
                      </Typography>
                    </MenuItem>
                  </>
                )}

                {/* Logout */}
                {token && (
                  <>
                    <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', my: 1.5 }} />
                    <MenuItem 
                      onClick={() => { 
                        handleCloseNavMenu(); 
                        logOut(); 
                      }}
                      sx={{
                        borderRadius: 1.5,
                        '&:hover': {
                          background: 'rgba(248,68,107,0.1)'
                        }
                      }}
                    >
                      <LogoutIcon sx={{ mr: 1.5, fontSize: 20 }} />
                      <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                        Logout
                      </Typography>
                    </MenuItem>
                  </>
                )}
              </Box>
            </Menu>
          </Box>

          {/* Mobile Logo */}
          <Box
            component="a"
            href="/"
            sx={{
              display: { xs: 'flex', md: 'none' },
              flexGrow: 1,
              justifyContent: 'center',
              textDecoration: 'none'
            }}
          >
            <Box
              component="img"
              sx={{
                height: 36,
                width: 'auto',
                filter: 'drop-shadow(0 2px 8px rgba(248,68,107,0.3))'
              }}
              alt="BookMyShow"
              src={bms}
            />
          </Box>

          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }} />

          {/* Desktop Menu */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
            {/* Movies Button */}
            <Button
              component={RouterLink}
              to="/bookmyshow/movies"
              startIcon={<MovieIcon />}
              sx={{ 
                textTransform: 'none', 
                fontWeight: 700,
                fontSize: 15,
                px: 2.5,
                py: 1,
                borderRadius: 2,
                color: 'white',
                background: isActive('/bookmyshow/movies') ? 'rgba(248,68,107,0.15)' : 'transparent',
                border: isActive('/bookmyshow/movies') ? '1px solid rgba(248,68,107,0.3)' : '1px solid transparent',
                '&:hover': { 
                  background: 'rgba(248,68,107,0.2)',
                  borderColor: 'rgba(248,68,107,0.4)'
                },
                transition: 'all 200ms ease'
              }}
            >
              Movies
            </Button>

            {/* My Bookings Button */}
            {token && (
              <Button
                component={RouterLink}
                to="/users/bookings"
                startIcon={<ConfirmationNumberIcon />}
                sx={{ 
                  textTransform: 'none', 
                  fontWeight: 700,
                  fontSize: 15,
                  px: 2.5,
                  py: 1,
                  borderRadius: 2,
                  color: 'white',
                  background: isActive('/users/bookings') ? 'rgba(248,68,107,0.15)' : 'transparent',
                  border: isActive('/users/bookings') ? '1px solid rgba(248,68,107,0.3)' : '1px solid transparent',
                  '&:hover': { 
                    background: 'rgba(248,68,107,0.2)',
                    borderColor: 'rgba(248,68,107,0.4)'
                  },
                  transition: 'all 200ms ease'
                }}
              >
                My Bookings
              </Button>
            )}

            {/* Auth Buttons for Non-logged in users */}
            {!token && (
              <>
                <Button
                  component={RouterLink}
                  to="/users/signup"
                  startIcon={<PersonAddIcon />}
                  sx={{ 
                    textTransform: 'none', 
                    fontWeight: 700,
                    fontSize: 15,
                    px: 2.5,
                    py: 1,
                    borderRadius: 2,
                    color: 'white',
                    background: isActive('/users/signup') ? 'rgba(248,68,107,0.15)' : 'transparent',
                    border: isActive('/users/signup') ? '1px solid rgba(248,68,107,0.3)' : '1px solid transparent',
                    '&:hover': { 
                      background: 'rgba(248,68,107,0.2)',
                      borderColor: 'rgba(248,68,107,0.4)'
                    },
                    transition: 'all 200ms ease'
                  }}
                >
                  Signup
                </Button>
                <Button
                  component={RouterLink}
                  to="/users/login"
                  startIcon={<LoginIcon />}
                  sx={{ 
                    textTransform: 'none', 
                    fontWeight: 700,
                    fontSize: 15,
                    px: 3,
                    py: 1,
                    borderRadius: 2,
                    background: 'linear-gradient(90deg, #ff3a44, #f8446b)',
                    color: 'white',
                    boxShadow: '0 4px 14px rgba(248,68,107,0.3)',
                    '&:hover': { 
                      background: 'linear-gradient(90deg, #e8333d, #e03d5e)',
                      boxShadow: '0 6px 20px rgba(248,68,107,0.4)',
                      transform: 'translateY(-2px)'
                    },
                    transition: 'all 200ms ease'
                  }}
                >
                  Login
                </Button>
              </>
            )}

            {/* User Info + Logout for logged in users */}
            {token && (
              <>
                <Divider 
                  orientation="vertical" 
                  flexItem 
                  sx={{ 
                    mx: 1.5, 
                    borderColor: 'rgba(255,255,255,0.15)',
                    height: 32,
                    alignSelf: 'center'
                  }} 
                />
                
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1.5,
                  px: 2,
                  py: 0.75,
                  borderRadius: 2,
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)'
                }}>
                  <Avatar 
                    sx={{ 
                      width: 36, 
                      height: 36,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      fontWeight: 700,
                      fontSize: 14,
                      boxShadow: '0 4px 12px rgba(102,126,234,0.4)'
                    }}
                  >
                    {getUserInitials()}
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontSize: 13, fontWeight: 700, lineHeight: 1.2 }}>
                      {user?.fullname || user?.fullName || 'User'}
                    </Typography>
                    <Typography sx={{ fontSize: 11, opacity: 0.7, lineHeight: 1.2 }}>
                      {user?.email}
                    </Typography>
                  </Box>
                </Box>

                <Button
                  onClick={logOut}
                  startIcon={<LogoutIcon />}
                  sx={{ 
                    textTransform: 'none', 
                    fontWeight: 700,
                    fontSize: 15,
                    px: 2.5,
                    py: 1,
                    borderRadius: 2,
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.2)',
                    '&:hover': { 
                      background: 'rgba(255,68,68,0.15)',
                      borderColor: 'rgba(255,68,68,0.4)'
                    },
                    transition: 'all 200ms ease'
                  }}
                >
                  Logout
                </Button>
              </>
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}

export default NavBar;