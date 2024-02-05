const mysql = require('mysql');
const db_access = require('/opt/nodejs/db_access')

exports.handler = async (event) => {
  
  // get credentials from the db_access layer (loaded separately via AWS console)
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
  
  	let findVM = () => {
		return new Promise((resolve, reject) => {
			pool.query("SELECT accessKey FROM vmAccessKeys WHERE isActive = 1;", (error, rows) => {
					if(rows.length === 1){
						return resolve(rows[0].accessKey);
					}
					if(rows.length === 0){
						return reject ("No VM logged in at this time");}
					else{return reject(error)}
			});

		});

	};
	
	const managerID = await findVM();
  
  
  let checkCredentials = (venueName, managerID) => {
    return new Promise((resolve, reject) => {
          pool.query("SELECT credentials FROM venues WHERE name=?", [venueName], (error, credentials) => {
              if (error) { return reject(error); }
              console.log(credentials);
              if ((credentials) && (credentials.length == 1)) {
                console.log(credentials[0].credentials);
                  return resolve(credentials[0].credentials === managerID); 
              } else {
                  return resolve(false);
              }
          });
    });
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
  
  // set 0 --> 1
  let checkIfShowIsSinglePriceMode = (showName, venueName, showDate, showTime) => {
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
          pool.query("SELECT * FROM shows WHERE showName=? AND venueID=? AND showDate=? AND showTime=? AND isSinglePriceMode=?", [showName, idOfVenue, date, time, 1], (error, rows) => {
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

  let response = undefined
  
  /*
  let parseRow = (row) => {
    let string = "A";
    let ParsedRow = parseInt(row) - parseInt(string);
    
    if(ParsedRow < 0 || ParsedRow > 25){
      throw ("Invalid row selected.");
    }
    else{
      return ParsedRow;
    }
  }

*/

let checkIfGotBlocks = () => {
        return new Promise((resolve, reject) => {
          pool.query("SELECT * FROM blocks WHERE `show`=?", [idOfShow], (error, rows) => {
              if (error) { return reject(error); }
              if ((rows) && (rows.length >= 1)) {
                    return resolve(true);
              } else {
                  return resolve(false);
              }
          });
    });
  }
  
  let DeleteBlocks = () => {
      return new Promise((resolve, reject) => {
          pool.query("DELETE FROM blocks WHERE `show`=?", [idOfShow], (error, rows) => {
              if (error) { return reject(error); }
              console.log(rows);
              if ((rows) && (rows.affectedRows >= 1)) {
                
                  pool.query("SELECT * FROM blocks WHERE `show`=?", [idOfShow], (error, rows) => {
                    if (error) { return reject(error); }
                        return resolve(rows);
                    })
                    
              } else {
                  return resolve(false);
              }
          });
      });
  }

let checkIfShowActiveAndPriceIsValid = (showName, venueName, showDate, showTime, section, price) => {
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
          pool.query("SELECT * FROM shows WHERE showName=? AND venueID=? AND showDate=? AND showTime=? AND isActive=?", [showName, idOfVenue, date, time, 0], (error, rows) => {
              if (error) { return reject(error); }
              console.log(rows);
              if(price <= 0){
                return reject("Invalid price.")
              }
              if ((rows) && (rows.length === 1)) {
                    return resolve(true);
              } else {
                  return reject("Cannot set the single price because show is active.");
              }
          });
    });
  }

  let createBlocks = (rowStart, rowEnd, section, price, show) => {
      return new Promise((resolve, reject) => {
        pool.query("INSERT into blocks(rowStart, rowEnd, section, price, `show`) VALUES(?,?,?,?,?);", [rowStart, rowEnd, section, price, idOfShow], (error, rows) => {
          if (error) { return reject(error); }
          if ((rows) && (rows.affectedRows === 1)) {
            return resolve("The single price was successfully set to: " + price); //"The single price was successfully set to: " + rows[0].price
          } else {
             return resolve(false);
            }
        });
        
    });
  }
  
  let findBlockID = (section) => {
        return new Promise((resolve, reject) => {
          pool.query("SELECT blockID FROM blocks WHERE section =? AND `show`=?", [section, idOfShow], (error, rows) => {
              if (error) { return reject(error); }
              if ((rows) && (rows.length === 1)) {
                  return resolve(rows[0].blockID); 
              } else {
                  return resolve(0);
              }
          });
    });
  }
  
  let createSeatsForBlocks = (row, col, seatBlock) => {
      return new Promise((resolve, reject) => {
        pool.query("INSERT into seats(`row`, `col`, `seatBlock`) VALUES(?,?,?);", [row, col, seatBlock], (error, rows) => {
          if (error) { return reject(error); }
          if ((rows) && (rows.affectedRows === 1)) {
            return resolve(rows);
          } else {
             return resolve(false);
            }
        });
        
    });
  }
  
  
        
    // gets the rows of the venues and create three blocks that takes the entire venue
  let findRowsForSection = (venueName) => {
        return new Promise((resolve, reject) => {
          pool.query("SELECT * FROM venues WHERE name=?", [venueName], (error, rows) => {
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
              
          });
    });
  }
  
  try{
      //const can_create= await ValidateShowInput(event.showName, event.showVenue, event.showDate, event.showTime, event.credentials);
      const isVenueIDFound = await findVenueID(event.venueName);
      
      if(isVenueIDFound === 0){ // if venue doesn't exist
        throw "Venue doesn't exist.";
      }
      else{ // if venue exists
        const areWeAuthorized = await checkCredentials(event.venueName, managerID);
          
        if(!areWeAuthorized){ //if we are NOT authorised
            throw "Not authorized to set the single price for this show in this venue.";
        }
        else{ // if we are authorised
          if(idOfShow === 0){ // if show is not found
            throw "A show in this venue at this time doesn't exists.";
          }
          else{ // if show is found
            const isShowInSPMode = await checkIfShowIsSinglePriceMode(event.showName, event.venueName, event.showDate, event.showTime);
              
            if(!isShowInSPMode){ // if we are in Single Price Mode
              throw "Show is not in single price mode.";
            }
            else{ // if we are in single price mode mode we create the block
              const isPriceValidandShowNotActive = await checkIfShowActiveAndPriceIsValid(event.showName, event.venueName, event.showDate, event.showTime, event.price);
                
                if(isPriceValidandShowNotActive){ // if the price is valid and show is not active
                  const needToDeleteExistingBlocks = await checkIfGotBlocks();
                  
                  if(needToDeleteExistingBlocks){
                    const cleanBlocks = await DeleteBlocks();
                    
                    const rowsAndCols = await findRowsForSection(event.venueName);
                    
                    const LeftRows = (rowsAndCols[0].leftRows);
                    const LeftCols = (rowsAndCols[0].leftCols);
                    
                    const CenterRows = (rowsAndCols[0].centerRows);
                    const CenterCols = (rowsAndCols[0].centerCols);
                    
                    const RightRows = (rowsAndCols[0].rightRows);
                    const RightCols = (rowsAndCols[0].rightCols);
    
                    //create a block for each section that compreends the entire section
                    const blockLeftSection = await createBlocks(0, LeftRows - 1, "left", event.price, idOfShow);
                    const blockCenterSection = await createBlocks(0, CenterRows - 1, "center", event.price, idOfShow);
                    const blockRightSection = await createBlocks(0, RightRows -1 , "right", event.price, idOfShow);
                    
                    // create seats objects for each section
                    
                    const idLeftBlock = await findBlockID("left");
                    console.log(idLeftBlock);
                    if(idLeftBlock === 0){
                      throw "No such block in the left section for this show. "
                    }
                    else{
                      for(let i = 0; i < LeftRows; i++){
                        for(let j = 0; j < LeftCols; j++){
                          const seatObj = await createSeatsForBlocks(i,j,idLeftBlock);
                        }
                      }
                    }
                    
                    const idCenterBlock = await findBlockID("center");
                    console.log(idCenterBlock);
                    if(idCenterBlock === 0){
                      throw "No such block in the center section for this show. "
                    }
                    else{
                      for(let i = 0; i < CenterRows; i++){
                        for(let j = 0; j < CenterCols; j++){
                          const seatObj = await createSeatsForBlocks(i,j,idCenterBlock);
                        }
                      }
                    }
                    
                    const idRightBlock = await findBlockID("right");
                    console.log(idRightBlock);
                    if(idRightBlock === 0){
                      throw "No such block in the center section for this show. "
                    }
                    else{
                      for(let i = 0; i < RightRows; i++){
                        for(let j = 0; j < RightCols; j++){
                          const seatObj = await createSeatsForBlocks(i,j,idRightBlock);
                        }
                      }
                    }
                    
                    response = {
                      statusCode: 200,
                      body: blockRightSection
                    }
                  }
                  else{ // if there are no blocks
                    const rowsAndCols = await findRowsForSection(event.venueName);
      
                    // get dimensions of venue sections
                    const LeftRows = (rowsAndCols[0].leftRows);
                    const LeftCols = (rowsAndCols[0].leftCols);
                    
                    const CenterRows = (rowsAndCols[0].centerRows);
                    const CenterCols = (rowsAndCols[0].centerCols);
                    
                    const RightRows = (rowsAndCols[0].rightRows);
                    const RightCols = (rowsAndCols[0].rightCols);
    
                    //create a block for each section that compreends the entire section
                    const blockLeftSection = await createBlocks(0, LeftRows - 1, "left", event.price, idOfShow);
                    const blockCenterSection = await createBlocks(0, CenterRows - 1, "center", event.price, idOfShow);
                    const blockRightSection = await createBlocks(0, RightRows - 1, "right", event.price, idOfShow);
                    
                    // create seats objects for each section
                    
                    const idLeftBlock = await findBlockID("left");
                    console.log(idLeftBlock);
                    if(idLeftBlock === 0){
                      throw "No such block in the left section for this show. "
                    }
                    else{
                      for(let i = 0; i < LeftRows; i++){
                        for(let j = 0; j < LeftCols; j++){
                          const seatObj = await createSeatsForBlocks(i,j,idLeftBlock);
                        }
                      }
                    }
                    
                    const idCenterBlock = await findBlockID("center");
                    console.log(idCenterBlock);
                    if(idCenterBlock === 0){
                      throw "No such block in the center section for this show. "
                    }
                    else{
                      for(let i = 0; i < CenterRows; i++){
                        for(let j = 0; j < CenterCols; j++){
                          const seatObj = await createSeatsForBlocks(i,j,idCenterBlock);
                        }
                      }
                    }
                    
                    const idRightBlock = await findBlockID("right");
                    console.log(idRightBlock);
                    if(idRightBlock === 0){
                      throw "No such block in the center section for this show. "
                    }
                    else{
                      for(let i = 0; i < RightRows; i++){
                        for(let j = 0; j < RightCols; j++){
                          const seatObj = await createSeatsForBlocks(i,j,idRightBlock);
                        }
                      }
                    }
                    
                    response = {
                      statusCode: 200,
                      body: blockRightSection
                    }
              }
                }
            }
          }
        }
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
