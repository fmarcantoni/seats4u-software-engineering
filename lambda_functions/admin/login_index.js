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

	let response = undefined;
	
	function checkPassword(password){
		if (password === "groupParashuramaRules"){
			return true;
		}
		else return false
	}
	
	try {
		const auth = await checkPassword(event.password);
		if(!auth){
			throw "Incorrect Password Entered"
		}
	response = {
		statusCode: 200,
		body: "admin logged in"
	};
		
	} catch (err) {
        response = {
          statusCode: 400,
          error: err
        }
    } finally {
	

	pool.end();   // done with DataBase
    }
	return response;
}