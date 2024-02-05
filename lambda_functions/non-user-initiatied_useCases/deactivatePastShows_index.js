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
  
  let listActiveShows = () => {
      return new Promise((resolve, reject) => {
          pool.query("SELECT * FROM shows WHERE isActive=?", [1], (error, rows) => {
              if (error) { return reject(error); }
              console.log(rows);
              if ((rows) && (rows.length > 0)) {
                    return resolve(rows);
              } else {
                  return reject("No active shows available.");
              }
          });
      });
    
  }
  
  let getVenueName = (venueID) => {
     return new Promise((resolve, reject) => {
          pool.query("SELECT name FROM venues WHERE venueID=?", [venueID], (error, rows) => {
              if (error) { return reject(error); }
              console.log(rows);
              if ((rows) && (rows.length > 0)) {
                    return resolve(rows);
              } else {
                  return reject("Show does not have a valid venue.");
              }
          });
      });
  }
  
  let deactivate = (showName, venueID, showDate, showTime) => {
        return new Promise((resolve, reject) => {
            let [hours, mins] = parseTime(showTime);
            //console.log(hours);
            let time = hours + ":" + mins;
            console.log(time);
            pool.query("UPDATE shows SET isActive = 0 WHERE showName=? AND venueID=? AND showDate=? AND showTime=?", [showName, venueID, showDate, time], (error, rows) => {
                if (error) { return reject(error); }
                resolve((rows) && (rows.affectedRows === 1)) // If found show, resolve true, otherwise resolve false
            });
        });
    }
  
  // The HTTP response
  let response = undefined;
  
    try{
      
        let listOfActiveShows = await listActiveShows();
        let trimmedList = [];
        for(let show of listOfActiveShows) {
          console.log("Checking " + show.showName + "...");
          let showDate = initDate(show.showDate, show.showTime);
          let now = new Date(new Date().toLocaleString('en', {timeZone: 'America/New_York'}));
          if(showDate < now) {
            console.log("Deactivating " + show.showName + "...");
            let success = await deactivate(show.showName, show.venueID, show.showDate, show.showTime);
            if(!success) {
              throw("Could not deactivate past show " + show.showName);
            }
          } else {
            let venueName = await getVenueName(show.venueID);
            let result = {
            "showName" : show.showName,
            "venueName" : venueName[0].name,
            "showDate" : show.showDate,
            "showTime" : show.showTime,
            "duration" : show.duration,
            "description" : show.description
            }
            //console.log(result);
            trimmedList.push(result);
          }
        }
            
        response = {
          statusCode: 200,
          body: trimmedList
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
