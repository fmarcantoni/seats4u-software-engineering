const mysql = require('mysql');
const db_access = require('/opt/nodejs/db_access');
const { error } = require('console');

let response = undefined;
exports.handler = async (event) => {

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
	
	const response = await findVM();
	
	pool.end();   // done with DataBase

	return response;
};