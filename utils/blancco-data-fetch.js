const axios = require("axios");
const fs = require("fs");
const FormData = require("form-data");
const xml2js = require("xml2js");
const parseCsv = require("csv-parser");
const Papa = require("papaparse");
const { delivery } = require("../Model/deliveryModel/delivery");
const bqcUrl = process.env.BQC_URL;
const username = process.env.BQC_USERNAME;
const password = process.env.BQC_PASSWORD;
const apiUrl = `${bqcUrl}/rest-service/report/export/csv`;

module.exports = {
  fetchDataOfRpAuditScan: (uic) => {
    return new Promise((resolve, reject) => {
      const xmlFilePath =
        "C:/DEALSDRAY/PREXO-WEB-APP-CODE/prexo-web-app-api/Utils/xmlRequest.xml";
      let xmlData;

      try {
        xmlData = fs.readFileSync(xmlFilePath, "utf-8").trim();
      } catch (error) {
        console.error("Error reading XML file:", error);
        resolve({ status: 1 });
        return;
      }
      const parser = new xml2js.Parser();
      parser.parseString(xmlData, (err, result) => {
        if (err) {
          console.error(err);
          resolve({ status: 1 });
          return;
        }
        // result.request["export-report"][0].search[0].$.value = uic;
        const builder = new xml2js.Builder();
        xmlData = builder.buildObject(result);

        const formData = new FormData();
        formData.append("xmlRequest", xmlData, {
          filename: "xmlRequest.xml",
          contentType: "application/xml",
        });

        axios
          .post(apiUrl, formData, {
            auth: {
              username: username,
              password: password,
            },
            headers: {
              ...formData.getHeaders(),
            },
          })
          .then(async (response) => {
            await handleCsvData(response.data);
          })
          .catch((error) => {
            console.error(error);
            resolve({ status: 1 });
          });

        async function handleCsvData(csvData) {
          Papa.parse(csvData, {
            header: true,
            delimiter: ";",
            complete: async (result) => {
              if (result.data.length !== 0) {
                let latestData = null;
                for (let x of result.data) {
                  // Assuming x.Date is a Date object or a string representing a date
                  if (
                    !latestData ||
                    new Date(x.Date) > new Date(latestData.Date)
                  ) {
                    latestData = x;
                  }
                }
                if (latestData == undefined) {
                  resolve({ status: 1 });
                }
                latestData["device_color_one"] = latestData["Device_Color"];
                latestData["device_color_two"] = latestData["Device_Color"];
                latestData["hardware_device_color"] = latestData["Device color"];
                
                let finalData = toLowerKeys(latestData);
                
                let updateDelivery = await delivery.updateOne(
                  {
                    "uic_code.code": uic,
                  },
                  {
                    $set: {
                      rp_bqc_software_report: finalData,
                    },
                  }
                );
                if (updateDelivery.matchedCount !== 0) {
                  resolve({ status: 0 });
                } else {
                  resolve({ status: 1 });
                }
              }
            },
            error: (error) => {
              console.error("CSV Parsing Error:", error.message);
              resolve({ status: 1 });
            },
          });
        }

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
    });
  },
};
