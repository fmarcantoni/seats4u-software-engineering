const mysql = require('mysql');
const db_access = require('/opt/nodejs/db_access');

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
  
  const id = await findVenueID(event.venueName);
  
  let ValidateShowInput = (showName, showVenue, showDate, showTime) => {
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
            pool.query("SELECT * FROM shows WHERE showName=? AND venueID=? AND showDate=? AND showTime=?", [showName, id, date, time], (error, rows) => {
                if (error) { return reject(error); }
                console.log(rows)

                if ((rows) && (rows.length > 0)) { // shows already exists
                    return resolve(true); 
                } else {
                    return resolve(false);
                }
            });
            
        });
  }
  
  let DeleteShow = (showName, showVenue, showDate, showTime) => {
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
          pool.query("DELETE FROM shows WHERE showName=? AND venueID=? AND showDate=? AND showTime=?", [showName, id, date, time], (error, rows) => {
              if (error) { return reject(error); }
              console.log(rows);
              if ((rows) && (rows.affectedRows == 1)) {
                
                  pool.query("SELECT * FROM shows", [], (error, rows) => {
                    if (error) { return reject(error); }
                        return resolve(rows);
                    })
                    
              } else {
                  return resolve(false);
              }
          });
      });
  }
  
  // The HTTP response
  let response = undefined;
  console.log("Authorizing...");
  
    try{
      //const can_create= await ValidateShowInput(event.showName, event.showVenue, event.showDate, event.showTime, event.credentials);
      const isVenueIDFound = await findVenueID(event.venueName);
      
      if(isVenueIDFound === 0){ // if venue doesn't exist
          throw "Venue doesn't exist.";
      }
      else{ // if venue exists
              const can_delete = await ValidateShowInput(event.showName, event.showVenue, event.showDate, event.showTime);
              if(!can_delete){
                   throw "This show in this venue at this time doesn't exist.";
              }
              else{
                // const isShowActive = await checkIfNotActive(event.showName, event.showVenue, event.showDate, event.showTime);
                
                // if(!isShowActive){
                //   throw "Cannot delete a show that is active.";
                // }
                
                  let show = await DeleteShow(event.showName, event.showVenue, event.showDate, event.showTime);
                  
                  response = {
                  statusCode: 200,
                  body: show
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