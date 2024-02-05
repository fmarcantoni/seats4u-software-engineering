import { post } from "./Api"

export function createVenue(requestRedraw) {
    // potentially modify the model
    let nameField = document.getElementById("venue-to-create");

    let leftRows = document.getElementById("side-left-rows");
    let rightRows = document.getElementById("side-right-rows");
    let centerRows = document.getElementById("side-center-rows");

    let leftCols = document.getElementById("side-left-cols");
    let rightCols = document.getElementById("side-right-cols");
    let centerCols = document.getElementById("side-center-cols");

    let credentials = document.getElementById("venue-manager-credentials");

    // prepare payload for the post
    let data = { 
        // venueName, sideLeftSection.numRows, sideLeftSection.numCols, centerSection.numRows, centerSection.numCols, sideRightSection.numRows, sideRightSection.numCols, managerID
        "venueName": nameField.value,

        "leftRows": leftRows.value,
        "rightRows": rightRows.value,
        "centerRows": centerRows.value,

        "leftCols": leftCols.value,
        "rightCols": rightCols.value,
        "centerCols": centerCols.value,

        "credentials" : credentials.value
    };

    const handler = (json) => {
        console.log(json)
        // clear inputs
        nameField.value = '';
        leftRows.value = '';
        rightRows.value = '';
        centerRows.value = '';
        leftCols.value = '';
        rightCols.value = '';
        centerCols.value = '';
        credentials.value = '';
        requestRedraw();
    }

    post('/createVenue_VM', data, handler);

}
