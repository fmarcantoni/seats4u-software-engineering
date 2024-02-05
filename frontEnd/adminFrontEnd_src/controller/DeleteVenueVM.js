import { post } from "./Api"

export function deleteVenue(requestRedraw) {
    // potentially modify the model
    let nameField = document.getElementById("venue-to-delete");
    let credentials = document.getElementById("venue-manager-credentials");

     // prepare payload for the post
    let data = { "venueName": nameField.value, 
                "credentials" : credentials.value};
    
    const handler = (json) => {
        console.log(json);
        // clear inputs
        nameField.value = "";
        credentials.value = "";
        requestRedraw();
    }

    post('/deleteVenue_VM', data, handler);
}