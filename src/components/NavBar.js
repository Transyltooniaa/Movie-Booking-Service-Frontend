import React, {useContext} from 'react';
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
import Link from '@mui/material/Link';
import MenuItem from '@mui/material/MenuItem';
import { MyContext } from "../components/Context";
import { clearToken, getToken } from './auth';
import bms from "../image/bms.png";



function NavBar() {

  let {user} = useContext(MyContext)

  const [anchorElNav, setAnchorElNav] = React.useState(null);

  const token = getToken()

 let navigate = useNavigate();
 const location = useLocation();

 const isActive = (pathPrefix) => location.pathname.startsWith(pathPrefix);

 let logOut = () => {
  clearToken()
  // localStorage.removeItem("email")
  // localStorage.removeItem("role")
  sessionStorage.removeItem("email")
  sessionStorage.removeItem("role")
  navigate('/users/login')
 }

  const handleOpenNavMenu = (event) => {
    setAnchorElNav(event.currentTarget);
  };

  const handleCloseNavMenu = () => {
    setAnchorElNav(null);
  };

  return (
    <AppBar sx={{backgroundColor:"#333545"}} position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <Typography
            variant="h6"
            noWrap
            component="a"
            href="/"
            sx={{
              mr: 2,
              display: { xs: 'none', md: 'flex' },
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.3rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
                   <Box
        component="img"
        sx={{
            margin:0,
          objectFit:'cover',
          objectPosition:'center',
          width: { xs: '120px', md: '120px' },
        }}
        alt="The house from the offer."
        src={bms}
        />
          </Typography>

          <Box sx={{ flexGrow: 1, display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleOpenNavMenu}
              color="inherit"
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
              }}
            >
                <MenuItem sx={{display:'flex',flexDirection:{xs:'column'},gap:2}} onClick={handleCloseNavMenu}>
                {/* Movies visible always */}
                <MenuItem onClick={() => { handleCloseNavMenu(); navigate('/bookmyshow/movies'); }}>
                  <Typography sx={{fontSize:"14px",fontWeight:600, color: isActive('/bookmyshow/movies') ? '#f84464' : 'inherit'}}>Movies</Typography>
                </MenuItem>
                {token ? (
                  <MenuItem onClick={() => { handleCloseNavMenu(); navigate('/users/bookings'); }}>
                    <Typography sx={{fontSize:"14px",fontWeight:600, color: isActive('/users/bookings') ? '#f84464' : 'inherit'}}>My Bookings</Typography>
                  </MenuItem>
                ) : null}

                {
                  token ? null :  (
                    <MenuItem onClick={() => { handleCloseNavMenu(); navigate('/users/signup'); }}>
                      <Typography sx={{fontSize:"14px",fontWeight:600, color: isActive('/users/signup') ? '#f84464' : 'inherit'}}>Signup</Typography>
                    </MenuItem>
                  )
                }
                  {
                    token ? (
                      <MenuItem onClick={() => { handleCloseNavMenu(); logOut(); }}>
                        <Typography sx={{fontSize:"14px",fontWeight:600}}>Logout</Typography>
                      </MenuItem>
                    ) : (
                      <MenuItem onClick={() => { handleCloseNavMenu(); navigate('/users/login'); }}>
                        <Typography sx={{fontSize:"14px",fontWeight:600, color: isActive('/users/login') ? '#f84464' : 'inherit'}}>Login</Typography>
                      </MenuItem>
                    )
                  }
                  {token && (
                    <Typography sx={{fontSize:"12px",opacity:0.85, mt:1}}>{user?.fullname || user?.fullName || user?.email}</Typography>
                  )}
                  
                </MenuItem>
              
            </Menu>
          </Box>
          <Typography
            variant="h5"
            noWrap
            component="a"
            href=""
            sx={{
              mr: 2,
              display: { xs: 'flex', md: 'none' },
              flexGrow: 0,
              fontFamily: 'monospace',
              fontWeight: 700,
              letterSpacing: '.3rem',
              color: 'inherit',
              textDecoration: 'none',
            }}
          >
                   <Box
        component="img"
        sx={{
            margin:0,
          objectFit:'cover',
          objectPosition:'center',
          width: { xs: '120px', md: '120px' },
        }}
        alt="The house from the offer."
        src={bms}
        />
          </Typography>
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' } }}>
          </Box>

          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems:'center', gap: 2 }}>
              <Button
                component={RouterLink}
                to="/bookmyshow/movies"
                color="inherit"
                sx={{ textTransform:'none', fontWeight:700, color: isActive('/bookmyshow/movies') ? '#f84464' : 'white', '&:hover':{ color:'#ff6b81' } }}
              >
                Movies
              </Button>
              {token && (
                <Button
                  component={RouterLink}
                  to="/users/bookings"
                  color="inherit"
                  sx={{ textTransform:'none', fontWeight:700, color: isActive('/users/bookings') ? '#f84464' : 'white', '&:hover':{ color:'#ff6b81' } }}
                >
                  My Bookings
                </Button>
              )}

              {!token && (
                <>
                  <Button
                    component={RouterLink}
                    to="/users/signup"
                    color="inherit"
                    sx={{ textTransform:'none', fontWeight:700, color: isActive('/users/signup') ? '#f84464' : 'white', '&:hover':{ color:'#ff6b81' } }}
                  >
                    Signup
                  </Button>
                  <Button
                    component={RouterLink}
                    to="/users/login"
                    color="inherit"
                    sx={{ textTransform:'none', fontWeight:700, color: isActive('/users/login') ? '#f84464' : 'white', '&:hover':{ color:'#ff6b81' } }}
                  >
                    Login
                  </Button>
                </>
              )}

              {token && (
                <>
                  <Typography sx={{fontSize:"13px",opacity:0.85}}>{user?.fullname || user?.fullName || user?.email}</Typography>
                  <Button onClick={logOut} color="inherit" sx={{ textTransform:'none', fontWeight:700, '&:hover':{ color:'#ff6b81' } }}>Logout</Button>
                </>
              )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
export default NavBar;