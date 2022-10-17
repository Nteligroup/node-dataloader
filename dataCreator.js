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
        conn.bulk.load(config.objectName, "insert", sData, function (err, rets) {
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
        });
      }
      else {
        resolve();
      }
    });
  }

  return loadData(conn, config, data);
}

function loadSequences(sfConnection, loadSequence, idx) {
  if (!idx) idx = 0;

  return new Promise((resolve, reject) => {
    getDataFile(loadSequence[idx])
      .then((data) => {
        createData(sfConnection, loadSequence[idx], data)
          .then(() => {
            if (idx === loadSequence.length - 1) {
              resolve("completed");
            }
            else {
              resolve(loadSequences(sfConnection, loadSequence, idx+1));
            }
          });
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