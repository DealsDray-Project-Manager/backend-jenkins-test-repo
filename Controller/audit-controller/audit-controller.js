const { delivery } = require("../../Model/deliveryModel/delivery");
const { masters } = require("../../Model/mastersModel");
const { orders } = require("../../Model/ordersModel/ordersModel");
const Elasticsearch =require("../../Elastic-search/elastic")
module.exports = {
  getAssigendOtherTray: (username) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        issued_user_name: username,
        sort_id: "Issued to Audit",
        type_taxanomy: { $ne: "WHT" },
      });
      if (data) {
        resolve(data);
      }
    });
  },
  dashboardData: (username) => {
    return new Promise(async (resolve, reject) => {
      let count = {
        wht: 0,
        other_tray: 0,
      };
      count.wht = await masters.count({
        issued_user_name: username,
        sort_id: "Issued to Audit",
        type_taxanomy: "WHT",
      });
      count.other_tray = await masters.count({
        issued_user_name: username,
        sort_id: "Issued to Audit",
        type_taxanomy: { $ne: "WHT" },
      });
      if (count) {
        resolve(count);
      }
    });
  },
  getAssignedTrayItems: (trayId) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.findOne({ code: trayId });
      if (data) {
        resolve(data);
      } else {
        resolve(data);
      }
    });
  },
  getAuditRequest: (username) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        issued_user_name: username,
        sort_id: "Issued to Audit",
        type_taxanomy: "WHT",
      });
      if (data) {
        resolve(data);
      }
    });
  },
  getTransactionData: (trayId, username) => {
    return new Promise(async (resolve, reject) => {
      let obj = {};
      let data = await masters.findOne({
        code: trayId,
        sort_id: "Issued to Audit",
        issued_user_name: username,
      });
      if (data) {
        obj.wht = data;
        obj.otherTray = await masters.find({
          $or: [
            {
              sort_id: "Issued to Audit",
              issued_user_name: username,
              type_taxanomy: { $ne: "WHT" },
            },
            {
              sort_id: "Audit Done",
              issued_user_name: username,
              type_taxanomy: { $ne: "WHT" },
            },
          ],
        });
      
        resolve({ status: 1, tray: obj });
      } else {
        resolve({ status: 2 });
      }
    });
  },
  getBqcReport: (uic, trayId) => {
    return new Promise(async (resolve, reject) => {
      let obj = {};
      let checkIntray = await masters.findOne({
        code: trayId,
        "items.uic": uic,
      });
      if (checkIntray) {
        let checkAlreadyAdded = await masters.findOne({
          $or: [
            {
              type_taxanomy: "WHT",
              prefix: "tray-master",
              "actual_items.uic": uic,
            },
            {
              type_taxanomy: "WHT",
              prefix: "tray-master",
              "temp_array.uic": uic,
            },
          ],
        });
        if (checkAlreadyAdded) {
          resolve({ status: 5 });
        } else {
          let uicExists = await delivery.findOne(
            { "uic_code.code": uic },
            {
              uic_code: 1,
              tracking_id: 1,
              order_id: 1,
              charging: 1,
              bqc_report: 1,
              bqc_done_close: 1,
              bqc_software_report: 1,
              bot_report: 1,
              charging_done_date: 1,
              audit_report:1,
            }
          );
          if (uicExists) {
            if (uicExists.bqc_done_close !== undefined) {
              let getOrder = await orders.findOne({
                order_id: uicExists.order_id,
              });
              obj.delivery = uicExists;
              obj.order = getOrder;
              obj.checkIntray=checkIntray

              resolve({ status: 1, data: obj });
            } else {
              resolve({ status: 3 });
            }
          } else {
            resolve({ status: 2 });
          }
        }
      } else {
        resolve({ status: 4 });
      }
    });
  },
  traySegrigation: (itemData) => {
    return new Promise(async (resolve, reject) => {
      let obj = {
        grade: itemData.grade,
        stage: itemData.stage,
        reason: itemData.reason,
        description: itemData.description,
        orgGrade: itemData.orgGrade,
        wht_tray:itemData.trayId
      };
      let findTray = await masters.findOne({
        issued_user_name: itemData.username,
        type_taxanomy: itemData.type,
        sort_id: "Issued to Audit",
      });
      if (findTray) {
        if (findTray.sort_id !== "Issued to Audit") {
          resolve({ status: 6, trayId: findTray.code });
        } else if (findTray.type_taxanomy == "WHT") {
          let item = await masters.findOne(
            {
              code: itemData.trayId,
              "items.uic": itemData.uic,
            },
            {
              _id: 0,
              items: {
                $elemMatch: { uic: itemData.uic },
              },
            }
          );
          const updateReport = await masters.updateOne(
            {
              code: itemData.trayId,
              "items.uic": itemData.uic,
            },
            {
              $set: {
                "items.$.audit_report": obj,
              },
            }
          );
          if (item) {
            item.items[0].audit_report = obj;

            let updateOther = await masters.updateOne(
              { code: findTray.code },
              {
                $push: {
                  temp_array: item.items[0],
                },
              }
            );
            if (updateOther) {
              let update = await delivery.findOneAndUpdate(
                { "uic_code.code": itemData.uic },
                {
                  $set: {
                    wht_tray: findTray.code,
                    tray_location:"Audit",
                    tray_type: itemData.type,
                    audit_report: obj,
                  },
                },
                { 
                  new: true, 
                  projection: { _id: 0 } 
                }
              );
              let elasticSearchUpdate=await Elasticsearch.uicCodeGen(update)
              resolve({ status: 1, trayId: findTray.code });
            }
          } else {
            resolve({ status: 5 });
          }
        } else if (findTray?.items?.length === findTray?.limit) {
          resolve({ status: 2, trayId: findTray.code });
        } else {
          let item = await masters.findOne(
            {
              code: itemData.trayId,
              "items.uic": itemData.uic,
            },
            {
              _id: 0,
              items: {
                $elemMatch: { uic: itemData.uic },
              },
            }
          );
          if (item) {
            item.items[0].audit_report = obj;
            let updateWht = await masters.updateOne(
              { code: itemData.trayId },
              {
                $push: {
                  actual_items: item.items[0],
                },
              }
            );
            let updateOther = await masters.updateOne(
              { code: findTray.code },
              {
                $push: {
                  items: item.items[0],
                },
              }
            );
            if (updateOther) {
              let update = await delivery.findOneAndUpdate(
                { "uic_code.code": itemData.uic },
                {
                  $set: {
                    tray_id: findTray.code,
                    tray_type: itemData.type,
                    tray_location: "Audit",
                    audit_report: obj,
                  },
                },
                { 
                  new: true, 
                  projection: { _id: 0 } 
                }
              );
              let updateElasticSearch=await Elasticsearch.uicCodeGen(update)
              resolve({ status: 1, trayId: findTray.code });
            }
          } else {
            resolve({ status: 5 });
          }
        }
      } else {
        resolve({ status: 4 });
      }
    });
  },
  trayClose: (trayId) => {
    return new Promise(async (resolve, reject) => {
      let findTray = await masters.findOne({ code: trayId });
      let data;
      if (findTray.type_taxanomy == "WHT") {
        data = await masters.findOneAndUpdate(
          { code: trayId },
          {
            $set: {
              sort_id: "Audit Done",
              closed_time_bot: Date.now(),
              temp_array: [],
              items: findTray.temp_array,
              actual_items: [],
            },
          }
        );
      } else {
        data = await masters.findOneAndUpdate(
          { code: trayId },
          {
            $set: {
              sort_id: "Audit Done",
              closed_time_bot: Date.now(),
              actual_items: [],
            },
          }
        );
      }
      if (data.type_taxanomy == "WHT") {
        for (let x of data.items) {
          let updateDelivery = await delivery.findOneAndUpdate(
            { tracking_id: x.tracking_id },
            {
              $set: {
                audit_done_date: Date.now(),
                tray_location: "Warehouse",
                tray_status: "Audit Done",
              },
            },
            { 
              new: true, 
              projection: { _id: 0 } 
            }
          );
          let updateElasticSearch= await Elasticsearch.uicCodeGen(updateDelivery)
        }
        resolve(data);
      } else {
        resolve(data);
      }
    });
  },
};
/*-----------------------------------------------------*/