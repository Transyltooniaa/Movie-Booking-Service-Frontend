import React,{useContext} from 'react'
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
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




const formValidationSchema = yup.object({
    email:yup.string().required(),
    password:yup.string().required().min(5),
})

function Login() {

let {setUser} = useContext(MyContext), 
navigate=useNavigate();

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
  fetch(apiUrl(AUTH_SIGNIN), {
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
    });
}

  return <>
  <NavBar/>
  <Box sx={{backgroundColor:"#f2f2f2",height:{xs:"100vh",md:"100vh"},display:"flex",alignItems:"center"}}>
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
        <h4>Login to Your Account</h4>
        <form  onSubmit = {handleSubmit}>
        <Box sx={{display:"flex",flexDirection:"column",justifyContent:"center",gap:3}}>

        {/* role removed: user-only app */}

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
        label="Password" 
        variant="outlined" 
        name="password"
        value={values.password}
        onBlur={handleBlur}
        onChange={handleChange}
        type="password"
        error = {touched.password && errors.password}
         helperText =  {touched.password && errors.password ? errors.password :null}
        />

        <Button type="submit" sx={{backgroundColor:"#f84464",padding:"15px"}} variant="contained">Login</Button>
        <ToastContainer />
        </Box>
        </form>
        <h5 style={{margin:"15px"}}>Forgot Password <span style={{color:"#f84464",cursor:"pointer"}}>Click here</span></h5>
        <h5 style={{margin:"10px"}}>Don't have an Account <span style={{color:"#f84464",cursor:"pointer"}} onClick={() => navigate('/users/signup')}>Click here to Register</span></h5>

</Paper>
  </Box>
  </>
}

export default Login