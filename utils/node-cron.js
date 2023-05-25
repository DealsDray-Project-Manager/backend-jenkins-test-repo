/* REQUIRE NODE CRON */
const corn = require("node-cron");
const fs = require("fs");
const xmlParser = require("xml2js");
const formatXml = require("xml-formatter");
const csvParser = require("csv-parser");
const { delivery } = require("../Model/deliveryModel/delivery");
const elasticSearch = require("../Elastic-search/elastic");
const emailNotification=require("../Utils/email-notification")
/***************************************** */

exports = module.exports = () => {
  try {
    corn.schedule("00 20 * * *", () => {
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
            //currentdate

            let currentDate = new Date();
            dataOfXml.request["export-report"][0].search[1].$.value =
              new Date(currentDate.setDate(currentDate.getDate() + 1))
                .toISOString()
                .split("T")[0] + "T00:00:00+0000";

            //builder
            const builder = new xmlParser.Builder();
            const xml = builder.buildObject(dataOfXml);
            fs.writeFile(
              "blancco_qc_data/csvRequest.xml",
              formatXml(xml, { collapseContent: true }),
              function (err, result) {
                if (err) {
                  console.log(err);
                } else {
                  console.log("Xml file successfully updated.");
                }
              }
            );
            console.log("done");
          });
        }
      );
    });
  } catch (error) {
    console.log(error);
  }
  try {
    corn.schedule("42 15 * * *", () => {
      /*----------------------------------------------CSV READ-----------------------------*/
      let result = [];
      fs.createReadStream("blancco_qc_data/blancco_qc_data.csv")
        .pipe(csvParser())
        .on("data", (data) => {
          data["device_color_one"] = data["Device_Color"];
          result.push(toLowerKeys(data));
        })
        .on("end", async () => {
        let check=emailNotification.blancoDataUpdateNotification()
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
  try {
    corn.schedule("*/30 * * * *", async () => {
      /*----------------------------------------------CSV READ-----------------------------*/
      let lastUpdateData = await delivery
        .find({}, { _id: 0 })
        .sort({ updated_at: -1 })
        .limit(500);
      for (let x of lastUpdateData) {
        let update = await elasticSearch.uicCodeGen(x);
      }
    });
  } catch (error) {
    console.log(error);
  }
};
