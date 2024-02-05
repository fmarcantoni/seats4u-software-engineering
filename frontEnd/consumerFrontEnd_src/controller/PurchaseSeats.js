import { post } from "./Api"

export function purchaseSeats(selectedSeatList) {
    // this sends the ACTUAL POST and retrieves the answer.
    
    let showName = document.getElementById("show-name");
    let venueName = document.getElementById("venue-name");
    let showDate = document.getElementById("show-date");
    let [year, month, day] = showDate.value.split("-");
    let formattedDate = month + "/" + day + "/" + year;
    let showTime = document.getElementById("show-time");
    

    let data = {
        "showName": showName.value,
        "venueName" : venueName.value,
        "showDate" : formattedDate,
        "showTime": showTime.value,
        "listOfSeats" : selectedSeatList
      };
        
    console.log("Payload to send: " + JSON.stringify(data));
    //let response;
    const handler = (json) => {
        console.log("Received: " + JSON.stringify(json));
        // clear inputs
        if(json.statusCode === 200){
            document.getElementById("selected-seat-list").innerHTML = "Purchased Successfully!";
            selectedSeatList.splice(0); //delete the array. Note setting it to empty array will not work here because of reference BS
        }else{
            document.getElementById("selected-seat-list").innerHTML = json.error;
        }
    }

    post('/purchaseSeats_C', data, handler);
    
}


let selectedSeatList = []

export function addSeat(selectedSeatList) {
    let section = document.getElementById("seat-section");
    let row = document.getElementById("seat-row");
    let col = document.getElementById("seat-col");

    let seat = {
      "row" : row.value,
      "col" : col.value - 1,
      "section" : section.value
    }

    selectedSeatList.push(seat);
    
    try{
        let str = "";

        for (let [index, seat] of selectedSeatList.entries()) {
            //let show = response[i];
            //console.log(JSON.stringify(seat));
            str += "Seat #" + (index + 1) + "  |  Row: " + seat.row + "  |  Seat Number: " + (seat.col + 1) + "  |  Section: " + seat.section + '<br>';
        }
        console.log(str);
        // insert HTML in the <div> with 
        // constant-list
        document.getElementById("selected-seat-list").innerHTML = str;
    }
    catch(error) {
        // not much to do
        console.log(error);
    }
}

export function removeSeat(selectedSeatList, seatIndex) {


    selectedSeatList.splice(seatIndex, 1);
  
    let str = '';
  
    for (let [index, seat] of selectedSeatList.entries()) {
      str += `Seat #${index + 1} | Row: ${seat.row} | Seat Number: ${
        seat.col + 1
      } | Section: ${seat.section}<br>`;
    }
  
    document.getElementById("selected-seat-list").innerHTML = str;
  }
  