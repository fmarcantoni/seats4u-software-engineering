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
  
  // The HTTP response
  let response = undefined;
  
    try{
      
        let listOfActiveShows = await listActiveShows();
        let trimmedList = [];
        for(let show of listOfActiveShows) {
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
