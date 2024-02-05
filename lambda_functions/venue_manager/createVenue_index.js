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
	let credentials = undefined;
	
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
	
	credentials = await findVM();
	
	/**converts a list of strings to ints*/
	function list_text_to_nums(listoOfStrings){
		for(let index = 0; index < listoOfStrings.length; index++){
			listoOfStrings[index] = parseInt(listoOfStrings[index]);
		}
	}

	/**converts letters to numbers
	 * ( A -> 0, B -> 1, S -> 18, etc. )*/
	function letter_to_number(letter){
		if(!isNaN(parseInt(letter))){
			return letter;
		}
		letter = letter.toUpperCase();
		let num = (letter.charCodeAt() - 65);
		return num;
		
	}

	/** creates venue*/
	let createVenue = (venueName, sideLeftSection, centerSection, sideRightSection) => {

		// convert text to numbers for coloumns, and managerID //
		list_text_to_nums((
			sideLeftSection.numCols, centerSection.numCols, sideRightSection.numCols
		));


		/**     convert rows to numbers, A -> 1, B -> 2, S -> 19, etc.   */
		sideLeftSection.numRows = letter_to_number(sideLeftSection.numRows);
		sideRightSection.numRows = letter_to_number(sideRightSection.numRows);
		centerSection.numRows = letter_to_number(centerSection.numRows);
		// sideLeftSection.numRows = String.fromCharCode(sideLeftSection.numRows);
		// sideRightSection.numRows = String.fromCharCode(sideRightSection.numRows);
		// centerSection.numRows = String.fromCharCode(centerSection.numRows);

		//? a Promise is a method of asycrhonus running,
		//? keeps running code but comes back to this when promise is fufilled*/
		/** adds venue object to database's 'venue' table
		 *  using the sql syntax to input the user provided values into the database  */
		return new Promise((resolve, reject) => {

			/** run a query on the first available idle client and return its result. 
			 * rows.affectedrows		
			 * ?more info: https://github.com/mysqljs/mysql#pooling-connections */
			pool.query("INSERT INTO venues(name, leftRows, leftCols, centerRows, centerCols, rightRows, rightCols, credentials) VALUES(?,?,?,?,?,?,?,?);",
				[venueName, sideLeftSection.numRows, sideLeftSection.numCols, centerSection.numRows, centerSection.numCols, sideRightSection.numRows, sideRightSection.numCols, credentials],
				(error, rows) => {

					if(!venueName) {
						throw new Error('Venue name is required');
					}

					// /* check if database already has a venue by that name */
					// let dupliname = pool.query("SELECT name FROM venues WHERE name=?", [venueName]);

					if ((rows) && (rows.affectedRows == 1)) {
						return resolve({venueName, sideLeftSection, centerSection, sideRightSection});
					// }else if(dupliname === venueName){
					// 	return resolve({'duplicateVenue': venueName});
					}else{
						resolve(error);
					}

				});

		});

	};

	// waits to recive values from the user
	let createResult = await createVenue(event.venueName, event.sideLeftSection, event.centerSection, event.sideRightSection, credentials);

	response = {
		statusCode: 200,
		createResult
	};
	

	pool.end();   // done with DataBase
	return response;
};