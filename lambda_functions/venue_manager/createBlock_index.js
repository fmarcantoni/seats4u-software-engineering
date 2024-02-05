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
          result[0] = -1;
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
          result[0] = -1;
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
  
  //check we are autorised to create a block for this show
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
              console.log(rows);
              if ((rows) && (rows.length === 1)) {
                
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
  
  let checkIfShowIsBlockMode = (showName, venueName, showDate, showTime) => {
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
          pool.query("SELECT * FROM shows WHERE showName=? AND venueID=? AND showDate=? AND showTime=? AND isSinglePriceMode=?", [showName, idOfVenue, date, time, 0], (error, rows) => {
              if (error) { return reject(error); }
              console.log(rows);
              if ((rows) && (rows.length === 1)) {
                    return resolve(true);
              } else {
                  return reject("A block in this show in this venue cannot be created because it's in single price mode.");
              }
          });
    });
  }
  
  // check if active and if price and section are valid
let checkForPriceActiveSection = (showName, venueName, showDate, showTime, section, price) => {
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
                return reject("Invalid price.");
              }
              if(section !== "center" && section !== "left" && section !== "right"){
                return reject("Invalid section.");
              }
              if ((rows) && (rows.length === 1)) {
                    return resolve(true);
              } else {
                  return reject("Cannot create a block because show is active.");
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
            else{
              return reject("Venue doesn't exist.");
            }
          });
    });
  }
  

  const rowsAndCols = await findRowsForSection(event.venueName);
  let LeftRows = rowsAndCols[0].leftRows;
  console.log("LeftRows");
   console.log(LeftRows);
  let CenterRows = rowsAndCols[0].centerRows;
  console.log("CenterRows");
   console.log(CenterRows);
  let RightRows = rowsAndCols[0].rightRows;
  console.log("rightRows");
   console.log(RightRows);

  
  let response = undefined
  
  // convert rows and check that are valid
  let parseRow = (row, section, rowEnd) => {
    let ParsedRow = row.charCodeAt(0) - "A".charCodeAt(0);
    if(ParsedRow < 0 || ParsedRow > 25){
      return -1;
    }
    
    if(section === "left"){
      if((ParsedRow >= LeftRows) || (ParsedRow > rowEnd)){
        return -1;
      }
    }
    else if(section === "center"){
      if((ParsedRow >= CenterRows) || (ParsedRow > rowEnd)){
        return -1;
      }
    }
    else if(section === "right"){
      if((ParsedRow >= RightRows) || (ParsedRow > rowEnd)){
        return -1;
      }
    }
    return ParsedRow;
  }
  

  //check that block doesn't exists yet
  let validateIfBlockExists = (rowStart, rowEnd, section, show) => {
    return new Promise((resolve, reject) => {
        pool.query("SELECT * FROM blocks WHERE rowStart=? AND rowEnd=? AND `section`=? AND `show`=?", [parseRow(rowStart, section, rowEnd), parseRow(rowEnd, section, rowEnd), section, idOfShow], (error, rows) => {
            if (error) { return reject(error); }
            if ((rows) && (rows.length === 1)) {
                return resolve(false);
            } else {
                return resolve(true);
            }
        });
    });
  }
  
  let findListBlockID = (showID, section) => {
        return new Promise((resolve, reject) => {
          let listOfBlockIDs = [];
          pool.query("SELECT blockID FROM blocks WHERE `show`=? AND section =?", [idOfShow, section], (error, rows) => {
              if (error) { return reject(error); }
              
              if ((rows) && (rows.length >= 1)) {
                
                for(let i=0; i < rows.length; i++){
                  listOfBlockIDs.push(rows[i])
                }
                  return resolve(listOfBlockIDs); 
              } else {
                  return resolve([]);
              }
          });
    });
  }
  
  let validateIfBlockOverlaps = (rowStart, rowEnd, section) => {
    //tells me it overlaps when it doesn't beacuse it cannot understand which section we are talking about
    // SELECT seatBlock FROM seats WHERE (`row` >=?) AND (`row`<=?)
    let listOfRowsOverlapping = [];
    return new Promise((resolve, reject) => {
        pool.query("SELECT seats.row FROM seats INNER JOIN blocks ON seats.seatBlock=blocks.blockID where blocks.section=? AND blocks.show=?", [section, idOfShow], (error, rows) => {
            if (error) { return reject(error); }
              
            if ((rows) && (rows.length >= 1)) {
              
              for(let index = 0; index < rows.length; index++){
                
                if((rows[index].row >= parseRow(event.rowStart, event.section, event.rowEnd) && rows[index].row <= parseRow(event.rowEnd, event.section, event.rowEnd))){
                      listOfRowsOverlapping.push(rows[index].row);
                }
                
              }
              if(listOfRowsOverlapping.length !== 0){
                return resolve(true); //"This block overlaps an already existing block."
              }
              else{
                return resolve(false);
              }
              
            } else {
                return resolve(false);
            }
        });
    });
  }


  let createBlock = (rowStart, rowEnd, section, price, show) => {
    return new Promise((resolve, reject) => {
        pool.query("INSERT into blocks(rowStart, rowEnd, section, price, `show`) VALUES(?,?,?,?,?);", [parseRow(rowStart, section, rowEnd), parseRow(rowEnd, section, rowEnd), section, price, idOfShow], (error, rows) => {
            if (error) { return reject(error); }
            if ((rows) && (rows.affectedRows === 1)) {
                
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
  
  let findBlock = (rowStart, rowEnd, section) => {
        return new Promise((resolve, reject) => {
          pool.query("SELECT blockID FROM blocks WHERE rowStart=? AND rowEnd=? AND section =? AND `show`=?", [parseRow(rowStart, section, rowEnd), parseRow(rowEnd, section, rowEnd), section, idOfShow], (error, rows) => {
              if (error) { return reject(error); }
              if ((rows) && (rows.length === 1)) {
                  return resolve(rows[0]); 
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

  
  try{
      //const can_create= await ValidateShowInput(event.showName, event.showVenue, event.showDate, event.showTime, event.credentials);
      const isVenueIDFound = await findVenueID(event.venueName);
      
      if(isVenueIDFound === 0){ // if venue doesn't exist
        throw "Venue doesn't exist.";
      }
      
      const isVenueValid = await checkCredentials(event.venueName, managerID);
      
      if(!isVenueValid){ //if we are NOT authorised
          throw "Not authorized to create a block for this show in this venue.";
      }
      // if we are authorised
      if(parseTime(event.showTime)[0] == -1){
        throw "Invalid time";
      }
      
      const validDate = await initDate(event.showDate, event.showTime);
      let today = new Date(new Date().toLocaleString('en', {timeZone: 'America/New_York'}));
      console.log(today);
      
      if(validDate < today){
        throw "Invalid date. Date is in the past."
      }
      
      const isShowIdFound = await findShowID(event.showName, event.venueName, event.showDate, event.showTime);
      
      if(isShowIdFound === 0){ // if show is not found
        throw "This show in this venue at this time doesn't exist.";
      }
      // if show is found
        
      const isShowInBlockMode = await checkIfShowIsBlockMode(event.showName, event.venueName, event.showDate, event.showTime);
      
      if(!isShowInBlockMode){ // if we are in Single Price Mode
           throw "A block in this show in this venue cannot be created because it's in single price mode.";
      }
      // if we are in block mode we create the block
      const isInputValid = await checkForPriceActiveSection(event.showName, event.venueName, event.showDate, event.showTime, event.section, event.price);
      //check if show is active, price and section
      if(!isInputValid){
        throw "Input is invalid in some way yet bypassed all the other checks, whoops.";
        
      }// if price, section and is active are set correctly
      let startingRow = parseRow(event.rowStart, event.section, event.rowEnd);
      let endingRow = parseRow(event.rowEnd, event.section, event.rowEnd);
      
      if(startingRow === -1 || endingRow === -1){
        throw "Invalid row selected.";
      }
      const doesNOTExist = await validateIfBlockExists(event.rowStart, event.rowEnd, event.section, event.show);
      
      if(!doesNOTExist){
        throw "This block already exists.";
      }
      
      //check if overlaps
      const listOfBlockIDs = await findListBlockID(event.showID, event.section);

      const doesOverlap = await validateIfBlockOverlaps(event.rowStart, event.rowEnd, event.section);
          
      if(doesOverlap){
        throw "This block overlaps an already existing block.";
      }
          
                
      const rowsAndCols = await findRowsForSection(event.venueName);
      
      const LeftCols = (rowsAndCols[0].leftCols);
      const CenterCols = (rowsAndCols[0].centerCols);
      const RightCols = (rowsAndCols[0].rightCols);
      
      let block = await createBlock(event.rowStart, event.rowEnd, event.section, event.price, event.show);
    
      const idOfBlock = await findBlock(event.rowStart, event.rowEnd, event.section);
      
      console.log(idOfBlock);
      
      if(idOfBlock.blockID === 0){
        throw "No such block in this section for this show.";
      }
      
      for(let i = parseRow(event.rowStart, event.section, event.rowEnd); i <= parseRow(event.rowEnd, event.section, event.rowEnd); i++){
        if(event.section.toLowerCase() === "left"){
          for(let j = 0; j < LeftCols; j++){
            
            const seatObj = await createSeatsForBlocks(i,j,idOfBlock.blockID);
            
          }
        }
        else if(event.section.toLowerCase() === "center"){
          for(let j = 0; j < CenterCols; j++){
            
            const seatObj = await createSeatsForBlocks(i,j,idOfBlock.blockID);
            
          }
        }
        else if(event.section.toLowerCase() === "right"){
          for(let j = 0; j < RightCols; j++){
            
            const seatObj = await createSeatsForBlocks(i,j,idOfBlock.blockID);
            
          }
        } else {
          throw "Invalid section name.";
        }
      }
      response = {
        statusCode: 200,
        body: block
      };
    } catch (err) {
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

