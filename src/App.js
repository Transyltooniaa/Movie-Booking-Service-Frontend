import './App.css';
import React, { useState, useEffect } from 'react';
import {Routes,Route, Navigate, useLocation} from 'react-router-dom'
import Movies from './components/Movies';
import Movie from './components/Movie';
import Bookings from './components/Bookings';
import Login from './components/Login';
import Signup from './components/Signup';
import Payment from './components/Payment';
import SeatLayout from './components/SeatLayout';
import MyBookings from './components/MyBookings';
import { getToken } from './components/auth';
// Admin-related components removed for user-only app




function RequireAuth({ children }) {
  const token = getToken();
  if (!token) 
    return <Navigate to="/users/login" replace />
  return children
}

function App() {
  const location = useLocation();
  const [routeLoading, setRouteLoading] = useState(false);

  useEffect(() => {
    setRouteLoading(true);
    const t = setTimeout(() => setRouteLoading(false), 300); // minimal pleasant transition
    return () => clearTimeout(t);
  }, [location]);

  return <>
    {routeLoading && (
      <div style={{position:'fixed',inset:0,background:'rgba(20,20,24,0.85)',zIndex:1300,display:'flex',alignItems:'center',justifyContent:'center',backdropFilter:'blur(3px)'}}>
        <div style={{textAlign:'center'}}>
          <div style={{width:60,height:60,borderRadius:'50%',border:'6px solid #f84464',borderTopColor:'transparent',animation:'spin 0.9s linear infinite',margin:'0 auto'}}></div>
          <p style={{color:'#fff',marginTop:16,fontFamily:'monospace',letterSpacing:'2px'}}>LOADING</p>
        </div>
      </div>
    )}
    <Routes>
      <Route path='/' element={<Login/>}/>
      <Route path='/users/signup' element={<Signup/>}/>
      <Route path='/users/login' element={<Login/>}/>
      <Route path='/bookmyshow/movies' element={<Movies/>}/>
      <Route path='/bookmyshow/movies/:id' element={<RequireAuth><Movie/></RequireAuth>}/>
      <Route path='/bookmyshow/seat-layout/:showId' element={<RequireAuth><SeatLayout/></RequireAuth>}/>
      <Route path='/bookmyshow/payment/:theaterId/:showId/:selected/:total' element={<RequireAuth><Payment/></RequireAuth>}/>
      <Route path='/users/bookings' element={<RequireAuth><MyBookings/></RequireAuth>}/>
    </Routes>
  </>
}

export default App;
