import { post } from "./Api"

import { Alert } from "@mui/material";

export function showAvailableSeats() {
    // this sends the ACTUAL POST and retrieves the answer.

    let showName = document.getElementById("show-name");
    let venueName = document.getElementById("venue-name");
    let showDate = document.getElementById("show-date");
    let [year, month, day] = showDate.value.split("-");
    let formattedDate = month + "/" + day + "/" + year;
    let showTime = document.getElementById("show-time");
    let sortMethod = document.getElementById("sort-method");
    let descending = document.getElementById("descending");



    let data = {
        "showName": showName.value,
        "venueName" : venueName.value,
        "showDate" : formattedDate,
        "showTime": showTime.value,
        "sortMethod" : sortMethod.value,
        "descending" : descending.checked
    };

    console.log("Payload to send: " + JSON.stringify(data));
    //let response;
    const handler = (json) => {
        console.log("Received: " + JSON.stringify(json));
        // clear inputs
        if(json.statusCode === 200){
            if(json.body.length === 0){
                document.getElementById("seat-list").innerHTML = "SOLD OUT<br>";
            } else {
                printSeats(json);
            }
            
        } else {
            document.getElementById("seat-list").innerHTML = json.error;
        }
    }

    post('/showAvailableSeats_C', data, handler);
    
}

export function printSeats(response){
    try{
        let str = "";
        
        for (let [index, seat] of response.body.entries()) {
            //let show = response[i];
            //console.log(JSON.stringify(seat));
            str += "Seat #" + (index + 1) + "  |  Row: " + seat.row + "  |  Seat Number: " + (seat.column + 1) + "  |  Section: " + seat.section +  "  |  Price: $" + seat.price  + '<br>';
        }
        console.log(str);
        // insert HTML in the <div> with 
        // constant-list
        document.getElementById("seat-list").innerHTML = str
    }
    catch(error) {
        // not much to do
        console.log(error)
    }

   
}