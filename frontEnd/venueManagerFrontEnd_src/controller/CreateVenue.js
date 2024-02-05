import { post } from "./Api"

export function createVenue(requestRedraw) {
    // potentially modify the model
    let nameField = document.getElementById("venue-to-create");

    let leftRows = document.getElementById("side-left-rows");
    let rightRows = document.getElementById("side-right-rows");
    let centerRows = document.getElementById("center-rows");

    let leftCols = document.getElementById("side-left-cols");
    let rightCols = document.getElementById("side-right-cols");
    let centerCols = document.getElementById("center-cols");

    // prepare payload for the post
    let payload = { 
        // venueName, sideLeftSection.numRows, sideLeftSection.numCols, centerSection.numRows, centerSection.numCols, sideRightSection.numRows, sideRightSection.numCols, managerID
        "venueName": nameField.value,

        "sideLeftSection": {
            "numRows": leftRows.value,
            "numCols": leftCols.value
          },
          "centerSection": {
            "numRows": centerRows.value,
            "numCols": centerCols.value
          },
          "sideRightSection": {
            "numRows": rightRows.value,
            "numCols": rightCols.value
          }
    };
    
    //console.log(JSON.stringify(payload));

    const handler = (json) => {
        console.log(json)
        if(json.statusCode === 400) {
          document.getElementById("venue-error").innerHTML = json.error + "<br>";
        }
        // clear inputs
        /*
        nameField.value = '';
        leftRows.value = '';
        rightRows.value = '';
        centerRows.value = '';
        leftCols.value = '';
        rightCols.value = '';
        centerCols.value = '';
        */
        requestRedraw();
    }

    post('/createVenue_VM', payload, handler);

}
