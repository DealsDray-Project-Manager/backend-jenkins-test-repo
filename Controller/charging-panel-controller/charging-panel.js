const { orders } = require("../../Model/ordersModel/ordersModel");
const { delivery } = require("../../Model/deliveryModel/delivery");
const { infra } = require("../../Model/infraModel");
const { products } = require("../../Model/productModel/product");
const { brands } = require("../../Model/brandModel/brand");
const { user } = require("../../Model/userModel");
const { masters } = require("../../Model/mastersModel");
const { badOrders } = require("../../Model/ordersModel/bad-orders-model");
const { badDelivery } = require("../../Model/deliveryModel/bad-delivery");
/********************************************************************************** */

module.exports = {
  getAssignedTray: (username) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        $or: [
          { issued_user_name: username, sort_id: "Issued to Charging" },
          { issued_user_name: username, sort_id: "Charging Station IN" },
        ],
      });
      if (data) {
        resolve(data);
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
      let data = await masters.findOneAndUpdate(
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
      if (data) {
        for (let x of data.items) {
          let deliveryUpdate = await delivery.updateOne(
            {
              tracking_id: x.tracking_id,
            },
            {
              $set: {
                charging_in_date: Date.now(),
                tray_status: "Charging In",
                tray_location: "Charging",
              },
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
      let data = await masters.findOneAndUpdate(
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
      if (data) {
        for (let x of data.actual_items) {
          let deliveryUpdate = await delivery.updateOne(
            {
              tracking_id: x.tracking_id,
            },
            {
              $set: {
                charging_done_date: Date.now(),
                tray_status: "Charging Done",
                tray_location: "Send to warehouse",
                charging:x.charging
              },
            }
          );
        }
        resolve(data);
      } else {
        resolve();
      }
    });
  },
};
