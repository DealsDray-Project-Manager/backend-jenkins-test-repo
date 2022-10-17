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
          { issued_user_name: username, sort_id: "Issued" },
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
      let data = await masters.updateOne(
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
      if (data.modifiedCount != 0) {
        resolve(data);
      } else {
        resolve();
      }
    });
  },
  chargeDone: (trayData) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.updateOne(
        { code: trayData.trayId },
        {
          $set: {
            sort_id: "Charge Done",
            closed_time_bot: Date.now(),
            description: trayData.description,
          },
        }
      );
      if (data.modifiedCount != 0) {
        resolve(data);
      } else {
        resolve();
      }
    });
  },
};
