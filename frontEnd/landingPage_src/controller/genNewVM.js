import { post } from "./Api"

export function genNewVM() {
    let data = { };
    const handler = (json) => {
        console.log(json);
        if (json.statusCode === 200){
            console.log(json.newAccessKey);
            document.getElementById("new-access-key").innerHTML = "New Access Key: " + json.newAccessKey;
        }
    }

    post('/genVM', data , handler);
}