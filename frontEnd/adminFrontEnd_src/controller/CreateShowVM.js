import { post } from "./Api"

export function createShow(requestRedraw) {
    // potentially modify the model
    let showName = document.getElementById("venue-to-create");
    let venueName = document.getElementById("show-venue");

    let showDate = document.getElementById("show-date");
    let showTime = document.getElementById("show-time");

    let credentials = document.getElementById("venue-manager-credentials");

    // prepare payload for the post
    let data = { 
        // venueName, sideLeftSection.numRows, sideLeftSection.numCols, centerSection.numRows, centerSection.numCols, sideRightSection.numRows, sideRightSection.numCols, managerID
        "showName" : showName.value,
        "showVenue": venueName.value,

        "showDate" : showDate.value,
        "showTime" : showTime.value,

        "credentials" : credentials.value
    };

    const handler = (json) => {
        console.log(json)
        // clear inputs
        showName.value = "";
        venueName.value = "";
        showDate.value = "";
        showTime.value = "";
        credentials.value = "";
        requestRedraw() //
    }

    post('/createShow_VM', data, handler)
}
