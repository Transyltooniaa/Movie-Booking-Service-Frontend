import './App.css';
import {Routes,Route} from 'react-router-dom'
import Movies from './components/Movies';
import Movie from './components/Movie';
import Bookings from './components/Bookings';
import Login from './components/Login';
import Signup from './components/Signup';
import Query from './components/Query';
import Payment from './components/Payment';
import SeatLayout from './components/SeatLayout';
import MyBookings from './components/MyBookings';
import Admin from './components/Admin';
import AdminaddMovies from './components/AdminaddMovies';
import AdmineditMovie from './components/AdmineditMovie';




function App() {

  return <>
  <Routes>
  {/* Default to Movies page for now (skip signup/login during development) */}
  <Route path='/' element={<Movies/>}/>
  <Route path='/users/signup' element={<Signup/>}/>
  <Route path='/users/login' element={<Login/>}/>
  {/* <Route path='/bookmyshow/movies/admin' element={<Admin/>}/>
  <Route path='/bookmyshow/movies/add' element={<AdminaddMovies/>}/>
  <Route path='/bookmyshow/movies/edit/:id' element={<AdmineditMovie/>}/> */}
  <Route path='/bookmyshow/movies' element={<Movies/>}/>
  <Route path='/bookmyshow/movies/query' element={<Query/>}/>
  <Route path='/bookmyshow/movies/:id' element={<Movie/>}/>
  <Route path='/bookmyshow/seat-layout/:showId' element={<SeatLayout/>}/>
  <Route path='/bookmyshow/payment/:theaterId/:showId/:selected/:total' element={<Payment/>}/>
  <Route path='/users/bookings' element={<MyBookings/>}/>
  </Routes>
  
  </>
}

export default App;
