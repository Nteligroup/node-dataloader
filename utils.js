import fs from "fs";
import jsforce from "jsforce";
import { parse } from "csv-parse";
import { logger } from "./logger.js";

export function getConnection(loaderConfig) {
  return new Promise((resolve, reject) => {
    //Establish connection and pass it
    let username = loaderConfig.connection.username;
    let password = loaderConfig.connection.password;

    let conn = new jsforce.Connection({
      // you can change loginUrl to connect to sandbox or prerelease env.
      loginUrl: loaderConfig.connection.loginUrl,
    });

    conn.login(username, password, function (err, userInfo) {
      if (err) {
        reject(err);
      }
      // Now you can get the access token and instance URL information.
      // Save them to establish a connection next time.
      logger.info("AccessToken: " + conn.accessToken);
      logger.info("InstanceUrl: " + conn.instanceUrl);
      // logged in user property
      logger.info("User ID: " + userInfo.id);
      logger.info("Org ID: " + userInfo.organizationId);
      conn.bulk.pollTimeout = 25000000;
      resolve(conn);
    });
  });
}

export function getConfig() {
  return new Promise((resolve, reject) => {
    fs.readFile("./config/loaderConfig.json", (err, data) => {
      if (err) reject(err);
      resolve(JSON.parse(data));
    });
  });
}

export function getDataFile(config) {
  console.log("in get data file method: ");
  // console.log(config);
  const data = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(config.fileName)
      .pipe(
        parse({
          delimiter: ",",
          columns: true,
          ltrim: true,
          bom: true,
        })
      )
      .on("data", function (row) {
        // 👇 push the object row into the array
        // console.log("reading data");
        data.push(row);
      })
      .on("error", function (error) {
        reject(error);
      })
      .on("end", function () {
        console.log("file records: " + data.length);
        // console.log(data);
        resolve(data);
      });
  });
}