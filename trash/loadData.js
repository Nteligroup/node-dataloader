import fs from "fs";
import { ContactLoader } from "../contactLoader.js";
import { AccountLoader } from "../accountLoader.js";
import { logger } from "../logger.js";
import jsforce from "jsforce";

//using callback api because it's more performant for fs module
let loaderConfig = {};
fs.readFile("./config/loaderConfig.json", (err, data) => {
  if (err) throw err;
  loaderConfig = JSON.parse(data);
  // console.log(loaderConfig);

  //Establish connection and pass it
  let username = loaderConfig.connection.username;
  let password = loaderConfig.connection.password;

  let conn = new jsforce.Connection({
    // you can change loginUrl to connect to sandbox or prerelease env.
    loginUrl: loaderConfig.connection.loginUrl
  });

  conn.login(username, password, function (err, userInfo) {
    if (err) {
      return console.error(err);
    }
    // Now you can get the access token and instance URL information.
    // Save them to establish a connection next time.
    console.log("AccessToken: " + conn.accessToken);
    console.log("InstanceUrl: " + conn.instanceUrl);
    // logged in user property
    console.log("User ID: " + userInfo.id);
    console.log("Org ID: " + userInfo.organizationId);
    conn.bulk.pollTimeout = 25000000;

    //determine the load sequence
    /* loaderConfig.loadsequence.forEach((element) => {
      if (element.objectName === "Account") {
        const acctLoader = new AccountLoader();
        logger.info("start loading accounts");
        acctLoader.loadAccounts(conn, element);
      } else if (element.objectName === "Contact") {
        const contactLoader = new ContactLoader();
        logger.info("start loading contacts");
        contactLoader.loadContacts(conn, element);
      }
    }); */

    /* let acctLoader = new AccountLoader();
    let contactLoader = new ContactLoader();

    acctLoader.loadAccounts(conn, loaderConfig.loadsequence[0])
      .then(result => {
        contactLoader.loadContacts(conn, loaderConfig.loadsequence[1])
          .then(result => {
          });
      }); */
  });
});