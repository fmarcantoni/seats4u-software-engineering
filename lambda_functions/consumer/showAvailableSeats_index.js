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
  
  
  
  let getVenueID = (venueName) => {
    return new Promise((resolve, reject) => {
          pool.query("SELECT venueID FROM venues WHERE name=?", [venueName], (error, rows) => {
              if (error) { return reject(error); }
              console.log(rows);
              if ((rows) && (rows.length > 0)) {
                    return resolve(rows);
              } else {
                  return reject("Venue not found.");
              }
          });
      });
  }
  
  let getShowID = (showName, venueID, showDate, showTime) => {
      return new Promise((resolve, reject) => {
        //CHANGE IS_ACTIVE TO 1 ONCE DONE TESTING
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
          console.log(time);
          console.log(date);
          console.log(showName);
          console.log(venueID);
        
          pool.query("SELECT showID FROM shows WHERE showName=? AND venueID=? AND showDate=? and showTime=? AND isActive=?", [showName, venueID, date, time, 1], (error, rows) => {
              if (error) { return reject(error); }
              console.log(rows);
              if ((rows) && (rows.length > 0)) {
                    return resolve(rows);
              } else {
                  return reject("Show not found.");
              }
          });
      });
    
  }
  
  let getBlockInfo = (showID) => {
      return new Promise((resolve, reject) => {
          pool.query("SELECT blockID,price,section FROM blocks WHERE `show`=?", [showID], (error, rows) => {
              if (error) { return reject(error); }
              console.log(rows);
              if ((rows) && (rows.length > 0)) {
                    return resolve(rows);
              } else {
                  return reject("Blocks not found.");
              }
          });
      });
  }
  
  let listAvailableSeatsInBlock = (blockID) => {
      return new Promise((resolve, reject) => {
          pool.query("SELECT `row`,col FROM seats WHERE sold=? AND seatBlock=?", [0, blockID], (error, rows) => {
              if (error) { return reject(error); }
              console.log("Rows: " + JSON.stringify(rows));
              if ((rows) && (rows.length > 0)) {
                    return resolve(rows);
              } else {
                  return resolve([]);
              }
          });
      });
  }
  
  function toLetter(n){
    return String.fromCharCode(n + "A".charCodeAt(0));
  }
  
  // The HTTP response
  let response = undefined;
  
    try{
      
        let venueID = await getVenueID(event.venueName);
        console.log(venueID[0].venueID);
        let showID = await getShowID(event.showName, venueID[0].venueID, event.showDate, event.showTime);
        let blockInfo = await getBlockInfo(showID[0].showID);
        let listOfAvailableSeats = [];
        
        for(let element of blockInfo){
          let thisID = element.blockID;
          let thisPrice = element.price;
          let thisSection = element.section;
          console.log(thisID);
          let seatsInBlock = await listAvailableSeatsInBlock(thisID);
          
          seatsInBlock.forEach((seatCoords) => {
            let seat = {
              "row" : toLetter(seatCoords.row),
              "column" : seatCoords.col,
              "section" : thisSection,
              "price" : thisPrice
            };
            listOfAvailableSeats.push(seat);
          });
        };
        
        switch(event.sortMethod.toLowerCase()){
          case "price":
            listOfAvailableSeats.sort((seat1, seat2) => {
              let result = seat1.price - seat2.price;
              return event.descending ? -1*result : result;
            })
            break;
          case "section":
            let leftSectionSeats = [];
            let centerSectionSeats = [];
            let rightSectionSeats = [];
            listOfAvailableSeats.forEach((seat) => {
              switch(seat.section){
                case "left":
                  leftSectionSeats.push(seat);
                  break;
                case "center":
                  centerSectionSeats.push(seat);
                  break;
                case "right":
                  rightSectionSeats.push(seat);
                  break;
                default:
                  throw "Invalid section for seat."
              }
            })
            listOfAvailableSeats = leftSectionSeats.concat(centerSectionSeats).concat(rightSectionSeats);
            break;
          case "row":
            listOfAvailableSeats.sort((seat1, seat2) => {
              let result = seat1.row.charCodeAt(0) - seat2.row.charCodeAt(0);
              return event.descending ? -1*result : result;
            })
            break;
          default:
            console.log("Invalid sorting method.");
        }
        response = {
          statusCode: 200,
          body: listOfAvailableSeats
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
