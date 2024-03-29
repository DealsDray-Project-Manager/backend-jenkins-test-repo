const { delivery } = require("../../Model/deliveryModel/delivery");
const { masters } = require("../../Model/mastersModel");
const Elasticsearch = require("../../Elastic-search/elastic");
var mongoose = require("mongoose");
const { unitsActionLog } = require("../../Model/units-log/units-action-log");
/****************************************************************** */
module.exports = {
  getAssignedTray: (username) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        $or: [
          { issued_user_name: username, sort_id: "Issued to BQC" },
          { issued_user_name: username, sort_id: "BQC work inprogress" },
        ],
      });
      if (data) {
        resolve(data);
      }
    });
  },

  dashboardCount: (username) => {
    return new Promise(async (resolve, reject) => {
      let count = {
        bqc: 0,
      };
      count.bqc = await masters.count({
        $or: [
          { issued_user_name: username, sort_id: "Issued to BQC" },
          { issued_user_name: username, sort_id: "BQC work inprogress" },
        ],
      });
      if (count) {
        resolve(count);
      }
    });
  },
  checkUicFirst: (uic, trayId) => {
    return new Promise(async (resolve, reject) => {
      let dataDelivered = await delivery.findOne({ "uic_code.code": uic });
      if (dataDelivered) {
        let alreadyAdded = await masters.findOne({
          $or: [
            { code: trayId, temp_array: { $elemMatch: { uic: uic } } },
            { code: trayId, actual_items: { $elemMatch: { uic: uic } } },
          ],
        });
        if (alreadyAdded) {
          resolve({ status: 3 });
        } else {
          let checkExitThisTray = await masters.findOne({
            code: trayId,
            items: { $elemMatch: { uic: uic } },
          });
          if (checkExitThisTray) {
            let obj;
            for (let x of checkExitThisTray.items) {
              if (x.uic == uic) {
                obj = x;
              }
            }
            resolve({ status: 4, data: obj });
          } else {
            resolve({ status: 2 });
          }
        }
      } else {
        resolve({ status: 1 });
      }
    });
  },
  addWhtitem: (itemData) => {
    return new Promise(async (resolve, reject) => {
      if (itemData.condiation == "Device In") {
        let checkItem = await masters.findOne({
          code: itemData.trayId,
          "actual_items.uic": itemData.item.uic,
        });
        if (checkItem) {
          resolve({ status: 3 });
        } else {
          itemData.item['_id'] = mongoose.Types.ObjectId();
          let data = await masters.updateOne(
            { code: itemData.trayId },
            {
              $addToSet: {
                actual_items: itemData.item,
              },
              $pull: {
                items: {
                  uic: itemData.item.uic,
                },
              },
            }
          );
          if (data.matchedCount != 0) {
            resolve({ status: 1 });
          } else {
            resolve({ status: 2 });
          }
        }
      } else {
        let checkItem = await masters.findOne({
          code: itemData.trayId,
          "temp_array.uic": itemData.item.uic,
        });
        if (checkItem) {
          resolve({ status: 3 });
        } else {
          itemData.item['_id'] = mongoose.Types.ObjectId();
          let data = await masters.updateOne(
            { code: itemData.trayId },
            {
              $addToSet: {
                temp_array: itemData.item,
              },
              $pull: {
                items: {
                  uic: itemData.item.uic,
                },
              },
            }
          );
          if (data.matchedCount != 0) {
            resolve({ status: 1 });
          } else {
            resolve({ status: 2 });
          }
        }
      }
    });
  },
  uicCheckBqcDone: (uic, trayId) => {
    return new Promise(async (resolve, reject) => {
      let dataDelivered = await delivery.findOne({ "uic_code.code": uic });
      if (dataDelivered) {
        let alreadyAdded = await masters.findOne({
          code: trayId,
          items: { $elemMatch: { uic: uic } },
        });
        if (alreadyAdded) {
          resolve({ status: 3 });
        } else {
          let checkExitThisTray = await masters.findOne({
            code: trayId,
            actual_items: { $elemMatch: { uic: uic } },
          });
          if (checkExitThisTray) {
            let obj;
            for (let x of checkExitThisTray.actual_items) {
              if (x.uic == uic) {
                obj = x;
              }
            }
            resolve({ status: 4, data: obj });
          } else {
            resolve({ status: 2 });
          }
        }
      } else {
        resolve({ status: 1 });
      }
    });
  },
  getWhtTrayitem: (trayId, username, status, page) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.findOne({ code: trayId });
      if (data) {
        if (
          data.sort_id === status ||
          (data.sort_id == "BQC work inprogress" &&
            data.issued_user_name == username 
           )
        ) {

          resolve({ status: 1, data: data });
        } else if (
          data.sort_id === status ||
          (data.sort_id == "BQC work inprogress" &&
            data.issued_user_name == username &&
            
            data.items.length == 0)
        ) {
          resolve({ status: 4, data: data });
        } else if (
          data.sort_id === status ||
          (data.sort_id == "BQC work inprogress" &&
            data.issued_user_name == username &&
            
            data.items.length !== 0)
        ) {
          resolve({ status: 5, data: data });
        } else if (
          data.sort_id !== status ||
          data.sort_id == "BQC work inprogress"
        ) {
          resolve({ status: 4, data: data });
        }
      } else if (data.issued_user_name !== username) {
        resolve({ status: 2 });
      } else {
        resolve({ status: 3 });
      }
    });
  },
  bqcIn: (trayData) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.findOneAndUpdate(
        { code: trayData.trayId },
        {
          $set: {
            sort_id: "BQC IN",
            closed_time_bot: Date.now(),
            description: trayData.description,
            actual_items: [],
          },
        }
      );
      if (data) {
        for (let x of data.items) {
          let deliveryUpdate = await delivery.findOneAndUpdate(
            {
              tracking_id: x.tracking_id,
            },
            {
              $set: {
                bqc_in_date: Date.now(),
                tray_status: "BQC IN",
                tray_location: "BQC",
                updated_at: Date.now(),
              },
            },
            {
              new: true,
              projection: { _id: 0 },
            }
          );
        }
        resolve(data);
      } else {
        resolve();
      }
    });
  },
  bqcOut: (trayData) => {
    return new Promise(async (resolve, reject) => {
      let getTray = await masters.findOne({ code: trayData.trayId });
      if (getTray) {
        if (getTray.sort_id !== "BQC Done") {
          Array.prototype.push.apply(getTray.items, getTray.temp_array);
          let data = await masters.findOneAndUpdate(
            { code: trayData.trayId, sort_id: { $ne: "BQC Done" } },
            {
              $set: {
                sort_id: "BQC Done",
                closed_time_bot: Date.now(),
                description: trayData.description,
                actual_items: getTray.items,
                temp_array: [],
                items: [],  
              },
            },
            { new: true }
          );
          if (data) {
            let state = "Tray";
            for (let x of data.actual_items) {
              if (x.bqc_report == undefined) {
                let obj = {
                  bqc_status: x.bqc_status,
                };
                x["bqc_report"] = obj;
              } else {
                x.bqc_report.bqc_status = x.bqc_status;
              }
              const addLogsofUnits = await unitsActionLog.create({
                action_type: "BQC Done",
                created_at: Date.now(),
                uic: x.uic,
                tray_id: trayData.trayId,
                user_name_of_action: data.issued_user_name,
                report: x.bqc_report,
                description: `BQC Done closed by the agent :${data.issued_user_name}`,
                track_tray: state,
                user_type: "PRC BQC",
              });
              state = "Units";
              let deliveryUpdate = await delivery.findOneAndUpdate(
                {
                  tracking_id: x.tracking_id,
                },
                {
                  $set: {
                    bqc_out_date: Date.now(),
                    tray_status: "BQC Done",
                    tray_location: "BQC",
                    bqc_report: x.bqc_report,
                    updated_at: Date.now(),
                  },
                },
                {
                  new: true,
                  projection: { _id: 0 },
                }
              );
            }
            resolve(data);
          } else {
            resolve();
          }
        } else {
          resolve();
        }
      }
    });
  },
};
