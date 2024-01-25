/* REQUIRE NODE CRON */
const corn = require("node-cron");
const fs = require("fs");
const xmlParser = require("xml2js");
const formatXml = require("xml-formatter");
const csvParser = require("csv-parser");
const { delivery } = require("../Model/deliveryModel/delivery");
const elasticSearch = require("../Elastic-search/elastic");
const emailNotification = require("../Utils/email-notification");
const warehouseController = require("../Controller/warehouseIn/warehouseInController");
const BlancoAutoMation = require("./blancooAutomation");
const superAdminController = require("../Controller/superAdmin/superAdminController");
const reportingAgentRouter = require("../Controller/reporting-controller/reporting");
/***************************************** */

exports = module.exports = () => {
  try {
    corn.schedule("00 20 * * *", () => {
      /*---------------------------xml read ------------------------------------*/
      BlancoAutoMation.xmlFileRead();
    });
  } catch (error) {
    console.log(error);
  }
  // NIGHT 11 BLANCOO AUTOMATION
  try {
    corn.schedule("00 23 * * *", () => {
      /*----------------------------------------------CSV READ-----------------------------*/
      BlancoAutoMation.blancooFileUpload();
    });
  } catch (error) {
    console.log(error);
  }
  // MORNING 9 BLANCOO AUTOMATION
  try {
    corn.schedule("00 09 * * *", () => {
      /*----------------------------------------------CSV READ-----------------------------*/
      BlancoAutoMation.blancooFileUpload();
    });
  } catch (error) {
    console.log(error);
  }
  // RDL-2 OUTPUT GENERATE
  try {
    corn.schedule("*/10 * * * *", () => {
      reportingAgentRouter.generateRdlTwoOutputReport();
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
  try {
    //"0 9 * * 1"
    corn.schedule("00 09 * * 1", async () => {
      /*----------------------------------------------WEEKLY DELEVERED REPORT-----------------------------*/
      const deleiveryReportOfLastWeek =
        await superAdminController.openPacketDataFetch();
      if (deleiveryReportOfLastWeek) {
        let check = emailNotification.deleiveryReportOfLastWeek(
          deleiveryReportOfLastWeek
        );
      }
    });
  } catch (error) {
    console.log(error);
  }
  // TO CHECK BLANCOO UPDATION IS DONE OR NOT AT 5:AM
  try {
    corn.schedule("00 10 * * *", () => {
      /*---------------------------xml read ------------------------------------*/
      BlancoAutoMation.toCheckBlancoUpdation();
    });
  } catch (error) {
    console.log(error);
  }
  /*----------------------------------------------OUT STOCK ---------------------*/
  try {
    corn.schedule("00 10 * * *", () => {
      /*---------------------------xml read ------------------------------------*/
      warehouseController.checkOutOfStock();
    });
  } catch (error) {
    console.log(error);
  }
};
