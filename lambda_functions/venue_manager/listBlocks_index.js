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
                    console.log("check credentials");
                    console.log(credentials[0].credentials);
                    console.log(managerID);
                    console.log(parseInt(credentials[0].credentials) === parseInt(managerID));
                    return resolve(parseInt(credentials[0].credentials) === parseInt(managerID));
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
    
    let findBlocks = (section, showID) => {
        return new Promise((resolve, reject) => {
          pool.query("SELECT * FROM blocks WHERE section=? AND `show`=?", [section, showID], (error, rows) => {
              if (error) { return reject(error); }
              if ((rows) && (rows.length >= 1)) {
                  return resolve(rows); 
              } else {
                  return resolve([]);
              }
          });
    });
  }
  
  let findListBlockID = (showID) => {
        return new Promise((resolve, reject) => {
          let listOfBlockIDs = [];
          pool.query("SELECT blockID FROM blocks WHERE `show`=?", [showID], (error, rows) => {
              if (error) { return reject(error); }
              
              if ((rows) && (rows.length >= 1)) {
                
                for(let i=0; i < rows.length; i++){
                  listOfBlockIDs.push(rows[i].blockID)
                }
                  return resolve(listOfBlockIDs); 
              } else {
                  return resolve(0);
              }
          });
    });
  }
  
  let getBlockInfo = (blockID) => {
        return new Promise((resolve, reject) => {
          pool.query("SELECT rowStart, rowEnd, section, price FROM blocks WHERE `blockID`=?", [blockID], (error, rows) => {
              if (error) { return reject(error); }
              if ((rows) && (rows.length >= 1)) {
                console.log("get block info");
                console.log(rows);
                  return resolve(rows[0]); 
              } else {
                  return resolve(false);
              }
          });
    });
  }
  
  function toLetter(n){
    return String.fromCharCode(n + "A".charCodeAt(0));
  }
  
  let listPurchasedSeats = (seatBlock) => {
        return new Promise((resolve, reject) => {
          pool.query("SELECT seats.* FROM seats INNER JOIN blocks ON seats.seatBlock=blocks.blockID where seats.seatBlock=? AND seats.sold=?", [seatBlock, 1], (error, rows) => {
              if (error) { return reject(error); }
              if ((rows) && (rows.length >= 1)) {
                  return resolve(rows.length);
              } else {
                  return resolve(0);
              }
          });
    });
  }
  
   let listAvailableSeats = (seatBlock) => {
        return new Promise((resolve, reject) => {
          pool.query("SELECT seats.*, blocks.section, blocks.price FROM seats INNER JOIN blocks ON seats.seatBlock=blocks.blockID where seats.seatBlock=? AND seats.sold=?", [seatBlock, 0], (error, rows) => {
              if (error) { return reject(error); }
              if ((rows) && (rows.length >= 1)) {
                  return resolve(rows.length); 
              } else {
                  return resolve(0);
              }
          });
    });
  }
  
  
  let checkIfShowIsBlockMode = (showName, venueID, showDate, showTime) => {
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
          pool.query("SELECT * FROM shows WHERE showName=? AND venueID=? AND showDate=? AND showTime=? AND isSinglePriceMode=?", [showName, venueID, date, time, 0], (error, rows) => {
              if (error) { return reject(error); }
              console.log(rows);
              resolve ((rows) && (rows.length === 1));
          });
    });
  }
  
  
  let response = undefined;

    try{
        const venueID = await findVenueID(event.venueName);
        const isAuthorized = await checkCredentials(event.venueName, managerID);
        if(!isAuthorized) {
            throw "Not authorized to list the blocks of this show at this venue.";
        }
        let showID = await findShowID(event.showName, venueID, event.showDate, event.showTime);
            
        const showDateObject = await initDate(event.showDate, event.showTime);
         let todayDate = new Date(new Date().toLocaleString('en', {timeZone: 'America/New_York'}));
         console.log(todayDate);
         if(showDateObject < todayDate){
            throw "Invalid date. Date is in the past."
         }
        
        let listOfBlockIds = await findListBlockID(showID);
        
        //let leftBlocks = await findBlocks("left", showID);
        //let centerBlocks = await findBlocks("center", showID);
        //let rightBlocks = await findBlocks("right", showID);
        //let allBlockInfo = leftBlocks.concat(centerBlocks).concat(rightBlocks);
        
        let blocks = [];
        
        for(let j = 0; j < listOfBlockIds.length; j++){
            let numberOfSeatsAvailable  = await listAvailableSeats(listOfBlockIds[j]);
            let numberOfSeatsSold = await listPurchasedSeats(listOfBlockIds[j]);
            let blockInfo = await getBlockInfo(listOfBlockIds[j]);
            
            let singleBlock = {
                "rowStart" : blockInfo.rowStart,
                "rowEnd" : blockInfo.rowEnd,
                "section" : blockInfo.section,
                "price" : blockInfo.price,
                "numberOfSeatsAvailable" : numberOfSeatsAvailable,
                "numberOfSeatsSold" : numberOfSeatsSold
            };
            blocks.push(singleBlock);
        }
        
        let result = {
            "showName" : event.showName,
            "venueName" : event.venueName,
            "showDate" : event.showDate,
            "showTime" : event.showTime,
            "blocks" : blocks
        };
        
        response = {
            statusCode: 200,
            body: result
        };
    } catch (err) {
        response = {
          statusCode: 400,
          error: err
        };
    } finally {
        pool.end();   // done with DB
    }
	return response;
}
