/* REQUIRE NODE CRON */
const corn = require("node-cron");
const fs = require("fs");
const xmlParser = require("xml2js");
const formatXml = require("xml-formatter");
const csvParser = require("csv-parser");
const { delivery } = require("../Model/deliveryModel/delivery");
/***************************************** */

exports = module.exports = () => {
  try {
    corn.schedule("29 17 * * *", () => {
      /*---------------------------xml read ------------------------------------*/
      fs.readFile(
        "blancco_qc_data/csvRequest.xml",
        "utf-8",
        function (err, data) {
          xmlParser.parseString(data, function (err, dataOfXml) {
            if (err) console.log(err);
            // here we log the results of our xml string conversion
            dataOfXml.request["export-report"][0].search[0].$.value =
              new Date().toISOString().split("T")[0] + "T00:00:00+0000";
            var builder = new xmlParser.Builder();
            var xml = builder.buildObject(dataOfXml);
            fs.writeFile(
              "blancco_qc_data/csvRequest.xml",
              formatXml(xml, { collapseContent: true }),
              function (err, result) {
                if (err) {
                  console.log("err");
                } else {
                  console.log("Xml file successfully updated.");
                }
              }
            );
          });
        }
      );
    });
  } catch (error) {
    console.log(error);
  }
  try {
    corn.schedule("21 17 * * *", () => {
      /*----------------------------------------------CSV READ-----------------------------*/
      let result = [];
      fs.createReadStream("blancco_qc_data/blancco_qc_data dummy 7.csv")
        .pipe(csvParser())
        .on("data", (data) => {
          result.push(toLowerKeys(data));
        })
        .on("end", async () => {
          
          for (let x of result) {
            let updateBqcData = await delivery.updateOne(
              { "uic_code.code": x.uic },
              {
                $set: {
                  bqc_software_report: x,
                },
              }
            );
          }
          console.log("BQC report updated");
        });
      /*---------------------------------FOR OBJECT KEY CONVERT TO LOWER KEY ------------------*/
      function toLowerKeys(obj) {
        return Object.keys(obj).reduce((accumulator, key) => {
          accumulator[
            key
              .toLowerCase()
              ?.split(/[-" "./]/)
              .join("_")
          ] = obj[key];
          return accumulator;
        }, {});
      }
    });
  } catch (error) {
    console.log(error);
  }
};
