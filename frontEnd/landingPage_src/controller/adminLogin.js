import { post } from "./Api"

export function adminLogin() {
    let password = document.getElementById("admin-password");
    let data = { "password": password.value};
    const handler = (json) => {
        console.log(json);
        if (json.statusCode === 200){
            document.getElementById("admin-login-status").innerHTML = "Admin Signed In";
            window.open("http://seats4uadministratorbucket.s3-website-us-east-1.amazonaws.com/");
        } else {
            document.getElementById("admin-login-status").innerHTML = "Invalid Password";
        }
    }

    post('/adminLogin', data , handler);
}