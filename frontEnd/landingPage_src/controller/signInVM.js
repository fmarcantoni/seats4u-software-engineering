import { post } from "./Api"

export function signInVM() {
    let key = document.getElementById("vm-access-key");

    let data = {
        "key": Number(key.value),
        "setStatus" : "1"
    };
    console.log(data);
    const handler = (json) => {
        console.log(json);
        if (json.statusCode === 200){
            document.getElementById("vm-sign-in-status").innerHTML = "Venue Manager Signed In";
            window.open("http://seats4uvenuemanagerbucket.s3-website-us-east-1.amazonaws.com/");
        } else{
            document.getElementById("vm-sign-in-status").innerHTML = "Invalid Access Key";
        }
    }

    post('/signInVM', data , handler);
}