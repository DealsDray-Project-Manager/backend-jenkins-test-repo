/* REQUIRE NODE CRON */
const fs = require("fs");
const xmlParser = require("xml2js");
const formatXml = require("xml-formatter");
const csvParser = require("csv-parser");
const { delivery } = require("../Model/deliveryModel/delivery");
const emailNotification = require("../Utils/email-notification");
const { products } = require("../Model/productModel/product");
const { orders } = require("../Model/ordersModel/ordersModel");
const filePathOfXml =
  "C:/DEALSDRAY/PREXO-WEB-APP-CODE/blancco_qc_data/csvRequest.xml";
const filePathOfCsv =
  "C:/DEALSDRAY/PREXO-WEB-APP-CODE/blancco_qc_data/blancco_qc_data.csv";

/***************************************** */

module.exports = {
  xmlFileRead: () => {
    /*---------------------------xml read ------------------------------------*/
    fs.readFile(filePathOfXml, "utf-8", function (err, data) {
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
          filePathOfXml,
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
        let curDate = new Date();
        let check = emailNotification.xmlUpdationMail(
          new Date().toISOString().split("T")[0] + "T00:00:00+0000",
          new Date(curDate.setDate(curDate.getDate() + 1))
            .toISOString()
            .split("T")[0] + "T00:00:00+0000"
        );
      });
    });
  },
  // NIGHT 11 BLANCOO AUTOMATION
  blancooFileUpload: () => {
    /*----------------------------------------------CSV READ-----------------------------*/
    let result = [];
    fs.createReadStream(filePathOfCsv)
      .pipe(csvParser())
      .on("data", (data) => {
        data["device_color_one"] = data["Device_Color"];
        result.push(toLowerKeys(data));
      })
      .on("end", async () => {
        let updatedMuic = [];
        let arrofTray = [];
        let dupUic = [];
        for (let x of result) {
          if (dupUic.includes(x.uic) == false) {
            dupUic.push(x.uic);
            x["imei_verification_status_from_prexo"] = "Unverified";
            let imeiCheck = await delivery.findOne({ "uic_code.code": x.uic });
            if (imeiCheck?.imei !== undefined) {
              if (
                imeiCheck?.imei?.match(/[0-9]/g)?.join("") == x?.mobile_imei ||
                imeiCheck?.imei?.match(/[0-9]/g)?.join("") == x?.mobile_imei2 ||
                imeiCheck?.imei?.match(/[0-9]/g)?.join("") ==
                  x?._ro_ril_miui_imei0
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
                    imei_verification_status:
                      x.imei_verification_status_from_prexo,
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
  },
};
