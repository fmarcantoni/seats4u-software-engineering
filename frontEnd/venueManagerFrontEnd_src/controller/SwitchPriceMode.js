import { post } from "./Api"

export function switchPricingMode(updateBlockMode) {
    // potentially modify the model
    let showName = document.getElementById("show-name");
    let venueName = document.getElementById("show-venue");

    let showDate = document.getElementById("show-date");
    let showTime = document.getElementById("show-time");

    // prepare payload for the post
    let data = { 
        // venueName, sideLeftSection.numRows, sideLeftSection.numCols, centerSection.numRows, centerSection.numCols, sideRightSection.numRows, sideRightSection.numCols, managerID
        "showName" : showName.value,
        "venueName": venueName.value,

        "showDate" : showDate.value,
        "showTime" : showTime.value
    };
    console.log(JSON.stringify(data));

    const handler = (json) => {
        console.log(json)
        // clear inputs
        // showName.value = "";
        // venueName.value = "";
        // showDate.value = "";
        // showTime.value = "";
        // credentials.value = "";
        if(json.statusCode === 200){
            updateBlockMode(json.body.toLowerCase().includes("block")); //changes block mode to true or false depending on which mode was changed to
        } else {
            document.getElementById("show-error").innerHTML = json.error + "<br>";
        }
        
    }

    post('/switchPricingMode', data, handler)
}
