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
                  return reject("Venue doesn't exist.");
              }
          });
    });
  }
  
  
    let findShowID = (showName, venueID, showDate, showTime) => {
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
            pool.query("SELECT showID FROM shows WHERE showName=? AND venueID=? AND showDate=? AND showTime=?", [showName, venueID, date, time], (error, rows) => {
                if (error) { return reject(error); }
                console.log(rows)
                if ((rows) && (rows.length === 1)) { // shows already exists
                    return resolve(rows[0].showID); 
                } else {
                    return reject("Show doesn't exist.");
                }
            });
            
        });
  }
  
    
    
    let checkIfShowIsInactive = (showName, venueID, showDate, showTime) => {
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
            pool.query("SELECT * FROM shows WHERE showName=? AND venueID=? AND showDate=? AND showTime=? AND isActive=?", [showName, venueID, date, time, 0], (error, rows) => {
              if (error) { return reject(error); }
              resolve((rows) && (rows.length === 1));
          });
    });
  }
    
    let makeActive = (showName, venueID, showDate, showTime) => {
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
            pool.query("UPDATE shows SET isActive = 1 WHERE showName=? AND venueID=? AND showDate=? AND showTime=?", [showName, venueID, date, time], (error, rows) => {
                if (error) { return reject(error); }
                resolve((rows) && (rows.affectedRows === 1)) // If found show, resolve true, otherwise resolve false
            });
        });
    }
    
    let findBlockIDs = (section, showID) => {
        return new Promise((resolve, reject) => {
          pool.query("SELECT * FROM blocks WHERE section=? AND `show`=?", [section, showID], (error, rows) => {
              if (error) { return reject(error); }
              if ((rows) && (rows.length >= 1)) {
                  return resolve(rows.map((element) => element.blockID)); 
              } else {
                  return reject("No blocks found in the " + section + " section.");
              }
          });
    });
  }
  
  let getSeats =  (blockID) => {
        return new Promise((resolve, reject) => {
           pool.query("SELECT * FROM seats WHERE seatBlock=?", [blockID], (error, rows) => {
              if (error) { return reject(error); }
              if ((rows) && (rows.length >= 1)) {
                  return resolve(rows); 
              }
              return reject("No seats found for block " + blockID + "." );
            });
        });
  }
  
//   let checkIfShowIsBlockMode = (showName, venueID, showDate, showTime) => {
//         return new Promise((resolve, reject) => {
//             let [hours, mins] = parseTime(event.showTime);
//             let time = hours + ":" + mins;
//           pool.query("SELECT * FROM shows WHERE showName=? AND venueID=? AND showDate=? AND showTime=? AND isSinglePriceMode=?", [showName, venueID, showDate, time, 0], (error, rows) => {
//               if (error) { return reject(error); }
//               console.log(rows);
//               if ((rows) && (rows.length === 1)) {
//                     return resolve(true);
//               } else {
//                   return resolve(false);
//               }
//           });
//     });
//   }
  
  
    
    let checkIfSeatHasBlock = (row, col, seatBlock) => {
        return new Promise((resolve, reject) => {
          pool.query("SELECT * FROM seats WHERE `row`=? AND `col`=? AND seatBlock=?", [row, col, seatBlock], (error, rows) => {
              if (error) { return reject(error); }
              resolve((rows) && (rows.length === 1));
          });
    });
  }
    
    
    let findRowsForSection = (venueName) => {
        return new Promise((resolve, reject) => {
          pool.query("SELECT * FROM venues WHERE name=?", [venueName], (error, rows) => {
            if (error) { return reject(error); }
            console.log(rows);
            if ((rows) && (rows.length === 1)) {
                if(rows[0].leftRows > 25){
                  return reject("The number of rows for the left section execeeds section capacity.");
                }
                if(rows[0].centerRows > 25){
                  return reject("The number of rows for the center section execeeds section capacity.");
                }
                if(rows[0].rightRows > 25){
                  return reject("The number of rows for the right section execeeds section capacity.");
                }
                return resolve(rows[0]);
            }
            return reject("Rows not found for the venue specified.");
          });
    });
  }
  
  let checkSection = async(blockIDs, actualSectionRows, actualSectionCols) => {
      let sum = 0;
        for(let blockID of blockIDs) {
            let seats = await getSeats(blockID);
            sum += seats.length;
        }
        console.log(sum);
        console.log(actualSectionRows * actualSectionCols);
        if(sum !== actualSectionRows * actualSectionCols) {
            throw "Not every seat in a section has a block.";
        }
  }
  
  
  let response = undefined;

    try{
        const venueID = await findVenueID(event.venueName);
        
        const rowsAndCols = await findRowsForSection(event.venueName);
        let LeftRows = rowsAndCols.leftRows;
        let CenterRows = rowsAndCols.centerRows;
        let RightRows = rowsAndCols.rightRows;
        let LeftCols = rowsAndCols.leftCols;
        let CenterCols = rowsAndCols.centerCols;
        let RightCols = rowsAndCols.rightCols;
        
        const isAuthorized = await checkCredentials(event.venueName, managerID);
        if(!isAuthorized) {
            throw "Not authorized to activate this show at this venue.";
        }
        
        let showID = await findShowID(event.showName, venueID, event.showDate, event.showTime);
            
        const showDateObject = await initDate(event.showDate, event.showTime);
         let todayDate = new Date(new Date().toLocaleString('en', {timeZone: 'America/New_York'})); //date of now
         console.log(todayDate);
         if(showDateObject < todayDate){
            throw "Invalid date. Date is in the past."
         }
                  
        let isShowInactive = await checkIfShowIsInactive(event.showName, venueID, event.showDate, event.showTime);
        if(!isShowInactive){
            throw "Cannot activate show beacuse it's already active";
        }
                
        //check that all seats in the left section have a block assigned
        let leftBlockIDs = await findBlockIDs("left", showID);
        let centerBlockIDs = await findBlockIDs("center", showID);
        let rightBlockIDs = await findBlockIDs("right", showID);
        
        let success = await checkSection(leftBlockIDs, LeftRows, LeftCols);
        success = await checkSection(centerBlockIDs, CenterRows, CenterCols);
        success = await checkSection(rightBlockIDs, RightRows, RightCols);
                let activate = await makeActive(event.showName, venueID, event.showDate, event.showTime);
        if(!activate){
            throw "Couldn't activate the show.";
        }
        response = {
            statusCode: 200,
            body: "This show was successfully activated." //should probably return something more useful than this, maybe?
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
