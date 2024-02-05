import { post } from "./Api"

export function setSinglePrice(requestRedraw) {
    // potentially modify the model
    let showName = document.getElementById("show-name");
    let venueName = document.getElementById("show-venue");

    let showDate = document.getElementById("show-date");
    let showTime = document.getElementById("show-time");

    let price = document.getElementById("single-price");

    // prepare payload for the post
    let data = { 
        // venueName, sideLeftSection.numRows, sideLeftSection.numCols, centerSection.numRows, centerSection.numCols, sideRightSection.numRows, sideRightSection.numCols, managerID
        "showName" : showName.value,
        "venueName": venueName.value,

        "showDate" : showDate.value,
        "showTime" : showTime.value,

        "price" : Number(price.value)
    };

    const handler = (json) => {
        console.log(json)
        if(json.statusCode === 400){
            document.getElementById("show-error").innerHTML = json.error + "<br>";
        }
        // clear inputs
        // showName.value = "";
        // venueName.value = "";
        // showDate.value = "";
        // showTime.value = "";
        // credentials.value = "";
        requestRedraw() //
    }

    post('/setSinglePrice_VM', data, handler)
}
