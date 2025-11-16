import './App.css';
import {Routes,Route, Navigate} from 'react-router-dom'
import Movies from './components/Movies';
import Movie from './components/Movie';
import Bookings from './components/Bookings';
import Login from './components/Login';
import Signup from './components/Signup';
import Query from './components/Query';
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

  return <>
  <Routes>
  <Route path='/' element={<Login/>}/>
  <Route path='/users/signup' element={<Signup/>}/>
  <Route path='/users/login' element={<Login/>}/>
  <Route path='/bookmyshow/movies' element={<Movies/>}/>
  <Route path='/bookmyshow/movies/query' element={<RequireAuth><Query/></RequireAuth>}/>
  <Route path='/bookmyshow/movies/:id' element={<RequireAuth><Movie/></RequireAuth>}/>
  <Route path='/bookmyshow/seat-layout/:showId' element={<RequireAuth><SeatLayout/></RequireAuth>}/>
  <Route path='/bookmyshow/payment/:theaterId/:showId/:selected/:total' element={<RequireAuth><Payment/></RequireAuth>}/>
  <Route path='/users/bookings' element={<RequireAuth><MyBookings/></RequireAuth>}/>
  </Routes>
  
  </>
}

export default App;
