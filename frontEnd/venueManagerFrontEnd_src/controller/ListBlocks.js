import { post } from "./Api"

export function listBlocks() {
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
        if(json.statusCode === 200) {
            displayBlocks(json.body.blocks);
        } else {
            document.getElementById("block-list").innerHTML = json.error
        }
        // clear inputs
        // showName.value = "";
        // venueName.value = "";
        // showDate.value = "";
        // showTime.value = "";
        // credentials.value = "";
    }

    post('/listBlocks_VM', data, handler)
    //post("/genVM", {"active" : 0}, () => {console.log("Frick u cors")});
}

export function displayBlocks(listOfBlocks){
    console.log(listOfBlocks);
    console.log(JSON.stringify(listOfBlocks));
    try{
        let str = "";
        let i = 0;
        for (let block of listOfBlocks) {
            //let show = response[i];
            str += "Block #" + (++i) +":<br>";
            str += "Section: " + block.section + " Row Start: " + block.rowStart + " Row End: " + block.rowEnd +  "<br>";
            str += "Price: $" + block.price + "<br>";
            if(block.numberOfSeatsSold !== undefined){
                str += "Seats Sold: " + block.numberOfSeatsSold + "<br>"
            }
            if(block.numberOfSeatsAvailable !== undefined) {
                str += "Seats Available: " + block.numberOfSeatsAvailable + "<br>";
            }
            str += "<br>";
             
        }
        console.log(str);
        // insert HTML in the <div> with 
        // constant-list
        document.getElementById("block-list").innerHTML = str
    }
    catch(error) {
        // not much to do
        console.log(error)
    }

   
}