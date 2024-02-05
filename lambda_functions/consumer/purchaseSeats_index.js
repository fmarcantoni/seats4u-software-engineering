const mysql = require('mysql');
const db_access = require('/opt/nodejs/db_access');
const { error } = require('console');

exports.handler = async (event) => {
    /** get credentials from the db_access layer (loaded separately via AWS console) */
	var pool = mysql.createPool({
		host: db_access.config.host,
		user: db_access.config.user,
		password: db_access.config.password,
		database: db_access.config.database
	});
	
	    function parseTime(aTime){
        let resultString = aTime.split(":");
        let result = [-9999, -9999];
        if(resultString.length < 2) throw "Malformed Time.";
            result[0] = Number(resultString[0]);
        if(resultString[1].includes('-')){
          throw "Invalid Time.";
        }
        if(resultString[1].toLowerCase().includes("pm")) {
          result[0] += 12;
        }
        else if(resultString[1].toLowerCase().includes("am")) {
          if(result[0] >= 12){
            result[0] -= 12;
          }
        }
        result[1] = Number(resultString[1].replace(/[^0-9]/g, "")); //remove anything that isn't the number using RegEx :)
        console.log(result);
        if(result[1] >= 60 || result[0] < 0 || result[0] < 0 || result[0] >= 24) {
          throw "Invalid Time.";
        }
        return result;
    }
  
  //"12/5/2023" "15:00"
  function initDate(dateString, timeString) {
        let result = new Date(dateString);
        if(isNaN(result.getTime())){
          throw "Invalid Date.";
        }
        if(timeString !== undefined) {
          let [hours,minutes] = parseTime(timeString);
          result.setHours(hours);
          result.setMinutes(minutes);
        }
        return result;
  }
  
	
	  let findVenueID = (venueName) => {
        return new Promise((resolve, reject) => {
          pool.query("SELECT venueID FROM venues WHERE name=?", [venueName], (error, rows) => {
              if (error) { return reject(error); }
              
              if ((rows) && (rows.length === 1)) {
                console.log(rows);
                  return resolve(rows[0].venueID); 
              } else {
                  return resolve(0);
              }
          });
    });
  }
  
  const idOfVenue = await findVenueID(event.venueName);
  if(idOfVenue === 0){
    return {statusCode: 400, body: "Venue doesn't exists."};
  }
  
  let findShowID = (showName, venueName, showDate, showTime) => {
        return new Promise((resolve, reject) => {
          let [hours, mins] = parseTime(event.showTime);
          let time = hours + ":";
          if(mins < 10) {
            time+= "0" + mins;
          } else {
            time+= mins;
          }
          let [month, day, year] = showDate.split('/');
          let date = "";
          if(Number(month) < 10 && !month.includes("0")){
            date += "0" + month;
          } else {
            date += month;
          }
          date += "/";
          if(Number(day) < 10 && !day.includes("0")){
            date += "0" + day;
          } else {
            date += day;
          }
          date+= "/" + year;
          pool.query("SELECT showID FROM shows WHERE showName=? AND venueID=? AND showDate=? AND showTime=?", [showName, idOfVenue, date, time], (error, rows) => {
              if (error) { return reject(error); }
              
              if ((rows) && (rows.length === 1)) {
                console.log(rows);
                  return resolve(rows[0].showID); 
              } else {
                  return resolve(0);
              }
          });
    });
  }
  
  const idOfShow = await findShowID(event.showName, event.venueName, event.showDate, event.showTime);
  
  let findBlockID = (section, seatRow) => {
        return new Promise((resolve, reject) => {
          console.log(section);
          pool.query("SELECT blockID, rowStart, rowEnd FROM blocks WHERE section =? AND `show`=?", [section, idOfShow], (error, rows) => {
              if (error) { return reject(error); }
              if ((rows) && (rows.length >= 1)) {
                  for(let row of rows){
                    console.log("Seat's row" + seatRow);
                    console.log("Row start" + row.rowStart)
                    console.log("Row end" + row.rowEnd);
                    if(seatRow >= row.rowStart && seatRow <= row.rowEnd){
                      console.log("Found block ID" + row.blockID);
                      return resolve(row.blockID);
                    }
                  }
                  
              }
              return resolve(0);
          });
    });
  }
  
   let getBlockInfo = (idOfBlock) => {
     //console.log(section);
      return new Promise((resolve, reject) => {
          pool.query("SELECT price FROM blocks WHERE blockID =? AND `show`=?", [idOfBlock, idOfShow], (error, rows) => {
              if (error) { return reject(error); }
              console.log(rows);
              if ((rows) && (rows.length === 1)) {
                    return resolve(rows[0].price);
              } else {
                  return reject("Blocks not found.");
              }
          });
      });
  }
  
  
    let findRowsForSection = (venueName) => {
        return new Promise((resolve, reject) => {
          pool.query("SELECT * FROM venues WHERE name=?", [venueName], (error, rows) => {
            if(idOfVenue !== 0){
              if (error) { return reject(error); }
              console.log(rows);
              if ((rows) && (rows.length === 1)) {
                if(rows[0].leftRows > 26){
                  return reject("The number of rows for the left section execeeds section capacity.");
                }
                if(rows[0].centerRows > 26){
                  return reject("The number of rows for the center section execeeds section capacity.");
                }
                if(rows[0].rightRows > 26){
                  return reject("The number of rows for the center section execeeds section capacity.");
                }
                else{
                   return resolve(rows);
                }
              }
              else {
                  return resolve(false);
              }
            }
          });
    });
  }
  

  const rowsAndCols = await findRowsForSection(event.venueName);
  let LeftRows = rowsAndCols[0].leftRows;
  let LeftCols = rowsAndCols[0].leftCols;
  let CenterRows = rowsAndCols[0].centerRows;
  let CenterCols = rowsAndCols[0].centerCols;
  let RightRows = rowsAndCols[0].rightRows;
  let RightCols = rowsAndCols[0].rightCols;
  

  
    // convert rows and check that are valid
  let parseRow = (row, section) => {
    let string = "A";
    let ParsedRow = row.charCodeAt(0) - string.charCodeAt(0);
    console.log(ParsedRow);
    console.log(CenterRows);
    
    if(section === "left" || section === "Left"){
      if((ParsedRow < 0 || ParsedRow > 25) || (ParsedRow >= LeftRows)){
        return -1;
      }
      else{
        return ParsedRow;
      }
    }
    else if(section === "center" || section === "Center"){
      if((ParsedRow < 0 || ParsedRow > 25) || (ParsedRow >= CenterRows)){
        return -1;
      }
      else{
        return ParsedRow;
      }
    }
    else if(section === "right" || section === "Right"){
      if((ParsedRow < 0 || ParsedRow > 25) || (ParsedRow >= RightRows)){
        return -1;
      }
      else{
        return ParsedRow;
      }
    }
  }
  
  //Seats already purchased.”
    let checkIfSeatIsSold = (row, col, section, seatBlock) => {
      return new Promise((resolve, reject) => {
          pool.query("SELECT * FROM seats WHERE `row` =? AND `col`=? AND `seatBlock` =? AND sold =?", [parseRow(row, section), col, seatBlock, 0], (error, rows) => {
              if (error) { return reject(error); }
              console.log(rows);
              if ((rows) && (rows.length === 1)) {
                    return resolve(true);
              } else {
                  return resolve(false);
              }
          });
      });
  }
  
  let purchaseSeat = (row, col, section, seatBlock) => {
  	//let idOfBlock = await findBlockID(section);
        return new Promise((resolve, reject) => {
          pool.query("UPDATE seats SET sold = 1 WHERE `row` =? AND `col`=? and `seatBlock` =?", [parseRow(row, section), col, seatBlock], (error, rows) => {
              if (error) { return reject(error); }
              if ((rows) && (rows.affectedRows === 1)) {
                  return resolve(true); 
              } else {
                  return resolve(false);
              }
          });
    });
  }
  
  function toLetter(n){
    return String.fromCharCode(n + "A".charCodeAt(0));
  }
  
  
  
	
	let response = undefined;


	try{
	  let listOfPurchasedSeats = [];
          
      if(idOfVenue === 0){ //if we are NOT authorised
          throw "Venue doesn't exists.";
      }
      else{ 
        if(idOfShow === 0){
          throw "Show doesn't exists.";
        }
        else{
          
          for(let i = 0; i < event.listOfSeats.length; i++){
            
            let idOfBlock = await findBlockID(event.listOfSeats[i].section, parseRow(event.listOfSeats[i].row, event.listOfSeats[i].section));
            let checkRow = await parseRow(event.listOfSeats[i].row, event.listOfSeats[i].section);
            
            let showDate = initDate(event.showDate, event.showTime);
            let today = new Date(new Date().toLocaleString('en', {timeZone: 'America/New_York'}));
            if(showDate < today) {
              throw "Cannot purchase a ticket for a show that already started.";
            }
            else{
              console.log("Checking for invalid seat..." + event.listOfSeats[i].section +" " + parseRow(event.listOfSeats[i].row, event.listOfSeats[i].section))
            console.log(CenterCols)
            console.log(event.listOfSeats[i].col)
            console.log(idOfBlock);
            console.log(checkRow);
            if(idOfBlock === 0 || checkRow === -1 || (event.listOfSeats[i].section === "left" && event.listOfSeats[i].col >= LeftCols) 
            || (event.listOfSeats[i].section === "center" && event.listOfSeats[i].col >= CenterCols) || (event.listOfSeats[i].section === "right" && event.listOfSeats[i].col >= RightCols)){
              throw "Invalid seat was selected.";
            }
              
              else{
                let isSold = await checkIfSeatIsSold(event.listOfSeats[i].row, event.listOfSeats[i].col, event.listOfSeats[i].section, idOfBlock);
                
                if(!isSold){
                  throw "Seats already purchased.";
                }
                
                else{
                  let seatSold = await purchaseSeat(event.listOfSeats[i].row, event.listOfSeats[i].col, event.listOfSeats[i].section, idOfBlock);
                  let blockPrice = await getBlockInfo(idOfBlock);
                  if(seatSold){
                    let seat = {
                    "row" : event.listOfSeats[i].row,
                    "column" : event.listOfSeats[i].col,
                    "section" : event.listOfSeats[i].section,
                    "price" : blockPrice
                  };
                  listOfPurchasedSeats.push(seat);
                  
                  console.log("seat string:");
                  console.log(seat);
                  
                  }
                  else{
                    throw "Couldn't purchase the seat at row:" + event.listOfSeats[i].row + " , col: " + event.listOfSeats[i].col + " , section: " + event.listOfSeats[i].section;
                  }

              
            }
            }
            
          }
        }
      }}
        
		response = {
			statusCode: 200,
			body: listOfPurchasedSeats
		  }
	}
	catch (err) {
      response = {
        statusCode: 400,
        error: err
      }
  }
    finally{
  pool.end();   // done with DB
 }
 return response;
	
};