import readline from "readline";
//const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

console.log("Establishing new credentials");
let loginUrl = "https://login.salesforce.com";
let username = "";
let password = "";

rl.question(`Enter Login URL [${loginUrl}]: `, function(inputLoginUrl) {
    loginUrl = inputLoginUrl !== "" ? inputLoginUrl : loginUrl;
    rl.question("Enter Username: ", function(inputUsername) {
        rl.question("Enter Password (including security token): ", function(inputPassword) {
            console.log("loginUrl: " + loginUrl);
            rl.close();
        });
    });
});

rl.on("close", function() {
    process.exit(0);
});