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
                    return reject("Venue not found.");
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
                console.log(rows)
                if ((rows) && (rows.length === 1)) { // show already exists
                    return resolve(rows[0].showID); 
                } else {
                    return resolve(0);
                }
            });
            
        });
  }
  
  const idOfShow = await findShowID(event.showName, event.venueName, event.showDate, event.showTime);
  if(idOfShow === 0){
    return {statusCode: 400, body: "Show doesn't exists."};
  }
    
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
  console.log("LeftRows");
   console.log(LeftRows);
  let CenterRows = rowsAndCols[0].centerRows;
  console.log("CenterRows");
   console.log(CenterRows);
  let RightRows = rowsAndCols[0].rightRows;
  console.log("rightRows");
   console.log(RightRows);


  
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
  
  
    let deleteBlock = (rowStart, rowEnd, section) => {
        return new Promise((resolve, reject) => {
          pool.query("DELETE FROM blocks WHERE rowStart=? AND rowEnd=? AND section=? AND `show`=?", [parseRow(rowStart, section, rowEnd), parseRow(rowEnd, section, rowEnd), section, idOfShow], (error, rows) => {
              if (error) { return reject(error); }
              if ((rows) && (rows.affectedRows === 1)) {
                  
                  pool.query("SELECT * FROM blocks WHERE `show`=?", [idOfShow], (error, rows) => {
                    if (error) { return reject(error); }
                    return resolve(rows);
                    })
                  
              } else {
                  return reject("Block does not exist.");
              }
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
              resolve ((rows) && (rows.length === 1));
          });
    });
  };
  
  let toNumber = (letter) => {
      if(!isNaN(Number(letter))) {
          return letter;
      }
      return letter.charCodeAt(0) - "A".charCodeAt(0);
  }
  
  
  let response = undefined;

    try{
        const venueID = await findVenueID(event.venueName);
        
        const isAuthorized = await checkCredentials(event.venueName, managerID);
        if(!isAuthorized) {
            throw "Not authorized to activate this show at this venue.";
        }
            
        const showDateObject = await initDate(event.showDate, event.showTime);
         let today = new Date(new Date().toLocaleString('en', {timeZone: 'America/New_York'}));
         console.log(today);
         if(showDateObject < today){
            throw "Invalid date. Date is in the past."
         }
                  
        let isShowInactive = await checkIfShowIsInactive(event.showName, venueID, event.showDate, event.showTime);
        if(!isShowInactive){
            throw "Cannot delete the block specified because the show is already active.";
        }
        let isShowInBlockMode = await checkIfShowIsBlockMode(event.showName, venueID, event.showDate, event.showTime);
        if(!isShowInBlockMode){
            throw "Cannot delete the block specified because the show is in single price mode."
        }
        
        let result = await deleteBlock(event.rowStart, event.rowEnd, event.section);
        
        response = {
            statusCode: 200,
            body: result 
        }
    } catch (err) {
        response = {
          statusCode: 400,
          error: err
        }
    } finally {
        pool.end();   // done with DB
    }
	return response;
}
