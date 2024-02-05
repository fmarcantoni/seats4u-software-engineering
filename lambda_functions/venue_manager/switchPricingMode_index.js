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
        if(result[1] >= 60 || result[1] < 0 || result[0] < 0 || result[0] >= 24) {
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
  
  if(idOfVenue === 0){
    return {statusCode: 400, body: "Venue doesn't exist."};
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
  
  let checkIfShowIsInactive = (showName, venueName, showDate, showTime) => {
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
              resolve((rows) && (rows.length === 1));
          });
    });
  }
  
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
                  return resolve(false);
              }
          });
    });
  }
  
  
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
  
  
  let switchPriceModeSinglePriceToBlockMode = (showName, venueName, showDate, showTime) => {
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
          pool.query("UPDATE shows SET isSinglePriceMode = 0 WHERE showName=? AND venueID=? AND showDate=? AND showTime=?", [showName, idOfVenue, date, time], (error, rows) => {
              if (error) { return reject(error); }
              console.log(rows);
              if ((rows) && (rows.affectedRows === 1)) {
                    return resolve(true);
              } else {
                  return resolve(false);
              }
          });
    });
  }
  
  let switchPriceModeBlockToSinglePrice = (showName, venueName, showDate, showTime) => {
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
          pool.query("UPDATE shows SET isSinglePriceMode = 1 WHERE showName=? AND venueID=? AND showDate=? AND showTime=?", [showName, idOfVenue, date, time], (error, rows) => {
              if (error) { return reject(error); }
              console.log(rows);
              if ((rows) && (rows.affectedRows === 1)) {
                    return resolve(true);
              } else {
                  return resolve(false);
              }
          });
    });
  }
  
  let response = undefined
  
  try{
      //const can_create= await ValidateShowInput(event.showName, event.showVenue, event.showDate, event.showTime, event.credentials);
      const isVenueIDFound = await findVenueID(event.venueName);
      
      if(isVenueIDFound === 0){ // if venue doesn't exist
        throw "Venue doesn't exist.";
      }
      
      const isVenueValid = await checkCredentials(event.venueName, managerID);
      
      if(!isVenueValid){ //if we are NOT authorised
          throw "Not authorized to switch pricing mode for this show in this venue.";
      }
      // if we are authorised
      const isShowIdFound = await findShowID(event.showName, event.venueName, event.showDate, event.showTime);
      const showDateObject = await initDate(event.showDate, event.showTime);
      let todayDate = new Date(new Date().toLocaleString('en', {timeZone: 'America/New_York'})); //date of now
      if(showDateObject < todayDate){
         throw "Invalid date. Date is in the past."
      }
          
      if(isShowIdFound === 0){ // if show is not found
        throw "This show in this venue at this time doesn't exist.";
      }
      // if show is found
            
      const isShowInactive = await checkIfShowIsInactive(event.showName, event.venueName, event.showDate, event.showTime);
      
      if(!isShowInactive){
        throw "Cannot change the price mode since this show is already active."
      }
      
      const isShowInBlockMode = await checkIfShowIsBlockMode(event.showName, event.venueName, event.showDate, event.showTime);
      console.log("is show in block mode?");
      console.log(isShowInBlockMode);
               
      if(!isShowInBlockMode){ // if we are in Single Price Mode
        const gotBlocks = await checkIfGotBlocks();
        if(gotBlocks !== false){
          const cleanVenue = await DeleteBlocks();
        }
        const switchToBlockMode = await switchPriceModeSinglePriceToBlockMode(event.showName, event.venueName, event.showDate, event.showTime);
        //should prob remove the 3 blocks that come with single price mode here
        if(switchToBlockMode){
          response = {
            statusCode: 200,
            body: "This show was successfully set to Block Mode."
          }
        } else {
          throw "This show is already in Block Mode."
        }
      }
      else{ // if we are in block mode we create the block
                  
        const switchToSinglePriceMode = await switchPriceModeBlockToSinglePrice(event.showName, event.venueName, event.showDate, event.showTime);
          
        if(switchToSinglePriceMode){
          response = {
            statusCode: 200,
            body: "This show was successfully set to Single Price Mode."
          };
        }
        else{
          throw "This show is already in Single Price Mode.";
        }
      }
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
