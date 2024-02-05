import { get } from "./Api"

let showsList = [];

// API module
export async function fetchShows() {
     // this sends the ACTUAL GET and retrieves the answer.
     get('/listActiveShow_A').then((response) => {
        try {
            console.log(response);
            if(response.statusCode === 200){
                printShowsList(response);
                showsList = response.body;
            } else {
                document.getElementById("show-list").innerHTML = "No active shows found.<br>";
            }
        }catch (err) {
            //! add error catch later
        }
        
    });
} 

// Display list  
export function printShowsList(response){

    try{
        let str = "";
        //let i = 0;
        for (let show of response.body) {
            console.log(show);
            str += show.showName + "<br>" + show.showDate + " " + show.showTime + "<br>";
            str += "Happening at " + show.venueName + "<br><br>";
            // str += "Duration: " + show.duration + "<br>";
            if(str.description != null){
                str += show.description + "<br>";
            } 
            //str += "<SelectShowButton show = {" + JSON.stringify(show) + "}></SelectShowButton>";
            //Cursed
        }
        console.log(str);
        // insert HTML in the <div> with 
        // constant-list
        document.getElementById("show-list").innerHTML = str
    }
    catch(error) {
        // not much to do
        console.log(error)
    }

   
}


export function setShowsList(otherList){
    showsList = otherList;
}
export function getShowsList(){
    return showsList;
}