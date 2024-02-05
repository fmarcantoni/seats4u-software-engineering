import { post } from "./Api"

export function deleteShow() {
    // this sends the ACTUAL POST and retrieves the answer.
    let showName = document.getElementById("show-name");
    let venueName = document.getElementById("venue-name");
    let showDate = document.getElementById("show-date");
    let showTime = document.getElementById("show-time");

    let data = { 
        "showName" : showName.value,
        "venueName" : venueName.value,

        "showDate" : showDate.value,
        "showTime" : showTime.value
    }
    //let response;
    console.log(JSON.stringify(data));
    const handler = (json) => {
        console.log(JSON.stringify(json));
        if(json.statusCode === 400){
            document.getElementById("shows-error").innerHTML = json.error + "<br>";
        }
        // clear inputs
        //adminCredentialsField.value = "";
        // showName.value = "";
        // venueName.value = "";
        // showDate.value = "";
        // showTime.value = "";
    }

    post('/deleteShow_A', data, handler);
    
}