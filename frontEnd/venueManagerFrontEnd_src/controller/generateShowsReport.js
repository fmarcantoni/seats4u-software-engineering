import { post } from "./Api"

export function generateShowsReport() {
    // this sends the ACTUAL POST and retrieves the answer.
    let venueName = document.getElementById("venue-of-shows-report");

    let data = { 
        "venueName" : venueName.value
    }
    console.log("Payload to send: " + JSON.stringify(data));
    //let response;
    const handler = (json) => {
        console.log("Received: " + JSON.stringify(json));
        // clear inputs
        if(json.statusCode === 200){
            displayReport(json);
        } else {
            document.getElementById("show-report").innerHTML = json.error;
        }
        venueName.value = "";
    }

    post('/generateShowReport_VM', data, handler);
    
}

function displayReport(response){
    try{
        let str = "";
        
        for (let show of response.body) {
            //let show = response[i];
            console.log(JSON.stringify(show));
            str += "Name: " + show.showName + " Date: " + show.showDate + " Time: " + show.showTime +  " ";
            if(show.isActive === 1){
                str += "Active";
            } else {
                str += "Inactive";
            }
            str+= "<br>Seats Available:<br><br>"
            for(let seat of show.listOfAvailableSeats){
                str+= "Section: " + seat.section + " Seat: " + seat.row + "" + seat.col + " Price: " + seat.price + "<br>";
            }
            str+= "<br>Seats Sold:<br><br>"
            for(let seat of show.listOfPurchasedSeats){
                str+= "Section: " + seat.section + " Seat: " + seat.row + "" + seat.col + " Price: " + seat.price + "<br>";
            }
            str+= "Total Money Made: $" + show.moneyMade + "<br>"; 
        }
        console.log(str);
        // insert HTML in the <div> with 
        // constant-list
        document.getElementById("show-report").innerHTML = str
    }
    catch(error) {
        // not much to do
        console.log(error)
    }

   
}