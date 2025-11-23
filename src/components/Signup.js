import React, { useState } from 'react'
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import {useNavigate} from 'react-router-dom'
import {useFormik} from "formik";
import * as yup from "yup"
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import NavBar from './NavBar';
import { apiUrl, AUTH_SIGNUP } from './global/connect';
import bms from "../image/bms.png";
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';


const formValidationSchema = yup.object({
  fullname:yup.string().required(),
  email:yup.string().required(),
  password:yup.string().required().min(5),
})

function Signup() {

  let navigate = useNavigate()
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
    const {handleSubmit, values, handleChange,handleBlur,touched, errors} = useFormik({
      initialValues:{
        fullname:'',
        email:'',
        password:'',
      },
      validationSchema : formValidationSchema,
      onSubmit:(newList) => {
          addUser(newList)
      }
  
  })
    let addUser = (newList) => {
      setLoading(true);
      const slowTimer = setTimeout(() => toast.info('Creating your account…'), 1200);
      const API = process.env.REACT_APP_API_URL;
      fetch(`${API}/auth/signup`,{
        method:"POST", 
        body: JSON.stringify({
          fullname: newList.fullname,
          email: newList.email,
          password: newList.password,
        }),
        headers: {
          "Content-Type" : "application/json",
        },
      })
      .then((res) => (res.ok ? res.json() : res.json().then((d)=>Promise.reject(d))))
      .then(() => toast.success('Account Created Successfully', {
        position: "top-center",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: "light",
      }))
      .then(() => setTimeout(() => navigate('/users/login'), 800))
      .catch((err) => toast.error(err?.message || 'Signup failed'))
      .finally(() => { clearTimeout(slowTimer); setLoading(false); })
    }

  return <>
  <NavBar/>
    <Box sx={{backgroundColor:"#f2f2f2",minHeight:{xs:"100vh",md:"100vh"},display:"flex",alignItems:"center"}}>
  <Paper elevation={6} sx={{padding:"40px 28px",borderRadius:3,width:{xs:"320px",sm:"420px",md:"420px"},margin:"0px auto",textAlign:"center"}}>
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
        <h3 style={{marginTop:8, marginBottom:8}}>Create your account</h3>
        <p style={{marginTop:0, color:'#666'}}>Book tickets faster next time</p>

        <form  onSubmit = {handleSubmit}>
        <Box sx={{display:"flex",flexDirection:"column",justifyContent:"center",gap:3}}>

        {/* role removed: signup creates user accounts only */}

        <TextField
         id="outlined-basic"
          label="Full Name"
          variant="outlined"
          name="fullname"
          value={values.fullname}
          onBlur={handleBlur}
          onChange={handleChange}
          type="text"
          required
          error = {touched.fullname && errors.fullname}
           helperText =  {touched.fullname && errors.fullname ? errors.fullname :null}
           />

        <TextField
         id="outlined-basic"
          label="Email"
           variant="outlined"
           name="email"
           value={values.email}
           onBlur={handleBlur}
           onChange={handleChange}
           type="email"
           required
           error = {touched.email && errors.email}
            helperText =  {touched.email && errors.email ? errors.email :null}
            />
           
        <TextField
         id="outlined-basic"
          label="Password"
           variant="outlined"
           name="password"
           value={values.password}
           onBlur={handleBlur}
           onChange={handleChange}
           type={showPassword ? 'text' : 'password'}
           required
           InputProps={{
             endAdornment: (
               <InputAdornment position="end">
                 <IconButton aria-label="toggle password visibility" onClick={() => setShowPassword((s) => !s)} edge="end">
                   {showPassword ? <VisibilityOff /> : <Visibility />}
                 </IconButton>
               </InputAdornment>
             )
           }}
           error = {touched.password && errors.password}
            helperText =  {touched.password && errors.password ? errors.password :null}
            />

        <Button type="submit" disabled={loading} sx={{backgroundColor:"#f84464",padding:"12px", textTransform:'none', fontWeight:700}} variant="contained">
          {loading ? (<><CircularProgress size={18} sx={{color:'#fff', mr:1}}/> Creating…</>) : 'Signup'}
        </Button>
        <ToastContainer />
        </Box>
        </form>
        <h5 style={{margin:"10px"}}>Already have an Account <span style={{color:"#f84464",cursor:"pointer"}} onClick={() => navigate('/users/login')}>Click here to Login</span></h5>

</Paper>
  </Box>
  </>
}

export default Signup