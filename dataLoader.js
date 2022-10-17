import { logger } from "./logger.js";
import { getConfig, getConnection, getDataFile } from "./utils.js";

function createData(conn, config, data) {
  let interval = 10;
  let start = 0;
  let end = interval;

  function loadData(conn, config, data) {
    return new Promise((resolve, reject) => {
      // console.log(data);

      if (config.loadType === "insert") {
        //load bulk data recursively till everything is loaded
        //console.log(data.slice(start, end));
        let sData = data.slice(start, end);
        //console.log(sData);
        conn.bulk.load(
          config.objectName,
          "insert",
          sData,
          function (err, rets) {
            if (err) {
              console.log(err);
            }
            start = end;
            end = end + interval;
            if (start < data.length) {
              console.log(rets);
              resolve(loadData(conn, config, data));
            } else {
              console.log(rets);
              resolve(rets);
            }
          }
        );
      } else {
        resolve();
      }
    });
  }

  return loadData(conn, config, data);
}

function upsertData(conn, config, data) {
  let interval = 10;
  let start = 0;
  let end = interval;
  function loadData(conn, config, data) {
    return new Promise((resolve, reject) => {
      console.log("In loadData " + "start: " + start + " end: " + end);
      // console.log(config);
      // console.log(data);
      console.log("upserting");
      let sData = [];
      data.slice(start, end).forEach((item) => {
        let sDataRecord = {};
        config.mappings.forEach((mapping) => {
          if (item[mapping.source]) {
            if (mapping.lookup) {
              let lookup = {};
              lookup[mapping.lookup] = item[mapping.source];
              sDataRecord[mapping.destination] = lookup;
            } else {
              sDataRecord[mapping.destination] = item[mapping.source];
            }
          }
        });
        sData.push(sDataRecord);
      });
      // console.log("sData");
      // console.log(sData);
      console.log("pushing: " + sData.length + " records");

      conn
        .sobject(config.objectName)
        .upsert(
          sData,
          "External_ID__c",
          { allowRecursive: true },
          function (err, rets) {
            if (err) {
              console.log(err);
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
              resolve(loadData(conn, config, data));
            } else {
              console.log(rets);
              resolve(rets);
            }
          }
        );
    });
  }

  return loadData(conn, config, data);
}

function loadSequences(sfConnection, loadSequence, idx) {
  console.log("in load sequence: " + idx);
  if (!idx) idx = 0;

  return new Promise((resolve, reject) => {
    getDataFile(loadSequence[idx])
      .then((data) => {
        console.log("loadType: " + loadSequence[idx].loadType);
        if (loadSequence[idx].loadType === "upsert") {
          upsertData(sfConnection, loadSequence[idx], data).then(() => {
            if (idx === loadSequence.length - 1) {
              resolve("completed");
            } else {
              resolve(loadSequences(sfConnection, loadSequence, idx + 1));
            }
          });
        } else if (loadSequence[idx].loadType === "insert") {
          createData(sfConnection, loadSequence[idx], data).then(() => {
            if (idx === loadSequence.length - 1) {
              resolve("completed");
            } else {
              resolve(loadSequences(sfConnection, loadSequence, idx + 1));
            }
          });
        }
        else if (idx < loadSequence.length - 1) {
            resolve(loadSequences(sfConnection, loadSequence, idx + 1));
        }
      })
      .catch((error) => {
        console.log(error);
      });
  });
}

getConfig()
  .then((loaderConfig) => {
    // console.log(loaderConfig);
    getConnection(loaderConfig)
      .then((sfConnection) => {
        console.log("got connection");
        loadSequences(sfConnection, loaderConfig.loadsequence);
      })
      .catch((error) => {
        console.log(error);
      });
  })
  .catch((error) => {
    console.log(error);
  });
