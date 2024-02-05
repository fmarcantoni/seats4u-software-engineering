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
                  return resolve(false);
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
  
  let generateShowReport = (venueName) => {
      return new Promise((resolve, reject) => {
          pool.query("SELECT showID FROM shows WHERE venueID=?", [idOfVenue], (error, rows) => {
              if (error) { return reject(error); }
              console.log(rows);
              
              if ((rows) && (rows.length >= 1)) {
                let listOfShowsID = [];
                
                for(let j = 0; j < rows.length; j++){
                  listOfShowsID.push(rows[j].showID);
                  console.log(rows[j].showID);
                }
                console.log("check show id");
                console.log(listOfShowsID);
                  
                    return resolve(listOfShowsID);
              } else {
                  return reject("No such venue exists.");
              }
          });
      });
  }
  
  let findBlockID = (showID) => {
        return new Promise((resolve, reject) => {
          pool.query("SELECT blockID FROM blocks WHERE `show`=?", [showID], (error, rows) => {
              if (error) { return reject(error); }
              if ((rows) && (rows.length >= 1)) {
                  return resolve(rows[0].blockID); 
              } else {
                  return resolve(0);
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
  
  let getShowInfo = (showID) => {
        return new Promise((resolve, reject) => {
          pool.query("SELECT * FROM shows WHERE `showID`=?", [showID], (error, rows) => {
              if (error) { return reject(error); }
              if ((rows) && (rows.length >= 1)) {
                console.log("get show info");
                console.log(rows);
                  return resolve(rows[0]); 
              } else {
                  return resolve(false);
              }
          });
    });
  }
  
  /*
  
  SELECT seats.*, blocks.section
FROM seats
INNER JOIN blocks ON seats.seatBlock=blocks.blockID where seats.seatBlock=155
  */
  
  function toLetter(n){
    return String.fromCharCode(n + "A".charCodeAt(0));
  }
  
  
  let listAvailableSeats = (seatBlock) => {
        return new Promise((resolve, reject) => {
          let listAvailableSeatsForABlock = [];
          pool.query("SELECT seats.*, blocks.section, blocks.price FROM seats INNER JOIN blocks ON seats.seatBlock=blocks.blockID where seats.seatBlock=? AND seats.sold=?", [seatBlock, 0], (error, rows) => {
              if (error) { return reject(error); }
              
              if ((rows) && (rows.length >= 1)) {
                for(let j = 0; j < rows.length; j++){
                  let seatInfo = {
                      "row" : toLetter(rows[j].row),
                      "col" : rows[j].col,
                      "section" : rows[j].section,
                      "price" : rows[j].price,
                  };
                  listAvailableSeatsForABlock.push(seatInfo);
                }
                
                console.log("show available seats from function listAvailableSeats: ");
                console.log(listAvailableSeatsForABlock);
                  return resolve(listAvailableSeatsForABlock); 
              } else {
                  return resolve([]);
              }
          });
    });
  }
  
  let listPurchasedSeats = (seatBlock) => {
        return new Promise((resolve, reject) => {
          let listPurchasedSeatsForABlock = [];
          pool.query("SELECT seats.*, blocks.section, blocks.price FROM seats INNER JOIN blocks ON seats.seatBlock=blocks.blockID where seats.seatBlock=? AND seats.sold=?", [seatBlock, 1], (error, rows) => {
              if (error) { return reject(error); }
              if ((rows) && (rows.length >= 1)) {
                for(let j = 0; j < rows.length; j++){
                  let seatInfo = {
                      "row" : toLetter(rows[j].row),
                      "col" : rows[j].col,
                      "section" : rows[j].section,
                      "price" : rows[j].price,
                  };
                  listPurchasedSeatsForABlock.push(seatInfo);
                }
                  return resolve(listPurchasedSeatsForABlock); 
              } else {
                  return resolve([]);
              }
          });
    });
  }
  
  let moneyMadePerBlock = (seatBlock) => {
        return new Promise((resolve, reject) => {
          let moneyMadeForBlock = 0;
          pool.query("SELECT seats.*, blocks.price FROM seats INNER JOIN blocks ON seats.seatBlock=blocks.blockID where seats.seatBlock=? AND seats.sold=?", [seatBlock, 1], (error, rows) => {
              if (error) { return reject(error); }
              if ((rows) && (rows.length >= 1)) {
                for(let j = 0; j < rows.length; j++){
                  moneyMadeForBlock += rows[j].price;
                }
                  return resolve(moneyMadeForBlock); 
              } else {
                  return resolve(0);
              }
          });
    });
  }
  
  // The HTTP response
  let response = undefined;
  console.log("Authorizing...");
  
    try{
      let listOfShows = [];
      //const can_create= await ValidateShowInput(event.showName, event.showVenue, event.showDate, event.showTime, event.credentials);
      const isVenueIDFound = await findVenueID(event.venueName);
      
      if(isVenueIDFound === 0){ // if venue doesn't exist
          throw "Venue doesn't exist.";
      }
      else{ // if venue exists
          const checkIfAuthorized = await checkCredentials(event.venueName, managerID);
          if(!checkIfAuthorized){ //if we are NOT authorised
              throw "Not authorised to generate a report for the shows in this venue."
          }
          else{ // if we are authorised
          
              let listOfShowIDs = await generateShowReport(event.venueName);
              
              console.log(listOfShowIDs);
              
              for(let i = 0; i< listOfShowIDs.length; i++){
                let moneyMadeForThisShow = 0;
                let listOfAvailableSeatForThisShow = [];
                let listPurchasedSeatsForThisShow = [];
                
                const listOfBlocksIds = await findListBlockID(listOfShowIDs[i]);
                
                for(let j = 0; j < listOfBlocksIds.length; j++){
                  
                  const availableSeats = await listAvailableSeats(listOfBlocksIds[j]);
                  const purchasedSeats = await listPurchasedSeats(listOfBlocksIds[j]);
                  const blocksMoney = await moneyMadePerBlock(listOfBlocksIds[j]);
                  moneyMadeForThisShow += blocksMoney;
                  
                  if(j == 0){
                    listOfAvailableSeatForThisShow = availableSeats;
                    listPurchasedSeatsForThisShow = purchasedSeats;
                  }
                  else{
                    listOfAvailableSeatForThisShow = listOfAvailableSeatForThisShow.concat(availableSeats);
                    listPurchasedSeatsForThisShow = listPurchasedSeatsForThisShow.concat(purchasedSeats);
                  }
                  
                }
                
                console.log("HERE");
                
                const showInfo = await getShowInfo(listOfShowIDs[i]);
                
                console.log("show info");
                console.log(showInfo);
                
                let show = {
                      "showName" : showInfo.showName,
                      "venueName" : event.venueName,
                      "showDate" : showInfo.showDate,
                      "showTime" : showInfo.showTime,
                      "isActive" : showInfo.isActive,
                      "listOfAvailableSeats" : listOfAvailableSeatForThisShow,
                      "listOfPurchasedSeats" : listPurchasedSeatsForThisShow,
                      "moneyMade" : moneyMadeForThisShow
                };
                
                listOfShows.push(show);
              
                
              }
              
                  
                  response = {
                  statusCode: 200,
                  body: listOfShows
                }
          }
          
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