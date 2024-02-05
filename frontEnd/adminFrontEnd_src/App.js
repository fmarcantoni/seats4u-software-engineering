import './App.css'

import React from 'react'
import { listVenues } from './controller/listVenues';
import {deleteShow} from "./controller/deleteShow";
import {generateShowsReport} from "./controller/generateShowsReport";

export default function App() {
  const [redraw, forceRedraw] = React.useState(0);

  React.useEffect(()=>{
    // getConstants()
    
  }, [redraw]);

  // this function requests the redraw, and can be passed as an argument to other functions
  const requestRedraw = () => {
    forceRedraw(redraw+1)
  }
  
  const listVenuesHandler = (e) => {
    listVenues();
    requestRedraw();
  }

  const deleteShowHandler = (e) => {
    deleteShow();
    requestRedraw();
  }

  const generateReportHandler = (e) => {
    generateShowsReport();
    requestRedraw();
  }

  return (
    <div className="App">
      <h1>Venues</h1>
      <div id="venue-error"></div>
      <h2>List Venues</h2>
      <button onClick={listVenuesHandler}>List</button>
      <div id="venue-list"></div>

      <h1>Shows</h1>
      <div id="shows-error"></div>
      <h2>Delete Show</h2>
      Show Name: <input id="show-name"/>
      Venue Name: <input id="venue-name"/>
      <br></br>
      Show Date: <input id="show-date"/>
      Show Time: <input id="show-time"/>
      <br></br>
      <button onClick={deleteShowHandler}>Delete</button>

      <h2>Generate Shows Report</h2>
      Venue Name: <input id="venue-of-shows-report"/>
      <button onClick={generateReportHandler}>Generate</button>
      <div id="show-report"></div>
    </div>
  );
}
