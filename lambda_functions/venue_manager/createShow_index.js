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
  
  //const isVenueValid = await checkShowVenue(event.showVenue, event.credentials);
  
  let findVenueID = (venueName) => {
        return new Promise((resolve, reject) => {
          pool.query("SELECT venueID FROM venues WHERE name=?", [venueName], (error, rows) => {
              if (error) { return reject(error); }
              if ((rows) && (rows.length === 1)) {
                console.log(rows[0].venueID);
                  return resolve(rows[0].venueID); 
              } else {
                  return resolve(0);
              }
          });
    });
  }
  
  const idOfVenue = await findVenueID(event.venueName);
  
  let ValidateShowInput = (showVenue, showDate, showTime) => {
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
          
            pool.query("SELECT * FROM shows WHERE venueID=? AND showDate=? AND showTime=?", [idOfVenue, date, time], (error, rows) => {
                if (error) { return reject(error); }
                console.log(rows)

                if ((rows) && (rows.length > 0)) { // shows already exists
                    return resolve(false); 
                } else {
                    return resolve(true);
                }
            });
            
        });
  }
  
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
  
  let response = undefined
  
    
      let createShow = (showName, venueID, showDate, showTime) => {
       // const id = await findVenueID(showVenue);
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
            pool.query("INSERT into shows(showName, venueID, showDate, showTime, isSinglePriceMode) VALUES(?,?,?,?,?);", [showName, idOfVenue, date, time, 1], (error, rows) => {
                if (error) { return reject(error); }
                if ((rows) && (rows.affectedRows === 1)) {
                    
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
    
  
  try{
      //const can_create= await ValidateShowInput(event.showName, event.showVenue, event.showDate, event.showTime, event.credentials);
      console.log(idOfVenue);
      if(idOfVenue === 0){ // if venue doesn't exist
          throw "Venue doesn't exist.";
      }
      else{ // if venue exists
          const isVenueValid = await checkCredentials(event.venueName, managerID);
          
          if(!isVenueValid){ //if we are NOT authorised
              throw "Not authorized to add a show to this venue.";
          }
          else{ // if we are authorised
              const can_create = await ValidateShowInput(event.showVenue, event.showDate, event.showTime);
              if(!can_create){
                   throw "This venue is alreday booked at this time";
              }
              else{
                  
                  const validDate = await initDate(event.showDate, event.showTime);
                  let todayDate = new Date(new Date().toLocaleString('en', {timeZone: 'America/New_York'}));
                  console.log(todayDate);
                  if(validDate < todayDate){
                    throw "Invalid date. Date is in the past."
                  }
                  else{
                  //let [hours, mins] = parseTime(event.showTime);
                  //let time = hours + ":" + mins;
                  let show = await createShow(event.showName, event.showVenue, event.showDate, event.showTime);
                  
                  response = {
                  statusCode: 200,
                  body: show
                }
              }
          }}
          
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
