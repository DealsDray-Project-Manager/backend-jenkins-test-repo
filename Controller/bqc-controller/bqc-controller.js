const { delivery } = require("../../Model/deliveryModel/delivery");
const { masters } = require("../../Model/mastersModel");
const Elasticsearch = require("../../Elastic-search/elastic");
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
          let data = await masters.updateOne(
            { code: itemData.trayId },
            {
              $push: {
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
          let data = await masters.updateOne(
            { code: itemData.trayId },
            {
              $push: {
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
            data.issued_user_name == username &&
            page == "Page-1")
        ) {
          resolve({ status: 1, data: data });
        } else if (
          data.sort_id === status ||
          (data.sort_id == "BQC work inprogress" &&
            data.issued_user_name == username &&
            page == "Page-2" &&
            data.items.length == 0)
        ) {
          resolve({ status: 4, data: data });
        } else if (
          data.sort_id === status ||
          (data.sort_id == "BQC work inprogress" &&
            data.issued_user_name == username &&
            page == "Page-2" &&
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
  bqcOut: async (trayData) => {
    try {
      const getTray = await masters.findOneAndUpdate(
        { code: trayData.trayId, sort_id: { $ne: "BQC Done" } },
        {
          $set: {
            sort_id: "BQC Done",
            closed_time_bot: Date.now(),
            description: trayData.description,
            temp_array: [],
          },
          $push: { items: { $each: getTray.temp_array } },
        },
        { new: true }
      );
  
      if (!getTray) {
        return null;
      }
      const updatedItems = getTray.actual_items.map((item) => {
        const bqc_report = item.bqc_report || {};
        bqc_report.bqc_status = item.bqc_status;
        return {
          ...item,
          bqc_report,
        };
      });
  
      await unitsActionLog.create(
        getTray.actual_items.map((item) => ({
          action_type: "BQC Done",
          created_at: Date.now(),
          uic: item.uic,
          tray_id: trayData.trayId,
          user_name_of_action: getTray.issued_user_name,
          report: item.bqc_report,
        }))
      );
      await delivery.updateMany(
        { tracking_id: { $in: getTray.actual_items.map((item) => item.tracking_id) } },
        {
          $set: {
            bqc_out_date: Date.now(),
            tray_status: "BQC Done",
            tray_location: "BQC",
            bqc_report: { $mergeObjects: ["$bqc_report", "$$newReport"] },
            updated_at: Date.now(),
          },
        }
      );
  
      return getTray;
    } catch (error) {
      console.error("Error in bqcOut:", error);
      throw error;
    }
  },
  
};
