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
  
  let ListVenues = () => {
      return new Promise((resolve, reject) => {
          pool.query("SELECT name FROM venues", [], (error, rows) => {
              if (error) { return reject(error); }
              if(rows.length === 0){return resolve(false);}
              else {return resolve(rows);}
          });
      });
  }
  
  const all_constants = await ListVenues()
  let response = undefined

  if (all_constants === false){
    const error ={
      statusCode: 400,
      venues: all_constants
    }
    return error;
  } else {
      response = {
      statusCode: 200,
      venues: all_constants
    }
  }

  pool.end();
    
  return response;
};
