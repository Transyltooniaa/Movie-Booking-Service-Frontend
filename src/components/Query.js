import React from 'react'
import Paper from '@mui/material/Paper';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import {useFormik} from "formik";
import * as yup from "yup"
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';
import NavBar from './NavBar';
import bms from "../image/bms.png";


const formValidationSchema = yup.object({
  email:yup.string().required(),
  query:yup.string().required().min(5),
})

function Query() {

  // const token = localStorage.getItem("Authorization")
  const {handleSubmit, values, handleChange,handleBlur,touched, errors} = useFormik({
    initialValues:{
      email:'',
      query:'',
    },
    validationSchema : formValidationSchema,
    onSubmit:(queryList) => {
        addUser(queryList)
    }

})
  let navigate = useNavigate()

  let addUser = (queryList) => {
        // Assuming query endpoint belongs to movie service
        const API = process.env.REACT_APP_API_URL || "";
        fetch(`${API}/movies/queries`,{
          method:"POST",
          body: JSON.stringify(queryList),
          headers: {
            "Content-Type" : "application/json"
        },
        })
            .then((data) => data.json())
            .then((dat) => console.log(dat),
            toast.success('Query Sent Successfully', {
              position: "top-center",
              autoClose: 5000,
              hideProgressBar: false,
              closeOnClick: true,
              pauseOnHover: true,
              draggable: true,
              progress: undefined,
              theme: "light",
              })
            )
            .then(() => navigate('/bookmyshow/movies'))
  }

  return <>
  <NavBar/>
  <Box sx={{backgroundColor:"#f2f2f2",height:{xs:"93.7vh",md:"91.8vh"},display:"flex",alignItems:"center"}}>
<Paper sx={{padding:"50px 30px",width:{xs:"300px",sm:"400px",md:"400px"},margin:"0px auto",textAlign:"center"}}>
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
        <h4>Add Your Query</h4>

        <form  onSubmit = {handleSubmit}>
        <Box sx={{display:"flex",flexDirection:"column",justifyContent:"center",gap:3}}>

        <TextField
         id="outlined-basic"
          label="Email"
           variant="outlined"
            name="email"
           value={values.email}
           onBlur={handleBlur}
           onChange={handleChange}
           type="text"
           error = {touched.email && errors.email}
            helperText =  {touched.email && errors.email ? errors.email :null}
           />

        <TextField
         id="outlined-basic"
          label="Query"
           variant="outlined" 
            name="query"
           value={values.query}
           onBlur={handleBlur}
           onChange={handleChange}
           type="text"
           error = {touched.query && errors.query}
            helperText =  {touched.query && errors.query ? errors.query :null} 
           />
        <Button type="submit" sx={{backgroundColor:"#f84464",padding:"15px"}} variant="contained">Send</Button>
        <ToastContainer />
        </Box>
        </form>

</Paper>
  </Box>
  </>
}

export default Query