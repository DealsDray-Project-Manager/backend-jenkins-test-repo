const { orders } = require("../../Model/ordersModel/ordersModel");
const { delivery } = require("../../Model/deliveryModel/delivery");
const { infra } = require("../../Model/infraModel");
const { products } = require("../../Model/productModel/product");
const { brands } = require("../../Model/brandModel/brand");
const { user } = require("../../Model/userModel");
const { masters } = require("../../Model/mastersModel");
const { badOrders } = require("../../Model/ordersModel/bad-orders-model");
const { badDelivery } = require("../../Model/deliveryModel/bad-delivery");
const Elasticsearch = require("../../Elastic-search/elastic");
const { unitsActionLog } = require("../../Model/units-log/units-action-log");
/********************************************************************************** */

module.exports = {
  getAssignedTray: (username) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        $or: [
          { issued_user_name: username, sort_id: "Issued to Charging" },
          { issued_user_name: username, sort_id: "Charging Station IN" },
          { issued_user_name: username, sort_id: "Issued to Recharging" },
          { issued_user_name: username, sort_id: "Recharging Station IN" },
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
        charging: 0,
      };
      count.charging = await masters.count({
        $or: [
          { issued_user_name: username, sort_id: "Issued to Charging" },
          { issued_user_name: username, sort_id: "Charging Station IN" },
          { issued_user_name: username, sort_id: "Issued to Recharging" },
          { issued_user_name: username, sort_id: "Recharging Station IN" },
        ],
      });
      if (count) {
        resolve(count);
      }
    });
  },
  getTrayDetails: (trayId) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.findOne({ code: trayId });
      if (data) {
        resolve(data);
      } else {
        resolve();
      }
    });
  },
  chargingStationIN: (trayData) => {
    return new Promise(async (resolve, reject) => {
      let data;
      let checkTray = await masters.findOne({ code: trayData.trayId });
      if (checkTray?.sort_id == "Issued to Recharging") {
        data = await masters.findOneAndUpdate(
          { code: trayData.trayId },
          {
            $set: {
              sort_id: "Recharging Station IN",
              closed_time_bot: Date.now(),
              description: trayData.description,
              actual_items: [],
            },
          }
        );
      } else {
        data = await masters.findOneAndUpdate(
          { code: trayData.trayId },
          {
            $set: {
              sort_id: "Charging Station IN",
              closed_time_bot: Date.now(),
              description: trayData.description,
              actual_items: [],
            },
          }
        );
      }
      if (data) {
        for (let x of data.items) {
          const addLogsofUnits = await unitsActionLog.create({
            action_type: "Charging In",
            created_at: Date.now(),
            uic: x.uic,
            user_name_of_action: data.issued_user_name,
            tray_id:trayData.trayId,
            user_type:"PRC Charging",
            description:`Charging station in by the agent:${data.issued_user_name}`
          });
          let deliveryUpdate = await delivery.findOneAndUpdate(
            {
              tracking_id: x.tracking_id,
            },
            {
              $set: {
                charging_in_date: Date.now(),
                tray_status: "Charging In",
                tray_location: "Charging",
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
  chargeDone: (trayData) => {
    return new Promise(async (resolve, reject) => {
      let data;
      let checkTray = await masters.findOne({ code: trayData.trayId });
      if (checkTray.sort_id == "Recharging Station IN") {
        data = await masters.findOneAndUpdate(
          { code: trayData.trayId },
          {
            $set: {
              sort_id: "Recharge Done",
              closed_time_bot: Date.now(),
              description: trayData.description,
              items: [],
            },
          }
        );
      } else {
        data = await masters.findOneAndUpdate(
          { code: trayData.trayId },
          {
            $set: {
              sort_id: "Charge Done",
              closed_time_bot: Date.now(),
              description: trayData.description,
              items: [],
            },
          }
        );
      }
      if (data) {
        let state="Tray"
        for (let x of data.actual_items) {
          let addLogsofUnits = await unitsActionLog.create({
            action_type: "Charging Done",
            created_at: Date.now(),
            uic: x.uic,
            tray_id: trayData.trayId,
            user_name_of_action: data.issued_user_name,
            report: x.charging,
            track_tray:state,
            user_type:"PRC Charging",
            description:`Charging done and sent to warehouse by agent:${data.issued_user_name}`
          });
          state="Units"
          let deliveryUpdate = await delivery.findOneAndUpdate(
            {
              tracking_id: x.tracking_id,
            },
            {
              $set: {
                charging_done_date: Date.now(),
                tray_status: "Charging Done",
                tray_location: "Send to warehouse",
                charging: x.charging,
                updated_at: Date.now(),
              },
            },
            {
              new: true,
              projection: { _id: 0 },
            }
          );
          // let elasticSearchUpdate = await Elasticsearch.uicCodeGen(
          //   deliveryUpdate
          // );
        }
        resolve(data);
      } else {
        resolve();
      }
    });
  },
  checkUicCode: (uic, trayId) => {
    return new Promise(async (resolve, reject) => {
      let data = await delivery.findOne({ "uic_code.code": uic });
      if (data) {
        let checkExitThisTray = await masters.findOne({
          code: trayId,
          items: { $elemMatch: { uic: uic } },
        });
        if (checkExitThisTray) {
          let alreadyAdded = await masters.findOne({
            code: trayId,
            "actual_items.uic": uic,
          });
          if (alreadyAdded) {
            resolve({ status: 3 });
          } else {
            let obj;
            for (let x of checkExitThisTray.items) {
              if (x.uic == uic) {
                obj = x;
              }
            }
            resolve({ status: 4, data: obj });
          }
        } else {
          resolve({ status: 2 });
        }
      } else {
        resolve({ status: 1 });
      }
    });
  },
};
