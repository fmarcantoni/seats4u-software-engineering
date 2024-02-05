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
	
	const credentials = await findVM();
  
  let CheckCredentials = (venueName, managerID) => {
    return new Promise((resolve, reject) => {
          pool.query("SELECT credentials FROM venues WHERE name=?", [venueName], (error, credentials) => {
              if (error) { return reject(error); }
              console.log(credentials);
              if ((credentials) && (credentials.length == 1)) {
                console.log(credentials[0].credentials);
                  return resolve(credentials[0].credentials === managerID); 
              } else {
                  return reject("Venue '" + venueName + "' does not exist");
              }
          });
    });
  }
  
  let DeleteVenue = (venueName) => {
      return new Promise((resolve, reject) => {
          //console.log("Querying the database...");
          pool.query("DELETE FROM venues WHERE name=?", [venueName], (error, rows) => {
              if (error) { return reject(error); }
              console.log(rows);
              if ((rows) && (rows.affectedRows == 1)) {
                  return resolve(venueName); 
              } else {
                  return reject("Venue '" + venueName + "' does not exist");
              }
          });
      });
  }
  
  // The HTTP response
  let response = undefined;
  console.log("Authorizing...");
  
  try {
    const isAuthorized = await CheckCredentials(event.venueName, credentials);
    if(!isAuthorized) {
      throw "Not authorized to delete this venue.";
    }
    console.log("Authorized! Attempting to delete " + event.venueName  + "...");
    const result = await DeleteVenue(event.venueName);
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
    pool.end();     // disconnect from database to avoid "too many connections" problem that can occur
  }
  
  return response;
}