import { post } from "./Api"
import { displayBlocks } from "./ListBlocks";

export function deleteBlock(requestRedraw) {
    // potentially modify the model
    let showName = document.getElementById("show-name");
    let venueName = document.getElementById("show-venue");

    let showDate = document.getElementById("show-date");
    let showTime = document.getElementById("show-time");

    let section = document.getElementById("block-section");
    let rowStart = document.getElementById("block-row-start");
    let rowEnd = document.getElementById("block-row-end");

    // prepare payload for the post
    let data = { 
        // venueName, sideLeftSection.numRows, sideLeftSection.numCols, centerSection.numRows, centerSection.numCols, sideRightSection.numRows, sideRightSection.numCols, managerID
        "showName" : showName.value,
        "venueName": venueName.value,

        "showDate" : showDate.value,
        "showTime" : showTime.value,

        "rowStart": rowStart.value,
        "rowEnd": rowEnd.value,
        "section": section.value
    };

    console.log(JSON.stringify(data));

    const handler = (json) => {
        console.log(json)
        if(json.statusCode === 200) {
            displayBlocks(json.body);
        } else  {
            document.getElementById("block-error").innerHTML = json.error + "<br>";
        }
        // clear inputs
        // showName.value = "";
        // venueName.value = "";
        // showDate.value = "";
        // showTime.value = "";
        // credentials.value = "";
        requestRedraw() //
    }

    post('/deleteBlock_VM', data, handler)
}
