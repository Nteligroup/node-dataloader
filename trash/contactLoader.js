import fs from "fs";
import { parse as myParse } from "csv-parse";
import jsforce from "jsforce";
import {logger} from '../logger.js';

export class ContactLoader {
  loadContacts(conn) {
    const data = [];

    function loadContactData(conn) {
      console.log("loadData from contactLoader");
      let sData = [];
      data.forEach((item) => {
        sData.push({
          LastName: item.Name,
          External_ID__c: item.External_ID__c,
          Account: { External_ID__c: item.External_Account_ID__c },
        });
      });

      console.log(sData);
      conn
        .sobject("Contact")
        .upsert(
          sData,
          "External_ID__c",
          { allowRecursive: true },
          function (err, rets) {
            if (err) console.log(err);
            if (rets) {
              console.log(rets);
              logger.info('successfully loaded ' + rets.length + ' contacts');
              for (var i = 0; i < rets.length; i++) {
                if (rets[i].success) {
                  console.log("Contacts Upserted Successfully");
                } else {
                  console.log("Contacts Upsert Errors: ");
                  console.log(rets[i].errors);
                }
              }
            }
          }
        );
    }

    fs.createReadStream("./datafiles/Contacts.csv")
      .pipe(
        myParse({
          delimiter: ",",
          columns: true,
          ltrim: true,
          bom: true,
        })
      )
      .on("data", function (row) {
        // 👇 push the object row into the array
        data.push(row);
      })
      .on("error", function (error) {
        console.log(error.message);
      })
      .on("end", function () {
        loadContactData(conn);
      });
  }
}
