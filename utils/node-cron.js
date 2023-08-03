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
const { orders } = require("../Model/ordersModel/ordersModel");
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
  // NIGHT 11 BLANCOO AUTOMATION
  try {
    corn.schedule("21 14 * * *", () => {
      /*----------------------------------------------CSV READ-----------------------------*/
      let result = [];
      fs.createReadStream("blancco_qc_data/blancco_qc_data.csv")
        .pipe(csvParser())
        .on("data", (data) => {
          data["device_color_one"] = data["Device_Color"];
          result.push(toLowerKeys(data));
        })
        .on("end", async () => {
          blancooAutmation(result);
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
  // MORNING 9 BLANCOO AUTOMATION
  try {
    corn.schedule("21 14 * * *", () => {
      /*----------------------------------------------CSV READ-----------------------------*/
      let result = [];
      fs.createReadStream("blancco_qc_data/blancco_qc_data.csv")
        .pipe(csvParser())
        .on("data", (data) => {
          data["device_color_one"] = data["Device_Color"];
          result.push(toLowerKeys(data));
        })
        .on("end", async () => {
          blancooAutmation(result);
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
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    corn.schedule("*/30 * * * *", async () => {
      /*----------------------------------------------CSV READ-----------------------------*/
      let lastUpdateData = await delivery
        .find({}, { _id: 0 })
        .sort({ updated_at: -1 })
        .limit(500);
      for (let x of lastUpdateData) {
        let obj = {
          _ro_ril_miui_imei0: x?.bqc_software_report?._ro_ril_miui_imei0,
          mobile_imei: x?.bqc_software_report?.mobile_imei,
          mobile_imei2: x?.bqc_software_report?.mobile_imei2,
        };
        x.bqc_software_report = obj;
        await elasticSearch.uicCodeGen(x);
        // Introduce a delay of 500 milliseconds (adjust as needed)
        await delay(500);
      }
    });
  } catch (error) {
    console.log(error);
  }
};
// BLANCOO AUTOMATION
async function blancooAutmation(result) {
  let updatedMuic = [];
  let arrofTray = [];
  let dupUic = [];
  for (let x of result) {
    if (dupUic.includes(x.uic) == false) {
      dupUic.push(x.uic);
      x["imei_verification_status_from_prexo"] = "Unverified";
      let imeiCheck = await delivery.findOne({ "uic_code.code": x.uic });
      if (
        imeiCheck?.imei !== undefined &&
        imeiCheck?.bqc_report?.blancoo_qc_status == "BQC Finished"
      ) {
        if (
          imeiCheck?.imei?.match(/[0-9]/g)?.join("") == x.mobile_imei ||
          imeiCheck?.imei?.match(/[0-9]/g)?.join("") == x.mobile_imei2 ||
          imeiCheck?.imei?.match(/[0-9]/g)?.join("") == x._ro_ril_miui_imei0
        ) {
          x["imei_verification_status_from_prexo"] = "Verified";
        }
      }

      let updateBqcData = await delivery.findOneAndUpdate(
        { "uic_code.code": x.uic },
        {
          $set: {
            bqc_software_report: x,
            updated_at: Date.now(),
            unverified_imei_status: x.imei_verification_status_from_prexo,
          },
        }
      );

      if (updateBqcData) {
        let updateOrder = await orders.findOneAndUpdate(
          { "uic_code.code": x.uic },
          {
            $set: {
              imei_verification_status: x.imei_verification_status_from_prexo,
            },
          }
        );
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
  }

  let check = emailNotification.blancoDataUpdateNotification(
    updatedMuic,
    arrofTray
  );
  console.log("BQC report updated");
}
