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
          pool.query("SELECT * FROM shows WHERE isActive=?", [1], (error, rows) => { //CHANGE THIS BACK TO 1 ONCE DONE TESTING
              if (error) { return reject(error); }
              console.log(rows);
              if ((rows) && (rows.length > 0)) {
                    return resolve(rows);
              } else {
                  return resolve([]); //if no shows available, return an empty array
              }
          });
      });
    
  }
  
   let listVenues = () => {
      return new Promise((resolve, reject) => {
          pool.query("SELECT name, venueID FROM venues", [], (error, rows) => {
              if (error) { return reject(error); }
              if(rows.affectedRows === 0){return reject ("No Venues")}
              else {return resolve(rows);}
          })
      })
   }
  
  /*
    Returns whether or not a show's name fits the given partial string. Not case sensitive.
  */
  function fitsPartialName(expectedName, partialName){
    console.log(expectedName);
    console.log(partialName);
    let expectedLowerCase = expectedName.toLowerCase();
    let partialNameLowerCase = partialName.toLowerCase();
    return (expectedLowerCase.includes(partialNameLowerCase));
  }
  
  
  
  function filterByName(showList, partialName) {
    return showList.filter(
      (show) => fitsPartialName(show.showName, partialName)
      );
  }
  
  function isBeforeDate(showDate, endDate){
    return (showDate <= endDate);
  }
  
  function isAfterDate(showDate, startDate){
    return (showDate >= startDate);
  }
  
  function isBetweenDates(showDate, startDate, endDate){
    return isAfterDate(showDate, startDate) && isBeforeDate(showDate, endDate);
  }
  
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
  
  function filterByDate(showList, startDateString, endDateString, startTime, endTime){
    let timeFilteredList = showList;
    if(startTime !== undefined || endTime !== undefined){ //if a time is defined, filter by it
      timeFilteredList = filterByTime(showList, startTime, endTime);
    }
    console.log("Filtered by time successfully");
    if(startDateString === undefined && endDateString === undefined){
      console.log("No date specified.");
      return timeFilteredList;
    }
    console.log(timeFilteredList);
    
    
    
    if(startDateString === undefined) {
       let endDate = initDate(endDateString, endTime);
       return timeFilteredList.filter((show) => {
         let showDate = initDate(show.showDate, show.showTime);
         return isBeforeDate(showDate, endDate);
       });
    } else if(endDateString === undefined) {
      let startDate = initDate(startDateString,startTime);
       return timeFilteredList.filter((show) => {
         let showDate = initDate(show.showDate, show.showTime);
         console.log(showDate.toLocaleDateString("en-US"));
         console.log(startDate.toLocaleDateString("en-US"));
         return isAfterDate(showDate, startDate);
       });
    }
    //if both are defined, check between
    let startDate = initDate(startDateString, startTime);
    let endDate = initDate(endDateString, endTime);
    if(startDate > endDate) throw "Start date is after the end date.";
    return timeFilteredList.filter((show) => {
      let showDate = initDate(show.showDate, show.showTime);
      return isBetweenDates(showDate, startDate, endDate);
    });
  }
  
  function isBeforeTime(show, endTime){
    let [endHours, endMinutes] = parseTime(endTime);
    let [showHours, showMinutes] = parseTime(show.showTime);
     if(showHours !== endHours) return showHours < endHours;
     return showMinutes <= endMinutes;
  }
  
  function isAfterTime(show, startTime){
    let [startHours, startMinutes] = parseTime(startTime);
    let [showHours, showMinutes] = parseTime(show.showTime);
     if(showHours !== startHours) return showHours > startHours;
     return showMinutes >= startMinutes;
  }
  
  function isBetweenTimes(show, startTime, endTime) {
    return isBeforeTime(show, endTime) && isAfterTime(show, startTime);
  }
  
  function filterByTime(showList, startTime, endTime){
    //console.log("Filtering by time...");
    if(startTime === undefined) { //end time must be defined if start is undefined
     //console.log("Start time undefined");
     return showList.filter((show) => isBeforeTime(show, endTime));
    } else if (endTime === undefined) {
      //console.log("End time undefined");
      return showList.filter((show) => isAfterTime(show, startTime));
    }
    //console.log("Both times defined");
    return showList.filter((show) => isBetweenTimes(show, startTime, endTime)); //if both defined, go in between
  }
  
  //https://fjolt.com/article/javascript-check-if-array-is-subset
  let checkSubset = (parentArray, subsetArray) => {
    return subsetArray.every((el) => parentArray.includes(el));
  }

  function includesPartialName(queriedVenueList, existingVenue){
    console.log("No segfault");
    return queriedVenueList.some((queriedVenue) => fitsPartialName(existingVenue, queriedVenue));
  }
  function extractVenueIDs(queriedVenueNames, existingVenueList){
    console.log(JSON.stringify((existingVenueList)));
    let filteredVenueList = existingVenueList.filter((existingVenue) => {
      return includesPartialName(queriedVenueNames, existingVenue.name);
    });
    console.log("FilteredVenueList " + JSON.stringify(filteredVenueList));
    return filteredVenueList.map((venue) => venue.venueID);
  }
  
  function filterByVenue(showList, venueIDs) {
    //console.log(venueIDs.length);
    return showList.filter((show) => (venueIDs.includes(show.venueID)));
  }
  
  // The HTTP response
  let response = undefined;
  
    try{
        
        
        let listOfActiveShows = await listActiveShows();

        console.log("Active Shows: " + listOfActiveShows);
        let nameFiltered = listOfActiveShows;
        if(event.showNameSearched !== undefined){
          nameFiltered = filterByName(listOfActiveShows, event.showNameSearched);
          console.log("List of Shows matching '" + event.showNameSearched + "': " + nameFiltered);
        } //if partial name not specified, don't search by it
        let dateFiltered = nameFiltered;
        if(event.startDate !== undefined || event.endDate !== undefined || event.startTime !== undefined || event.endTime !== undefined){
          dateFiltered = filterByDate(nameFiltered, event.startDate, event.endDate, event.startTime, event.endTime);
        } //if all undefined, don't filter
        let filteredList = dateFiltered;
        let existingVenues = await listVenues();
        //let existingVenueNames = existingVenues.map((el) => el.name);
        if(event.venueList !== undefined) { //If venue not specified, don't search by venue
          
          let queriedVenueNames = event.venueList.map((el) => el.venueName);
          // console.log("Attempting to check subset");
          // console.log(existingVenues);
          // console.log(event.venueList);
          // if(!checkSubset(existingVenueNames, queriedVenueNames)){
          //   //console.log("Check Subset False");
          //   throw "One of the selected venues does not exist";
          // }
          console.log("Success!");
          let venueIDs = extractVenueIDs(queriedVenueNames, existingVenues);
          console.log("IDs: " + venueIDs);
          filteredList = filterByVenue(dateFiltered, venueIDs);
        }
        let trimmedList = [];
        filteredList.forEach((show) => {
          let thisVenueName = "";
          for(let v of existingVenues){
            if(v.venueID === show.venueID){
              thisVenueName = v.name;
              break;
            }
          }
          let result = {
            "showName" : show.showName,
            "venueName" : thisVenueName,
            "showDate" : show.showDate,
            "showTime" : show.showTime,
            "description" : show.description,
            "duration" : show.duration
          }
          trimmedList.push(result);
        })
        
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
    } finally{
        pool.end();   // done with DB
    }
    return response;
}
