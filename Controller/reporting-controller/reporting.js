const { delivery } = require("../../Model/deliveryModel/delivery");
const {orders}=require("../../Model/ordersModel/ordersModel")
/*--------------------------------------------------------------*/

/************************************************** */
//REPORTING AGENT OPERATIONS//
/************************************************** */

module.exports = {
  dashboardData: (location) => {
    return new Promise(async (resolve, reject) => {
      let count = {
        allOrders: 0,
        deliveredOrder: 0,
        notDeliveredOrders: 0,
        processingUnits: 0,
        readyForSale: 0,
      };
      count.allOrders = await orders.count({ partner_shop: location });
      count.notDeliveredOrders = await orders.count({
        partner_shop: location,
        delivery_status: "Pending",
      });
      count.deliveredOrder = await orders.count({
        partner_shop: location,
        delivery_status: "Delivered",
      });
      count.processingUnits = await delivery.count({
        partner_shop: location,
        ctx_tray_id: { $exists: false },
      });
      count.readyForSale = await delivery.count({
        partner_shop: location,
        ctx_tray_id: { $exists: true },
      });
      if (count) {
        resolve(count);
      }
    });
  },
  getUnitsCond: (location, limit, skip, screen) => {
    console.log(screen);
    return new Promise(async (resolve, reject) => {
      if (screen == "Processing-units") {
        const units = await delivery
          .find({ partner_shop: location, ctx_tray_id: { $exists: false } })
          .limit(limit)
          .skip(skip);
        const forCount = await delivery.count({ partner_shop: location });
        resolve({ units: units, forCount: forCount });
      } else {
        const units = await delivery
          .find({ partner_shop: location })
          .limit(limit)
          .skip(skip);
        const forCount = await delivery.count({
          partner_shop: location,
          ctx_tray_id: { $exists: true },
        });
        resolve({ units: units, forCount: forCount });
      }
    });
  },
};
