/* REQUIRE NODE CRON */
const corn = require("node-cron");
const fs = require("fs");
const xmlParser = require("xml2js");
const formatXml = require("xml-formatter");
const csvParser = require("csv-parser");
const { delivery } = require("../Model/deliveryModel/delivery");
const elasticSearch = require("../Elastic-search/elastic");
const emailNotification = require("../Utils/email-notification");
const { products } = require("../Model/productModel/product");
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
    corn.schedule("00 23 * * *", () => {
      /*----------------------------------------------CSV READ-----------------------------*/
      let result = [];
      let updatedMuic = [];
      let arrofTray = [];
      fs.createReadStream("blancco_qc_data/blancco_qc_data.csv")
        .pipe(csvParser())
        .on("data", (data) => {
          data["device_color_one"] = data["Device_Color"];
          result.push(toLowerKeys(data));
        })
        .on("end", async () => {
          for (let x of result) {
            let updateBqcData = await delivery.findOneAndUpdate(
              { "uic_code.code": x.uic },
              {
                $set: {
                  bqc_software_report: x,
                },
              }
            );
            // if(x.tray_id !== updateBqcData?.wht_tray){
            //   console.log(x.uic);
            // }

            if (updateBqcData) {
              let obj = {
                updatedUic: x.uic,
                tray: x.tray_id,
                brand: "",
                model: "",
              };
              if (arrofTray.includes(x.tray_id) == false) {
                arrofTray.push(x.tray_id);
              }

              let findBrandAndModel = await products.findOne({
                vendor_sku_id: updateBqcData.item_id,
              });
              if (findBrandAndModel) {
                obj.brand = findBrandAndModel.brand_name;
                obj.model = findBrandAndModel.model_name;
              }
              updatedMuic.push(obj);
            }
          }
          console.log(updatedMuic);
          let check = emailNotification.blancoDataUpdateNotification(
            updatedMuic,
            arrofTray
          );
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
    // const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    // corn.schedule("*/30 * * * *", async () => {
    //   /*----------------------------------------------CSV READ-----------------------------*/
    //   let lastUpdateData = await delivery
    //     .find({}, { _id: 0 })
    //     .sort({ updated_at: -1 })
    //     .limit(1000);
        
    //   for (let x of lastUpdateData) {
    //     await elasticSearch.uicCodeGen(x);
    //     // Introduce a delay of 500 milliseconds (adjust as needed)
    //     await delay(500);
    //   }
    // });
    
  } catch (error) {
    console.log(error);
  }
};
