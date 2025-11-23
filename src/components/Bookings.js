import React,{useState,useEffect} from 'react'
import {useParams,useNavigate} from 'react-router-dom'
import Box from '@mui/material/Box';
import NavBar from './NavBar';



function Bookings() {
    const API = process.env.REACT_APP_API_URL;
    const { id,theaterId } = useParams()
    let [movie,setMovie] = useState([])
    let [show,setShow] = useState([])
    let [theater,setTheater] = useState([])

    const token = localStorage.getItem("Authorization")

    const getMovie = () => {
      fetch(`${API}/movies/${id}`, {
        method: "GET",
        headers: {
          Authorization: localStorage.getItem("Authorization") || '',
        }
      })
      .then((data) => data.json())
      .then((mv) => setMovie(mv))
    }
        useEffect(() => {getMovie()},[id])

        useEffect(() => {
        if(movie){
           const theaterNames = movie.theaters.find((e) => e.id == theaterId)
          setTheater(movie.theaters)
        }
        
        }, [movie])

        useEffect(() => {
          if(movie){
            setShow(movie.shows)
          }
          }, [movie])


  return <>
  <NavBar/>
    <Box sx={{backgroundColor:"#1a1a1a"}}>
  <Box sx={{padding:"30px 0px",width:"70%",margin:"0px auto"}}>
   <h6 style={{fontSize:"18px",color:"whitesmoke",margin:15}}>{movie.name}</h6>
   <h6 style={{fontSize:"18px",color:"whitesmoke",margin:15}}>Today, 23 Nov | {movie.type}</h6>

   <p style={{color:"white",margin:15}}>{theater && theater ? theater.find((e,i) => e.theaterid === theaterId)?.theatername : ''}</p>

  </Box>
  </Box>
  <Box sx={{padding:"20px 0px"}}>

  <Box sx={{display:"flex",flexDirection:{xs:"column",md:"row",gap:40},width:"70%",margin:"0px auto",justifyContent:"space-around"}}>
    {
        show &&show.map((e,i) => <Showtime movie={movie} theaterId={theaterId} show={e} key={i}/>)
    }
  </Box>

  </Box>
  </>
}

function Showtime({show,movie,theaterId}){
  let navigate = useNavigate()
  let showSelect = () => {
    navigate(`/bookmyshow/movies/${movie.id}/theater/${theaterId}/${show?.showid}/seatbooking`)
  }

    return<>
      <p style={{textAlign:"center",border:"1px solid green",color:"black",borderRadius:"5%",padding:"10px 15px",cursor:"pointer"}} onClick={showSelect}>{show.show}</p>
    </>
}





export default Bookings