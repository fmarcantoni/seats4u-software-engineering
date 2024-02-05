import './App.css'

import React from 'react'
//import { getConstants } from './controller/GetConstants';
import { deleteVenue } from "./controller/DeleteVenue";
import { createVenue } from "./controller/CreateVenue";
import { createShow } from "./controller/CreateShow";
import { deleteShow } from './controller/DeleteShow';
import { setSinglePrice } from './controller/SetSinglePrice';
import { listBlocks } from './controller/ListBlocks';
import { createBlock } from './controller/CreateBlock';
import { deleteBlock } from "./controller/DeleteBlock";
import { activateShow } from './controller/ActivateShow';
import { generateShowsReport } from './controller/GenerateShowsReport';
import { switchPricingMode } from "./controller/SwitchPriceMode";



export default function App() {
  const [redraw, forceRedraw] = React.useState(0);
  const [isBlockMode, updateBlockMode] = React.useState(false);

  React.useEffect( () => {
    
  }, [isBlockMode]);

  // const requestUpdateBlocks = () => {
  //   updateBlockMode(!isBlockMode);
  // }

  React.useEffect(()=>{
    //listBlocks();
    
  }, [redraw]);

  // this function requests the redraw, and can be passed as an argument to other functions
  const requestRedraw = () => {
    forceRedraw(redraw+1)
  }

  const deleteVenueHandler = (e) => {
    deleteVenue(requestRedraw);
  }

  const createVenueHandler = (e) => {
    createVenue(requestRedraw);
  }

  const createShowHandler = (e) => {
    createShow(requestRedraw);
  }

  const deleteShowHandler = (e) => {
    deleteShow(requestRedraw);
  }

  const switchPriceModeHandler = (e) => {
    switchPricingMode(updateBlockMode);
  }

  const listBlocksHandler = (e) => {
    listBlocks(requestRedraw);
  }

  const createBlockHandler = (e) => {
    createBlock(requestRedraw);
  }

  const deleteBlockHandler = (e) => {
    deleteBlock(requestRedraw);
  }


  const setSinglePriceHandler = (e) => {
    setSinglePrice(requestRedraw);
  }

  const activateShowHandler = (e) => {
    activateShow(requestRedraw);
  }

  const generateReportHandler = (e) => {
    generateShowsReport();
    requestRedraw();
  }


  

  return (
    <div className="App">
      <h1>Venues</h1>
      <h2>Create a Venue</h2>
      <div id="venue-error"></div>
      Venue Name: <input id="venue-to-create"/>
      <br></br>
      Side Left Section Rows: <input id="side-left-rows"/>
      Side Left Section Columns: <input id="side-left-cols"/>
      <br></br>
      Center Section Rows: <input id="center-rows"/>
      Center Section Columns: <input id="center-cols"/>
      <br></br>
      Side Right Section Rows: <input id="side-right-rows"/>
      Side Right Section Columns: <input id="side-right-cols"/>
      <br></br>
      <button onClick={createVenueHandler}>Create</button>

      <h2>Delete a Venue</h2>
      Venue Name: <input id="venue-to-delete"/>
      <br></br>
      <button onClick={deleteVenueHandler}>Remove</button>

      <h1>Shows</h1>
      <div id="show-error"></div>
      <h2>Show Info</h2>
      Show Name: <input id="show-name"/>
      Venue Name: <input id="show-venue"/>
      <br></br>
      Show Date: <input id="show-date"/>
      Show Time: <input id="show-time"/>
      
      <h2>Create Show</h2>
      <button onClick={createShowHandler}>Create</button>

      <h2>Delete a Show</h2>
      <button onClick={deleteShowHandler}>Delete</button>

      <h2>Pricing</h2>
      <div id="block-error"></div>
      <div>
      <h3>Block Mode ON/OFF</h3>
      <input
        type="checkbox"
        checked={isBlockMode}
        onChange={switchPriceModeHandler}
      ></input>
    </div>
    
      Single Price: <input id="single-price"/>
      <button onClick={setSinglePriceHandler} disabled={isBlockMode}>Set Price</button>

      <h3>Blocks</h3>
      <button onClick={listBlocksHandler}>List Blocks</button>
      <div id="block-list"></div>
      <br></br>
      Block Section <select id="block-section">
        <option value="left">Side Left</option>
        <option value="center">Center</option>
        <option value="right">Side Right</option>
      </select>
      Block Row Start: <input id="block-row-start"/>
      Block Row End: <input id="block-row-end"/>
      Block Price: <input id="block-price"/>
      <br></br>
      <button onClick={createBlockHandler} disabled={!isBlockMode}>Create</button>
      <button onClick={deleteBlockHandler} disabled={!isBlockMode}>Delete</button>
      
      
      <h2>Activate Show</h2>
      <button onClick={activateShowHandler}>Activate</button>

      <h2>Generate Shows Report</h2>
      Venue Name: <input id="venue-of-shows-report"/>
      <button onClick={generateReportHandler}>Generate</button>
      <div id="show-report"></div>
  </div>
  );
}
