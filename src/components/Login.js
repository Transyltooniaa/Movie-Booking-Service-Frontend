import React,{useContext, useState} from 'react'
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
import NavBar from './NavBar';
import { ToastContainer, toast } from 'react-toastify';
import { MyContext } from "../components/Context";
import { apiUrl, AUTH_SIGNIN } from './global/connect';
import { setToken } from './auth';
import jwtDecode from 'jwt-decode';
import bms from "../image/bms.png";
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';




const formValidationSchema = yup.object({
    email:yup.string().required(),
    password:yup.string().required().min(5),
})

function Login() {
const API = process.env.REACT_APP_API_URL;
let {setUser} = useContext(MyContext), 
navigate=useNavigate();

const [loading, setLoading] = useState(false);
const [showPassword, setShowPassword] = useState(false);

const {handleSubmit, values, handleChange,handleBlur,touched, errors} = useFormik({
    initialValues:{
      email:'',
      password:'',
    },
    validationSchema : formValidationSchema,
    onSubmit:(loginUser) => {
        addList(loginUser)
    }
})

let addList = (loginUser) => {
  setLoading(true);
  const slowTimer = setTimeout(() => {
    toast.info('Signing you in… one moment');
  }, 1200);
  fetch(`${API}/auth/signin`, {
    method: "POST",
    body: JSON.stringify({
      email: loginUser.email,
      password: loginUser.password,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  })

    // console.log(loginUser)
    .then((res) => (res.ok ? res.json() : res.json().then((d) => Promise.reject(d))))
    .then((data) => {
      // AuthResponse: { token, role, message }
      if (!data?.token) {
        return Promise.reject({ message: data?.message || 'Login failed' });
      }

      // Store token and role
      setToken(`Bearer ${data.token}`);
      if (data?.role) localStorage.setItem('role', data.role);

      // No /users/me endpoint: decode JWT for basic identity
      try {
        const decoded = jwtDecode(data.token);
        const email = decoded?.email || decoded?.sub || decoded?.username;
        const role = data?.role || decoded?.role;
        const userDetail = { email, role };
        setUser(userDetail);
        if (email) localStorage.setItem('email', email);
      } catch {}

      navigate('/bookmyshow/movies');
      return; // stop chain
    })
    .catch((err) => {
      const msg = err?.message || 'Unable to login';
      toast.error(msg);
    })
    .finally(() => { clearTimeout(slowTimer); setLoading(false); });
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
        <h3 style={{marginTop:8, marginBottom:8}}>Welcome back</h3>
        <p style={{marginTop:0, color:'#666'}}>Sign in to continue booking</p>
        <form  onSubmit = {handleSubmit}>
        <Box sx={{display:"flex",flexDirection:"column",justifyContent:"center",gap:2.5}}>

        {/* role removed: user-only app */}

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
          {loading ? (<><CircularProgress size={18} sx={{color:'#fff', mr:1}}/> Signing in…</>) : 'Login'}
        </Button>
        <ToastContainer />
        </Box>
        </form>
        <h5 style={{margin:"15px", color:'#666'}}>Forgot Password <span style={{color:"#f84464",cursor:"pointer"}}>Click here</span></h5>
        <h5 style={{margin:"10px", color:'#666'}}>Don't have an Account <span style={{color:"#f84464",cursor:"pointer"}} onClick={() => navigate('/users/signup')}>Click here to Register</span></h5>

</Paper>
  </Box>
  </>
}

export default Login