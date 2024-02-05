import './App.css'

import React from 'react'
//import { getConstants } from './controller/GetConstants';
import { fetchShows } from "./controller/ListShows";
import { searchShows } from './controller/SearchShows';
import { showAvailableSeats } from './controller/ShowAvailableSeats';
import { purchaseSeats, addSeat, removeSeat } from './controller/PurchaseSeats';
// import { checkEmpty } from './controller/ShowAvailableSeats';

import Typography from "@mui/material/Typography";
import CssBaseline from "@mui/material/CssBaseline";
import Grid from "@mui/material/Grid";
import { Alert, Button } from '@mui/material';
import { useState } from 'react';

export default function App() {
  const [redraw, forceRedraw] = React.useState(0);

  let selectedSeatList = [];

  React.useEffect(() => {
    fetchShows();
  }, [redraw]);

  // this function requests the redraw, and can be passed as an argument to other functions
  const requestRedraw = () => {
    forceRedraw(redraw + 1)
  }

  // const selectShowHandler = (show) => {
  //   selectedShow = show;
  // }

  const listShowsHandler = () => {
    fetchShows(requestRedraw);
    // showsList = getShowsList();
    // console.log(showsList);
  }
  const searchShowsHandler = () => {

    searchShows(requestRedraw);
    // showsList = getShowsList();
    // console.log(showsList);
  }

  const showAvailableSeatsHandler = () => {
    showAvailableSeats();
  }

  const addSeatHandler = () => {
    addSeat(selectedSeatList)
  }
  const removeSeatHandler = () => {
    removeSeat(selectedSeatList, selectedSeatList.length - 1)
  }

  const purchaseSeatsHandler = () => {
    purchaseSeats(selectedSeatList);
  }

  // sections based on letters of alphabet
  const sections = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'].map((char, index) => index);

  const [darkMode, setDarkMode] = useState(false);

  function toggleDarkMode() {
    setDarkMode(!darkMode);
  }
  

  //onLoad={showAvailableSeats()}
  return (
    <div className={darkMode ? 'dark' : 'light'}>
    <div className="App" >
      <link href="//cdn.muicss.com/mui-0.10.3/css/mui.min.css" rel="stylesheet" type="text/css" />
      <script src="//cdn.muicss.com/mui-0.10.3/js/mui.min.js"></script>

      <CssBaseline />
      {/* Folloing mateial UI ( cause i like it :] ) */}

      <button onClick={toggleDarkMode}>
        Toggle Dark Mode
      </button>


      {/* make title */}
      <Typography variant="h1">Seats4U</Typography>
      {/* create overline */}
      <Typography variant="overline">Buy Show Seats Here!</Typography>

      <Grid container spacing={1}>
        <Grid item xs={12} sm={12} md={12}>
          {/* button to go to home screen */}
           <ConsumerButton color="#764abc" /> 
        </Grid>
      </Grid>

      <div className='show-list'>
        <Typography variant="h4"> Shows: </Typography>
        <ul id="show-list">
        </ul>
        <button type="button" onClick={(e) => listShowsHandler()}>
          List Shows Available
        </button>


      </div>


      <div className='user-entry'>
        {/* Filter Shows  */}

        <label>
          <h2>Show Name:</h2>
          <input id="show-name" />
        </label>

      
        <header>
          <h2>Venue Name:</h2>
          <input id="venue-name" type='search'> 
          </input>
        </header>


        <div className="search-shows">
          <header>
            <h2>Search for a Show</h2>
          </header>

          <fieldset className='show-search-filter'>
            <legend>Filter by:</legend>

            <label>
              Start Date:
              <input id="start-date" type='date' />
            </label>


            <label>
              End Date:
              <input id="end-date" type='date' />
            </label>


            <label>
              Starting Time:
              <input id="start-time" type='time' />
            </label>


            <label>
              Ending Time:
              <input id="end-time" type='time' />
            </label>

          </fieldset>


          <button onClick={(e) => searchShowsHandler()}>Search</button>

        </div>
        {/*       */}

        {/* Show Available Seats */}
        <div className="show-available-seats">
          <h2>Show Available Seats</h2>
          <label>So you know what to purchase...</label>

          <fieldset>
            <legend>Filter by:</legend>

            <label>
              {/* price section row (ascend or descend) */}
            </label>


            <label>
              Show Date:
              <input id="show-date" type='date' format="MM/DD/YYYY" />
            </label>


            <label>
              Show Time:
              <input id="show-time" type='time' />
            </label>

            <label>
              Sorting Method:
              <select id="sort-method">
                <option value="section">By Section</option>
                <option value="row">By Row</option>
                <option value="price">By Price</option>
              </select>
            </label>

            <label>
              Descending?
              <input id="descending" type="checkbox"></input>
            </label>

          </fieldset>

          <button onClick={(e) => {
            if (!document.getElementById('show-name').value) {
              alert('Please enter a show name');
            } else if (!document.getElementById('venue-name').value) {
              alert('Please enter a venue name');
            } else if (!document.getElementById('show-date').value) {
              alert('Please enter a show date');
            } else if (!document.getElementById('show-time').value) {
              alert('Please enter a show time');
            }
            else {
              showAvailableSeatsHandler();
            }
          }
          }>Show</button>
          <div id="seat-list"></div>
        </div>

        <div className='purchase-seats'>
          <h2>Purchase Seats</h2>
          <label>
            Seat Section
            <select id="seat-section">
              <option value="left">Side Left</option>
              <option value="center">Center</option>
              <option value="right">Side Right</option>
            </select>
          </label>


          <label>Seat Row:
            <select id="seat-row">
              {sections &&
                sections.map((char, index) => (
                  <option value={(String.fromCharCode(index + 65))}>
                    {/* Row {String.fromCharCode(section + "A".charCodeAt(0) - 1)} */}
                    Row {String.fromCharCode(index + 65)}
                  </option>))
              }
            </select>
            {/* <input id="seat-row" type='text'/> */}
          </label>

          <label>
            Seat Number:
            <input id="seat-col" type='number' />
          </label>


          <br></br>
          <button onClick={(e) => {
            if (!document.getElementById("seat-col").value) {
              alert('Please enter a seat number');
            } else {
              addSeatHandler()
            }

          }
          }>Add</button>
          <button onClick={(e) => removeSeatHandler()}>Remove Latest</button>
          <button onClick={(e) => purchaseSeatsHandler()}>Purchase</button>
          <br></br>
          <div id="selected-seat-list"></div>
        </div>
      </div>

    </div>
    </div>
  );
}

function selectShow() {
  return (
    <div>

    </div>
  );
}

function ConsumerButton({ color }) {
  return (
    <div
      style={{
        backgroundColor: color,
        color: "white",
        padding: "8px",
        textAlign: "center",
      }}
    >
      <Typography variant="body1">Consumer</Typography>
    </div>
  );
}
