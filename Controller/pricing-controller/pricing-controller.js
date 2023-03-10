const { orders } = require("../../Model/ordersModel/ordersModel");
const { delivery } = require("../../Model/deliveryModel/delivery");
const { infra } = require("../../Model/infraModel");
const { products } = require("../../Model/productModel/product");
const { brands } = require("../../Model/brandModel/brand");
const { user } = require("../../Model/userModel");
const { masters } = require("../../Model/mastersModel");
const { badOrders } = require("../../Model/ordersModel/bad-orders-model");
const { badDelivery } = require("../../Model/deliveryModel/bad-delivery");



module.exports = {
 
  dashboardCount: (username) => {
    return new Promise(async (resolve, reject) => {
      let count = {
        charging: 0,
      };
      count.charging = await masters.count({
        $or: [
          { issued_user_name: username, sort_id: "Issued to pricing" },
        ],
      });
      if (count) {
        resolve(count);
      }
    });
  },
  
}