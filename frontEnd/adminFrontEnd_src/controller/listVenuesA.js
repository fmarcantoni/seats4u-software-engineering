import { post } from "./Api"

export function listVenuesA() {
    // this sends the ACTUAL POST and retrieves the answer.
    let adminCredentialsField = document.getElementById("admin-credentials");

    let data = { "adminId": adminCredentialsField.value}
    //let response;
    const handler = (json) => {
        if(json.statusCode === 200){
            printList(json);
        } else {
            console.log(json);
        }
        // clear inputs
        adminCredentialsField.value = "";
    }

    post('/listVenues_A', data, handler);
    
}


export function printList(response){
    let str = ''
        for (let v of response.venues) {
            str += v.name + '<br>'
        }

        // insert HTML in the <div> with 
        // constant-list
        let cd = document.getElementById("venue-list");
        cd.innerHTML = str


    .catch(function (error) {
        // not much to do
        console.log(error)
    });
}