import { post } from "./Api"

export function deleteVenue(requestRedraw) {
    // potentially modify the model
    let nameField = document.getElementById("venue-to-delete");

     // prepare payload for the post
    let data = { "venueName": nameField.value};
    
    const handler = (json) => {
        console.log(json);
        // clear inputs
        if(json.statusCode === 200) {
            nameField.value = "";
        } else  {
            document.getElementById("venue-error").innerHTML = json.error + "<br>";
        }
        requestRedraw();
    }

    post('/deleteVenue_VM', data, handler);
}