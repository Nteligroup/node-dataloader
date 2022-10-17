import fs from "fs";
import { parse } from "csv-parse";
import jsforce from "jsforce";
import { logger } from "../logger.js";

export class AccountLoader {
  loadAccounts(conn, config) {
    console.log("In loadAccounts");
    const data = [];
    
    let interval = 10;
    let start = 0;
    let end = interval;

    function loadData(conn) {
      if (config.loadType === "insert") {
        //load bulk data recursively till everything is loaded
        //console.log(data.slice(start, end));

        let sData = data.slice(start, end);
        console.log("start: " + start + " end: " + end);
        //console.log(sData);
        conn.bulk.load("Account", "insert", sData, function (err, rets) {
          if (err) {
            return console.error(err);
          }
          start = end;
          end = end + interval;
          if (start < data.length) {
            return loadData(conn);
          }
          else {
            return rets;
          }
        });
      }
      else if (config.loadType === "upsert") {
        let sData = [];
        data.slice(start, end).forEach((item) => {
          sData.push({
            Name: item.Name,
            External_ID__c: item.External_ID__c,
            BillingCountry: item.BillingCountry,
            CreatedById: "0058Z000008hGYaQAM",
            CreatedDate: jsforce.SfDate.parseDate(
              "2022-01-01T00:00:00.000-06:00"
            ),
          });
        });

        conn
          .sobject(config.objectName)
          .upsert(
            sData,
            "External_ID__c",
            { allowRecursive: true },
            function (err, rets) {
              if (err) {
                console.log(err);
                return err;
              }

              if (rets) {
                console.log(rets);
                logger.info("successfully loaded " + rets.length + " accounts");
                for (var i = 0; i < rets.length; i++) {
                  if (rets[i].success) {
                    //console.log("Upserted Successfully");
                  } else {
                    console.log(rets[i].errors);
                  }
                }
              }

              start = end;
              end = end + interval;
              if (start < data.length) {
                return loadData(conn);
              }
              else {
                console.log(rets);
                return rets;
              }
            }
          );
      }
    }

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
        data.push(row);
      })
      .on("error", function (error) {
        console.log(error.message);
      })
      .on("end", function () {
        return loadData(conn);
      });
  }
}