import './App.css'

import React from 'react'
//import { getConstants } from './controller/GetConstants';
import { genNewVM } from './controller/genNewVM';
import { signInVM } from './controller/signInVM';
import { adminLogin } from './controller/adminLogin';
import { breakTheCode } from './controller/breakTheCode';




export default function App() {
  const [redraw, forceRedraw] = React.useState(0);

  React.useEffect(()=>{
    //listBlocks();
    
  }, [redraw]);

  // this function requests the redraw, and can be passed as an argument to other functions
  const requestRedraw = () => {
    forceRedraw(redraw+1)
  }

  const genNewVMHandler = (e) => {
    genNewVM();
  }

  const signInVMHandler = (e) => {
    signInVM();
  }

  const signInAdminHandler = (e) => {
    adminLogin();
  }

  const breakCodeHandler = (e) => {
    breakTheCode();
  }

  return (
    <div className="App">
      <h1>Welcome!</h1>
      
      Venue Manager Access Key: <input id="vm-access-key" type=''/>
      <button onClick={(e) => signInVMHandler()}>Sign In</button>
      <div id="vm-sign-in-status"></div>

      <br></br>
      <br></br>
      
      <button onClick={(e) => genNewVMHandler()}>Generate New Access Key</button> <div id="new-access-key"></div>
      
      <br></br>
      <br></br>

      Admin Password: <input id="admin-password" type=''/>
      <button onClick={(e) => signInAdminHandler()}>Sign In</button>
      <div id="admin-login-status"></div>

      <br></br>
      <br></br>

      <button onClick={(e) => window.open("http://seats4ucustomerbucket.s3-website-us-east-1.amazonaws.com/")}>Continue As Consumer</button>

      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <button onClick={(e) => breakCodeHandler()}>Definetly Don't Click This Button, It'll Break Eveything...</button>
      <div id="break-the-code"></div>
  </div>
  );
}
