import { post } from "./Api"
import { printShowsList, setShowsList} from "./ListShows";



export function searchShows() {
    // this sends the ACTUAL POST and retrieves the answer.
    let showName = document.getElementById("show-name");
    let startDate = document.getElementById("start-date");
    let sendStartDate = startDate.value !== "";
    
    
    let [year, month, day] = startDate.value.split("-");
    let formattedStartDate = month + "/" + day + "/" + year;

    let endDate = document.getElementById("end-date");
    let sendEndDate = endDate.value !== ""; 
    [year, month, day] = endDate.value.split("-");
    let formattedEndDate = month + "/" + day + "/" + year;

    let startTime = document.getElementById("start-time");
    let endTime = document.getElementById("end-time");
    let venueName = document.getElementById("venue-name");
    
    let data = {
        "showNameSearched": showName.value,
        "venueList": [
          {
            "venueName": venueName.value
          }
        ],
        "startDate": formattedStartDate,
        "endDate": formattedEndDate,
        "startTime": startTime.value,
        "endTime": endTime.value
    };
    if(venueName.value === ""){
        delete data.venueList;
    }

    if(data.showNameSearched === ""){
        //console.log("deleting name...");
        delete data.showNameSearched;
    }
    if(!sendStartDate){
        //console.log("deleting start date...");
        delete data.startDate;
    }
    if(!sendEndDate){
        delete data.endDate;
    }
    if(data.startTime === ""){
        delete data.startTime;
    }
    if(data.endTime=== ""){
        delete data.endTime;
    }
    
    console.log("Payload to send: " + JSON.stringify(data));
    //let response;
    const handler = (json) => {
        console.log("Received: " + JSON.stringify(json));
        // clear inputs
        if(json.statusCode === 200){
            printShowsList(json);
            console.log("Hello from Search Shows " + JSON.stringify(json.body[0]));
            setShowsList(json.body);
        } else {
            document.getElementById("show-list").innerHTML = "No shows fit those criteria. <br>";
        }
    }

    post('/searchShows_C', data, handler);
    
}