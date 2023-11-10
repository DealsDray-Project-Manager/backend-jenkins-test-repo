const {
  partAndColor,
} = require("../../Model/Part-list-and-color/part-list-and-color");
const {
  rdl2OutputRequest,
} = require("../../Model/Rdl-2-output/rdl-2-output-request");
const { delivery } = require("../../Model/deliveryModel/delivery");
const { masters } = require("../../Model/mastersModel");
const { orders } = require("../../Model/ordersModel/ordersModel");
const {
  partInventoryLedger,
} = require("../../Model/part-inventory-ledger/part-inventory-ledger");
const { products } = require("../../Model/productModel/product");
const { unitsActionLog } = require("../../Model/units-log/units-action-log");
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
        InCharging: 0,
        inBqc: 0,
        inAudit: 0,
        inMergingWht: 0,
        inMergingMmt: 0,
        inRdlFls: 0,
        allDelivery: 0,
        recharging: 0,
        ctxTransferPendingToSales: 0,
        ctxTransferToSalesInProgress: 0,
        monthWisePurchase: 0,
        rdlOneDoneUnits: 0,
      };
      count.rdlOneDoneUnits = await delivery.count({
        partner_shop: location,
        rdl_fls_closed_date: { $exists: true },
      });
      count.monthWisePurchase = await delivery.count({
        partner_shop: location,
        temp_delivery_status: { $ne: "Pending" },
      });
      count.allOrders = await orders.count({
        partner_shop: location,
        order_status: "NEW",
      });
      count.allOrdersLastDate = await orders
        .findOne({ partner_shop: location, order_status: "NEW" })
        .sort({ order_date: -1 });
      count.notDeliveredOrders = await orders.count({
        partner_shop: location,
        order_status: "NEW",
        delivery_status: "Pending",
      });
      count.notDeliveredXxTray = await masters.count({
        cpc: location,
        prefix: "tray-master",
        sort_id: { $nin: ["Open", "No Status"] },
      });

      count.notDeliveredOrdersLastOrderDate = await orders
        .findOne({
          partner_shop: location,
          order_status: "NEW",
          delivery_status: "Pending",
        })
        .sort({ order_date: -1 });

      count.allDelivery = await delivery.count({
        partner_shop: location,
        temp_delivery_status: { $ne: "Pending" },
      });
      count.deliveredOrder = await masters.aggregate([
        {
          $match: {
            cpc: location,
            prefix: "tray-master",
            sort_id: { $nin: ["Open", "No Status"] },
            items: { $exists: true, $type: "array" },
          },
        },
        {
          $project: {
            itemCount: { $size: "$items" },
          },
        },
        {
          $group: {
            _id: null,
            totalItemCount: { $sum: "$itemCount" },
          },
        },
      ]);
      count.deliveredOrderOrderLastDate = await delivery
        .findOne({
          partner_shop: location,
        })
        .sort({ delivery_date: -1 });

      count.processingUnits = await delivery.count({
        $or: [
          {
            partner_shop: location,
            ctx_tray_id: { $exists: false },
            temp_delivery_status: { $ne: "Pending" },
            sales_bin_status: { $exists: false },
          },
        ],
      });
      count.processingUnitsLastDate = await delivery.aggregate([
        {
          $match: {
            partner_shop: location,
            temp_delivery_status: { $ne: "Pending" },
          },
        },
        {
          $project: {
            maxDate: {
              $max: ["$delivery_date", "$audit_done_close"],
            },
          },
        },
        {
          $sort: {
            maxDate: -1,
          },
        },
        {
          $limit: 1,
        },
      ]);

      count.readyForSale = await delivery.count({
        $or: [
          { partner_shop: location, ctx_tray_id: { $exists: true } },
          { partner_shop: location, sales_bin_status: "Sales Bin" },
        ],
      });
      count.readyForSaleLastAuditDate = await delivery
        .findOne({
          partner_shop: location,
          ctx_tray_id: { $exists: true },
        })
        .sort({ audit_done_close: -1 });
      count.closedBag = await masters.count({
        $or: [
          {
            cpc: location,
            sort_id: "Closed",
            prefix: "bag-master",
          },
          {
            cpc: location,
            sort_id: "Pre-closure",
            prefix: "bag-master",
          },
        ],
      });
      count.closedBagLastDeliveryDate = await masters.aggregate([
        {
          $match: {
            $or: [
              {
                cpc: location,
                sort_id: "Closed",
                prefix: "bag-master",
              },
              {
                cpc: location,
                sort_id: "Pre-closure",
                prefix: "bag-master",
              },
            ],
          },
        },
        {
          $unwind: "$items",
        },
        {
          $lookup: {
            from: "deliveries",
            localField: "items.order_id",
            foreignField: "order_id",
            as: "delivery",
          },
        },
        {
          $unwind: "$delivery",
        },
        {
          $group: {
            _id: null,
            maxDeliveryDate: { $max: "$delivery.delivery_date" },
          },
        },
      ]);
      count.ctxTransferToSalesInProgress = await masters.count({
        $or: [
          {
            cpc: location,
            type_taxanomy: "CT",
            prefix: "tray-master",
            sort_id: "Transfer Request sent to Warehouse",
          },
          {
            cpc: location,
            type_taxanomy: "CT",
            prefix: "tray-master",
            sort_id: "Transferred to Sales",
          },
        ],
      });
      count.ctxTransferToSalesInProgressItemCount = await masters.aggregate([
        {
          $match: {
            $or: [
              {
                cpc: location,
                type_taxanomy: "CT",
                prefix: "tray-master",
                sort_id: "Transfer Request sent to Warehouse",
                items: { $exists: true, $type: "array" },
              },
              {
                cpc: location,
                type_taxanomy: "CT",
                prefix: "tray-master",
                sort_id: "Transferred to Sales",
                items: { $exists: true, $type: "array" },
              },
            ],
          },
        },
        {
          $project: {
            itemCount: { $size: "$items" },
          },
        },
        {
          $group: {
            _id: null,
            totalItemCount: { $sum: "$itemCount" },
          },
        },
      ]);
      count.ctxTransferPendingToSales = await masters.count({
        cpc: location,
        sort_id: "Ready to Transfer to Sales",
        prefix: "tray-master",
        type_taxanomy: "CT",
      });
      count.ctxTransferPendingToSalesItemCount = await masters.aggregate([
        {
          $match: {
            cpc: location,
            sort_id: "Ready to Transfer to Sales",
            prefix: "tray-master",
            type_taxanomy: "CT",
            items: { $exists: true, $type: "array" },
          },
        },
        {
          $project: {
            itemCount: { $size: "$items" },
          },
        },
        {
          $group: {
            _id: null,
            totalItemCount: { $sum: "$itemCount" },
          },
        },
      ]);
      count.closedBagItemCount = await masters.aggregate([
        {
          $match: {
            $or: [
              {
                cpc: location,
                sort_id: "Closed",
                prefix: "bag-master",
                items: { $exists: true, $type: "array" },
              },
              {
                cpc: location,
                sort_id: "Pre-closure",
                prefix: "bag-master",
                items: { $exists: true, $type: "array" },
              },
            ],
          },
        },
        {
          $project: {
            itemCount: { $size: "$items" },
          },
        },
        {
          $group: {
            _id: null,
            totalItemCount: { $sum: "$itemCount" },
          },
        },
      ]);
      count.sortingPendingBot = await masters.count({
        cpc: location,
        type_taxanomy: "BOT",
        prefix: "tray-master",
        sort_id: "Closed By Warehouse",
      });
      count.sortingPendingBotItemsCount = await masters.aggregate([
        {
          $match: {
            cpc: location,
            type_taxanomy: "BOT",
            prefix: "tray-master",
            sort_id: "Closed By Warehouse",
            items: { $exists: true, $type: "array" },
          },
        },
        {
          $project: {
            itemCount: { $size: "$items" },
          },
        },
        {
          $group: {
            _id: null,
            totalItemCount: { $sum: "$itemCount" },
          },
        },
      ]);
      count.sortingPendingBotIDeliveryDate = await masters.aggregate([
        {
          $match: {
            cpc: location,
            type_taxanomy: "BOT",
            prefix: "tray-master",
            sort_id: "Closed By Warehouse",
          },
        },
        {
          $unwind: "$items",
        },
        {
          $lookup: {
            from: "deliveries",
            localField: "items.order_id",
            foreignField: "order_id",
            as: "delivery",
          },
        },
        {
          $unwind: "$delivery",
        },
        {
          $group: {
            _id: null,
            maxDeliveryDate: { $max: "$delivery.delivery_date" },
          },
        },
      ]);
      count.mmtTray = await masters.count({
        cpc: location,
        type_taxanomy: "MMT",
        prefix: "tray-master",
        sort_id: { $ne: "Open" },
      });
      count.mmtTrayItemCount = await masters.aggregate([
        {
          $match: {
            cpc: location,
            type_taxanomy: "MMT",
            prefix: "tray-master",
            sort_id: { $ne: "Open" },
            items: { $exists: true, $type: "array" },
          },
        },
        {
          $project: {
            itemCount: { $size: "$items" },
          },
        },
        {
          $group: {
            _id: null,
            totalItemCount: { $sum: "$itemCount" },
          },
        },
      ]);
      count.mmtTrayLastDeliveryDate = await masters.aggregate([
        {
          $match: {
            cpc: location,
            type_taxanomy: "MMT",
            prefix: "tray-master",
            sort_id: { $ne: "Open" },
          },
        },
        {
          $unwind: "$items",
        },
        {
          $lookup: {
            from: "deliveries",
            localField: "items.order_id",
            foreignField: "order_id",
            as: "delivery",
          },
        },
        {
          $unwind: "$delivery",
        },
        {
          $group: {
            _id: null,
            maxDeliveryDate: { $max: "$delivery.delivery_date" },
          },
        },
      ]);
      count.pmtTray = await masters.count({
        cpc: location,
        type_taxanomy: "PMT",
        prefix: "tray-master",
        sort_id: { $ne: "Open" },
      });
      count.pmtTrayCount = await masters.aggregate([
        {
          $match: {
            cpc: location,
            type_taxanomy: "PMT",
            prefix: "tray-master",
            sort_id: { $ne: "Open" },
            items: { $exists: true, $type: "array" },
          },
        },
        {
          $project: {
            itemCount: { $size: "$items" },
          },
        },
        {
          $group: {
            _id: null,
            totalItemCount: { $sum: "$itemCount" },
          },
        },
      ]);
      count.pmtTrayCountLastDeliveryDate = await masters.aggregate([
        {
          $match: {
            cpc: location,
            type_taxanomy: "PMT",
            prefix: "tray-master",
            sort_id: { $ne: "Open" },
          },
        },
        {
          $unwind: "$items",
        },
        {
          $lookup: {
            from: "deliveries",
            localField: "items.order_id",
            foreignField: "order_id",
            as: "delivery",
          },
        },
        {
          $unwind: "$delivery",
        },
        {
          $group: {
            _id: null,
            maxDeliveryDate: { $max: "$delivery.delivery_date" },
          },
        },
      ]);

      count.inuseWht = await masters.count({
        cpc: location,
        type_taxanomy: "WHT",
        prefix: "tray-master",
        sort_id: "Inuse",
      });
      count.inuseWhtItemCount = await masters.aggregate([
        {
          $match: {
            cpc: location,
            type_taxanomy: "WHT",
            prefix: "tray-master",
            sort_id: "Inuse",
          },
        },
        {
          $project: {
            itemCount: { $size: "$items" },
          },
        },
        {
          $group: {
            _id: null,
            totalItemCount: { $sum: "$itemCount" },
          },
        },
      ]);
      count.recharging = await masters.count({
        cpc: location,
        type_taxanomy: "WHT",
        prefix: "tray-master",
        sort_id: "Recharging",
      });
      count.rechargingItemCount = await masters.aggregate([
        {
          $match: {
            cpc: location,
            type_taxanomy: "WHT",
            prefix: "tray-master",
            sort_id: "Recharging",
            items: { $exists: true, $type: "array" },
          },
        },
        {
          $project: {
            itemCount: { $size: "$items" },
          },
        },
        {
          $group: {
            _id: null,
            totalItemCount: { $sum: "$itemCount" },
          },
        },
      ]);
      count.readyToCharge = await masters.count({
        cpc: location,
        type_taxanomy: "WHT",
        prefix: "tray-master",
        sort_id: "Closed",
      });
      count.readyToChargeItemCount = await masters.aggregate([
        {
          $match: {
            cpc: location,
            type_taxanomy: "WHT",
            prefix: "tray-master",
            sort_id: "Closed",
          },
        },
        {
          $project: {
            itemCount: { $size: "$items" },
          },
        },
        {
          $group: {
            _id: null,
            totalItemCount: { $sum: "$itemCount" },
          },
        },
      ]);
      count.readyToBqc = await masters.count({
        cpc: location,
        type_taxanomy: "WHT",
        prefix: "tray-master",
        sort_id: "Ready to BQC",
      });
      count.readyToBqcItemCount = await masters.aggregate([
        {
          $match: {
            cpc: location,
            type_taxanomy: "WHT",
            prefix: "tray-master",
            sort_id: "Ready to BQC",
            items: { $exists: true, $type: "array" },
          },
        },
        {
          $project: {
            itemCount: { $size: "$items" },
          },
        },
        {
          $group: {
            _id: null,
            totalItemCount: { $sum: "$itemCount" },
          },
        },
      ]);
      count.readyToAudit = await masters.count({
        cpc: location,
        type_taxanomy: "WHT",
        prefix: "tray-master",
        sort_id: "Ready to Audit",
      });
      count.readyToAuditItemCount = await masters.aggregate([
        {
          $match: {
            cpc: location,
            type_taxanomy: "WHT",
            prefix: "tray-master",
            sort_id: "Ready to Audit",
            items: { $exists: true, $type: "array" },
          },
        },
        {
          $project: {
            itemCount: { $size: "$items" },
          },
        },
        {
          $group: {
            _id: null,
            totalItemCount: { $sum: "$itemCount" },
          },
        },
      ]);
      count.readyToRdlFls = await masters.count({
        cpc: location,
        type_taxanomy: "WHT",
        prefix: "tray-master",
        sort_id: "Ready to RDL-1",
      });
      count.readyToRdlFlsItemCount = await masters.aggregate([
        {
          $match: {
            cpc: location,
            type_taxanomy: "WHT",
            prefix: "tray-master",
            sort_id: "Ready to RDL-1",
            items: { $exists: true, $type: "array" },
          },
        },
        {
          $project: {
            itemCount: { $size: "$items" },
          },
        },
        {
          $group: {
            _id: null,
            totalItemCount: { $sum: "$itemCount" },
          },
        },
      ]);
      count.inMergingMmt = await masters.count({
        cpc: location,
        type_taxanomy: "MMT",
        prefix: "tray-master",
        sort_id: "Issued to Merging",
      });
      count.inMergingMmtItemCount = await masters.aggregate([
        {
          $match: {
            cpc: location,
            type_taxanomy: "MMT",
            prefix: "tray-master",
            sort_id: "Issued to Merging",
            items: { $exists: true, $type: "array" },
          },
        },
        {
          $project: {
            itemCount: { $size: "$items" },
          },
        },
        {
          $group: {
            _id: null,
            totalItemCount: { $sum: "$itemCount" },
          },
        },
      ]);
      count.inMergingMmtLastDeliveryDate = await masters.aggregate([
        {
          $match: {
            cpc: location,
            type_taxanomy: "MMT",
            prefix: "tray-master",
            sort_id: "Issued to Merging",
          },
        },
        {
          $unwind: "$items",
        },
        {
          $lookup: {
            from: "deliveries",
            localField: "items.order_id",
            foreignField: "order_id",
            as: "delivery",
          },
        },
        {
          $unwind: "$delivery",
        },
        {
          $group: {
            _id: null,
            maxDeliveryDate: { $max: "$delivery.delivery_date" },
          },
        },
      ]);
      count.inMergingWht = await masters.count({
        $or: [
          {
            cpc: location,
            to_merge: { $ne: null },
            type_taxanomy: { $ne: "MMT" },
            sort_id: "Issued to Merging",
          },
          {
            cpc: location,
            to_merge: { $ne: null },
            sort_id: "Audit Done Issued to Merging",
          },
          {
            cpc: location,
            to_merge: { $ne: null },
            sort_id: "Ready to RDL-2 Issued to Merging",
          },
          {
            cpc: location,
            to_merge: { $ne: null },
            sort_id: "Ready to BQC Issued to Merging",
          },
        ],
      });
      count.inMergingWhtItemCount = await masters.aggregate([
        {
          $match: {
            $or: [
              {
                cpc: location,
                to_merge: { $ne: null },
                type_taxanomy: { $ne: "MMT" },
                sort_id: "Issued to Merging",
                items: { $exists: true, $type: "array" },
              },
              {
                cpc: location,
                to_merge: { $ne: null },
                sort_id: "Audit Done Issued to Merging",
                items: { $exists: true, $type: "array" },
              },
              {
                cpc: location,
                to_merge: { $ne: null },
                sort_id: "Ready to RDL-2 Issued to Merging",
                items: { $exists: true, $type: "array" },
              },
              {
                cpc: location,
                to_merge: { $ne: null },
                sort_id: "Ready to BQC Issued to Merging",
                items: { $exists: true, $type: "array" },
              },
            ],
          },
        },
        {
          $project: {
            itemCount: { $size: "$items" },
          },
        },
        {
          $group: {
            _id: null,
            totalItemCount: { $sum: "$itemCount" },
          },
        },
      ]);
      count.InCharging = await masters.count({
        cpc: location,
        type_taxanomy: "WHT",
        prefix: "tray-master",
        sort_id: "Issued to Charging",
      });
      count.InChargingItemCount = await masters.aggregate([
        {
          $match: {
            cpc: location,
            type_taxanomy: "WHT",
            prefix: "tray-master",
            sort_id: "Issued to Charging",
            items: { $exists: true, $type: "array" },
          },
        },
        {
          $project: {
            itemCount: { $size: "$items" },
          },
        },
        {
          $group: {
            _id: null,
            totalItemCount: { $sum: "$itemCount" },
          },
        },
      ]);
      count.inAudit = await masters.count({
        cpc: location,
        type_taxanomy: "WHT",
        prefix: "tray-master",
        sort_id: "Issued to Audit",
      });
      count.inAuditItemCount = await masters.aggregate([
        {
          $match: {
            cpc: location,
            type_taxanomy: "WHT",
            prefix: "tray-master",
            sort_id: "Issued to Audit",
          },
        },
        {
          $project: {
            itemCount: { $size: "$items" },
          },
        },
        {
          $group: {
            _id: null,
            totalItemCount: { $sum: "$itemCount" },
          },
        },
      ]);
      count.inBqc = await masters.count({
        $or: [
          {
            cpc: location,
            type_taxanomy: "WHT",
            prefix: "tray-master",
            sort_id: "Issued to BQC",
          },
          {
            cpc: location,
            type_taxanomy: "WHT",
            prefix: "tray-master",
            sort_id: "BQC work inprogress",
          },
        ],
      });
      count.inBqcItemCount = await masters.aggregate([
        {
          $match: {
            $or: [
              {
                cpc: location,
                type_taxanomy: "WHT",
                prefix: "tray-master",
                sort_id: "Issued to BQC",
                items: { $exists: true, $type: "array" },
              },
              {
                cpc: location,
                type_taxanomy: "WHT",
                prefix: "tray-master",
                sort_id: "BQC work inprogress",
                items: { $exists: true, $type: "array" },
              },
            ],
          },
        },
        {
          $project: {
            itemCount: { $size: "$actual_items" },
          },
        },
        {
          $group: {
            _id: null,
            totalItemCount: { $sum: "$itemCount" },
          },
        },
      ]);
      count.inRdlFls = await masters.count({
        cpc: location,
        type_taxanomy: "WHT",
        prefix: "tray-master",
        sort_id: "Issued to RDL-1",
      });
      count.inRdlFlsItemCount = await masters.aggregate([
        {
          $match: {
            cpc: location,
            type_taxanomy: "WHT",
            prefix: "tray-master",
            sort_id: "Issued to RDL-1",
          },
        },
        {
          $project: {
            itemCount: { $size: "$items" },
          },
        },
        {
          $group: {
            _id: null,
            totalItemCount: { $sum: "$itemCount" },
          },
        },
      ]);
      count.readyToMerge = await masters.count({
        $or: [
          {
            cpc: location,
            prefix: "tray-master",
            type_taxanomy: "WHT",
            sort_id: "Inuse",
            items: {
              $ne: [],
              $exists: true,
            },
          },
          {
            cpc: location,
            prefix: "tray-master",
            type_taxanomy: "WHT",
            sort_id: "Audit Done Closed By Warehouse",
          },
          {
            cpc: location,
            prefix: "tray-master",
            type_taxanomy: "WHT",
            $expr: {
              $and: [
                { $ne: [{ $ifNull: ["$items", null] }, null] },
                { $ne: [{ $size: "$items" }, { $toInt: "$limit" }] },
              ],
            },
            sort_id: "Ready to RDL-2",
          },
          {
            cpc: location,
            prefix: "tray-master",
            type_taxanomy: "WHT",
            $expr: {
              $and: [
                { $ne: [{ $ifNull: ["$items", null] }, null] },
                { $ne: [{ $size: "$items" }, { $toInt: "$limit" }] },
              ],
            },
            sort_id: "Ready to BQC",
          },
          {
            cpc: location,
            prefix: "tray-master",
            type_taxanomy: "WHT",
            $expr: {
              $and: [
                { $ne: [{ $ifNull: ["$items", null] }, null] },
                { $ne: [{ $size: "$items" }, { $toInt: "$limit" }] },
              ],
            },
            sort_id: "Ready to Audit",
          },
        ],
      });
      count.readyToMergeItemCount = await masters.aggregate([
        {
          $match: {
            $or: [
              {
                cpc: location,
                prefix: "tray-master",
                type_taxanomy: "WHT",
                sort_id: "Inuse",
                items: {
                  $ne: [],
                  $exists: true,
                },
              },
              {
                cpc: location,
                prefix: "tray-master",
                type_taxanomy: "WHT",
                sort_id: "Audit Done Closed By Warehouse",
              },
              {
                cpc: location,
                prefix: "tray-master",
                type_taxanomy: "WHT",
                $expr: {
                  $and: [
                    { $ne: [{ $ifNull: ["$items", null] }, null] },
                    { $ne: [{ $size: "$items" }, { $toInt: "$limit" }] },
                  ],
                },
                sort_id: "Ready to RDL-2",
              },
              {
                cpc: location,
                prefix: "tray-master",
                type_taxanomy: "WHT",
                $expr: {
                  $and: [
                    { $ne: [{ $ifNull: ["$items", null] }, null] },
                    { $ne: [{ $size: "$items" }, { $toInt: "$limit" }] },
                  ],
                },
                sort_id: "Ready to BQC",
              },
            ],
          },
        },
        {
          $project: {
            itemCount: { $size: "$items" },
          },
        },
        {
          $group: {
            _id: null,
            totalItemCount: { $sum: "$itemCount" },
          },
        },
      ]);
      if (count) {
        resolve(count);
      }
    });
  },
  getUnitsCond: (location, limit, skip, screen) => {
    return new Promise(async (resolve, reject) => {
      if (screen == "Processing-units") {
        const units = await delivery
          .find({
            partner_shop: location,
            ctx_tray_id: { $exists: false },
            temp_delivery_status: { $ne: "Pending" },
            sales_bin_status: { $exists: false },
          })
          .limit(limit)
          .skip(skip);
        const forCount = await delivery.count({
          partner_shop: location,
          ctx_tray_id: { $exists: false },
          temp_delivery_status: { $ne: "Pending" },
          sales_bin_status: { $exists: false },
        });
        resolve({ units: units, forCount: forCount });
      } else {
        const units = await delivery
          .find({
            $or: [
              { partner_shop: location, ctx_tray_id: { $exists: true } },
              { partner_shop: location, sales_bin_status: "Sales Bin" },
            ],
          })
          .limit(limit)
          .skip(skip);
        const forCount = await delivery.count({
          $or: [
            { partner_shop: location, ctx_tray_id: { $exists: true } },
            { partner_shop: location, sales_bin_status: "Sales Bin" },
          ],
        });
        resolve({ units: units, forCount: forCount });
      }
    });
  },
  closedBag: (location) => {
    return new Promise(async (resolve, reject) => {
      const bags = await masters.find({
        $or: [
          {
            cpc: location,
            sort_id: "Closed",
            prefix: "bag-master",
          },
          {
            cpc: location,
            sort_id: "Pre-closure",
            prefix: "bag-master",
          },
        ],
      });
      resolve(bags);
    });
  },
  trayBasedOnStatus: (location, sortId, trayType) => {
    return new Promise(async (resolve, reject) => {
      if (trayType == "PMT" || (trayType == "MMT" && sortId == "Open")) {
        const tray = await masters.find({
          cpc: location,
          type_taxanomy: trayType,
          prefix: "tray-master",
          sort_id: { $ne: sortId },
        });
        resolve(tray);
      } else if (sortId == "Transfer Request sent to Warehouse") {
        const tray = await masters.find({
          $or: [
            {
              cpc: location,
              type_taxanomy: trayType,
              prefix: "tray-master",
              sort_id: "Transfer Request sent to Warehouse",
            },
            {
              cpc: location,
              type_taxanomy: trayType,
              prefix: "tray-master",
              sort_id: "Transferred to Sales",
            },
          ],
        });
        resolve(tray);
      } else if (sortId == "For All Tray") {
        const tray = await masters.find({
          cpc: location,
          prefix: "tray-master",
          sort_id: { $nin: ["Open", "No Status"] },
        });
        resolve(tray);
      } else if (sortId == "Issued to BQC") {
        const tray = await masters.find({
          $or: [
            {
              cpc: location,
              type_taxanomy: "WHT",
              prefix: "tray-master",
              sort_id: "Issued to BQC",
            },
            {
              cpc: location,
              type_taxanomy: "WHT",
              prefix: "tray-master",
              sort_id: "BQC work inprogress",
            },
          ],
        });
        resolve(tray);
      } else if (sortId == "Issued to Merging" && trayType == "WHT") {
        const tray = await masters.find({
          $or: [
            {
              cpc: location,
              to_merge: { $ne: null },
              type_taxanomy: "WHT",
              sort_id: "Issued to Merging",
            },
            {
              cpc: location,
              to_merge: { $ne: null },
              sort_id: "Audit Done Issued to Merging",
            },
            {
              cpc: location,
              to_merge: { $ne: null },
              sort_id: "Ready to RDL-2 Issued to Merging",
            },
            {
              cpc: location,
              to_merge: { $ne: null },
              sort_id: "Ready to BQC Issued to Merging",
            },
          ],
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
  getDeliveryForReport: (location, limit, skip) => {
    return new Promise(async (resolve, reject) => {
      const deliveryData = await delivery
        .find({
          partner_shop: location,
          temp_delivery_status: { $ne: "Pending" },
        })
        .skip(skip)
        .limit(limit);
      const count = await delivery.count({
        partner_shop: location,
        temp_delivery_status: { $ne: "Pending" },
      });
      resolve({ deliveryData: deliveryData, count: count });
    });
  },
  deliveredItemFilter: (
    brand,
    model,
    location,
    fromDate,
    toDate,
    limit,
    skip,
    totalCount
  ) => {
    return new Promise(async (resolve, reject) => {
      try {
        let getDelivery;
        let dataFourAvgPrice;
        let count = 0;
        if (brand == undefined && model == undefined) {
          const fromDateISO = new Date(fromDate).toISOString();
          const toDateISO = new Date(toDate).toISOString();
          getDelivery = await delivery
            .find({
              partner_shop: location,
              delivery_date: { $gte: fromDateISO, $lte: toDateISO },
            })
            .skip(skip)
            .limit(limit);
          count = await delivery.count({
            partner_shop: location,
            delivery_date: { $gte: fromDateISO, $lte: toDateISO },
          });
          dataFourAvgPrice = await delivery.find({
            partner_shop: location,
            delivery_date: { $gte: fromDateISO, $lte: toDateISO },
          });
        } else if (fromDate == undefined && toDate == undefined) {
          const getProduct = await products.findOne({
            brand_name: brand,
            model_name: model,
          });
          getDelivery = await delivery
            .find({
              item_id: getProduct.vendor_sku_id,
              partner_shop: location,
            })
            .skip(skip)
            .limit(limit);
          count = await delivery.count({
            item_id: getProduct.vendor_sku_id,
            partner_shop: location,
          });
          dataFourAvgPrice = await delivery.find({
            item_id: getProduct.vendor_sku_id,
            partner_shop: location,
          });
        } else {
          const fromDateISO = new Date(fromDate).toISOString();
          const toDateISO = new Date(toDate).toISOString();
          const getProduct = await products.findOne({
            brand_name: brand,
            model_name: model,
          });
          getDelivery = await delivery
            .find({
              item_id: getProduct.vendor_sku_id,
              partner_shop: location,
              delivery_date: { $gte: fromDateISO, $lte: toDateISO },
            })
            .skip(skip)
            .limit(limit);
          count = await delivery.count({
            item_id: getProduct.vendor_sku_id,
            partner_shop: location,
            delivery_date: { $gte: fromDateISO, $lte: toDateISO },
          });
          dataFourAvgPrice = await delivery.find({
            item_id: getProduct.vendor_sku_id,
            partner_shop: location,
            delivery_date: { $gte: fromDateISO, $lte: toDateISO },
          });
        }
        let totalPrice = 0;
        for (let x of dataFourAvgPrice) {
          if (x.partner_purchase_price !== undefined) {
            totalPrice = totalPrice + Number(x.partner_purchase_price);
          }
        }
        let avgPrice = totalPrice / dataFourAvgPrice?.length;
        if (isNaN(avgPrice)) {
          avgPrice = 0;
        }
        resolve({
          getDelivery: getDelivery,
          avgPrice: avgPrice,
          count: count,
          forXlsxDownload: dataFourAvgPrice,
        });
      } catch (err) {
        reject(err);
      }
    });
  },
  getUnverifiedImeiReport: (location, limit, skip) => {
    return new Promise(async (resolve, reject) => {
      const findUnverifiedImei = await delivery
        .find({
          partner_shop: location,
          unverified_imei_status: "Unverified",
        })
        .skip(skip)
        .limit(limit);
      const count = await delivery.count({
        partner_shop: location,
        unverified_imei_status: "Unverified",
      });
      resolve({ unverifiedImei: findUnverifiedImei, count: count });
    });
  },
  allOrdersReportItemFilter: (
    location,
    fromDate,
    toDate,
    limit,
    skip,
    type
  ) => {
    return new Promise(async (resolve, reject) => {
      const fromDateTimestamp = Date.parse(fromDate);
      const toDateTimestamp = Date.parse(toDate);
      let allOrdersReport = await orders.aggregate([
        {
          $match: {
            order_status: "NEW",
            partner_shop: location,
            order_date: {
              $gte: new Date(fromDateTimestamp),
              $lte: new Date(toDateTimestamp),
            },
          },
        },
        {
          $lookup: {
            from: "products",
            localField: `item_id`,
            foreignField: "vendor_sku_id",
            as: "products",
          },
        },
        {
          $facet: {
            results: [{ $skip: skip }, { $limit: limit }],
            count: [{ $count: "count" }],
          },
        },
      ]);

      let forXlsxDownload = await orders.aggregate([
        {
          $match: {
            partner_shop: location,
            order_status: "NEW",
            order_date: {
              $gte: new Date(fromDateTimestamp),
              $lte: new Date(toDateTimestamp),
            },
          },
        },
        {
          $lookup: {
            from: "products",
            localField: `item_id`,
            foreignField: "vendor_sku_id",
            as: "products",
          },
        },
      ]);
      resolve({
        getCount: allOrdersReport[0]?.count[0]?.count,
        allOrdersReport: allOrdersReport[0]?.results,
        forXlsxDownload: forXlsxDownload,
      });
    });
  },

  monthWiseReportItemFilter: (
    location,
    fromDate,
    toDate,
    limit,
    skip,
    type
  ) => {
    return new Promise(async (resolve, reject) => {
      let monthWiseReport, getCount, forXlsxDownload;
      if (type == "Order Date") {
        const fromDateTimestamp = Date.parse(fromDate);
        const toDateTimestamp = Date.parse(toDate);
        let monthWiseReport = await orders.aggregate([
          {
            $match: {
              delivery_status: "Delivered",
              partner_shop: location,
              order_date: {
                $gte: new Date(fromDateTimestamp),
                $lte: new Date(toDateTimestamp),
              },
            },
          },
          {
            $lookup: {
              from: "deliveries",
              localField: "order_id",
              foreignField: "order_id",
              as: "delivery",
            },
          },
          {
            $facet: {
              results: [{ $skip: skip }, { $limit: limit }],
              count: [{ $count: "count" }],
            },
          },
        ]);

        let forXlsxDownload = await orders.aggregate([
          {
            $match: {
              partner_shop: location,
              delivery_status: "Delivered",
              order_date: {
                $gte: new Date(fromDateTimestamp),
                $lte: new Date(toDateTimestamp),
              },
            },
          },
          {
            $lookup: {
              from: "deliveries",
              localField: "order_id",
              foreignField: "order_id",
              as: "delivery",
            },
          },
        ]);

        let arrLimit = [];
        for (let x of monthWiseReport?.[0].results) {
          arrLimit.push(...x.delivery);
        }
        let arrWithoutLimit = [];
        for (let y of forXlsxDownload) {
          arrWithoutLimit.push(...y.delivery);
        }
        resolve({
          getCount: arrWithoutLimit.length,
          monthWiseReport: arrLimit,
          forXlsxDownload: arrWithoutLimit,
        });
      } else {
        const fromDateISO = new Date(fromDate).toISOString();
        const toDateISO = new Date(toDate).toISOString();
        monthWiseReport = await delivery
          .find({
            partner_shop: location,
            delivery_date: { $gte: fromDateISO, $lte: toDateISO },
          })
          .limit(limit)
          .skip(skip);
        getCount = await delivery.count({
          partner_shop: location,
          delivery_date: { $gte: fromDateISO, $lte: toDateISO },
        });
        forXlsxDownload = await delivery.find({
          partner_shop: location,
          delivery_date: { $gte: fromDateISO, $lte: toDateISO },
        });
      }
      resolve({
        monthWiseReport: monthWiseReport,
        forXlsxDownload: forXlsxDownload,
        getCount: getCount,
      });
    });
  },
  unVerifiedReportItemFilter: (
    location,
    fromDate,
    toDate,
    limit,
    skip,
    type
  ) => {
    return new Promise(async (resolve, reject) => {
      let monthWiseReport, getCount, forXlsxDownload;
      if (type == "Order Date") {
        const fromDateTimestamp = Date.parse(fromDate);
        const toDateTimestamp = Date.parse(toDate);
        let monthWiseReport = await orders.aggregate([
          {
            $match: {
              delivery_status: "Delivered",
              partner_shop: location,
              imei_verification_status: "Unverified",
              order_date: {
                $gte: new Date(fromDateTimestamp),
                $lte: new Date(toDateTimestamp),
              },
            },
          },
          {
            $lookup: {
              from: "deliveries",
              localField: "order_id",
              foreignField: "order_id",
              as: "delivery",
            },
          },
          {
            $facet: {
              results: [{ $skip: skip }, { $limit: limit }],
              count: [{ $count: "count" }],
            },
          },
        ]);

        let forXlsxDownload = await orders.aggregate([
          {
            $match: {
              partner_shop: location,
              delivery_status: "Delivered",
              imei_verification_status: "Unverified",
              order_date: {
                $gte: new Date(fromDateTimestamp),
                $lte: new Date(toDateTimestamp),
              },
            },
          },
          {
            $lookup: {
              from: "deliveries",
              localField: "order_id",
              foreignField: "order_id",
              as: "delivery",
            },
          },
        ]);
        let arrLimit = [];
        for (let x of monthWiseReport?.[0].results) {
          arrLimit.push(...x.delivery);
        }
        let arrWithoutLimit = [];
        for (let y of forXlsxDownload) {
          arrWithoutLimit.push(...y.delivery);
        }
        resolve({
          getCount: arrWithoutLimit.length,
          monthWiseReport: arrLimit,
          forXlsxDownload: arrWithoutLimit,
        });
      } else {
        const fromDateISO = new Date(fromDate).toISOString();
        const toDateISO = new Date(toDate).toISOString();
        monthWiseReport = await delivery
          .find({
            partner_shop: location,
            unverified_imei_status: "Unverified",
            delivery_date: { $gte: fromDateISO, $lte: toDateISO },
          })
          .limit(limit)
          .skip(skip);
        getCount = await delivery.count({
          partner_shop: location,
          unverified_imei_status: "Unverified",
          delivery_date: { $gte: fromDateISO, $lte: toDateISO },
        });
        forXlsxDownload = await delivery.find({
          partner_shop: location,
          unverified_imei_status: "Unverified",
          delivery_date: { $gte: fromDateISO, $lte: toDateISO },
        });
      }
      resolve({
        monthWiseReport: monthWiseReport,
        forXlsxDownload: forXlsxDownload,
        getCount: getCount,
      });
    });
  },
  getOrdersOrderDateWaise: (location, limit, skip) => {
    return new Promise(async (resolve, reject) => {
      let allOrders = await orders.aggregate([
        { $match: { partner_shop: location, order_status: "NEW" } },
        {
          $lookup: {
            from: "products",
            localField: `item_id`,
            foreignField: "vendor_sku_id",
            as: "products",
          },
        },
        { $sort: { order_date: -1 } },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
      ]);
      if (allOrders) {
        resolve(allOrders);
      }
    });
  },
  allOrderlastOrderDate: (location) => {
    return new Promise(async (resolve, reject) => {
      let lasteOrderDate = await orders
        .find({
          partner_shop: location,
        })
        .sort({ order_date: -1 })
        .limit(1);
      resolve(lasteOrderDate);
    });
  },
  getDeliveredOrders: (location, limit, skip) => {
    return new Promise(async (resolve, reject) => {
      let data = await orders.aggregate([
        {
          $match: {
            partner_shop: location,
            delivery_status: "Delivered",
          },
        },
        {
          $lookup: {
            from: "deliveries",
            localField: "order_id",
            foreignField: "order_id",
            as: "delivery",
          },
        },
        {
          $sort: { order_date: -1 },
        },
        {
          $unwind: "$delivery",
        },

        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
      ]);
      let count = await orders.count({
        partner_shop: location,
        delivery_status: "Delivered",
      });
      resolve({ data: data, count: count });
    });
  },
  notDeliveredOrders: (location, limit, skip) => {
    return new Promise(async (resolve, reject) => {
      let data = await orders
        .find({
          partner_shop: location,
          order_status: "NEW",
          delivery_status: "Pending",
        })
        .sort({ order_date: -1 })
        .limit(limit)
        .skip(skip);
      let count = await orders.count({
        partner_shop: location,
        order_status: "NEW",
        delivery_status: "Pending",
      });
      resolve({ data: data, count: count });
    });
  },
  searchProcessing: (searchType, value, location, limit, skip, page) => {
    return new Promise(async (resolve, reject) => {
      let allOrders;
      if (searchType == "order_id") {
        allOrders = await delivery.aggregate([
          {
            $match: {
              partner_shop: location,
              temp_delivery_status: { $ne: "Pending" },
              sales_bin_status: { $exists: false },
              order_id: { $regex: "^" + value + ".*", $options: "i" },
            },
          },

          {
            $lookup: {
              from: "orders",
              let: {
                order_id: "$order_id",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        {
                          $eq: ["$order_status", "NEW"],
                        },
                        {
                          $eq: ["$order_id", "$$order_id"],
                        },
                      ],
                    },
                  },
                },
              ],
              as: "result",
            },
          },
          {
            $facet: {
              results: [{ $skip: skip }, { $limit: limit }],
              count: [{ $count: "count" }],
            },
          },
        ]);
      } else if (searchType == "tracking_id") {
        allOrders = await delivery.aggregate([
          {
            $match: {
              partner_shop: location,
              temp_delivery_status: { $ne: "Pending" },
              sales_bin_status: { $exists: false },
              tracking_id: { $regex: ".*" + value + ".*", $options: "i" },
            },
          },
          {
            $lookup: {
              from: "orders",
              let: {
                order_id: "$order_id",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        {
                          $eq: ["$order_status", "NEW"],
                        },
                        {
                          $eq: ["$order_id", "$$order_id"],
                        },
                      ],
                    },
                  },
                },
              ],
              as: "result",
            },
          },
          {
            $facet: {
              results: [{ $skip: skip }, { $limit: limit }],
              count: [{ $count: "count" }],
            },
          },
        ]);
      } else if (searchType == "imei") {
        allOrders = await delivery.aggregate([
          {
            $match: {
              partner_shop: location,
              temp_delivery_status: { $ne: "Pending" },
              sales_bin_status: { $exists: false },
              imei: { $regex: ".*" + value + ".*", $options: "i" },
            },
          },
          {
            $lookup: {
              from: "orders",
              let: {
                order_id: "$order_id",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        {
                          $eq: ["$order_status", "NEW"],
                        },
                        {
                          $eq: ["$order_id", "$$order_id"],
                        },
                      ],
                    },
                  },
                },
              ],
              as: "result",
            },
          },
          {
            $facet: {
              results: [{ $skip: skip }, { $limit: limit }],
              count: [{ $count: "count" }],
            },
          },
        ]);
      } else if (searchType == "UIC") {
        allOrders = await delivery.aggregate([
          {
            $match: {
              partner_shop: location,
              temp_delivery_status: { $ne: "Pending" },
              sales_bin_status: { $exists: false },
              "uic_code.code": { $regex: "^" + value + ".*", $options: "i" },
            },
          },
          {
            $lookup: {
              from: "orders",
              let: {
                order_id: "$order_id",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        {
                          $eq: ["$order_status", "NEW"],
                        },
                        {
                          $eq: ["$order_id", "$$order_id"],
                        },
                      ],
                    },
                  },
                },
              ],
              as: "result",
            },
          },
          {
            $facet: {
              results: [{ $skip: skip }, { $limit: limit }],
              count: [{ $count: "count" }],
            },
          },
        ]);
      } else if (searchType == "item_id") {
        allOrders = await delivery.aggregate([
          {
            $match: {
              partner_shop: location,
              temp_delivery_status: { $ne: "Pending" },
              sales_bin_status: { $exists: false },
              item_id: { $regex: "^" + value + ".*", $options: "i" },
            },
          },
          {
            $lookup: {
              from: "orders",
              let: {
                order_id: "$order_id",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        {
                          $eq: ["$order_status", "NEW"],
                        },
                        {
                          $eq: ["$order_id", "$$order_id"],
                        },
                      ],
                    },
                  },
                },
              ],
              as: "result",
            },
          },
          {
            $facet: {
              results: [{ $skip: skip }, { $limit: limit }],
              count: [{ $count: "count" }],
            },
          },
        ]);
      }
      if (allOrders) {
        const count = allOrders[0]?.count[0]?.count;
        const deliveryData = allOrders[0]?.results;
        resolve({ count: count, deliveryData: deliveryData });
      }
    });
  },
  SearchSales: (searchType, value, location, limit, skip, page) => {
    return new Promise(async (resolve, reject) => {
      let allOrders;
      if (searchType == "order_id") {
        allOrders = await delivery.aggregate([
          {
            $match: {
              $or: [
                {
                  partner_shop: location,
                  ctx_tray_id: { $exists: true },
                  order_id: { $regex: "^" + value + ".*", $options: "i" },
                },
                {
                  partner_shop: location,
                  sales_bin_status: "Sales Bin",
                  order_id: { $regex: "^" + value + ".*", $options: "i" },
                },
              ],
            },
          },

          {
            $lookup: {
              from: "orders",
              let: {
                order_id: "$order_id",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        {
                          $eq: ["$order_status", "NEW"],
                        },
                        {
                          $eq: ["$order_id", "$$order_id"],
                        },
                      ],
                    },
                  },
                },
              ],
              as: "result",
            },
          },
          {
            $facet: {
              results: [{ $skip: skip }, { $limit: limit }],
              count: [{ $count: "count" }],
            },
          },
        ]);
      } else if (searchType == "tracking_id") {
        allOrders = await delivery.aggregate([
          {
            $match: {
              $or: [
                {
                  partner_shop: location,
                  ctx_tray_id: { $exists: true },
                  tracking_id: { $regex: ".*" + value + ".*", $options: "i" },
                },
                {
                  partner_shop: location,
                  sales_bin_status: "Sales Bin",
                  tracking_id: { $regex: ".*" + value + ".*", $options: "i" },
                },
              ],
            },
          },
          {
            $lookup: {
              from: "orders",
              let: {
                order_id: "$order_id",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        {
                          $eq: ["$order_status", "NEW"],
                        },
                        {
                          $eq: ["$order_id", "$$order_id"],
                        },
                      ],
                    },
                  },
                },
              ],
              as: "result",
            },
          },
          {
            $facet: {
              results: [{ $skip: skip }, { $limit: limit }],
              count: [{ $count: "count" }],
            },
          },
        ]);
      } else if (searchType == "imei") {
        allOrders = await delivery.aggregate([
          {
            $match: {
              $or: [
                {
                  partner_shop: location,
                  ctx_tray_id: { $exists: true },
                  imei: { $regex: ".*" + value + ".*", $options: "i" },
                },
                {
                  partner_shop: location,
                  sales_bin_status: "Sales Bin",
                  imei: { $regex: ".*" + value + ".*", $options: "i" },
                },
              ],
            },
          },
          {
            $lookup: {
              from: "orders",
              let: {
                order_id: "$order_id",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        {
                          $eq: ["$order_status", "NEW"],
                        },
                        {
                          $eq: ["$order_id", "$$order_id"],
                        },
                      ],
                    },
                  },
                },
              ],
              as: "result",
            },
          },
          {
            $facet: {
              results: [{ $skip: skip }, { $limit: limit }],
              count: [{ $count: "count" }],
            },
          },
        ]);
      } else if (searchType == "UIC") {
        allOrders = await delivery.aggregate([
          {
            $match: {
              $or: [
                {
                  partner_shop: location,
                  ctx_tray_id: { $exists: true },
                  "uic_code.code": {
                    $regex: "^" + value + ".*",
                    $options: "i",
                  },
                },
                {
                  partner_shop: location,
                  sales_bin_status: "Sales Bin",
                  "uic_code.code": {
                    $regex: "^" + value + ".*",
                    $options: "i",
                  },
                },
              ],
            },
          },
          {
            $lookup: {
              from: "orders",
              let: {
                order_id: "$order_id",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        {
                          $eq: ["$order_status", "NEW"],
                        },
                        {
                          $eq: ["$order_id", "$$order_id"],
                        },
                      ],
                    },
                  },
                },
              ],
              as: "result",
            },
          },
          {
            $facet: {
              results: [{ $skip: skip }, { $limit: limit }],
              count: [{ $count: "count" }],
            },
          },
        ]);
      } else if (searchType == "item_id") {
        allOrders = await delivery.aggregate([
          {
            $match: {
              $or: [
                {
                  partner_shop: location,
                  ctx_tray_id: { $exists: true },
                  item_id: { $regex: "^" + value + ".*", $options: "i" },
                },
                {
                  partner_shop: location,
                  sales_bin_status: "Sales Bin",
                  item_id: { $regex: "^" + value + ".*", $options: "i" },
                },
              ],
            },
          },
          {
            $lookup: {
              from: "orders",
              let: {
                order_id: "$order_id",
              },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        {
                          $eq: ["$order_status", "NEW"],
                        },
                        {
                          $eq: ["$order_id", "$$order_id"],
                        },
                      ],
                    },
                  },
                },
              ],
              as: "result",
            },
          },
          {
            $facet: {
              results: [{ $skip: skip }, { $limit: limit }],
              count: [{ $count: "count" }],
            },
          },
        ]);
      }
      if (allOrders) {
        const count = allOrders[0]?.count[0]?.count;
        const deliveryData = allOrders[0]?.results;
        resolve({ count: count, deliveryData: deliveryData });
      }
    });
  },
  reportPageSort: (location, limit, skip, type, sortFormate) => {
    return new Promise(async (resolve, reject) => {
      let deliveryData = [];
      if (type == "order_id") {
        deliveryData = await delivery
          .find({
            partner_shop: location,
            temp_delivery_status: { $ne: "Pending" },
          })
          .sort({ order_id: sortFormate })
          .skip(skip)
          .limit(limit);
      } else if (type == "tracking_id") {
        deliveryData = await delivery
          .find({
            partner_shop: location,
            temp_delivery_status: { $ne: "Pending" },
          })
          .sort({ tracking_id: sortFormate })
          .skip(skip)
          .limit(limit);
      } else if (type == "model_name") {
        deliveryData = await delivery
          .find({
            partner_shop: location,
            temp_delivery_status: { $ne: "Pending" },
          })
          .sort({ old_item_details: sortFormate })
          .skip(skip)
          .limit(limit);
      } else if (type == "imei") {
        deliveryData = await delivery
          .find({
            partner_shop: location,
            temp_delivery_status: { $ne: "Pending" },
          })
          .sort({ imei: sortFormate })
          .skip(skip)
          .limit(limit);
      } else if (type == "sku_name") {
        deliveryData = await delivery
          .find({
            partner_shop: location,
            temp_delivery_status: { $ne: "Pending" },
          })
          .sort({ item_id: sortFormate })
          .skip(skip)
          .limit(limit);
      } else if (type == "bot_remark") {
        deliveryData = await delivery
          .find({
            partner_shop: location,
            temp_delivery_status: { $ne: "Pending" },
          })
          .sort({ "bot_report.body_damage_des": sortFormate })
          .skip(skip)
          .limit(limit);
      } else if (type == "type") {
        deliveryData = await delivery
          .find({
            partner_shop: location,
            temp_delivery_status: { $ne: "Pending" },
          })
          .sort({ tray_type: sortFormate })
          .skip(skip)
          .limit(limit);
      } else if (type == "uic") {
        deliveryData = await delivery
          .find({
            partner_shop: location,
            temp_delivery_status: { $ne: "Pending" },
          })
          .sort({ "uic_code.code": sortFormate })
          .skip(skip)
          .limit(limit);
      } else if (type == "price") {
        deliveryData = await delivery
          .find({
            partner_shop: location,
            temp_delivery_status: { $ne: "Pending" },
          })
          .sort({ partner_purchase_price: sortFormate })
          .skip(skip)
          .limit(limit);
      } else if (type == "order_date") {
        deliveryData = await delivery
          .find({
            partner_shop: location,
            temp_delivery_status: { $ne: "Pending" },
          })
          .sort({ order_date: sortFormate })
          .skip(skip)
          .limit(limit);
      } else if (type == "location") {
        deliveryData = await delivery
          .find({
            partner_shop: location,
            temp_delivery_status: { $ne: "Pending" },
          })
          .sort({ partner_shop: sortFormate })
          .skip(skip)
          .limit(limit);
      } else if (type == "delivery_date") {
        deliveryData = await delivery
          .find({
            partner_shop: location,
            temp_delivery_status: { $ne: "Pending" },
          })
          .sort({ delivery_date: sortFormate })
          .skip(skip)
          .limit(limit);
      } else if (type == "packet_open_date") {
        deliveryData = await delivery
          .find({
            partner_shop: location,
            temp_delivery_status: { $ne: "Pending" },
          })
          .sort({ assign_to_agent: sortFormate })
          .skip(skip)
          .limit(limit);
      }
      resolve(deliveryData);
    });
  },
  rdlOneDoneUnits: (location, limit, skip) => {
    return new Promise(async (resolve, reject) => {
      const getUnits = await delivery
        .find({
          partner_shop: location,
          rdl_fls_closed_date: { $exists: true },
        })
        .skip(skip)
        .limit(limit);
      const count = await delivery.count({
        partner_shop: location,
        rdl_fls_closed_date: { $exists: true },
      });
      resolve({ units: getUnits, count: count });
    });
  },
  findItemBasedOnInput: (searchInput, location) => {
    return new Promise(async (resolve, reject) => {
      const data = await delivery
        .aggregate([
          {
            $match: {
              $or: [
                {
                  "uic_code.code": searchInput,
                  partner_shop: location,
                },
                { imei: searchInput, partner_shop: location },
                { imei: "'" + searchInput, partner_shop: location },
              ],
            },
          },
          {
            $lookup: {
              from: "products",
              localField: `item_id`,
              foreignField: "vendor_sku_id",
              as: "products",
            },
          },
          {
            $lookup: {
              from: "orders",
              localField: `order_id`,
              foreignField: "order_id",
              as: "order",
            },
          },
        ])
        .catch((err) => reject(err));
      if (data.length == 0) {
        resolve({ status: 0 });
      } else {
        let findAllHistory;
        if (data[0]?.uic_code?.code == undefined) {
          findAllHistory = await unitsActionLog
            .find({
              $or: [{ awbn_number: data[0]?.tracking_id }],
            })
            .sort({ _id: 1 });
        } else {
          findAllHistory = await unitsActionLog
            .find({
              $or: [
                { uic: data[0]?.uic_code?.code },
                { awbn_number: data[0]?.tracking_id },
              ],
            })
            .sort({ _id: 1 });
        }

        if (findAllHistory) {
          data[0]["uic_history"] = findAllHistory;
        } else {
          data[0]["uic_history"] = [];
        }

        resolve({ status: 1, data: data });
      }
    });
  },
  trackTray: (location, trayId) => {
    return new Promise(async (resolve, reject) => {
      try {
        const tray = await masters.findOne(
          { code: trayId, cpc: location },
          { actual_items: 0, track_tray: 0 }
        );

        if (!tray) {
          resolve({ status: 0 });
          return;
        }

        const findTrayJourney = await unitsActionLog
          .find({
            tray_id: tray.code,
            track_tray: "Tray",
          })
          .sort({ _id: 1 });

        tray.actual_items = findTrayJourney;

        const auditData = await unitsActionLog
          .find({ action_type: "Issued to Audit", tray_id: trayId })
          .sort({ _id: 1 })
          .limit(tray.limit);

        let trayIdArr = [];
        let uicArr = [];
        let obj = {};

        await Promise.all(
          auditData.map(async (data) => {
            if (uicArr.includes(data.uic)) {
              return;
            }

            uicArr.push(data.uic);

            const findCurrentTray = await masters.findOne(
              {
                "items.uic": data.uic,
                type_taxanomy: "CT",
              },
              { code: 1, type_taxanomy: 1 }
            );

            if (findCurrentTray) {
              if (findCurrentTray.type_taxanomy !== "WHT") {
                if (trayIdArr.includes(findCurrentTray.code)) {
                  obj[findCurrentTray.code] =
                    (obj[findCurrentTray.code] || 0) + 1;
                } else {
                  obj[findCurrentTray.code] = 1;
                }
              }
              trayIdArr.push(findCurrentTray.code);
            }
          })
        );

        resolve({ tray: tray, status: 1, otherDetails: obj });
      } catch (error) {
        reject(error);
      }
    });
  },
  /*------------------------------------RDL-2 OUT PUT ------------------------------------------------*/
  rdl2OutputRequest: async () => {
    try {
      const rdl2OutputRequestsData = await rdl2OutputRequest.find();
      return rdl2OutputRequestsData;
    } catch (error) {
      return error;
    }
  },
  /*-----------------------------------------CREATE REQUEST FOR RDL-2 OUTPUT---------------------------*/
  createdRequestForRdlTwoOutput: async (data) => {
    try {
      // Generate a unique ID starting with "RD"
      const uniqueId = `RD${Date.now()}${Math.floor(Math.random() * 1000)}`;

      // Add the generated unique ID to the data object
      data.request_id = uniqueId;
      const createRequest = await rdl2OutputRequest.create(data);
      if (createRequest) {
        return { status: 1 };
      } else {
        return { status: 0 };
      }
    } catch (error) {
      return error;
    }
  },
  generateRdlTwoOutputReport: async () => {
    try {
      let getPendingRequest = await rdl2OutputRequest.find({
        status: "Pending",
      });
      for (let x of getPendingRequest) {
        const fromDateTimestamp = Date.parse(x.from_date);
        const toDateTimestamp = Date.parse(x.to_date);
        const getReportBasisAuditFinelGrade = await delivery.aggregate([
          {
            $match: {
              rdl_two_closed_date: {
                $gte: new Date(fromDateTimestamp),
                $lte: new Date(toDateTimestamp),
              },
            },
          },
          {
            $group: {
              _id: {
                audit_report_grade: "$audit_report.grade",
                item_id: "$item_id",
              },
              count: { $sum: 1 },
            },
          },
          {
            $group: {
              _id: "$_id.audit_report_grade",
              grades: {
                $push: { grade: "$_id.audit_report_grade", count: "$count" },
              },
              total_count: { $sum: "$count" },
            },
          },
        ]);
        for (let y of getReportBasisAuditFinelGrade) {
          console.log(y);
        }
      }
    } catch (error) {
      return error;
    }
  },
  /* ---------------------------------------PART INVENTORY LEDGER------------------------------------------*/
  getPartInventoryLedger: async (part_code) => {
    try {
      let findPartData = await partAndColor.findOne(
        { part_code: part_code },
        { name: 1, part_code: 1, sp_category: 1, created_at: 1, avl_stock: 1 }
      );
      if(findPartData){

        const findPartInventoryLedger = await partInventoryLedger.find({
          part_code: part_code,
        });
        return {
          status:1,
          data:findPartInventoryLedger,
          partData:findPartData,
        };
      }
      else{
        return {status:2}
      }
    } catch (error) {
      return error;
    }
  },
};
