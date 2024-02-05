import { post } from "./Api"

export function listVenues() {
    // this sends the ACTUAL POST and retrieves the answer.
    let data = {}
    //let response;

    console.log(JSON.stringify(data));
    const handler = (json) => {
        console.log(JSON.stringify(json));
        if(json.statusCode === 200){
            printList(json);
        } else  {
            document.getElementById("shows-error").innerHTML = json.error + "<br>";
        }
        // clear inputs
    }

    post('/listVenues_A', data, handler);
    
}


export function printList(response){
    try{
        let str = ''
        for (let v of response.venues) {
            console.log(v);
            str += v.name + '<br>'
        }
        console.log(str);
        // insert HTML in the <div> with 
        // constant-list
        document.getElementById("venue-list").innerHTML = str
    }
    catch(error) {
        // not much to do
        console.log(error)
    }

   
}