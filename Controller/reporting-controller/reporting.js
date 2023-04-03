const { delivery } = require("../../Model/deliveryModel/delivery");
const { masters } = require("../../Model/mastersModel");
const { orders } = require("../../Model/ordersModel/ordersModel");
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
        closedBag: 0,
        sortingPendingBot: 0,
        mmtTray: 0,
        pmtTray: 0,
        inuseWht: 0,
        readyToMerge: 0,
        readyToCharge: 0,
        readyToBqc: 0,
        readyToAudit: 0,
        readyToRdlFls: 0,
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
      count.closedBag = await masters.count({
        cpc: location,
        sort_id: "Closed",
        prefix: "bag-master",
      });
      count.sortingPendingBot = await masters.count({
        cpc: location,
        type_taxanomy: "BOT",
        prefix: "tray-master",
        sort_id: "Closed By Warehouse",
      });
      count.mmtTray = await masters.count({
        cpc: location,
        type_taxanomy: "MMT",
        prefix: "tray-master",
        sort_id: { $ne: "Open" },
      });
      count.pmtTray = await masters.count({
        cpc: location,
        type_taxanomy: "PMT",
        prefix: "tray-master",
        sort_id: { $ne: "Open" },
      });

      count.inuseWht = await masters.count({
        cpc: location,
        type_taxanomy: "WHT",
        prefix: "tray-master",
        sort_id: "Inuse",
      });
      count.readyToCharge = await masters.count({
        $or: [
          {
            cpc: location,
            type_taxanomy: "WHT",
            prefix: "tray-master",
            sort_id: "Closed",
          },
          {
            cpc: location,
            type_taxanomy: "WHT",
            prefix: "tray-master",
            sort_id: "Recharging",
          },
        ],
      });
      count.readyToBqc = await masters.count({
        cpc: location,
        type_taxanomy: "WHT",
        prefix: "tray-master",
        sort_id: "Ready to BQC",
      });
      count.readyToAudit = await masters.count({
        cpc: location,
        type_taxanomy: "WHT",
        prefix: "tray-master",
        sort_id: "Ready to Audit",
      });
      count.readyToRdlFls = await masters.count({
        cpc: location,
        type_taxanomy: "WHT",
        prefix: "tray-master",
        sort_id: "Ready to RDL",
      });
      count.readyToMerge = await masters.count({
        $or: [
          {
            cpc: location,
            prefix: "tray-master",
            type_taxanomy: "WHT",
            sort_id: "Inuse",
            items: { $ne: [] },
          },
          {
            cpc: location,
            prefix: "tray-master",
            type_taxanomy: "WHT",
            sort_id: "Audit Done Closed By Warehouse",
          },
        ],
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
        const forCount = await delivery.count({
          partner_shop: location,
          ctx_tray_id: { $exists: false },
        });
        resolve({ units: units, forCount: forCount });
      } else {
        const units = await delivery
          .find({ partner_shop: location, ctx_tray_id: { $exists: true } })
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
  closedBag: (location) => {
    return new Promise(async (resolve, reject) => {
      const bags = await masters.find({
        cpc: location,
        sort_id: "Closed",
        prefix: "bag-master",
      });
      resolve(bags);
    });
  },
  trayBasedOnStatus: (location, sortId, trayType) => {
    return new Promise(async (resolve, reject) => {
      if (trayType == "PMT" || trayType == "MMT" && sortId == "Open") {
        const tray = await masters.find({
          cpc: location,
          type_taxanomy: trayType,
          prefix: "tray-master",
          sort_id: { $ne: sortId },
        });
        resolve(tray);
      } else {
        const tray = await masters.find({
          cpc: location,
          type_taxanomy: trayType,
          prefix: "tray-master",
          sort_id: sortId,
        });
        resolve(tray);
      }
    });
  },
};
