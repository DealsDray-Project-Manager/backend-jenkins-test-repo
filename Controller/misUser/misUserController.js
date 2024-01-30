const { orders } = require("../../Model/ordersModel/ordersModel");
const { delivery } = require("../../Model/deliveryModel/delivery");
const { infra } = require("../../Model/infraModel");
const { products } = require("../../Model/productModel/product");
const { brands } = require("../../Model/brandModel/brand");
const { user } = require("../../Model/userModel");
const { masters } = require("../../Model/mastersModel");
const { badOrders } = require("../../Model/ordersModel/bad-orders-model");
const { badDelivery } = require("../../Model/deliveryModel/bad-delivery");
const { tempOrders } = require("../../Model/WhtUtility/tempOrder");
const { tempDelivery } = require("../../Model/WhtUtility/tempDelivery");
const { trayCategory } = require("../../Model/tray-category/tray-category");
const moment = require("moment");
const {
  partAndColor,
} = require("../../Model/Part-list-and-color/part-list-and-color");
const elasticsearch = require("../../Elastic-search/elastic");
const { stxUtility } = require("../../Model/Stx-utility/stx-utility");
const { unitsActionLog } = require("../../Model/units-log/units-action-log");
const { bagTransfer } = require("../../Model/bag-transfer/bag-transfer");
let mongoose = require("mongoose");
const {
  partInventoryLedger,
} = require("../../Model/part-inventory-ledger/part-inventory-ledger");
const { tempOrdersReq } = require("../../Model/temp-req/temp-req");
/******************************************************************* */

module.exports = {
  bulkOrdersValidation: (ordersData) => {
    return new Promise(async (resolve, reject) => {
      let err = {};
      let order_id = [];
      let partner_shop = [];
      let partner_id = [];
      let item_id = [];
      let brand_name = [];
      let model_name = [];
      let imei = [];
      let tracking_id = [];
      let order_status = [];
      let order_date = [];
      let i = 0;
      const imeiRegex = /^\d{15}$/; // Regex pattern for 15 digits
      for (let x of ordersData.item) {
        if (x.order_status != "NEW") {
          order_status.push(x.order_status);
          err["order_status"] = order_status;
        }
        if (x?.imei?.match(/[0-9]/g).join("").length !== 15) {
          // IMEI length is correct
          imei.push(x.imei);
          err["imei_number_is_duplicate"] = imei;
        }
        const orderDate = x?.order_date; // Assuming `data` is available
        const parsedDate = new Date(orderDate);
        if (isNaN(parsedDate)) {
          order_date.push(x.order_date);
          err["order_date"] = order_date;
        } else {
          const currentDate = new Date(); // Get the current date

          if (parsedDate > currentDate) {
            order_date.push(x.order_date);
            err["order_date"] = order_date;
          }
        }
        if (x.tracking_id !== undefined) {
          if (x?.tracking_id.match(/[0-9]/g).join("").length !== 12) {
            tracking_id.push(x.tracking_id);
            err["tracking_id"] = tracking_id;
          }
        }
        let orderExists = await orders.findOne({
          order_id: x.order_id,
        });
        if (orderExists) {
          order_id.push(x.order_id);
          err["order_id_is_duplicate"] = order_id;
        } else {
          if (
            ordersData.item.some(
              (data, index) => data?.order_id == x?.order_id && index != i
            )
          ) {
            order_id.push(x?.order_id);
            err["order_id_is_duplicate"] = order_id;
          }
        }
        if (x?.partner_shop != ordersData?.location) {
          partner_shop.push(x?.partner_shop);
          err["location_does_not_exist"] = partner_shop;
        }
        if (x?.partner_id != "1613633867") {
          partner_id.push(x?.partner_id);
          err["partner_id_does_not_exist"] = partner_id;
        }
        let itemId = await products.findOne({
          vendor_sku_id: x?.item_id,
        });
        if (itemId == null) {
          item_id.push(x?.item_id);
          err["item_id_does_not_exist"] = item_id;
        }
        let brand = await brands.findOne({
          brand_name: {
            $regex: new RegExp(
              "^" + x?.old_item_details?.split(":")[0] + "$",
              "i"
            ),
          },
          vendor_sku_id: x?.item_id,
        });
        if (brand == null) {
          brand_name.push(x?.old_item_details?.split(":")[0]);
          err["brand_name_does_not_exist"] = brand_name;
        }
        const itemDetails = x?.old_item_details;
        const parts = itemDetails ? itemDetails.split(":") : [];
        // Combine the last two elements into one
        let lastTwoElements = parts.slice(1).join("");
        let model = await products.findOne({
          model_name: {
            $regex: new RegExp("^" + lastTwoElements + "$", "i"),
          },
          vendor_sku_id: x?.item_id,
        });
        if (model == null) {
          model_name.push(lastTwoElements);
          err["model_name_does_not_exist"] = model_name;
        }

        i++;
      }
      if (Object.keys(err).length === 0) {
        resolve({ status: true });
      } else {
        resolve({ status: false, data: err });
      }
    });
  },
  dashboardData: (location) => {
    return new Promise(async (resolve, reject) => {
      let count = {
        orders: 0,
        badOrders: 0,
        delivered: 0,
        notDelivered: 0,
        delivery: 0,
        uicGented: 0,
        uicDownloaded: 0,
        uicNotGenrated: 0,
        badDelivery: 0,
        assigBot: 0,
        assigCharging: 0,
        bqc: 0,
        audit: 0,
        rdl: 0,
        botToWht: 0,
        whtMerge: 0,
        mmtMerge: 0,
        trackItem: 0,
        rdl_one: 0,
        rdl_two: 0,
        readyToTransfer: 0,
        ctxMerge: 0,
        receiveCtx: 0,
        ctxToStxSorting: 0,
        stxMerge: 0,
        rackChangeRequest: 0,
        rpaToStxSorting: 0,
      };
      count.rackChangeRequest = await masters.count({
        prefix: "tray-master",
        sort_id: "Assigned to warehouae for rack change",
        cpc: location,
        temp_rack: { $eq: null },
      });
      count.rpaToStxSorting = await masters.count({
        prefix: "tray-master",
        sort_id: "Ready to Transfer to STX",
        cpc: location,
        type_taxanomy: "RPA",
      });
      count.orders = await orders.count({
        partner_shop: location,
        order_status: "NEW",
      });
      count.badOrders = await badOrders.count({ partner_shop: location });
      count.delivered = await orders.count({
        partner_shop: location,
        order_status: "NEW",
        delivery_status: "Delivered",
      });
      count.notDelivered = await orders.count({
        partner_shop: location,
        order_status: "NEW",
        delivery_status: "Pending",
      });
      count.delivery = await delivery.count({
        partner_shop: location,
        temp_delivery_status: { $ne: "Pending" },
      });
      count.badDelivery = await badDelivery.count({ partner_shop: location });
      count.uicGented = await delivery.count({
        partner_shop: location,
        uic_status: "Created",
        temp_delivery_status: { $ne: "Pending" },
      });
      count.uicDownloaded = await delivery.count({
        partner_shop: location,
        uic_status: "Printed",
        temp_delivery_status: { $ne: "Pending" },
      });
      count.uicNotGenrated = await delivery.count({
        partner_shop: location,
        uic_status: "Pending",
        temp_delivery_status: { $ne: "Pending" },
      });
      count.assigBot = await masters.count({
        $or: [
          { cpc: location, sort_id: "Pre-closure", prefix: "bag-master" },
          { cpc: location, sort_id: "Closed", prefix: "bag-master" },
        ],
      });
      count.assigCharging = await masters.count({
        $or: [
          {
            cpc: location,
            sort_id: "Closed",
            prefix: "tray-master",
            type_taxanomy: "WHT",
          },
          {
            cpc: location,
            sort_id: "Recharging",
            prefix: "tray-master",
            type_taxanomy: "WHT",
          },
        ],
      });
      const fourDaysAgo = new Date();
      fourDaysAgo.setDate(fourDaysAgo.getDate() - 4);
      count.bqc = await masters.count({
        prefix: "tray-master",
        type_taxanomy: "WHT",
        sort_id: "Ready to BQC",
        cpc: location,
        $or: [
          { closed_time_bot: { $not: { $lt: fourDaysAgo } } }, // Items closed on or after 4 days ago
        ],
      });
      count.ctxToStxSorting = await masters.count({
        prefix: "tray-master",
        type_taxanomy: {
          $in: ["CT"],
        },
        sort_id: "Ready to Transfer to STX",
        cpc: location,
      });
      count.receiveCtx = await masters.count({
        $or: [
          {
            prefix: "tray-master",
            cpc: location,
            sort_id: "Transferred to Sales",
            type_taxanomy: {
              $in: ["CT", "RPA"],
            },
          },
          {
            prefix: "tray-master",
            cpc: location,
            sort_id: "Transferred to Processing",

            type_taxanomy: { $in: ["CT", "RPA"] },
          },
        ],
      });
      count.ctxMerge = await masters.count({
        prefix: "tray-master",
        cpc: location,
        sort_id: "Audit Done Closed By Warehouse",
        type_taxanomy: {
          $in: ["CT"],
        },
      });
      count.stxMerge = await masters.count({
        $or: [
          {
            prefix: "tray-master",
            cpc: location,
            sort_id: "Inuse",
            type_taxanomy: "ST",
            $expr: {
              $and: [
                { $ne: [{ $ifNull: ["$items", null] }, null] },
                { $ne: [{ $size: "$items" }, { $toInt: "$limit" }] },
              ],
            },
          },
        ],
      });
      count.readyToTransfer = await masters.count({
        $or: [
          {
            prefix: "tray-master",
            cpc: location,
            sort_id: "Ready to Transfer to Sales",
            type_taxanomy: {
              $in: ["CT", "RPA"],
            },
          },
          {
            prefix: "tray-master",
            cpc: location,
            sort_id: "Ready to Transfer to Processing",
            type_taxanomy: { $in: ["CT", "RPA"] },
          },
        ],
      });
      count.audit = await masters.count({
        prefix: "tray-master",
        type_taxanomy: "WHT",
        sort_id: "Ready to Audit",
        cpc: location,
      });
      count.rdl = await masters.count({
        prefix: "tray-master",
        type_taxanomy: "WHT",
        sort_id: "Ready to RDL-1",
        cpc: location,
      });
      count.rdl_two = await masters.countDocuments({
        cpc: location,
        sort_id: "Ready to RDL-2",
        type_taxanomy: "RPT",
      });
      count.botToWht = await masters.count({
        type_taxanomy: "BOT",
        prefix: "tray-master",
        sort_id: "Closed By Warehouse",
        cpc: location,
      });
      count.whtMerge = await masters.count({
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
      count.mmtMerge = await masters.count({
        cpc: location,
        type_taxanomy: "MMT",
        prefix: "tray-master",
        sort_id: "Closed By Warehouse",
        $expr: {
          $and: [
            { $ne: [{ $ifNull: ["$items", null] }, null] },
            { $ne: [{ $size: "$items" }, { $toInt: "$limit" }] },
          ],
        },
      });
      count.trackItem = await orders.count({
        partner_shop: location,
        order_status: "NEW",
        delivery_status: "Delivered",
      });
      if (count) {
        resolve(count);
      }
    });
  },
  importOrdersData: (ordersData) => {
    return new Promise(async (resolve, reject) => {
      let data = await orders
        .create(ordersData.validItem)
        .catch((err) => reject(err));
      let badEntry = await badOrders.create(ordersData.invalidItem);
      if (data) {
        resolve(data);
      } else {
        resolve();
      }
    });
  },
  getOrders: (location, limit, skip) => {
    return new Promise(async (resolve, reject) => {
      let allOrders = await orders.aggregate([
        { $match: { partner_shop: location } },
        {
          $lookup: {
            from: "products",
            localField: `item_id`,
            foreignField: "vendor_sku_id",
            as: "products",
          },
        },
        { $sort: { _id: -1 } },

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
  getBadOrders: (location, limit, skip) => {
    return new Promise(async (resolve, reject) => {
      let badOrdersData = await badOrders
        .find({ partner_shop: location }, { _id: 0, __v: 0 })
        .sort({ _id: -1 })
        .limit(limit)
        .skip(skip);
      const count = await badOrders.count({ partner_shop: location });
      const dataForDownload = await badOrders
        .find({ partner_shop: location }, { _id: 0, __v: 0 })
        .sort({ _id: -1 });

      if (badOrdersData) {
        resolve({
          badOrdersData: badOrdersData,
          count: count,
          dataForDownload: dataForDownload,
        });
      }
    });
  },
  searchOrders: (searchType, value, location, limit, skip) => {
    return new Promise(async (resolve, reject) => {
      let allOrders;
      if (searchType == "order_id") {
        allOrders = await orders.aggregate([
          {
            $match: {
              partner_shop: location,
              order_status: "NEW",
              order_id: { $regex: "^" + value + ".*", $options: "i" },
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
      } else if (searchType == "tracking_id") {
        allOrders = await orders.aggregate([
          {
            $match: {
              partner_shop: location,
              order_status: "NEW",
              tracking_id: { $regex: ".*" + value + ".*", $options: "i" },
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
      } else if (searchType == "imei") {
        allOrders = await orders.aggregate([
          {
            $match: {
              order_status: "NEW",
              imei: { $regex: ".*" + value + ".*", $options: "i" },
              partner_shop: location,
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
      } else if (searchType == "order_status") {
        allOrders = await orders.aggregate([
          {
            $match: {
              partner_shop: location,
              order_status: "NEW",
              delivery_status: { $regex: "^" + value + ".*", $options: "i" },
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
      } else if (searchType == "order_date") {
        allOrders = await orders.aggregate([
          {
            $match: {
              partner_shop: location,
              order_status: "NEW",
              order_date: { $regex: "^" + value + ".*", $options: "i" },
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
      } else if (searchType == "item_id") {
        allOrders = await orders.aggregate([
          {
            $match: {
              partner_shop: location,
              order_status: "NEW",
              item_id: { $regex: "^" + value + ".*", $options: "i" },
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
      } else if (searchType == "old_item_details") {
        allOrders = await orders.aggregate([
          {
            $match: {
              partner_shop: location,
              order_status: "NEW",
              old_item_details: { $regex: ".*" + value + ".*", $options: "i" },
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
      }

      if (allOrders) {
        const count = allOrders[0]?.count[0]?.count;
        const orders = allOrders[0]?.results;
        resolve({ count: count, orders: orders });
      }
    });
  },
  getOrdersCount: (location) => {
    return new Promise(async (resolve, reject) => {
      let data = await orders.count({
        partner_shop: location,
        order_status: "NEW",
      });
      resolve(data);
    });
  },
  badOrdersSearch: (searchType, value, location, limit, skip) => {
    return new Promise(async (resolve, reject) => {
      let allOrders;
      if (searchType == "order_id") {
        allOrders = await badOrders.aggregate([
          {
            $match: {
              partner_shop: location,
              order_id: { $regex: "^" + value + ".*", $options: "i" },
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
          {
            $project: { _id: 0, __v: 0 },
          },
        ]);
      } else if (searchType == "tracking_id") {
        allOrders = await badOrders.aggregate([
          {
            $match: {
              partner_shop: location,
              tracking_id: { $regex: ".*" + value + ".*", $options: "i" },
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
          {
            $project: { _id: 0, __v: 0 },
          },
        ]);
      } else if (searchType == "imei") {
        allOrders = await badOrders.aggregate([
          {
            $match: {
              imei: { $regex: ".*" + value + ".*", $options: "i" },
              partner_shop: location,
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
          {
            $project: { _id: 0, __v: 0 },
          },
        ]);
      } else if (searchType == "order_status") {
        allOrders = await badOrders.aggregate([
          {
            $match: {
              partner_shop: location,
              order_status: { $regex: "^" + value + ".*", $options: "i" },
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
          {
            $project: { _id: 0, __v: 0 },
          },
          // {
          //     $unwind: "$products"
          // }
        ]);
      } else if (searchType == "order_date") {
        value = value.split("/");
        value = value.reverse();
        value = value.join("-");
        allOrders = await badOrders.aggregate([
          {
            $match: {
              partner_shop: location,
              order_date: { $regex: ".*" + value + ".*", $options: "i" },
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
          {
            $project: { _id: 0, __v: 0 },
          },
        ]);
      } else if (searchType == "order_timestamp") {
        value = moment(value, "DD-MM-YYYY HH:mm").toDate();
        allOrders = await badOrders.aggregate([
          {
            $match: {
              partner_shop: location,
              order_timestamp: new Date(value),
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
          {
            $project: { _id: 0, __v: 0 },
          },
        ]);
      } else if (searchType == "item_id") {
        allOrders = await badOrders.aggregate([
          {
            $match: {
              partner_shop: location,
              item_id: { $regex: "^" + value + ".*", $options: "i" },
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
          {
            $project: { _id: 0, __v: 0 },
          },
        ]);
      } else if (searchType == "old_item_details") {
        allOrders = await badOrders.aggregate([
          {
            $match: {
              partner_shop: location,
              old_item_details: { $regex: ".*" + value + ".*", $options: "i" },
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
          {
            $project: { _id: 0, __v: 0 },
          },
        ]);
      }
      if (allOrders) {
        const count = allOrders[0]?.count[0]?.count;
        const orders = allOrders[0]?.results;
        resolve({ count: count, orders: orders });
      }
    });
  },
  getNewOrders: (location) => {
    return new Promise(async (resolve, reject) => {
      let data = await orders.find({
        partner_shop: location,
        order_status: "NEW",
      });
      resolve(data);
    });
  },
  getDeliveredOrders: (location, limit, skip) => {
    return new Promise(async (resolve, reject) => {
      let data = await orders.aggregate([
        {
          $match: {
            partner_shop: location,
            order_status: "NEW",
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
        order_status: "NEW",
        delivery_status: "Delivered",
      });
      let check = await orders.find({
        partner_shop: location,
        delivery_status: "Delivered",
      });

      resolve({ data: data, count: count });
    });
  },
  getUicPage: (location, limit, skip) => {
    return new Promise(async (resolve, reject) => {
      let data = await delivery.aggregate([
        {
          $match: {
            partner_shop: location,
          },
        },
        {
          $lookup: {
            from: "orders",
            localField: "order_id",
            foreignField: "order_id",
            as: "order",
          },
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
        {
          $unwind: "$order",
        },
      ]);
      let count = await delivery.count({ partner_shop: location });
      resolve({ data: data, count: count });
    });
  },
  searchUicPageAll: (searchType, value, location, uic_status, limit, skip) => {
    return new Promise(async (resolve, reject) => {
      let allOrders;
      if (searchType == "order_id") {
        allOrders = await delivery.aggregate([
          {
            $match: {
              partner_shop: location,
              uic_status: uic_status,
              order_id: { $regex: "^" + value + ".*", $options: "i" },
            },
          },
          {
            $lookup: {
              from: "orders",
              localField: "order_id",
              foreignField: "order_id",
              as: "order",
            },
          },
          {
            $unwind: "$order",
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
              uic_status: uic_status,
              tracking_id: { $regex: ".*" + value + ".*", $options: "i" },
            },
          },
          {
            $lookup: {
              from: "orders",
              localField: "order_id",
              foreignField: "order_id",
              as: "order",
            },
          },
          {
            $unwind: "$order",
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
              uic_status: uic_status,
              imei: { $regex: ".*" + value + ".*", $options: "i" },
            },
          },
          {
            $lookup: {
              from: "orders",
              localField: "order_id",
              foreignField: "order_id",
              as: "order",
            },
          },
          {
            $unwind: "$order",
          },
          {
            $facet: {
              results: [{ $skip: skip }, { $limit: limit }],
              count: [{ $count: "count" }],
            },
          },
        ]);
      } else if (searchType == "order_status") {
        allOrders = await delivery.aggregate([
          {
            $match: {
              partner_shop: location,
              uic_status: uic_status,
              order_status: { $regex: "^" + value + ".*", $options: "i" },
            },
          },
          {
            $lookup: {
              from: "orders",
              localField: "order_id",
              foreignField: "order_id",
              as: "order",
            },
          },
          {
            $unwind: "$order",
          },
          {
            $facet: {
              results: [{ $skip: skip }, { $limit: limit }],
              count: [{ $count: "count" }],
            },
          },
        ]);
      } else if (searchType == "order_date") {
        value = value.split("/");
        value = value.reverse();
        value = value.join("-");
        allOrders = await delivery.aggregate([
          {
            $match: {
              partner_shop: location,
              uic_status: uic_status,
              order_date: { $regex: ".*" + value + ".*", $options: "i" },
            },
          },
          {
            $lookup: {
              from: "orders",
              localField: "order_id",
              foreignField: "order_id",
              as: "order",
            },
          },
          {
            $unwind: "$order",
          },
          {
            $facet: {
              results: [{ $skip: skip }, { $limit: limit }],
              count: [{ $count: "count" }],
            },
          },
        ]);
      } else if (searchType == "order_timestamp") {
        value = moment(value, "DD-MM-YYYY HH:mm").toDate();
        allOrders = await delivery.aggregate([
          {
            $match: {
              partner_shop: location,
              uic_status: uic_status,
              order_timestamp: new Date(value),
            },
          },
          {
            $lookup: {
              from: "orders",
              localField: "order_id",
              foreignField: "order_id",
              as: "order",
            },
          },
          {
            $unwind: "$order",
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
              uic_status: uic_status,
              item_id: { $regex: "^" + value + ".*", $options: "i" },
            },
          },
          {
            $lookup: {
              from: "orders",
              localField: "order_id",
              foreignField: "order_id",
              as: "order",
            },
          },
          {
            $unwind: "$order",
          },
          {
            $facet: {
              results: [{ $skip: skip }, { $limit: limit }],
              count: [{ $count: "count" }],
            },
          },
        ]);
      } else if (searchType == "uic") {
        allOrders = await delivery.aggregate([
          {
            $match: {
              partner_shop: location,
              uic_status: uic_status,
              "uic_code.code": { $regex: "^" + value + ".*", $options: "i" },
            },
          },
          {
            $lookup: {
              from: "orders",
              localField: "order_id",
              foreignField: "order_id",
              as: "order",
            },
          },
          {
            $unwind: "$order",
          },
          {
            $facet: {
              results: [{ $skip: skip }, { $limit: limit }],
              count: [{ $count: "count" }],
            },
          },
        ]);
      } else if (searchType == "old_item_details") {
        allOrders = await badOrders.aggregate([
          {
            $match: {
              partner_shop: location,
              uic_status: uic_status,
              old_item_details: { $regex: ".*" + value + ".*", $options: "i" },
            },
          },
          {
            $lookup: {
              from: "orders",
              localField: "order_id",
              foreignField: "order_id",
              as: "order",
            },
          },
          {
            $unwind: "$order",
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
        const orders = allOrders[0]?.results;
        resolve({ count: count, orders: orders });
      }
    });
  },
  searchUicPageAllPage: (searchType, value, location, limit, skip) => {
    return new Promise(async (resolve, reject) => {
      let allOrders;
      if (searchType == "order_id") {
        allOrders = await delivery.aggregate([
          {
            $match: {
              partner_shop: location,
              order_id: { $regex: "^" + value + ".*", $options: "i" },
            },
          },
          {
            $lookup: {
              from: "orders",
              localField: "order_id",
              foreignField: "order_id",
              as: "order",
            },
          },
          {
            $unwind: "$order",
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
              tracking_id: { $regex: ".*" + value + ".*", $options: "i" },
            },
          },
          {
            $lookup: {
              from: "orders",
              localField: "order_id",
              foreignField: "order_id",
              as: "order",
            },
          },
          {
            $unwind: "$order",
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
              imei: { $regex: ".*" + value + ".*", $options: "i" },
            },
          },
          {
            $lookup: {
              from: "orders",
              localField: "order_id",
              foreignField: "order_id",
              as: "order",
            },
          },
          {
            $unwind: "$order",
          },
          {
            $facet: {
              results: [{ $skip: skip }, { $limit: limit }],
              count: [{ $count: "count" }],
            },
          },
        ]);
      } else if (searchType == "order_status") {
        allOrders = await delivery.aggregate([
          {
            $match: {
              partner_shop: location,
              order_status: { $regex: "^" + value + ".*", $options: "i" },
            },
          },
          {
            $lookup: {
              from: "orders",
              localField: "order_id",
              foreignField: "order_id",
              as: "order",
            },
          },
          {
            $unwind: "$order",
          },
          {
            $facet: {
              results: [{ $skip: skip }, { $limit: limit }],
              count: [{ $count: "count" }],
            },
          },
        ]);
      } else if (searchType == "order_date") {
        value = value.split("/");
        value = value.reverse();
        value = value.join("-");
        allOrders = await delivery.aggregate([
          {
            $match: {
              partner_shop: location,
              order_date: { $regex: ".*" + value + ".*", $options: "i" },
            },
          },
          {
            $lookup: {
              from: "orders",
              localField: "order_id",
              foreignField: "order_id",
              as: "order",
            },
          },
          {
            $unwind: "$order",
          },
          {
            $facet: {
              results: [{ $skip: skip }, { $limit: limit }],
              count: [{ $count: "count" }],
            },
          },
        ]);
      } else if (searchType == "order_timestamp") {
        value = moment(value, "DD-MM-YYYY HH:mm").toDate();
        allOrders = await delivery.aggregate([
          {
            $match: {
              partner_shop: location,
              order_timestamp: new Date(value),
            },
          },
          {
            $lookup: {
              from: "orders",
              localField: "order_id",
              foreignField: "order_id",
              as: "order",
            },
          },
          {
            $unwind: "$order",
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
              item_id: { $regex: "^" + value + ".*", $options: "i" },
            },
          },
          {
            $lookup: {
              from: "orders",
              localField: "order_id",
              foreignField: "order_id",
              as: "order",
            },
          },
          {
            $unwind: "$order",
          },
          {
            $facet: {
              results: [{ $skip: skip }, { $limit: limit }],
              count: [{ $count: "count" }],
            },
          },
        ]);
      } else if (searchType == "uic") {
        allOrders = await delivery.aggregate([
          {
            $match: {
              partner_shop: location,
              "uic_code.code": { $regex: "^" + value + ".*", $options: "i" },
            },
          },
          {
            $lookup: {
              from: "orders",
              localField: "order_id",
              foreignField: "order_id",
              as: "order",
            },
          },
          {
            $unwind: "$order",
          },
          {
            $facet: {
              results: [{ $skip: skip }, { $limit: limit }],
              count: [{ $count: "count" }],
            },
          },
        ]);
      } else if (searchType == "old_item_details") {
        allOrders = await badOrders.aggregate([
          {
            $match: {
              partner_shop: location,
              old_item_details: { $regex: ".*" + value + ".*", $options: "i" },
            },
          },
          {
            $lookup: {
              from: "orders",
              localField: "order_id",
              foreignField: "order_id",
              as: "order",
            },
          },
          {
            $unwind: "$order",
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
        const orders = allOrders[0]?.results;
        resolve({ count: count, orders: orders });
      }
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
  notDeliveredOrdersDataForDownload: (location) => {
    return new Promise(async (resolve, reject) => {
      let data = await orders.find({
        partner_shop: location,
        order_status: "NEW",
        delivery_status: "Pending",
      });
      resolve(data);
    });
  },
  searchDeliveredOrders: (searchType, value, location, status, limit, skip) => {
    return new Promise(async (resolve, reject) => {
      let allOrders;
      if (searchType == "order_id") {
        allOrders = await orders.aggregate([
          {
            $match: {
              order_id: { $regex: "^" + value + ".*", $options: "i" },
              partner_shop: location,
              delivery_status: status,
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
      } else if (searchType == "tracking_id") {
        allOrders = await orders.aggregate([
          {
            $match: {
              partner_shop: location,
              delivery_status: status,
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
            $unwind: "$delivery",
          },
          {
            $match: {
              partner_shop: location,
              delivery_status: "Delivered",
              "delivery.tracking_id": {
                $regex: ".*" + value + ".*",
                $options: "i",
              },
            },
          },
          {
            $facet: {
              results: [{ $skip: skip }, { $limit: limit }],
              count: [{ $count: "count" }],
            },
          },
        ]);
        // const count = 1;
        // const orders = allOrders;
        // resolve({ count: count, orders: orders });
      } else if (searchType == "imei") {
        allOrders = await orders.aggregate([
          {
            $match: {
              imei: { $regex: ".*" + value + ".*", $options: "i" },
              partner_shop: location,
              delivery_status: status,
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
      } else if (searchType == "order_date") {
        value = value.split("/");
        value = value.reverse();
        value = value.join("-");
        allOrders = await orders.aggregate([
          {
            $match: {
              partner_shop: location,
              order_date: { $regex: ".*" + value + ".*", $options: "i" },
              delivery_status: status,
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
            $unwind: "$delivery",
          },
          {
            $facet: {
              results: [{ $skip: skip }, { $limit: limit }],
              count: [{ $count: "count" }],
            },
          },
        ]);
      } else if (searchType == "item_id") {
        allOrders = await orders.aggregate([
          {
            $match: {
              partner_shop: location,
              item_id: { $regex: "^" + value + ".*", $options: "i" },
              delivery_status: status,
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
      }
      if (allOrders) {
        const count = allOrders[0]?.count[0]?.count;
        const orders = allOrders[0]?.results;
        resolve({ count: count, orders: orders });
      }
    });
  },
  getdeliveredNoOrderId: (location) => {
    return new Promise(async (resolve, reject) => {
      let data = await delivery.aggregate([
        { $match: { partner_shop: location } },
        {
          $lookup: {
            from: "orders",
            localField: "order_id",
            foreignField: "order_id",
            as: "delivery",
          },
        },
      ]);
      let arr = [];
      for (let i = 0; i < data.length; i++) {
        if (data[i].delivery.length == 0) {
          arr.push(data[i]);
        }
      }
      resolve(arr);
    });
  },
  bulkValidationDelivery: (deliveryData) => {
    return new Promise(async (resolve, reject) => {
      let err = {};
      let tracking_id = [];
      let order_id = [];
      let item_id = [];
      let partner_shop = [];
      let notDelivered = [];
      let tracking_id_digit = [];
      for (let i = 0; i < deliveryData.item.length; i++) {
        if (deliveryData.item[i]?.tracking_id !== undefined) {
          if (
            deliveryData.item[i]?.tracking_id?.match(/[0-9]/g).join("")
              .length !== 12
          ) {
            tracking_id_digit.push(deliveryData.item[i].tracking_id);
            err["tracking_id_digit"] = tracking_id_digit;
          }
        }
        if (deliveryData.item[i]?.tracking_id !== undefined) {
          if (
            deliveryData.item[i]?.tracking_id?.match(/[0-9]/g).join("")
              .length !== 12
          ) {
            tracking_id_digit.push(deliveryData.item[i].tracking_id);
            err["tracking_id_digit"] = tracking_id_digit;
          }
        }
        let trackingId = await delivery.findOne({
          tracking_id: deliveryData.item[i].tracking_id,
        });
        if (trackingId) {
          tracking_id.push(deliveryData.item[i].tracking_id);
          err["duplicate_tracking_id"] = tracking_id;
        } else {
          if (
            deliveryData.item.some(
              (data, index) =>
                data.tracking_id == deliveryData.item[i].tracking_id &&
                index != i
            )
          ) {
            tracking_id.push(deliveryData.item[i].tracking_id);
            err["duplicate_tracking_id"] = tracking_id;
          }
        }
        let orederID = await delivery.findOne({
          order_id: deliveryData.item[i].order_id,
        });
        if (orederID) {
          order_id.push(deliveryData.item[i].order_id);
          err["duplicate_order_id_found"] = order_id;
        } else {
          if (
            deliveryData.item.some(
              (data, index) =>
                data.order_id == deliveryData.item[i].order_id && index != i
            )
          ) {
            order_id.push(deliveryData.item[i].order_id);
            err["duplicate_order_id_found"] = order_id;
          } else {
            let noDeliveredCheck = await orders.findOne({
              order_id: deliveryData.item[i].order_id,
            });
            if (noDeliveredCheck == null) {
              notDelivered.push(deliveryData.item[i].order_id);
              err["no_orders"] = notDelivered;
            }
          }
        }
        let itemId = await products.findOne({
          vendor_sku_id: deliveryData.item[i].item_id,
        });
        if (itemId == null) {
          item_id.push(deliveryData.item[i].item_id);
          err["item_does_not_exist"] = item_id;
        }
        if (deliveryData.item[i].partner_shop != deliveryData?.location) {
          partner_shop.push(deliveryData.item[i].partner_shop);
          err["location_does_not_exist"] = partner_shop;
        }
      }
      if (Object.keys(err).length == 0) {
        resolve({ status: true });
      } else {
        resolve({ status: false, err: err });
      }
    });
  },
  importDelivery: (deliveryData) => {
    return new Promise(async (resolve, reject) => {
      let data = await delivery
        .create(deliveryData.validItem)
        .catch((err) => reject(err));
      let updateToelastic = await elasticsearch.addinToElastic(
        deliveryData.validItem
      );
      deliveryData.validItem.forEach(async (doc) => {
        let updateData = await orders.updateOne(
          { order_status: "NEW", order_id: doc.order_id },
          {
            $set: {
              delivery_status: "Delivered",
            },
          }
        );
      });
      if (data) {
        let badDeliveryData = await badDelivery.create(
          deliveryData.invalidItem
        );
        resolve(data);
      } else {
        resolve();
      }
    });
  },
  dashboard: () => {
    return new Promise(async (resolve, reject) => {
      let obj = {
        orders: 0,
        delivery: 0,
      };
      obj.orders = await orders.count({});
      obj.delivery = await delivery.count({});
      resolve(obj);
    });
  },
  getDeliveryCount: (location) => {
    return new Promise(async (resolve, reject) => {
      let data = await delivery.count({
        partner_shop: location,
        temp_delivery_status: { $ne: "Pending" },
      });
      if (data) {
        resolve(data);
      }
    });
  },
  getDelivery: (location, limit, skip) => {
    return new Promise(async (resolve, reject) => {
      let allDeliveryData = await delivery.aggregate([
        { $match: { partner_shop: location } },

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
          $sort: { _id: -1 },
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
      ]);

      resolve(allDeliveryData);
    });
  },
  getBadDelivery: (location, limit, skip) => {
    return new Promise(async (resolve, reject) => {
      let badDeliverydata = await badDelivery
        .find({ partner_shop: location }, { _id: 0, __v: 0 })
        .limit(limit)
        .skip(skip)
        .sort({ _id: -1 });
      let count = await badDelivery.count({ partner_shop: location });
      if (badDeliverydata) {
        resolve({ badDeliverydata: badDeliverydata, count: count });
      }
    });
  },
  searchDeliveryData: (searchType, value, location, limit, skip) => {
    return new Promise(async (resolve, reject) => {
      let allOrders;
      if (searchType == "order_id") {
        allOrders = await delivery.aggregate([
          {
            $match: {
              partner_shop: location,
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
      } else if (searchType == "uic_status") {
        allOrders = await delivery.aggregate([
          {
            $match: {
              partner_shop: location,
              order_status: { $regex: "^" + value + ".*", $options: "i" },
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
  searchMisTrackItem: (searchType, value, location) => {
    let allData;
    return new Promise(async (resolve, reject) => {
      if (searchType == "order_id") {
        allData = await orders.aggregate([
          {
            $match: {
              delivery_status: "Delivered",
              partner_shop: location,
              order_id: { $regex: "^" + value + ".*", $options: "i" },
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
            $limit: 50,
          },
          {
            $unwind: "$delivery",
          },
        ]);
      } else if (searchType == "tracking_id") {
        allData = await orders.aggregate([
          {
            $match: {
              delivery_status: "Delivered",
              partner_shop: location,
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
            $unwind: "$delivery",
          },

          {
            $match: {
              delivery_status: "Delivered",
              partner_shop: location,
              "delivery.tracking_id": {
                $regex: ".*" + value + ".*",
                $options: "i",
              },
            },
          },
          {
            $limit: 50,
          },
        ]);
      } else if (searchType == "uic") {
        allData = await orders.aggregate([
          {
            $match: {
              delivery_status: "Delivered",
              partner_shop: location,
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
            $unwind: "$delivery",
          },
          {
            $match: {
              delivery_status: "Delivered",
              partner_shop: location,
              "delivery.uic_code.code": {
                $regex: ".*" + value + ".*",
                $options: "i",
              },
            },
          },
          {
            $limit: 50,
          },
        ]);
      }
      if (allData) {
        resolve(allData);
      }
    });
  },
  searchBagDeliveryData: (searchType, value, location) => {
    return new Promise(async (resolve, reject) => {
      let allOrders;
      if (searchType == "order_id") {
        allOrders = await badDelivery
          .find(
            {
              partner_shop: location,
              order_id: { $regex: "^" + value + ".*", $options: "i" },
            },

            { _id: 0, __v: 0 }
          )
          .limit(50);
      } else if (searchType == "tracking_id") {
        allOrders = await badDelivery
          .find(
            {
              partner_shop: location,
              tracking_id: { $regex: ".*" + value + ".*", $options: "i" },
            },

            { _id: 0, __v: 0 }
          )
          .limit(50);
      } else if (searchType == "imei") {
        allOrders = await badDelivery
          .find(
            {
              partner_shop: location,
              imei: { $regex: ".*" + value + ".*", $options: "i" },
            },

            { _id: 0, __v: 0 }
          )
          .limit(50);
      } else if (searchType == "uic_status") {
        allOrders = await badDelivery
          .find(
            {
              partner_shop: location,
              order_status: { $regex: "^" + value + ".*", $options: "i" },
            },

            { _id: 0, __v: 0 }
          )
          .limit(50);
      } else if (searchType == "order_date") {
        value = value.split("/");
        value = value.reverse();
        value = value.join("-");
        allOrders = await badDelivery
          .find(
            {
              partner_shop: location,
              order_date: { $regex: ".*" + value + ".*", $options: "i" },
            },

            { _id: 0, __v: 0 }
          )
          .limit(50);
      } else if (searchType == "item_id") {
        allOrders = await badDelivery
          .find(
            {
              partner_shop: location,
              item_id: { $regex: "^" + value + ".*", $options: "i" },
            },

            { _id: 0, __v: 0 }
          )
          .limit(50);
      }
      if (allOrders) {
        resolve(allOrders);
      }
    });
  },
  addUicCode: (uicData) => {
    return new Promise(async (resolve, reject) => {
      // Step 1: Find the highest UIC code in the database collection "delivery."
      let codeHighst = await delivery.aggregate([
        {
          $group: {
            _id: "uic_code.code",
            Max: {
              $max: "$uic_code.code",
            },
          },
        },
      ]);

      // Step 2: Determine the count part of the new UIC code.
      let count = "";
      if (codeHighst[0].Max == null) {
        count = "00001";
      } else {
        let number = Number(codeHighst[0].Max.slice(-5)).toString();
        let total = (Number(number) + 1).toString();
        count = total.padStart(5, "0");
      }

      // Step 3: Get today's date and extract the day of the month as "DD".
      const today = new Date();
      const dayOfMonth = today.getDate().toString().padStart(2, "0");

      // Step 4: Generate the UIC code.
      let uic_code =
        "9" +
        new Date().getFullYear().toString().slice(-1) +
        (today.getMonth() + 1).toString().padStart(2, "0") +
        dayOfMonth +
        count;

      // Step 5: Update the database with the new UIC code and other data.
      let data = await delivery.findOneAndUpdate(
        { _id: uicData._id },
        {
          $set: {
            "uic_code.code": uic_code,
            "uic_code.user": uicData.email,
            "uic_code.created_at": Date.now(),
            uic_status: "Created",
            updated_at: Date.now(),
          },
        },
        {
          new: true,
          projection: { _id: 0 },
        }
      );
      if (data) {
        // let updateElastic = await elasticsearch.uicCodeGen(data);
        resolve(data);
      } else {
        resolve();
      }
    });
  },
  getUicRecon: (status) => {
    return new Promise(async (resolve, reject) => {
      if (!status.page) {
        page = 1;
      }
      if (!status.size) {
        size = 10;
      }
      status.page++;
      const limit = parseInt(status.size);
      const skip = (status.page - 1) * status.size;
      let data = await delivery.aggregate([
        {
          $match: {
            partner_shop: status.location,
            uic_status: status.status,
            temp_delivery_status: { $ne: "Pending" },
          },
        },
        {
          $lookup: {
            from: "orders",
            localField: "order_id",
            foreignField: "order_id",
            as: "order",
          },
        },
        {
          $unwind: "$order",
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
      ]);
      let count = await delivery.count({
        partner_shop: status.location,
        uic_status: status.status,
        temp_delivery_status: { $ne: "Pending" },
      });
      resolve({ data: data, count: count });
    });
  },
  searchUicReconPage: (searchType, value, location, stage) => {
    return new Promise(async (resolve, reject) => {
      let allOrders;
      allOrders = await orders.aggregate([
        {
          $match: {
            partner_shop: stage,
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
          $unwind: "$delivery",
        },
      ]);
    });
  },
  changeUicStatus: (id) => {
    return new Promise(async (resolve, reject) => {
      let data = await delivery.findOneAndUpdate(
        { _id: id },
        {
          $set: {
            uic_status: "Printed",
            download_time: Date.now(),
            updated_at: Date.now(),
          },
        },
        {
          new: true,
          projection: { _id: 0 },
        }
      );
      // let updateElasticSearch = await elasticsearch.uicCodeGen(data);
      if (data) {
        resolve({ status: true });
      } else {
        resolve({ status: false });
      }
    });
  },
  getStockin: (location) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        sort_id: { $in: ["Closed", "Pre-closure"] },
        prefix: "bag-master",
        cpc: location,
      });
      resolve(data);
    });
  },
  getSortingAgent: (location) => {
    return new Promise(async (resolve, reject) => {
      let data = await user.aggregate([
        {
          $match: {
            user_type: "Sorting Agent",
            status: "Active",
            cpc: location,
          },
        },
        {
          $lookup: {
            from: "masters",
            localField: "user_name",
            foreignField: "issued_user_name",
            as: "bag",
          },
        },
        {
          $sort: {
            user_name: 1,
          },
        },
      ]);
      if (data) {
        resolve(data);
      }
    });
  },
  getBot: (location) => {
    return new Promise(async (resolve, reject) => {
      let data = await user.aggregate([
        {
          $match: { user_type: "Bag Opening", status: "Active", cpc: location },
        },
        {
          $lookup: {
            from: "masters",
            localField: "user_name",
            foreignField: "issued_user_name",
            as: "bag",
          },
        },
        {
          $sort: {
            user_name: 1,
          },
        },
      ]);
      if (data) {
        resolve(data);
      }
    });
  },
  sendIssueRequest: (bagData) => {
    return new Promise(async (resolve, reject) => {
      let uicChecking = await masters.aggregate([
        { $match: { code: bagData.bagId } },
        {
          $lookup: {
            from: "deliveries",
            localField: "items.awbn_number",
            foreignField: "tracking_id",
            as: "delivery",
          },
        },
      ]);
      let check = true;
      for (let x of uicChecking?.[0]?.delivery) {
        if (x.uic_status != "Printed") {
          check = false;
          resolve({ status: 0 });
          break;
        }
      }
      if (check === true) {
        let data = await masters.findOneAndUpdate(
          { code: bagData.bagId },
          {
            $set: {
              sort_id: "Requested to Warehouse",
              issued_user_name: bagData.bot_name,
              "track_tray.bag_assign_to_bot": Date.now(),
            },
          }
        );
        if (data) {
          for (let x of data?.items) {
            let unitsLogCreation = await unitsActionLog.create({
              action_type: "Assigned to BOT",
              created_at: Date.now(),
              user_name_of_action: bagData.username,
              agent_name: bagData.bot_name,
              user_type: "MIS",
              awbn_number: x.awbn_number,
              bag_id: bagData.bagId,
              description: `Assigned to agent :${bagData.bot_name} by MIS: ${bagData.username}`,
            });
          }
          resolve({ status: 1 });
        } else {
          resolve();
        }
      }
    });
  },
  deleteBadOrders: (badOrdersData) => {
    return new Promise(async (resolve, reject) => {
      let data;
      for (let x of badOrdersData) {
        data = await badOrders.deleteOne({ _id: x });
      }
      resolve(data);
    });
  },
  deleteBadDelivery: (badDeliveryData) => {
    return new Promise(async (resolve, reject) => {
      let data;
      for (let x of badDeliveryData) {
        data = await badDelivery.deleteOne({ _id: x });
      }
      resolve(data);
    });
  },
  getBagItemForUic: (bagId) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.aggregate([
        { $match: { code: bagId } },
        {
          $lookup: {
            from: "deliveries",
            localField: "items.order_id",
            foreignField: "order_id",
            as: "delivery",
          },
        },
        {
          $lookup: {
            from: "orders",
            localField: "items.order_id",
            foreignField: "order_id",
            as: "orders",
          },
        },
      ]);
      if (data.length !== 0) {
        for (let x of data[0].delivery) {
          for (let y of data[0].orders) {
            if (x.order_id == y.order_id) {
              x.order_order_date = y.order_date;
              x.order_old_item_detail = y.old_item_details;
            }
          }
        }
        resolve({ data: data, status: 1 });
      } else if (data.length == 0) {
        resolve({ data: data, status: 2 });
      } else {
        resolve({ data: data, status: 3 });
      }
    });
  },
  getModelBasedDataFromBot: (trayData) => {
    return new Promise(async (resolve, reject) => {
      let temp_array = [];
      let data;
      let obj = {};
      let assigned_count = 0;
      let items = [];
      for (let x of trayData.tray) {
        data = await masters.findOne(
          { "temp_array.muic": trayData.muic, code: x },
          {
            _id: 0,
            items: 1,
            temp_array: {
              $elemMatch: { muic: trayData.muic },
            },
          }
        );
        if (data) {
          assigned_count = data.temp_array[0]?.assigned_count + assigned_count;
          obj[x] = data.temp_array[0]?.assigned_count;
          temp_array.push(...data.temp_array[0].item);
          obj.model = data.temp_array[0].model;
          obj.brand = data.temp_array[0].brand;
          obj.muic = data.temp_array[0].muic;
          items.push(...data.items);
        }
      }
      obj.temp_array = temp_array;
      obj.assigned_count = assigned_count;
      obj.items = items;
      if (temp_array) {
        resolve(obj);
      } else {
        resolve();
      }
    });
  },
  // whtTrayAssignScreen:(clubDate)=>{
  //   return new Promise(async(resolve,reject)=>{
  //     for(let x of clubDate.tray){
  //       let  data = await masters.findOne(
  //         { "temp_array.muic": clubDate.muic, code: x },
  //         {
  //           _id: 0,
  //           temp_array: {
  //             $elemMatch: { muic: clubDate.muic },
  //           },
  //         }
  //       );
  //       console.log(data);
  //     }
  //   })
  // },
  checkAllWhtInUseForSorting: (botTrayData) => {
    return new Promise(async (resolve, reject) => {
      let arr = [];
      for (let x of botTrayData.trayId) {
        let data = await masters.findOne({ code: x });
        for (let y of data.wht_tray) {
          let getWht = await masters.findOne({ code: y, sort_id: "Inuse" });
          if (getWht) {
          } else {
            arr.push(y);
          }
        }
      }
      resolve(arr);
    });
  },
  botTrayAssignedToSortingAgent: (botTrayData) => {
    return new Promise(async (resolve, reject) => {
      let data;
      for (let x of botTrayData.trayId) {
        data = await masters.findOneAndUpdate(
          { code: x },
          {
            $set: {
              sort_id: "Sorting Request Sent To Warehouse",
              issued_user_name: botTrayData.agent_name,
              status_change_time: Date.now(),
              "track_tray.mis_assign_to_sorting": Date.now(),
            },
          }
        );
        let state = "Tray";
        for (let y of data.items) {
          let unitsLogCreation = await unitsActionLog.create({
            action_type: "Assigned for BOT to WHT Sorting",
            created_at: Date.now(),
            user_name_of_action: botTrayData.username,
            agent_name: botTrayData.agent_name,
            user_type: "PRC MIS",
            uic: y.uic,
            tray_id: x,
            track_tray: state,
            description: `Assigned for BOT to WHT Sorting agent : ${botTrayData.agent_name} by Mis: ${botTrayData.username}`,
          });
          state = "Units";
        }
        for (let y of data.wht_tray) {
          dataWht = await masters.findOneAndUpdate(
            { code: y },
            {
              $set: {
                sort_id: "Sorting Request Sent To Warehouse",
                issued_user_name: botTrayData.agent_name,
                status_change_time: Date.now(),
                "track_tray.mis_assign_to_sorting": Date.now(),
              },
            }
          );
        }
      }
      if (data.modifiedCount != 0) {
        resolve(data);
      } else {
        resolve();
      }
    });
  },
  viewSortingRequests: (location, page) => {
    return new Promise(async (resolve, reject) => {
      if (page == "mis") {
        let data = await masters.find({
          sort_id: "Sorting Request Sent To Warehouse",
          cpc: location,

          type_taxanomy: "BOT",
        });
        if (data) {
          resolve(data);
        }
      } else {
        let data = await masters.aggregate([
          {
            $match: {
              $or: [
                {
                  sort_id: "Sorting Request Sent To Warehouse",
                  cpc: location,

                  // type_taxanomy: "BOT",
                },
                {
                  sort_id: "Assigned to sorting agent",
                  cpc: location,

                  // type_taxanomy: "BOT",
                },
              ],
            },
          },
          {
            $group: {
              _id: "$issued_user_name",
              tray: {
                $push: "$$ROOT",
              },
            },
          },
        ]);
        for (let y of data) {
          y.tray[0].botTray = [];
          y.tray[0].WhtTray = [];
          for (let x of y.tray) {
            if (x.type_taxanomy == "BOT") {
              y.tray[0].botTray.push(x.code);
            } else if (x.type_taxanomy == "WHT") {
              y.tray[0].WhtTray.push(x.code);
            }
          }
        }
        if (data) {
          resolve(data);
        }
      }
    });
  },
  getWhClosedBotTrayTillLastDay: (date, location) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.aggregate([
        {
          $match: {
            type_taxanomy: "BOT",
            prefix: "tray-master",
            sort_id: "Closed By Warehouse",
            cpc: location,
            // closed_time_wharehouse_from_bot: new Date(
            //   date.toISOString().split("T")[0]
            // ),
          },
        },
        {
          $lookup: {
            from: "trayracks",
            localField: "rack_id",
            foreignField: "rack_id",
            as: "rackData",
          },
        },
      ]);
      if (data) {
        resolve(data);
      }
    });
  },
  sortWhClosedBotTray: (date, location) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.aggregate([
        {
          $match: {
            type_taxanomy: "BOT",
            prefix: "tray-master",
            sort_id: "Closed By Warehouse",
            cpc: location,
            closed_time_wharehouse_from_bot: new Date(date),
          },
        },
        {
          $lookup: {
            from: "trayracks",
            localField: "rack_id",
            foreignField: "rack_id",
            as: "rackData",
          },
        },
      ]);
      resolve(data);
    });
  },
  assignForSortingData: (trayData) => {
    return new Promise(async (resolve, reject) => {
      let temp_array = [];
      let flag = false;
      for (let x of trayData.trayData) {
        let data = await masters.findOne({
          $or: [
            {
              code: x,
              sort_id: "Closed By Warehouse",
            },
            {
              code: x,
              sort_id: "Sorting Request Sent To Warehouse",
            },
          ],
        });
        temp_array.push(...data.items);
      }
      let arr = [];
      for (let x of temp_array) {
        if (x.wht_tray == null) {
          flag = true;
        }
        let status = false;
        if (arr.length != 0) {
          for (let y of arr) {
            if (x?.muic == y?.muic) {
              if (
                y.wht_tray.includes(x.wht_tray) == false &&
                x.wht_tray !== null
              ) {
                y.wht_tray.push(x.wht_tray);
              }
              if (x.wht_tray == null) {
                y.dis_tray_assign = false;
              } else {
                y.dis_tray_assign = true;
              }
              status = false;
              y.item.push(x);
              break;
            } else {
              status = true;
            }
          }
          if (status == true) {
            let obj = {
              item: [x],
              muic: x.muic,
              model: x.model,
              brand: x.brand,
              wht_tray: [],
              dis_tray_assign: false,
            };
            if (x.wht_tray !== null) {
              obj.dis_tray_assign = true;
              obj.wht_tray.push(x.wht_tray);
            } else {
              obj.dis_tray_assign = false;
            }
            arr.push(obj);
          }
        } else {
          let obj = {
            item: [x],
            muic: x.muic,
            model: x.model,
            brand: x.brand,
            wht_tray: [],
            dis_tray_assign: false,
          };
          if (x.wht_tray !== null) {
            obj.dis_tray_assign = true;
            obj.wht_tray.push(x.wht_tray);
          } else {
            obj.dis_tray_assign = false;
          }
          arr.push(obj);
        }
      }
      if (arr) {
        let obj = {
          temp_array: arr,
          not_assigned: flag,
        };

        resolve(obj);
      } else {
        resolve();
      }
    });
  },
  sortPickList: (date) => {
    return new Promise(async (resolve, reject) => {
      let data = await products.find({ "item.closed_time": date });
      resolve(data);
    });
  },
  getReadyForChargingWhtTray: () => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        prefix: "tray-master",
        type_taxanomy: "WHT",
        sort_id: "Requested to mis",
      });
      if (data) {
        resolve(data);
      }
    });
  },
  toWhtTrayForMerging: (
    location,
    brand,
    model,
    fromTray,
    itemCount,
    status,
    type,
    sortId,
    grade
  ) => {
    return new Promise(async (resolve, reject) => {
      let arr = [];
      let whtTray;
      if (type == "WHT") {
        let getFromtState = await masters.findOne({ code: fromTray });
        if (getFromtState) {
          whtTray = await masters
            .find({
              prefix: "tray-master",
              type_taxanomy: "WHT",
              brand: brand,
              model: model,
              cpc: location,
              items: { $ne: [] },
              sort_id: getFromtState.sort_id,
              code: { $ne: fromTray },
            })
            .catch((err) => reject(err));
        }
      } else if (type == "MMT") {
        whtTray = await masters
          .find({
            prefix: "tray-master",
            type_taxanomy: type,
            brand: brand,
            model: model,
            cpc: location,
            sort_id: sortId,
            code: { $ne: fromTray },
          })
          .catch((err) => reject(err));
      } else if (type == "ST") {
        whtTray = await masters
          .find({
            $or: [
              {
                prefix: "tray-master",
                type_taxanomy: type,
                tray_grade: grade,
                brand: brand,
                model: model,
                cpc: location,
                sort_id: sortId,
                code: { $ne: fromTray },
              },
            ],
          })
          .catch((err) => reject(err));
      } else {
        whtTray = await masters
          .find({
            prefix: "tray-master",
            type_taxanomy: type,
            tray_grade: grade,
            brand: brand,
            model: model,
            cpc: location,
            sort_id: sortId,
            code: { $ne: fromTray },
          })
          .catch((err) => reject(err));
      }

      if (whtTray.length !== 0) {
        for (let x of whtTray) {
          if (parseInt(x.limit) > parseInt(x.items.length)) {
            arr.push(x);
          }
        }
        if (arr.length !== 0) {
          resolve({ status: 1, tray: arr });
        } else {
          resolve({ status: 0 });
        }
      } else {
        resolve({ status: 0 });
      }
    });
  },
  getChargingUsers: (userType, location) => {
    return new Promise(async (resolve, reject) => {
      let data = await user
        .find({ user_type: userType, status: "Active", cpc: location })
        .sort({ user_name: 1 });
      if (data) {
        resolve(data);
      }
    });
  },
  whtSendToWh: (whtTrayData) => {
    return new Promise(async (resolve, reject) => {
      let data;
      for (let x of whtTrayData.tray) {
        let checkTray = await masters.findOne({ code: x });
        if (checkTray.sort_id == "Recharging") {
          data = await masters.findOneAndUpdate(
            { code: x },
            {
              $set: {
                sort_id: "Send for Recharging",
                issued_user_name: whtTrayData.user_name,
              },
            }
          );
        } else {
          data = await masters.findOneAndUpdate(
            { code: x },
            {
              $set: {
                sort_id: whtTrayData.sort_id,
                actual_items: [],
                requested_date: Date.now(),
                issued_user_name: whtTrayData.user_name,
              },
            }
          );
        }
        let state = "Tray";
        let typeOfpanel = "PRC MIS";
        if (whtTrayData.sort_id == "Assigned for Display Grading") {
          typeOfpanel = "Sales MIS";
        }
        for (let y of data.items) {
          let unitsLogCreation = await unitsActionLog.create({
            action_type: whtTrayData.sort_id,
            created_at: Date.now(),
            user_name_of_action: whtTrayData.actionUser,
            agent_name: whtTrayData.user_name,
            user_type: typeOfpanel,
            uic: y.uic,
            tray_id: x,
            track_tray: state,
            description: `${whtTrayData.sort_id} to agent :${whtTrayData.user_name} by mis :${whtTrayData.actionUser}`,
          });
          state = "Units";
        }
      }
      if (data) {
        resolve(data);
      } else {
        resolve();
      }
    });
  },
  sortWhtTrayBrandAndModel: (location, brand, model) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        cpc: location,
        brand: brand,
        model: model,
        sort_id: "Inuse",
      });
      resolve(data);
    });
  },
  checkWhtreadyForMerge: (trayIds) => {
    return new Promise(async (resolve, reject) => {
      let fromTray = await masters.findOne({ code: trayIds[0] });
      let toTray = await masters.findOne({ code: trayIds[1] });
      let traySpace = toTray.limit - toTray.items.length;
      if (fromTray.items.length <= traySpace) {
        resolve({ status: true });
      } else {
        resolve({ status: false });
      }
    });
  },
  // mergRegquestSendToWh:(trayDetails)=>{
  //   return new Promise(async(resolve,reject)=>{
  //     for(let x of trayDetails){
  //       let dataUpdate=await masters.updateOne({code:x},{
  //         $set:{
  //           sort_id:""
  //         }
  //       })
  //     }
  //   })
  // }
  getBagForTransfer: (location) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters
        .find({
          $or: [
            {
              sort_id: "Closed",
              prefix: "bag-master",
              cpc: location,
            },
            {
              sort_id: "Pre-closure",
              prefix: "bag-master",
              cpc: location,
            },
          ],
        })
        .catch((err) => reject(err));
      if (data) {
        resolve(data);
      }
    });
  },
  viewBagitem: (location, bagId) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters
        .findOne({
          $or: [
            { code: bagId, sort_id: "Closed", cpc: location },
            { code: bagId, sort_id: "Pre-closure", cpc: location },
          ],
        })
        .catch((err) => reject(err));
      if (data) {
        resolve(data);
      } else {
        resolve();
      }
    });
  },
  getClosedMmttray: (location) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters
        .aggregate([
          {
            $match: {
              cpc: location,
              type_taxanomy: "MMT",
              prefix: "tray-master",
              sort_id: "Closed By Warehouse",
              $expr: {
                $and: [
                  { $ne: [{ $ifNull: ["$items", null] }, null] },
                  { $ne: [{ $size: "$items" }, { $toInt: "$limit" }] },
                ],
              },
            },
          },
          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackData",
            },
          },
        ])
        .catch((err) => reject(err));
      if (data) {
        resolve(data);
      }
    });
  },
  getSortingAgentForMergeMmt: (location) => {
    return new Promise(async (resolve, reject) => {
      let data = await user
        .find({
          user_type: "Sorting Agent",
          status: "Active",
          cpc: location,
        })
        .catch((err) => reject(err));
      if (data) {
        resolve(data);
      }
    });
  },
  getToTrayMmtMerge: (toTray, location, itemsCount) => {
    return new Promise(async (resolve, reject) => {
      let arr = [];
      let whtTray = await masters
        .find({
          cpc: location,
          type_taxanomy: "MMT",
          sort_id: "Closed By Warehouse",
          prefix: "tray-master",
          code: { $ne: toTray },
        })
        .catch((err) => reject(err));

      if (whtTray.length !== 0) {
        for (let x of whtTray) {
          let count = x.limit - x.items.length;
          if (count >= itemsCount) {
            arr.push(x);
          }
        }
        if (arr.length !== 0) {
          resolve({ status: 1, tray: arr });
        } else {
          resolve({ status: 2 });
        }
      } else {
        resolve({ status: 2 });
      }
    });
  },
  mmtMergeRequestSendToWh: async (
    sortingAgent,
    fromTray,
    toTray,
    actionUser
  ) => {
    try {
      let whtTray = await masters.findOne({ code: fromTray });
      let updateFromTray, updateToTray, stage, dep;
      if (
        whtTray.sort_id === "Audit Done Closed By Warehouse" &&
        whtTray.type_taxanomy == "WHT"
      ) {
        dep = "PRC MIS";
        stage = "Audit Done Merge Request Sent To Wharehouse";
        updateFromTray = await masters.findOneAndUpdate(
          { code: fromTray },
          {
            $set: {
              sort_id: "Audit Done Merge Request Sent To Wharehouse",
              status_change_time: Date.now(),
              issued_user_name: sortingAgent,
              to_merge: toTray,
              actual_items: [],
            },
          }
        );

        if (updateFromTray) {
          updateToTray = await masters.findOneAndUpdate(
            { code: toTray },
            {
              $set: {
                sort_id: "Audit Done Merge Request Sent To Wharehouse",
                status_change_time: Date.now(),
                issued_user_name: sortingAgent,
                from_merge: fromTray,
                to_merge: null,
                actual_items: [],
              },
            }
          );
        } else {
          return { status: 0 };
        }
      } else if (
        whtTray.sort_id === "Ready to BQC" &&
        whtTray.type_taxanomy == "WHT"
      ) {
        dep = "PRC MIS";
        stage = "Ready to BQC Merge Request Sent To Wharehouse";
        updateFromTray = await masters.findOneAndUpdate(
          { code: fromTray },
          {
            $set: {
              sort_id: "Ready to BQC Merge Request Sent To Wharehouse",
              status_change_time: Date.now(),
              issued_user_name: sortingAgent,
              to_merge: toTray,
              actual_items: [],
            },
          }
        );

        if (updateFromTray) {
          updateToTray = await masters.findOneAndUpdate(
            { code: toTray },
            {
              $set: {
                sort_id: "Ready to BQC Merge Request Sent To Wharehouse",
                status_change_time: Date.now(),
                issued_user_name: sortingAgent,
                from_merge: fromTray,
                to_merge: null,
                actual_items: [],
              },
            }
          );
        } else {
          return { status: 0 };
        }
      } else if (
        whtTray.sort_id === "Ready to Audit" &&
        whtTray.type_taxanomy == "WHT"
      ) {
        dep = "PRC MIS";
        stage = "Ready to Audit Merge Request Sent To Wharehouse";
        updateFromTray = await masters.findOneAndUpdate(
          { code: fromTray },
          {
            $set: {
              sort_id: "Ready to Audit Merge Request Sent To Wharehouse",
              status_change_time: Date.now(),
              issued_user_name: sortingAgent,
              to_merge: toTray,
              actual_items: [],
            },
          }
        );

        if (updateFromTray) {
          updateToTray = await masters.findOneAndUpdate(
            { code: toTray },
            {
              $set: {
                sort_id: "Ready to Audit Merge Request Sent To Wharehouse",
                status_change_time: Date.now(),
                issued_user_name: sortingAgent,
                from_merge: fromTray,
                to_merge: null,
                actual_items: [],
              },
            }
          );
        } else {
          return { status: 0 };
        }
      } else if (
        whtTray.sort_id === "Ready to RDL-2" &&
        whtTray.type_taxanomy == "WHT"
      ) {
        dep = "PRC MIS";
        stage = "Ready to RDL-2 Merge Request Sent To Wharehouse";
        updateFromTray = await masters.findOneAndUpdate(
          { code: fromTray },
          {
            $set: {
              sort_id: "Ready to RDL-2 Merge Request Sent To Wharehouse",
              status_change_time: Date.now(),
              issued_user_name: sortingAgent,
              to_merge: toTray,
              actual_items: [],
            },
          }
        );

        if (updateFromTray) {
          updateToTray = await masters.findOneAndUpdate(
            { code: toTray },
            {
              $set: {
                sort_id: "Ready to RDL-2 Merge Request Sent To Wharehouse",
                status_change_time: Date.now(),
                issued_user_name: sortingAgent,
                from_merge: fromTray,
                to_merge: null,
                actual_items: [],
              },
            }
          );
        } else {
          return { status: 0 };
        }
      } else {
        dep = "PRC MIS";
        stage = "Merge Request Sent To Wharehouse";
        updateFromTray = await masters.findOneAndUpdate(
          { code: fromTray },
          {
            $set: {
              sort_id: "Merge Request Sent To Wharehouse",
              status_change_time: Date.now(),
              issued_user_name: sortingAgent,
              to_merge: toTray,
              actual_items: [],
            },
          }
        );

        if (updateFromTray) {
          updateToTray = await masters.findOneAndUpdate(
            { code: toTray },
            {
              $set: {
                sort_id: "Merge Request Sent To Wharehouse",
                status_change_time: Date.now(),
                issued_user_name: sortingAgent,
                from_merge: fromTray,
                to_merge: null,
                actual_items: [],
              },
            }
          );
        } else {
          return { status: 0 };
        }
      }
      if (whtTray.type_taxanomy == "ST") {
        dep = "Sales MIS";
      }

      if (updateFromTray) {
        let state1 = "Tray";
        for (let x of updateFromTray.items) {
          let unitsLogCreation = await unitsActionLog.create({
            action_type: stage,
            created_at: Date.now(),
            user_name_of_action: actionUser,
            agent_name: sortingAgent,
            user_type: dep,
            uic: x.uic,
            tray_id: updateFromTray.code,
            track_tray: state1,
            description: `${stage} to agent :${sortingAgent} by mis :${actionUser}`,
          });
          state1 = "Units";
        }
        let state2 = "Tray";
        for (let x of updateToTray.items) {
          let unitsLogCreation = await unitsActionLog.create({
            action_type: stage,
            created_at: Date.now(),
            user_name_of_action: actionUser,
            agent_name: sortingAgent,
            user_type: dep,
            uic: x.uic,
            tray_id: updateToTray.code,
            track_tray: state2,
            description: `${stage} to agent :${sortingAgent} by mis :${actionUser}`,
          });

          state2 = "Units";
        }

        return { status: 1 };
      } else {
        return { status: 0 };
      }
    } catch (error) {
      return error;
    }
  },
  imeiSearchDelivery: (value) => {
    return new Promise(async (resolve, reject) => {
      firstChar = value.charAt(0);
      if (firstChar.match(/[^a-zA-Z0-9]/)) {
        let deliveryItems = await delivery.find({ imei: value });
        if (deliveryItems.length == 0) {
          restOfStr = value.slice(1);
          deliveryItems = await delivery.find({ imei: restOfStr });
          if (deliveryItems) {
            resolve(deliveryItems);
          } else {
            resolve({ status: 2 });
          }
        } else {
          resolve(deliveryItems);
        }
      } else if (firstChar.match(/[a-zA-Z0-9]/)) {
        let deliveryItems = await delivery.find({ imei: value });
        if (deliveryItems.length == 0) {
          let deliveryItems = await delivery.find({ imei: `'${value}` });
          if (deliveryItems) {
            resolve(deliveryItems);
          } else {
            resolve({ status: 2 });
          }
        } else {
          resolve(deliveryItems);
        }
      } else {
        resolve({ status: 2 });
      }
    });
  },
  imeiSearchOrder: (value) => {
    return new Promise(async (resolve, reject) => {
      firstChar = value.charAt(0);
      if (firstChar.match(/[^a-zA-Z0-9]/)) {
        // let orderItems = await orders.find({ imei: value });
        orderItems = await orders.aggregate([
          {
            $match: {
              imei: value,
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

        if (orderItems.length == 0) {
          restOfStr = value.slice(1);
          // orderItems = await orders.find({ imei: restOfStr })
          orderItems = await orders.aggregate([
            {
              $match: {
                imei: restOfStr,
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
          if (orderItems) {
            resolve(orderItems);
          } else {
            resolve({ status: 2 });
          }
        } else {
          resolve(orderItems);
        }
      } else if (firstChar.match(/[a-zA-Z0-9]/)) {
        // let orderItems = await orders.find({ imei: value });

        orderItems = await orders.aggregate([
          {
            $match: {
              imei: value,
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

        if (orderItems.length == 0) {
          orderItems = await orders.aggregate([
            {
              $match: {
                imei: `'${value}`,
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

          if (orderItems) {
            resolve(orderItems);
          } else {
            resolve({ status: 2 });
          }
        } else {
          resolve(orderItems);
        }
      } else {
        resolve({ status: 2 });
      }
    });
  },
  /*-----------------------PICKUP MODEULE-------------------------------*/
  pickupPageItemView: (type, location) => {
    return new Promise(async (resolve, reject) => {
      let items = [];
      const today = new Date(); // Get the current date
      today.setHours(0, 0, 0, 0); // Set the time to midnight

      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(today.getDate() - 3);
      if (type == "Charge Done") {
        items = await masters.aggregate([
          {
            $match: {
              "track_tray.charging_done_close_wh": { $gte: threeDaysAgo },
              sort_id: "Ready to BQC",
              cpc: location,
            },
          },
          {
            $unwind: "$items",
          },

          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackData",
            },
          },
          {
            $unwind: {
              path: "$rackData",
              preserveNullAndEmptyArrays: true, // This option preserves documents that do not have a matching element in the array
            },
          },
          {
            $project: {
              rackData: 1,
              items: 1,
              brand: 1,
              model: 1,
              code: 1,
              closed_date_agent: 1,
            },
          },
        ]);
      } else if (type == "BQC Done") {
        items = await masters.aggregate([
          {
            $match: {
              "track_tray.bqc_done_close_by_wh": { $gte: threeDaysAgo },
              sort_id: "Ready to Audit",
              cpc: location,
            },
          },
          {
            $unwind: "$items",
          },
          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackData",
            },
          },
          {
            $unwind: {
              path: "$rackData",
              preserveNullAndEmptyArrays: true, // This option preserves documents that do not have a matching element in the array
            },
          },
          {
            $project: {
              items: 1,
              brand: 1,
              model: 1,
              code: 1,
              rackData: 1,
              closed_date_agent: 1,
            },
          },
        ]);
      } else if (type == "Audit Done") {
        items = await masters.aggregate([
          {
            $match: {
              "track_tray.audit_done_close_wh": { $gte: threeDaysAgo },
              sort_id: "Ready to RDL-1",
              cpc: location,
            },
          },
          {
            $unwind: "$items",
          },
          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackData",
            },
          },
          {
            $unwind: {
              path: "$rackData",
              preserveNullAndEmptyArrays: true, // This option preserves documents that do not have a matching element in the array
            },
          },
          {
            $project: {
              items: 1,
              brand: 1,
              model: 1,
              rackData: 1,
              code: 1,
              closed_date_agent: 1,
            },
          },
        ]);
      } else if (type == "RDL-2 done closed by warehouse") {
        items = await masters.aggregate([
          {
            $match: {
              "track_tray.rdl_two_done_closed_by_agent": { $gte: threeDaysAgo },

              sort_id: type,
              cpc: location,
            },
          },
          {
            $unwind: "$items",
          },
          {
            $match: {
              "items.rdl_repair_report.reason": {
                $ne: "Device not repairable",
              },
            },
          },
          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackData",
            },
          },
          {
            $unwind: {
              path: "$rackData",
              preserveNullAndEmptyArrays: true, // This option preserves documents that do not have a matching element in the array
            },
          },
          {
            $project: {
              items: 1,
              brand: 1,
              model: 1,
              rackData: 1,
              code: 1,
              "track_tray.rdl_two_done_closed_by_agent": 1,
            },
          },
        ]);
      } else {
        items = await masters.aggregate([
          {
            $match: {
              sort_id: type,
              cpc: location,
              type_taxanomy: "WHT",
            },
          },
          {
            $unwind: "$items",
          },
          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackData",
            },
          },
          {
            $unwind: {
              path: "$rackData",
              preserveNullAndEmptyArrays: true, // This option preserves documents that do not have a matching element in the array
            },
          },
          {
            $lookup: {
              from: "deliveries",
              localField: "items.uic",
              foreignField: "uic_code.code",
              as: "deliveryData",
            },
          },
          {
            $unwind: "$deliveryData",
          },
          {
            $match: {
              "deliveryData.rdl_fls_closed_date": { $gte: threeDaysAgo },
            },
          },
          {
            $project: {
              items: 1,
              rackData: 1,
              "deliveryData.rdl_fls_closed_date": 1,
              "deliveryData.merge_done_date": 1,
              "deliveryData.merge_done_tray": 1,
              brand: 1,
              model: 1,
              code: 1,
              closed_date_agent: 1,
            },
          },
        ]);
      }
      resolve({ items: items });
    });
  },
  pickUpDateWiseFilter: (type, location, selectedStatus) => {
    return new Promise(async (resolve, reject) => {
      let items = [];

      if (type == "Charge Done") {
        items = await masters.aggregate([
          {
            $match: {
              sort_id: "Ready to BQC",
              cpc: location,
            },
          },
          {
            $unwind: "$items",
          },
          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackData",
            },
          },
          {
            $unwind: {
              path: "$rackData",
              preserveNullAndEmptyArrays: true, // This option preserves documents that do not have a matching element in the array
            },
          },
          {
            $project: {
              items: 1,
              brand: 1,
              model: 1,
              rackData: 1,
              code: 1,
              closed_date_agent: 1,
            },
          },
        ]);
      } else if (type == "BQC Done") {
        items = await masters.aggregate([
          {
            $match: {
              "track_tray.bqc_done_close_by_wh": {
                $gte: new Date(startDate),
                $lt: new Date(endDate),
              },
              sort_id: "Ready to Audit",
              cpc: location,
            },
          },
          {
            $unwind: "$items",
          },
          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackData",
            },
          },
          {
            $unwind: {
              path: "$rackData",
              preserveNullAndEmptyArrays: true, // This option preserves documents that do not have a matching element in the array
            },
          },
          {
            $project: {
              items: 1,
              brand: 1,
              model: 1,
              code: 1,
              rackData: 1,
              closed_date_agent: 1,
            },
          },
        ]);
      } else if (type == "Audit Done") {
        items = await masters.aggregate([
          {
            $match: {
              "items.audit_report.stage": { $in: selectedStatus },
              sort_id: "Ready to RDL-1",
              cpc: location,
            },
          },
          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackData",
            },
          },
          {
            $unwind: {
              path: "$rackData",
              preserveNullAndEmptyArrays: true, // This option preserves documents that do not have a matching element in the array
            },
          },
          {
            $project: {
              items: {
                $filter: {
                  input: "$items",
                  cond: {
                    $in: ["$$this.audit_report.stage", selectedStatus],
                  },
                },
              },
              brand: 1,
              model: 1,
              code: 1,
              rackData: 1,
              closed_date_agent: 1,
            },
          },
          {
            $unwind: "$items",
          },
        ]);
      } else {
        items = await masters.aggregate([
          {
            $match: {
              "items.rdl_fls_report.selected_status": { $in: selectedStatus },
              sort_id: "Ready to RDL-2",
              cpc: location,
              type_taxanomy: "WHT",
            },
          },
          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackData",
            },
          },
          {
            $unwind: {
              path: "$rackData",
              preserveNullAndEmptyArrays: true, // This option preserves documents that do not have a matching element in the array
            },
          },
          {
            $project: {
              items: {
                $filter: {
                  input: "$items",
                  cond: {
                    $in: [
                      "$$this.rdl_fls_report.selected_status",
                      selectedStatus,
                    ],
                  },
                },
              },
              "deliveryData.rdl_fls_closed_date": 1,
              "deliveryData.merge_done_date": 1,
              "deliveryData.merge_done_tray": 1,
              brand: 1,
              model: 1,
              code: 1,
              rackData: 1,
              closed_date_agent: 1,
            },
          },
          {
            $unwind: "$items",
          },
          {
            $lookup: {
              from: "deliveries",
              localField: "items.uic",
              foreignField: "uic_code.code",
              as: "deliveryData",
            },
          },
          {
            $unwind: "$deliveryData", // Unwind the deliveryData array if it's an array
          },
        ]);
      }
      resolve({ items: items });
    });
  },
  pickupPageItemViewSeeAll: (type, location) => {
    return new Promise(async (resolve, reject) => {
      let items = [];
      const today = new Date(); // Get the current date
      today.setHours(0, 0, 0, 0); // Set the time to midnight
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(today.getDate() - 3);
      if (type == "Charge Done") {
        items = await masters.aggregate([
          { $match: { sort_id: "Ready to BQC", cpc: location } },

          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackData",
            },
          },
          {
            $unwind: {
              path: "$rackData",
              preserveNullAndEmptyArrays: true, // This option preserves documents that do not have a matching element in the array
            },
          },
          {
            $unwind: {
              path: "$items",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              items: 1,
              brand: 1,
              model: 1,
              code: 1,
              rackData: 1,
              closed_date_agent: 1,
            },
          },
        ]);
      } else if (type == "BQC Done") {
        items = await masters.aggregate([
          { $match: { sort_id: "Ready to Audit", cpc: location } },
          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackData",
            },
          },
          {
            $unwind: {
              path: "$rackData",
              preserveNullAndEmptyArrays: true, // This option preserves documents that do not have a matching element in the array
            },
          },
          {
            $unwind: {
              path: "$items",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              rackData: 1,
              items: 1,
              brand: 1,
              model: 1,
              code: 1,
              closed_date_agent: 1,
            },
          },
        ]);
      } else if (type == "Audit Done") {
        items = await masters.aggregate([
          { $match: { sort_id: "Ready to RDL-1", cpc: location } },
          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackData",
            },
          },
          {
            $unwind: {
              path: "$rackData",
              preserveNullAndEmptyArrays: true, // This option preserves documents that do not have a matching element in the array
            },
          },
          {
            $unwind: {
              path: "$items",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              rackData: 1,
              items: 1,
              brand: 1,
              model: 1,
              code: 1,
              closed_date_agent: 1,
            },
          },
        ]);
      } else if (type == "Ready to RDL-2") {
        items = await masters.aggregate([
          {
            $match: {
              sort_id: "Ready to RDL-2",
              type_taxanomy: "WHT",
              cpc: location,
            },
          },
          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackData",
            },
          },
          {
            $unwind: {
              path: "$rackData",
              preserveNullAndEmptyArrays: true, // This option preserves documents that do not have a matching element in the array
            },
          },
          {
            $unwind: {
              path: "$items",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $lookup: {
              from: "deliveries",
              localField: "items.uic",
              foreignField: "uic_code.code",
              as: "deliveryData",
            },
          },
          {
            $unwind: "$deliveryData", // Unwind the deliveryData array if it's an array
          },
          {
            $project: {
              "deliveryData.rdl_fls_closed_date": 1,
              "deliveryData.merge_done_date": 1,
              "deliveryData.merge_done_tray": 1,
              items: 1,
              brand: 1,
              rackData: 1,
              model: 1,
              code: 1,
              closed_date_agent: 1,
            },
          },
        ]);
      } else if (type == "RDL-2 done closed by warehouse") {
        items = await masters.aggregate([
          {
            $match: {
              sort_id: type,
              cpc: location,
            },
          },
          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackData",
            },
          },
          {
            $unwind: {
              path: "$rackData",
              preserveNullAndEmptyArrays: true, // This option preserves documents that do not have a matching element in the array
            },
          },
          {
            $unwind: {
              path: "$items",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $match: {
              "items.rdl_repair_report.reason": {
                $ne: "Device not repairable",
              },
            },
          },
          {
            $lookup: {
              from: "deliveries",
              localField: "items.uic",
              foreignField: "uic_code.code",
              as: "deliveryData",
            },
          },
          {
            $unwind: "$deliveryData", // Unwind the deliveryData array if it's an array
          },
          {
            $project: {
              "deliveryData.rdl_fls_closed_date": 1,
              "deliveryData.merge_done_date": 1,
              "deliveryData.merge_done_tray": 1,
              items: 1,
              brand: 1,
              rackData: 1,
              model: 1,
              code: 1,
              closed_date_agent: 1,
            },
          },
        ]);
      } else {
        items = await masters.aggregate([
          { $match: { sort_id: type, cpc: location } },
          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackData",
            },
          },
          {
            $unwind: {
              path: "$rackData",
              preserveNullAndEmptyArrays: true, // This option preserves documents that do not have a matching element in the array
            },
          },
          {
            $unwind: {
              path: "$items",
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              rackData: 1,
              items: 1,
              brand: 1,
              model: 1,
              code: 1,
              closed_date_agent: 1,
            },
          },
        ]);
      }

      resolve({ items: items });
    });
  },
  /*---------------------PICKUP SORT-------------------------------*/
  pickUpSortBrandModel: (brand, model, type, location) => {
    return new Promise(async (resolve, reject) => {
      let items, count;

      if (type == "Charge Done") {
        items = await masters.aggregate([
          {
            $match: {
              sort_id: "Ready to BQC",
              brand: brand,
              model: model,
              cpc: location,
            },
          },
          {
            $unwind: "$items",
          },
        ]);
      } else if (type == "BQC Done") {
        items = await masters.aggregate([
          {
            $match: {
              sort_id: "  ",
              brand: brand,
              model: model,
              cpc: location,
            },
          },
          {
            $unwind: "$items",
          },
        ]);
      } else if (type == "Audit Done") {
        items = await masters.aggregate([
          {
            $match: {
              sort_id: "Ready to RDL-1",
              brand: brand,
              model: model,
              cpc: location,
            },
          },
          {
            $unwind: "$items",
          },
        ]);
      } else {
        items = await masters.aggregate([
          {
            $match: {
              sort_id: type,
              brand: brand,
              model: model,
              cpc: location,
            },
          },
          {
            $unwind: "$items",
          },
        ]);
      }
      resolve({ items: items, count: count });
    });
  },
  /*-----------------------PICKUP PAGE UIC SEARCH--------------------------------*/
  pickupPageUicSearch: (uic, type) => {
    return new Promise(async (resolve, reject) => {
      let items, count;
      if (type == "Charge Done") {
        items = await delivery.aggregate([
          {
            $match: {
              charging_done_close: { $exists: true },
              tray_location: "Warehouse",
              "uic_code.code": { $regex: ".*" + uic + ".*", $options: "i" },
              assign_to_agent_bqc: { $exists: false },
              sales_bin_date: { $exists: false },
              pickup_request_sent_to_wh_date: { $exists: false },
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
            $limit: 100,
          },
        ]);
        count = await delivery.count({
          charging_done_close: { $exists: true },
          tray_location: "Warehouse",
          "uic_code.code": { $regex: ".*" + uic + ".*", $options: "i" },
          assign_to_agent_bqc: { $exists: false },
          sales_bin_date: { $exists: false },
          pickup_request_sent_to_wh_date: { $exists: false },
        });
      } else if (type == "BQC Done") {
        items = await delivery.aggregate([
          {
            $match: {
              bqc_done_close: { $exists: true },
              tray_location: "Warehouse",
              "uic_code.code": { $regex: ".*" + uic + ".*", $options: "i" },
              issued_to_audit: { $exists: false },
              sales_bin_date: { $exists: false },
              pickup_request_sent_to_wh_date: { $exists: false },
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
            $limit: 100,
          },
        ]);
        count = await delivery.count({
          bqc_done_close: { $exists: true },
          tray_location: "Warehouse",
          "uic_code.code": { $regex: ".*" + uic + ".*", $options: "i" },
          issued_to_audit: { $exists: false },
          sales_bin_date: { $exists: false },
          pickup_request_sent_to_wh_date: { $exists: false },
        });
      } else if (type == "Audit Done") {
        items = await delivery.aggregate([
          {
            $match: {
              audit_done_close: { $exists: true },
              tray_location: "Warehouse",
              "uic_code.code": { $regex: ".*" + uic + ".*", $options: "i" },
              issued_rdl_fls_one_date: { $exists: false },
              sales_bin_date: { $exists: false },
              pickup_request_sent_to_wh_date: { $exists: false },
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
            $limit: 100,
          },
        ]);

        count = await delivery.count({
          audit_done_close: { $exists: true },
          tray_location: "Warehouse",
          "uic_code.code": { $regex: ".*" + uic + ".*", $options: "i" },
          issued_rdl_fls_one_date: { $exists: false },
          sales_bin_date: { $exists: false },
          pickup_request_sent_to_wh_date: { $exists: false },
        });
      }
      resolve({ items: items, count: count });
    });
  },
  /*--------------------------GET WHT TRAY IN PICKUP PAGE----------------------------------*/
  pickupPageGetWhtTray: (itemData) => {
    return new Promise(async (resolve, reject) => {
      let arr = [];
      let prodct = [];
      let item_id_wht = "";
      for (let x of itemData.isCheck) {
        let checkBrand = await delivery.findOne({ "uic_code.code": x });
        item_id_wht = checkBrand.item_id;
        if (prodct.length == 0) {
          prodct.push(checkBrand.item_id);
        }
        if (prodct.includes(checkBrand.item_id) == false) {
          arr.push(x);
        }
      }

      if (arr.length == 0) {
        let product = await products.findOne({ vendor_sku_id: item_id_wht });
        let getWhtTray = await masters.find({
          sort_id: "Open",
          brand: product.brand_name,
          model: product.model_name,
          prefix: "tray-master",
          type_taxanomy: "WHT",
          limit: { $gte: itemData.isCheck.length.toString() },
        });
        if (getWhtTray) {
          resolve({ status: 1, whtTray: getWhtTray });
        }
      } else {
        resolve({ status: 2, item: arr });
      }
    });
  },
  pickupRequestSendToWh: async (itemData) => {
    let sendtoPickupRequest;
    let toTray;
    try {
      let arr = [];
      for (let x of itemData.isCheck) {
        let getDeliveryData = await delivery.findOne({ "uic_code.code": x });
        if (getDeliveryData) {
          if (itemData.value == "RDL-2 done closed by warehouse") {
            sendtoPickupRequest = await masters.findOneAndUpdate(
              {
                $or: [{ "items.uic": x, type_taxanomy: "RPT" }],
              },
              {
                $set: {
                  sort_id: "Pickup Request sent to Warehouse",
                  issued_user_name: itemData.user_name,
                  requested_date: Date.now(),
                  actual_items: [],
                  temp_array: [],
                  pickup_type: itemData.value,
                  "items.$.pickup_toTray": itemData.toTray,
                  to_tray_for_pickup: itemData.toTray,
                },
              }
            );
          } else {
            sendtoPickupRequest = await masters.findOneAndUpdate(
              {
                $or: [{ "items.uic": x, type_taxanomy: "WHT" }],
              },
              {
                $set: {
                  sort_id: "Pickup Request sent to Warehouse",
                  issued_user_name: itemData.user_name,
                  requested_date: Date.now(),
                  actual_items: [],
                  temp_array: [],
                  pickup_type: itemData.value,
                  "items.$.pickup_toTray": itemData.toTray,
                  to_tray_for_pickup: itemData.toTray,
                },
              }
            );
          }
          if (sendtoPickupRequest) {
            toTray = await masters.findOneAndUpdate(
              { code: itemData.toTray },
              {
                $set: {
                  sort_id: "Pickup Request sent to Warehouse",
                  issued_user_name: itemData.user_name,
                  pickup_type: itemData.value,
                  pickup_next_stage: itemData.nextStage,
                },
                $push: {
                  temp_array: x,
                },
              }
            );
          } else {
            return null;
          }

          let state = "Tray";
          if (arr.includes(sendtoPickupRequest.code)) {
            state = "Units";
          }
          arr.push(sendtoPickupRequest.code);

          let unitsLogCreation = await unitsActionLog.create({
            action_type: "Pickup Request sent to Warehouse",
            created_at: Date.now(),
            agent_name: itemData.user_name,
            user_type: "PRC Mis",
            uic: x,
            tray_id: sendtoPickupRequest.code,
            track_tray: state,
            description: `Pickup Request sent to Warehouse to agent :${itemData.user_name} by Mis :${itemData.actUser}`,
          });

          let updateDelivery = await delivery.updateOne(
            { "uic_code.code": x },
            {
              $set: {
                pickup_request_sent_to_wh_date: Date.now(),
                tray_status: "Pickup Request sent to Warehouse",
              },
            }
          );
        }
      }

      if (sendtoPickupRequest) {
        return sendtoPickupRequest;
      } else {
        return null;
      }
    } catch (error) {
      return error;
    }
  },
  pickUpReassign: (reAssignData) => {
    return new Promise(async (resolve, reject) => {
      const fromTray = await masters.updateOne(
        { code: reAssignData.fromTray },
        {
          $set: {
            issued_user_name: reAssignData.sort_agent,
          },
        }
      );
      if (fromTray.modifiedCount !== 0) {
        const toTray = await masters.updateOne(
          { code: reAssignData.toTray },
          {
            $set: {
              issued_user_name: reAssignData.sort_agent,
            },
          }
        );
        if (toTray.modifiedCount !== 0) {
          resolve({ status: 1 });
        } else {
          resolve({ status: 2 });
        }
      } else {
        resolve({ status: 2 });
      }
    });
  },
  getAuditDone: (location) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.aggregate([
        {
          $match: {
            sort_id: "Ready to RDL-1",
            type_taxanomy: "WHT",
            cpc: location,
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "items.muic",
            foreignField: "muic",
            as: "products",
          },
        },
        {
          $lookup: {
            from: "trayracks",
            localField: "rack_id",
            foreignField: "rack_id",
            as: "rackData",
          },
        },
      ]);
      if (data) {
        resolve(data);
      }
    });
  },
  assignToAgentRequestToWhRdlFls: (tray, user_name, sortId, actUser) => {
    return new Promise(async (resolve, reject) => {
      let sendtoRdlMis;
      let newStatus = sortId;
      for (let x of tray) {
        if (sortId == "Send for RDL-2") {
          sendtoRdlMis = await masters.findOneAndUpdate(
            { code: x },
            {
              $set: {
                sort_id: sortId,
                actual_items: [],
                issued_user_name: user_name,
                from_merge: null,
                to_merge: null,
                requested_date: Date.now(),
              },
            }
          );
          if (
            sendtoRdlMis &&
            sendtoRdlMis.sp_tray !== null &&
            sendtoRdlMis.sp_tray !== undefined
          ) {
            const updateSp = await masters.findOneAndUpdate(
              { code: sendtoRdlMis.sp_tray },
              {
                $set: {
                  rdl_2_user_temp: user_name,
                },
              }
            );
          }
        } else {
          sendtoRdlMis = await masters.findOneAndUpdate(
            { code: x },
            {
              $set: {
                sort_id: sortId,
                actual_items: [],
                issued_user_name: user_name,
                from_merge: null,
                to_merge: null,
                requested_date: Date.now(),
              },
            }
          );
        }
        if (sendtoRdlMis.items?.length !== 0) {
          let state = "Tray";
          if (newStatus == "Send for RDL-1") {
            newStatus = "Send for RDL-1";
          }
          for (let y of sendtoRdlMis.items) {
            let unitsLogCreation = await unitsActionLog.create({
              action_type: newStatus,
              created_at: Date.now(),
              user_name_of_action: actUser,
              agent_name: user_name,
              user_type: "PRC MIS",
              uic: y.uic,
              tray_id: x,
              track_tray: state,
              description: `${newStatus} to agent :${user_name} by mis :${actUser}`,
            });
            state = "Units";
          }
        }
      }
      if (sendtoRdlMis) {
        resolve({ status: true });
      } else {
        resolve({ status: false });
      }
    });
  },
  getRdlFlsUser: (userType, location) => {
    return new Promise(async (resolve, reject) => {
      let data = await user
        .find({ user_type: userType, status: "Active", cpc: location })
        .sort({ user_name: 1 });
      if (data) {
        resolve(data);
      }
    });
  },
  getRdlDonetray: (location) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.aggregate([
        {
          $match: {
            sort_id: "Ready to RDL-2",
            type_taxanomy: "RPT",
            cpc: location,
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "items.muic",
            foreignField: "muic",
            as: "products",
          },
        },
        {
          $lookup: {
            from: "trayracks",
            localField: "rack_id",
            foreignField: "rack_id",
            as: "rack",
          },
        },
        {
          $lookup: {
            from: "masters",
            localField: "sp_tray",
            foreignField: "code",
            as: "spTray",
          },
        },
        {
          $unwind: {
            path: "$spTray",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $lookup: {
            from: "trayracks",
            localField: "spTray.rack_id",
            foreignField: "rack_id",
            as: "rackIdForSP",
          },
        },
      ]);
      if (data) {
        resolve(data);
      }
    });
  },
  getSalesLocation: (cpcType) => {
    return new Promise(async (resolve, reject) => {
      if (cpcType == "Sales") {
        let locationGet = await infra.find({ location_type: "Processing" });
        resolve(locationGet);
      } else {
        let locationGet = await infra.find({ location_type: "Sales" });
        resolve(locationGet);
      }
    });
  },
  ctxTrayTransferRequestSend: (trayData) => {
    return new Promise(async (resolve, reject) => {
      for (let x of trayData.tray) {
        const sentToWarehouse = await masters.findOneAndUpdate(
          { code: x },
          {
            $set: {
              sort_id: trayData.sort_id,
              requested_date: Date.now(),
              recommend_location: trayData.sales,
            },
          }
        );
        if (sentToWarehouse.items.length == 0) {
          await unitsActionLog.create({
            action_type: "Transfer Request sent to Warehouse",
            created_at: Date.now(),
            user_name_of_action: trayData.actioUser,
            user_type: `${trayData?.cpc_type} Mis`,
            agent_name: trayData.actionUser,
            tray_id: x,
            track_tray: "Tray",
            description: `Transfer Request sent to Warehouse by MIS :${trayData.actionUser}`,
          });
        } else {
          let state = "Tray";
          for (let y of sentToWarehouse.items) {
            await unitsActionLog.create({
              action_type: "Transfer Request sent to Warehouse",
              created_at: Date.now(),
              user_name_of_action: trayData.actioUser,
              user_type: `${trayData?.cpc_type} MIS`,
              agent_name: trayData.actionUser,
              tray_id: x,
              uic: y.uic,
              track_tray: state,
              description: `Transfer Request sent to Warehouse by MIS :${trayData.actionUser}`,
            });
            state = "Units";
          }
        }
      }

      resolve({ status: 1 });
    });
  },
  /*----------------------------SORTING CTX TO STX -------------------------------------*/
  sortingCtxToStxStxTrayGet: (
    location,
    brand,
    model,
    fromTray,
    itemCount,
    status,
    type
  ) => {
    return new Promise(async (resolve, reject) => {
      let arr = [];
      let stxTray = [];
      let getCtxGrade = await trayCategory.findOne({ code: type });
      if (getCtxGrade) {
        stxTray = await masters
          .find({
            $or: [
              {
                prefix: "tray-master",
                type_taxanomy: "ST",
                brand: brand,
                model: model,
                tray_grade: getCtxGrade.code,
                cpc: location,
                sort_id: "Open",
              },
              {
                prefix: "tray-master",
                type_taxanomy: "ST",
                brand: brand,
                model: model,
                $expr: {
                  $and: [
                    { $ne: [{ $ifNull: ["$items", null] }, null] },
                    { $ne: [{ $size: "$items" }, { $toInt: "$limit" }] },
                  ],
                },
                tray_grade: getCtxGrade.code,
                cpc: location,
                sort_id: "Inuse",
              },
            ],
          })
          .catch((err) => reject(err));

        if (stxTray.length !== 0) {
          for (let x of stxTray) {
            if (parseInt(x.limit) > parseInt(x.items.length)) {
              arr.push(x);
            }
          }
          if (arr.length !== 0) {
            resolve({ status: 1, tray: arr });
          } else {
            resolve({ status: 0 });
          }
        } else {
          resolve({ status: 0 });
        }
      } else {
        resolve({ status: 3 });
      }
    });
  },
  whtToRpMuicListToRepair: (location) => {
    return new Promise(async (resolve, reject) => {
      const findItem = await masters.aggregate([
        {
          $match: {
            $or: [
              {
                "items.rdl_fls_report.selected_status": "Repair Required",
                cpc: location,
                sort_id: "Ready to RDL-2",
              },
            ],
          },
        },
        {
          $unwind: "$items",
        },
        {
          $match: {
            "items.rdl_fls_report.selected_status": "Repair Required",
            "items.rdl_repair_report.reason": {
              $ne: "Device not repairable",
            },
          },
        },
        {
          $group: {
            _id: {
              model: "$items.model_name",
              brand: "$items.brand_name",
              muic: "$items.muic",
              part_id: "$items.rdl_fls_report.partRequired.part_id",
            },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: {
              brand: "$_id.brand",
              model: "$_id.model",
              muic: "$_id.muic",
            },
            parts: {
              $push: {
                part_id: "$_id.part_id",
                count: "$count",
              },
            },
          },
        },
      ]);
      const partCodes = findItem.flatMap((x) =>
        x.parts.map((part) => part.part_id?.[0])
      );

      const partAndColorData = await partAndColor.find({
        part_code: { $in: partCodes },
      });
      const newArr = findItem.map((x) => {
        let required_qty = 0;
        let unitsCount = 0;
        x.parts.forEach((y) => {
          const checkThePart = partAndColorData.find(
            (part) => part.part_code === y.part_id?.[0]
          );
          if (checkThePart) {
            let qty = checkThePart.avl_stock - y.count;
            unitsCount += y.count;
            if (0 < qty) {
              let required = Math.abs(qty);
              required_qty += required;
            }
          } else {
            required_qty += y.count;
          }
        });
        x["repair_units"] = unitsCount;
        if (required_qty >= 0) {
          x["required_qty"] = required_qty;
          return x;
        }
      });
      const resolvedArr = newArr.filter(Boolean); // Remove any null values from the array
      resolve(resolvedArr);
    });
  },
  whtToRpMuicListToRepairWithoutSp: (location) => {
    return new Promise(async (resolve, reject) => {
      const findItem = await masters.aggregate([
        {
          $unwind: "$items",
        },
        {
          $match: {
            $or: [
              {
                "items.rdl_fls_report.selected_status": "Software Installation",
                cpc: location,
                sort_id: "Ready to RDL-2",
              },
              {
                "items.rdl_fls_report.selected_status": "Motherboard Work",
                cpc: location,
                sort_id: "Ready to RDL-2",
              },
            ],
          },
        },
        {
          $match: {
            $or: [
              {
                "items.rdl_fls_report.selected_status": "Motherboard Work",
              },
              {
                "items.rdl_fls_report.selected_status": "Software Installation",
              },
            ],
          },
        },

        {
          $group: {
            _id: {
              model: "$items.model_name",
              brand: "$items.brand_name",
              muic: "$items.muic",
            },
            items: { $push: "$items" },
            count: { $sum: 1 },
          },
        },
      ]);
      findItem.map((data) => {
        (data["Motherboard"] = data.items.filter(
          (item) => item.rdl_fls_report.selected_status === "Motherboard Work"
        ).length),
          (data["Software"] = data.items.filter(
            (item) =>
              item.rdl_fls_report.selected_status === "Software Installation"
          ).length);
      });
      resolve(findItem);
    });
  },
  procurmentRepairScreen: (location) => {
    return new Promise(async (resolve, reject) => {
      const findItem = await masters.aggregate([
        {
          $match: {
            "items.rdl_fls_report.selected_status": "Repair Required",
            cpc: location,
            sort_id: "Ready to RDL-2",
          },
        },
        {
          $unwind: "$items",
        },
        {
          $match: {
            "items.rdl_fls_report.selected_status": "Repair Required",
          },
        },
        {
          $group: {
            _id: {
              brand: "$items.brand_name",
              model: "$items.model_name",
              muic: "$items.muic",
              part_id: "$items.rdl_fls_report.partRequired.part_id",
            },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: {
              brand: "$_id.brand",
              model: "$_id.model",
              muic: "$_id.muic",
            },
            parts: {
              $push: {
                part_id: "$_id.part_id",
                count: "$count",
              },
            },
          },
        },
      ]);
      const partCodes = findItem.flatMap((x) =>
        x.parts.map((part) => part.part_id?.[0])
      );
      const partAndColorData = await partAndColor.find({
        part_code: { $in: partCodes },
      });
      const newArr = findItem.map((x) => {
        let required_qty = 0;
        x.parts.forEach((y) => {
          const checkThePart = partAndColorData.find(
            (part) => part.part_code === y.part_id?.[0]
          );
          if (checkThePart) {
            let qty = checkThePart.avl_stock - y.count;

            if (qty < 0) {
              let required = Math.abs(qty);
              required_qty += required;
            }
          } else {
            required_qty += y.count;
          }
        });
        if (required_qty !== 0) {
          x["required_qty"] = required_qty;
          return x;
        }
      });
      const resolvedArr = newArr.filter(Boolean); // Remove any null values from the array
      resolve(resolvedArr);
    });
  },
  whtToRpMuicListToRepairAssignForRepair: (location, brand, model) => {
    return new Promise(async (resolve, reject) => {
      const findItem = await masters.aggregate([
        {
          $match: {
            $or: [
              {
                "items.rdl_fls_report.selected_status": "Repair Required",
                cpc: location,
                brand: brand,
                model: model,
                type_taxanomy: "WHT",
                sort_id: "Ready to RDL-2",
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
            localField: "items.uic",
            foreignField: "uic_code.code",
            as: "deliveryData",
          },
        },
        {
          $lookup: {
            from: "trayracks",
            localField: "rack_id",
            foreignField: "rack_id",
            as: "rackData",
          },
        },
        {
          $unwind: "$rackData",
        },
        {
          $match: {
            "items.rdl_fls_report.selected_status": "Repair Required",
            "items.rdl_repair_report.reason": {
              $ne: "Device not repairable",
            },
          },
        },
        {
          $unwind: "$deliveryData", // Unwind the deliveryData array if it's an array
        },
        {
          $project: {
            rackData: 1,
            "deliveryData.rdl_fls_done_units_date": 1,
            "deliveryData._id": 1,
            items: "$items",
            closed_date_agent: "$closed_date_agent",
            code: "$code",
          },
        },
        {
          $sort: {
            "deliveryData.rdl_fls_done_units_date": -1,
          },
        },
      ]);
      let partsAvailable = [];
      let partsNotAvailable = [];
      let units = [];
      let temp = [];
      if (findItem) {
        for (let x of findItem) {
          let flag = false;
          if(x?.items?.rdl_fls_report?.partRequired.length == 0){
            flag=true
          }
          else{
            for (let y of x?.items?.rdl_fls_report?.partRequired) {
              const checkPart = await partAndColor.findOne({
                part_code: y?.part_id,
              });
              if (checkPart) {
                y["avl_qty"] = checkPart?.avl_stock;
              } else {
                y["avl_qty"] = 0;
              }
              temp.push(y.part_id);
              let count = temp.filter(function (element) {
                return element === y.part_id;
              }).length;
  
              if (Number(count) <= Number(checkPart?.avl_stock)) {
              } else {
                flag = true;
              }
            }
          }
          if (flag) {
            x.items.rdl_fls_report.partRequired?.forEach((item) => {
              let matchingIndex = temp.findIndex(
                (element) => item?.part_id === element
              );
              if (matchingIndex !== -1) {
                // Remove one element at the found index
                temp.splice(matchingIndex, 1);
              }
            });
            partsNotAvailable.push(x);
          } else {
            partsAvailable.push(x);
          }
        }
        resolve({
          partsNotAvailable: partsNotAvailable,
          partsAvailable: partsAvailable,
          status: 1,
        });
      } else {
        resolve({ status: 2 });
      }
    });
  },
  whtToRpMuicListToRepairAssignForRepairWithoutSp: (location, brand, model) => {
    return new Promise(async (resolve, reject) => {
      const findItem = await masters.aggregate([
        {
          $match: {
            $or: [
              {
                "items.rdl_fls_report.selected_status": "Software Installation",
                cpc: location,
                brand: brand,
                model: model,
                type_taxanomy: "WHT",
                sort_id: "Ready to RDL-2",
              },
              {
                "items.rdl_fls_report.selected_status": "Motherboard Work",
                cpc: location,
                brand: brand,
                model: model,
                type_taxanomy: "WHT",
                sort_id: "Ready to RDL-2",
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
            localField: "items.uic",
            foreignField: "uic_code.code",
            as: "deliveryData",
          },
        },
        {
          $lookup: {
            from: "trayracks",
            localField: "rack_id",
            foreignField: "rack_id",
            as: "rackData",
          },
        },
        {
          $unwind: "$rackData", // Unwind the deliveryData array if it's an array
        },
        {
          $unwind: "$deliveryData", // Unwind the deliveryData array if it's an array
        },
        {
          $match: {
            $or: [
              {
                "items.rdl_fls_report.selected_status": "Motherboard Work",
              },
              {
                "items.rdl_fls_report.selected_status": "Software Installation",
              },
            ],
          },
        },
        {
          $project: {
            rackData: 1,
            items: "$items",
            "deliveryData.rdl_fls_closed_date": 1,
            closed_date_agent: "$closed_date_agent",
            code: "$code",
          },
        },
      ]);
      resolve(findItem);
    });
  },
  assignForRepairStockCheck: (partId, uic, isCheck, checked, selectedQtySp) => {
    return new Promise(async (resolve, reject) => {
      let countofStock = selectedQtySp;
      let flag = false;
      for (let x of partId) {
        if (!checked) {
          isCheck = isCheck
            .map((item) => {
              let updated;
              if (item?.partId === x?.part_id) {
                countofStock = countofStock - 1;
                updated = {
                  ...item,
                  uic: item?.uic.filter((uicData) => uicData !== uic),
                  selected_qty: Number(item?.selected_qty) - 1,
                  balance_stock: Number(item?.balance_stock) + 1,
                };
                flag = true;
              }
              if (item?.uic?.length === 1 && flag) {
                flag = false;
                return;
              } else if (flag) {
                flag = false;
                return updated;
              } else {
                flag = false;
                return item;
              }
            })
            .filter((item) => item !== undefined);
        } else {
          const foundPart = isCheck?.find(
            (item) => item?.partId === x?.part_id
          );
          if (foundPart) {
            isCheck = isCheck.map((item) => {
              if (item?.partId === x?.part_id) {
                if (Number(item?.balance_stock) > 0) {
                  const updatedItem = {
                    ...item,
                    selected_qty: Number(item?.selected_qty) + 1,
                    balance_stock: Number(item?.balance_stock) - 1,
                  };
                  countofStock = countofStock + 1;
                  updatedItem.uic.push(uic);
                  return updatedItem;
                } else {
                  resolve({ status: 0, partid: x?.part_id });
                }
              }
              return item;
            });
          } else {
            const checkQty = await partAndColor.findOne({
              type: "part-list",
              part_code: x.part_id,
              status: "Active",
            });
            if (checkQty) {
              if (checkQty?.box_id !== undefined) {
                let check = checkQty?.avl_stock - Math.abs(1);
                if (check < 0) {
                  resolve({ status: 0, partid: x?.part_id });
                } else {
                  countofStock = countofStock + 1;
                  let obj = {
                    uic: [uic],
                    box_id: checkQty.box_id,
                    partName: x?.part_name,
                    partId: x?.part_id,
                    avl_stock: checkQty?.avl_stock,
                    selected_qty: 1,
                    balance_stock: check,
                    status: "Pending",
                  };
                  isCheck.push(obj);
                }
              } else {
                resolve({ status: 6 });
              }
            } else {
              resolve({ status: 5 });
            }
          }
        }
      }
      resolve({ status: 1, isCheck, countofStock: countofStock });
    });
  },
  plannerPageCharging: (location, type, type1) => {
    return new Promise(async (resolve, reject) => {
      const plannerData = await masters.aggregate([
        {
          $match: {
            $or: [
              {
                cpc: location,
                sort_id: type,
                type_taxanomy: "WHT",
                prefix: "tray-master",
              },
              {
                cpc: location,
                prefix: "tray-master",
                type_taxanomy: "WHT",
                sort_id: type1,
              },
            ],
          },
        },
        {
          $group: {
            _id: {
              brand: "$brand",
              model: "$model",
              charging_jack_type: "$items.charging.charging_jack_type",
            },
            count: { $sum: 1 },
          },
        },
      ]);

      resolve(plannerData);
    });
  },

  assigneToChargingScreen: (location, brand, model, jack, type, type1) => {
    return new Promise(async (resolve, reject) => {
      const data = await masters.find({
        $or: [
          {
            cpc: location,
            prefix: "tray-master",
            sort_id: type,
            type_taxanomy: "WHT",
            brand: brand,
            model: model,
            "items.charging.charging_jack_type": jack,
          },
          {
            cpc: location,
            prefix: "tray-master",
            type_taxanomy: "WHT",
            sort_id: type1,
            "items.charging.charging_jack_type": jack,
          },
        ],
      });

      resolve(data);
    });
  },
  assignForRepairSortingGetTheRequrements: (
    location,
    uicLength,
    brand,
    model,
    isCheck,
    selectedQtySp
  ) => {
    return new Promise(async (resolve, reject) => {
      const getSortingAgent = await user.find({
        user_type: "Sorting Agent",
        status: "Active",
        cpc: location,
      });
      const spWhUser = await user.find({
        user_type: "SP User",
        status: "Active",
        cpc: location,
      });
      const getRpTray = await masters.find({
        prefix: "tray-master",
        type_taxanomy: "RPT",
        sort_id: "Open",
        brand: brand,
        model: model,
        cpc: location,
      });
      const rpArr = [];
      if (getRpTray.length !== 0) {
        for (let rpt of getRpTray) {
          if (parseInt(rpt.limit) >= uicLength) {
            rpArr.push(rpt);
          }
        }
      }
      const getSpTray = await masters.find({
        prefix: "tray-master",
        type_taxanomy: "SPT",
        sort_id: "Open",
        cpc: location,
        limit: { $gte: selectedQtySp.toString() },
      });
      const spArr = [];
      if (getSpTray.length !== 0) {
        for (let spt of getSpTray) {
          if (parseInt(spt.limit) >= parseInt(isCheck)) {
            spArr.push(spt);
          }
        }
      }
      resolve({
        getSpTray: spArr,
        getRpTray: rpArr,
        spWhUser: spWhUser,
        getSortingAgent: getSortingAgent,
      });
    });
  },
  whtToRpSortingAssign: (
    spDetails,
    spTray,
    rpTray,
    spwhuser,
    sortingUser,
    selectedUic,
    actUser,
    screen
  ) => {
    return new Promise(async (resolve, reject) => {
      let whtTrayArr = [],
        otherTray = [];
      for (let uic of selectedUic) {
        const updateItem = await masters.findOneAndUpdate(
          {
            "items.uic": uic,
            type_taxanomy: "WHT",
          },
          {
            $set: {
              "items.$.rp_tray": rpTray,
              rp_tray: rpTray,
              requested_date: Date.now(),
              issued_user_name: sortingUser,
              sort_id: "Assigned to sorting (Wht to rp)",
              "track_tray.wht_to_rp_assigned_to_sorting": Date.now(),
            },
          }
        );
        if (updateItem) {
          if (whtTrayArr.includes(updateItem.code) == false) {
            state = "Tray";
            for (let y of updateItem.items) {
              let unitsLogCreation = await unitsActionLog.create({
                action_type: "Assigned to sorting (WHT TO RP)",
                created_at: Date.now(),
                user_name_of_action: actUser,
                agent_name: sortingUser,
                user_type: "PRC MIS",
                uic: y.uic,
                tray_id: updateItem.code,
                track_tray: state,
                description: `Assigned to sorting (WHT TO RP) to agent :${sortingUser} by mis :${actUser}`,
              });
              state = "Units";
            }
            whtTrayArr.push(updateItem.code);
          }
        } else {
          resolve({ status: 0 });
        }
      }
      if (whtTrayArr.length !== 0) {
        const rpTrayUpdation = await masters.findOneAndUpdate(
          { code: rpTray },
          {
            $set: {
              issued_user_name: sortingUser,
              requested_date: Date.now(),
              wht_tray: whtTrayArr,
              temp_array: selectedUic,
              sp_tray: spTray,
              sort_id: "Assigned to sorting (Wht to rp)",
              "track_tray.wht_to_rp_assigned_to_sorting": Date.now(),
            },
          }
        );
        otherTray.push(rpTray);
        if (rpTrayUpdation && screen == "WithSp") {
          const spTrayUpdation = await masters.findOneAndUpdate(
            { code: spTray },
            {
              $set: {
                issued_user_name: spwhuser,
                requested_date: Date.now(),
                items: spDetails,
                sort_id: "Assigned to sp warehouse",
                rp_tray: rpTray,
              },
            }
          );
          if (spTrayUpdation && screen == "WithSp") {
            otherTray.push(spTray);
            for (let x of spDetails) {
              let updateParts = await partAndColor.updateOne(
                { part_code: x.partId },
                {
                  $set: {
                    avl_stock: x.balance_stock,
                  },
                }
              );
              if (updateParts.modifiedCount !== 0) {
                await partInventoryLedger.create({
                  department: "PRC MIS",
                  action: "Part Assigning",
                  action_done_user: actUser,
                  description: `Part assigned by prc mis:${actUser},to SPWH agent:${spwhuser} for part issue`,
                  part_code: x.partId,
                  avl_stock: Number(x.balance_stock),
                  out_stock: x.selected_qty,
                  tray_id: spTray,
                });
                let limit = x.selected_qty;
                for (let i = 1; i <= limit; i++) {
                  x.selected_qty = 1;
                  const spTrayUpdation = await masters.findOneAndUpdate(
                    { code: spTray },
                    {
                      $push: {
                        actual_items: x,
                      },
                    }
                  );
                }
              } else {
                resolve({ status: 0 });
              }
            }
            let obj = {
              code: otherTray,
              agent_name: spwhuser,
              actUser: actUser,
              description: "Assigned to sorting (WHT TO RP) to agent",
            };
            let unitsLogCreation = await unitsActionLog.create({
              action_type: "Assigned to sp warehouse for parts issue to agent",
              created_at: Date.now(),
              agent_name: spwhuser,
              user_type: "PRC MIS",
              tray_id: spTray,
              track_tray: "Tray",
              description: `Assigned to sp warehouse for parts issue to agent: :${spwhuser} by mis :${actUser}`,
            });
            let logCreationRes = await module.exports.trackSpAndRpAssignLevel(
              obj
            );
            if (logCreationRes.status == 1) {
              resolve({ status: 1 });
            } else {
              resolve({ status: 0 });
            }
          } else {
            resolve({ status: 0 });
          }
        } else if (screen == "WithoutSp" && rpTrayUpdation) {
          let obj = {
            code: otherTray,
            agent_name: sortingUser,
            actUser: actUser,
            description: "Assigned to sorting (WHT TO RP) to agent",
          };
          let logCreationRes = await module.exports.trackSpAndRpAssignLevel(
            obj
          );
          if (logCreationRes.status == 1) {
            resolve({ status: 1 });
          } else {
            resolve({ status: 0 });
          }
        } else {
          resolve({ status: 0 });
        }
      } else {
        resolve({ status: 0 });
      }
    });
  },
  trackSpAndRpAssignLevel: async (obj) => {
    try {
      let flag = true;
      for (let x of obj.code) {
        let unitsLogCreation = await unitsActionLog.create({
          action_type: x.description,
          created_at: Date.now(),
          agent_name: obj.agent_name,
          user_type: "PRC MIS",
          tray_id: x,
          track_tray: "Tray",
          description: `${obj.description} :${obj.agent_name} by mis :${obj.actUser}`,
        });
        if (unitsLogCreation == null) {
          flag = false;
          break;
        }
      }
      if (flag) {
        return { status: 1 };
      } else {
        return { status: 0 };
      }
    } catch (error) {
      return error;
    }
  },
  sortingCtxtoStxRequestSendToWh: (
    sortingAgent,
    fromTray,
    toTray,
    actionUser
  ) => {
    let updateFromTray;
    return new Promise(async (resolve, reject) => {
      updateFromTray = await masters.findOneAndUpdate(
        { code: fromTray },
        {
          $set: {
            sort_id: "Ctx to Stx Send for Sorting",
            requested_date: Date.now(),
            issued_user_name: sortingAgent,
            to_merge: toTray,
            from_merge: null,
            actual_items: [],
          },
        }
      );
      if (updateFromTray) {
        const updateToTray = await masters.updateOne(
          { code: toTray },
          {
            $set: {
              sort_id: "Ctx to Stx Send for Sorting",
              requested_date: Date.now(),
              issued_user_name: sortingAgent,
              from_merge: fromTray,
              to_merge: null,
              actual_items: [],
            },
          }
        );
        if (updateToTray.modifiedCount !== 0) {
          let state = "Tray";
          for (let x of updateFromTray.items) {
            let unitsLogCreation = await unitsActionLog.create({
              action_type: "Ctx to Stx Send for Sorting",
              created_at: Date.now(),
              agent_name: sortingAgent,
              user_type: "Sales Mis",
              uic: x.uic,
              tray_id: updateFromTray.code,
              track_tray: state,
              description: `Ctx to Stx Send for Sorting to agent :${sortingAgent} by Mis :${actionUser}`,
            });
            state = "Units";
          }
          resolve({ status: 1 });
        } else {
          resolve({ status: 0 });
        }
      } else {
        resolve({ status: 0 });
      }
    });
  },
  /*--------------------------------WHT UTILITY-----------------------------------------*/
  whtutilitySearch: (oldUc) => {
    return new Promise(async (resolve, reject) => {
      let tempDeliveryData = await tempDelivery.aggregate([
        { $match: { old_uic: oldUc } },
        {
          $lookup: {
            from: "products",
            localField: `item_id`,
            foreignField: "vendor_sku_id",
            as: "products",
          },
        },
      ]);
      if (tempDeliveryData.length !== 0) {
        let tempOrderData = await tempOrders.aggregate([
          {
            $match: { order_id: tempDeliveryData[0].order_id },
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
        let orgOrder = await orders.aggregate([
          {
            $match: { order_id: tempDeliveryData[0].order_id },
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
        let orgDelivery = await delivery.aggregate([
          {
            $match: { order_id: tempDeliveryData[0].order_id },
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
          status: 1,
          tempDeliveryData: tempDeliveryData,
          tempOrderData: tempOrderData,
          orgOrder: orgOrder,
          orgDelivery: orgDelivery,
        });
      } else {
        resolve({ status: 2 });
      }
    });
  },
  whtUtilityBagAndBot: (location) => {
    return new Promise(async (resolve, reject) => {
      let bag = await masters.find({
        cpc: location,
        prefix: "bag-master",
        sort_id: "No Status",
      });
      let tray = await masters.find({
        $or: [
          {
            $expr: {
              $and: [
                { $ne: [{ $ifNull: ["$items", null] }, null] },
                { $ne: [{ $size: "$items" }, { $toInt: "$limit" }] },
              ],
            },
            cpc: location,
            prefix: "tray-master",
            sort_id: "Open",
            type_taxanomy: "BOT",
          },
          {
            $expr: {
              $and: [
                { $ne: [{ $ifNull: ["$items", null] }, null] },
                { $ne: [{ $size: "$items" }, { $toInt: "$limit" }] },
              ],
            },
            cpc: location,
            prefix: "tray-master",
            sort_id: "Wht-utility-work",
            type_taxanomy: "BOT",
          },
        ],
      });
      let botUsers = await user.find({
        status: "Active",
        cpc: location,
        user_type: "Bag Opening",
      });

      resolve({ bag: bag, tray: tray, botUsers: botUsers });
    });
  },
  whtUtilityGetBotTrayInuse: () => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        $or: [
          {
            prefix: "tray-master",
            sort_id: "Wht-utility-work",
            type_taxanomy: "BOT",
          },
          {
            prefix: "tray-master",
            sort_id: "Wht-utility Resticker Done",
            type_taxanomy: "BOT",
          },
        ],
      });
      resolve(data);
    });
  },
  whtUtilityImportOrder: (orderData) => {
    return new Promise(async (resolve, reject) => {
      let arr = [];
      let locationCheck = await infra.findOne({ code: orderData.partner_shop });
      if (locationCheck == null) {
        arr.push(`${orderData.partner_shop}- "Location Not Exists"`);
      }
      let brandAndModel = await products.findOne({
        vendor_sku_id: orderData.item_id,
      });
      if (brandAndModel == null) {
        arr.push(
          `${orderData?.old_item_details} - Brand name or model namee not Exists`
        );
      }
      if (arr.length == 0) {
        let checkAlreadyImport = await orders.findOne({
          order_id: orderData.order_id,
        });
        if (checkAlreadyImport) {
          resolve({ status: 4 });
        } else {
          orderData.created_at = Date.now();
          let importOrder = await orders.create(orderData);
          if (importOrder) {
            resolve({ status: 1 });
          } else {
            resolve({ status: 3 });
          }
        }
      } else {
        resolve({ status: 2, arr: arr });
      }
    });
  },
  whtUtilityBotTrayGetOne: (trayId, status) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.findOne({ code: trayId });
      if (data) {
        if (data.sort_id == status) {
          resolve({ status: 1, tray: data });
        } else {
          resolve({ status: 3 });
        }
      } else {
        resolve({ status: 2 });
      }
    });
  },
  checkUicFroWhtUtility: (trayId, uic) => {
    return new Promise(async (resolve, reject) => {
      let data = await tempDelivery.findOne({ old_uic: uic });
      if (data) {
        let getDelivery = await delivery.findOne({ order_id: data.order_id });
        if (getDelivery) {
          if (getDelivery.uic_status == "Printed") {
            let checkExitThisTray = await masters.findOne({
              code: trayId,
              items: { $elemMatch: { uic: getDelivery.uic_code.code } },
            });
            if (checkExitThisTray) {
              let alreadyAdded = await masters.findOne({
                code: trayId,
                "actual_items.uic": getDelivery.uic_code.code,
              });
              if (alreadyAdded) {
                resolve({ status: 3 });
              } else {
                let arr = [];
                let obj;
                for (let x of checkExitThisTray.items) {
                  if (x.uic == getDelivery.uic_code.code) {
                    obj = x;
                  }
                }
                let findProduct = await products.findOne({
                  vendor_sku_id: getDelivery.item_id,
                });
                arr.push(obj);
                arr.push(findProduct);
                resolve({ status: 4, data: arr });
              }
            } else {
              resolve({ status: 2 });
            }
          } else {
            resolve({ status: 7 });
          }
        } else {
          resolve({ status: 6 });
        }
      } else {
        resolve({ status: 1 });
      }
    });
  },
  whtUtilityRestickerSave: (trayId) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.updateOne(
        { code: trayId },
        {
          $set: {
            sort_id: "Wht-utility Resticker Done",
            actual_items: [],
          },
        }
      );
      if (data.modifiedCount !== 0) {
        resolve({ status: 1 });
      } else {
        resolve({ status: 0 });
      }
    });
  },
  whtutilityAddDelivery: (deliveryData) => {
    return new Promise(async (resolve, reject) => {
      let arr = [];
      let locationCheck = await infra.findOne({
        code: deliveryData.utilty.partner_shop,
      });
      if (locationCheck == null) {
        arr.push(`${deliveryData.utilty.partner_shop}- "Location Not Exists"`);
      }
      let brandAndModel = await products.findOne({
        vendor_sku_id: deliveryData.utilty.item_id,
      });
      if (brandAndModel == null) {
        arr.push(`${deliveryData.utilty.item_id} - Vendor Sku Id not exists`);
      }
      if (arr.length == 0) {
        deliveryData.utilty.created_at = Date.now();
        deliveryData.utilty.stockin_date = Date.now();
        deliveryData.utilty.stockin_date = Date.now();
        deliveryData.utilty.bag_id = deliveryData.extra.bag_id;
        deliveryData.utilty.agent_name = deliveryData.extra.bot_agent;
        deliveryData.utilty.tray_id = deliveryData.extra.tray_id;
        deliveryData.utilty.assign_to_agent = Date.now();
        deliveryData.utilty.stock_in_status = "Valid";
        deliveryData.utilty.bag_close_date = Date.now();
        deliveryData.utilty.warehouse_close_date = Date.now();
        deliveryData.utilty.tray_status = "Closed By Bot Agent";
        deliveryData.utilty.tray_type = "BOT";
        deliveryData.utilty.tray_location = "Warehouse";
        deliveryData.utilty.bot_done_received = Date.now();
        deliveryData.utilty.tray_closed_by_bot = Date.now();
        let obj = {
          awbn_number: deliveryData.utilty.tracking_id,
          order_id: deliveryData.utilty?.order_id,
          order_date: deliveryData.utilty?.order_date,
          imei: deliveryData.utilty?.imei,
          status: "Valid",
          tray_id: deliveryData.extra.tray_id,
          bag_id: deliveryData.extra.bag_id,
          user_name: deliveryData.extra.bot_agent,
          bag_assigned_date: Date.now(),
          uic: deliveryData.utilty?.uic_code.code,
          old_uic: deliveryData.utilty.old_uic,
        };
        let checkDup = await delivery.findOne({
          order_id: deliveryData.utilty.order_id,
        });
        if (checkDup) {
          resolve({ status: 5 });
        } else {
          let importOrder = await delivery.create(deliveryData.utilty);
          let updateOrder = await orders.updateOne(
            { order_id: deliveryData.utilty.order_id },
            {
              $set: {
                delivery_status: "Delivered",
              },
            }
          );
          let addToTray = await masters.updateOne(
            {
              code: deliveryData.extra.tray_id,
            },
            {
              $push: {
                items: obj,
              },
              $set: {
                sort_id: "Wht-utility-work",
              },
            }
          );
          if (importOrder) {
            resolve({ status: 1 });
          } else {
            resolve({ status: 3 });
          }
        }
      } else {
        resolve({ status: 2, arr: arr });
      }
    });
  },
  whtUtilityImportFile: (xlsxData) => {
    return new Promise(async (resolve, reject) => {
      // let tempDeliveryData=await tempDelivery.find({})
      // let first=0
      // let second=0
      // let third=0

      // for(let x of tempDeliveryData){
      //   console.log(x);
      //   if (x.uic_code.code.slice(0, 4) === "9101") {
      //     first++
      //   } else if(x.uic_code.code.slice(0, 4) === "9203") {
      //     second++
      //   }
      //   else if(x.uic_code.code.slice(0, 4) === "9001") {
      //     third++
      //   }
      // }
      // console.log("first-",first)
      // console.log("second-",second)
      // console.log("third-",third)
      let count = 6192;

      for (let x of arr) {
        count++;
        let uicNum = "";

        // if (count.toString().length == 1) {
        //   uicNum = "9101000000" + count;
        // } else if (count.toString().length == 2) {
        //   uicNum = "910100000" + count;
        // } else if (count.toString().length == 3) {
        //   uicNum = "91010000" + count;
        // } else if (count.toString().length == 4) {
        //   uicNum = "9101000" + count;
        // } else if (count.toString().length == 5) {
        //   uicNum = "910100" + count;
        // } else if (count.toString().length == 6) {
        //   uicNum = "91010" + count;
        // }

        // if (count.toString().length == 1) {
        //   uicNum = "9203000000" + count;
        // } else if (count.toString().length == 2) {
        //   uicNum = "920300000" + count;
        // } else if (count.toString().length == 3) {
        //   uicNum = "92030000" + count;
        // } else if (count.toString().length == 4) {
        //   uicNum = "9203000" + count;
        // } else if (count.toString().length == 5) {
        //   uicNum = "920300" + count;
        // } else if (count.toString().length == 6) {
        //   uicNum = "92030" + count;
        // }

        // if (count.toString().length == 1) {
        //   uicNum = "9001000000" + count;
        // } else if (count.toString().length == 2) {
        //   uicNum = "900100000" + count;
        // } else if (count.toString().length == 3) {
        //   uicNum = "90010000" + count;
        // } else if (count.toString().length == 4) {
        //   uicNum = "9001000" + count;
        // } else if (count.toString().length == 5) {
        //   uicNum = "900100" + count;
        // } else if (count.toString().length == 6) {
        //   uicNum = "90010" + count;
        // }

        if (count.toString().length == 1) {
          uicNum = "9203000000" + count;
        } else if (count.toString().length == 2) {
          uicNum = "920300000" + count;
        } else if (count.toString().length == 3) {
          uicNum = "92030000" + count;
        } else if (count.toString().length == 4) {
          uicNum = "9203000" + count;
        } else if (count.toString().length == 5) {
          uicNum = "920300" + count;
        } else if (count.toString().length == 6) {
          uicNum = "92030" + count;
        }
        const string = x.Model_Name;
        const firstSpaceIndex = x.Model_Name.indexOf(" ");
        const firstWord = string.substring(0, firstSpaceIndex);
        const remainingWords = string.substring(firstSpaceIndex + 1);

        let orderObj = {
          order_id: x.Order_ID.toString(),
          order_date: new Date("01/01/2021"),
          partner_shop: "Gurgaon_122016",
          item_id: x.Item_ID,
          old_item_details: `${firstWord}:${remainingWords}`,
          imei: x.IMEI.toString(),
          tracking_id: x.Tracking_ID.toString(),
          created_at: Date.now(),
          type: x.Last_Status,
          delivery_status: "Delivered",
          order_status: "NEW",
        };
        let objDelivery = {
          order_id: x.Order_ID.toString(),
          order_date: new Date("01/01/2021"),
          partner_shop: "Gurgaon_122016",
          item_id: x.Item_ID,

          imei: x.IMEI.toString(),
          tracking_id: x.Tracking_ID.toString(),
          created_at: Date.now(),
          type: x.Last_Status,
          uic_status: "Created",
          "uic_code.created_at": Date.now(),
          "uic_code.code": uicNum,
          created_at: Date.now(),
          download_time: Date.now(),
          old_uic: x.Old_UIC,
          delivery_date: Date.now(),
        };
        // let dataImportToOrder=await  tempOrders.create(orderObj)
        let dataImportDelivery = await tempDelivery.create(objDelivery);
      }
      resolve({ status: 1 });
    });
  },
  /*--------------------------------------------STX UTILITY ---------------------------------------*/
  stxUtilityImportXlsx: () => {
    return new Promise(async (resolve, reject) => {
      let arr = [];
      for (let x of arr) {
        let obj = {
          uic: x.uic?.toString(),
          ctx_tray_id: x?.ctx_tray_id,
          current_status: x?.current_status,
          model_name: x?.model_name,
          grade: x.grade,
          old_grade: x?.old_grade,
          type: "Stx-to-stx",
          description: x.description,
          file_name: "22 Dec. Copy of Copy of UIC SETUP FOR UTILITY",
        };
        let createTo = await stxUtility.create(obj);
        // const checkIntrayOrnot = await masters.findOne({ "items.uic": x.uic?.toString()});
        // if(checkIntrayOrnot == null){
        //   let checkDelivery = await delivery.findOne(
        //     { "uic_code.code": x.uic?.toString() },
        //     { sales_bin_status: 1, item_moved_to_billed_bin: 1 }
        //   );
        //   if(checkDelivery?.sales_bin_status == undefined && checkDelivery?.item_moved_to_billed_bin == undefined){
        //     let create=await tempOrdersReq.create({
        //       uic:x.uic?.toString()
        //     })
        //   }
        // }
      }
      resolve({ status: 1 });
    });
  },
  //SEARCH UIC FROM STX UTILITY COLLECTION
  stxUtilityScanUic: (uic) => {
    // PROMISE FOR GET DATA
    return new Promise(async (resolve, reject) => {
      // FETCH DATA / CHECK UIC VALID OR NOT
      const fetchData = await stxUtility.find({
        uic: uic,
        type: { $ne: "Stx-to-stx" },
      });
      // CHECK UIC AVAILABLE OR NOT
      if (fetchData.length !== 0) {
        // CHECK ALREADY ADDED INTO TRAY
        const checkIntrayOrnot = await masters.findOne({ "items.uic": uic });
        if (checkIntrayOrnot) {
          resolve({ status: 2, trayId: checkIntrayOrnot.code });
        }
        // RESOLVE WITH STATUS 1
        resolve({ status: 1, uicData: fetchData });
      } else {
        // UIC NOT FOUND SO STATUS 0
        resolve({ status: 0 });
      }
    });
  },
  // STX UTILITY GET MATCH BRAND AND MODEL
  stxUtilityImportXlsxstxUtilityGetStx: (uic, location, grade) => {
    // PROMISE
    return new Promise(async (resolve, reject) => {
      // CHECK UIC BRAND AND MODEL AND AVAILABILITY OF UIC
      const checkUic = await delivery.findOne({ "uic_code.code": uic });
      // IF UIC EXISTS IN MAIN DELIVERY
      if (checkUic) {
        // FIND BRAND AND MODEL USING ITEM ID FROM UIC
        const brandAndModel = await products.findOne({
          vendor_sku_id: checkUic?.item_id,
        });
        // CHECK PRODUCT MASTER
        if (brandAndModel) {
          let obj = {
            brand: brandAndModel.brand_name,
            model: brandAndModel.model_name,
            muic: brandAndModel.muic,
          };
          const findStxTray = await masters.find({
            $or: [
              {
                sort_id: "Open",
                type_taxanomy: "ST",
                cpc: location,
                tray_grade: grade,
                brand: brandAndModel.brand_name,
                model: brandAndModel.model_name,
              },
              {
                sort_id: "Inuse",
                type_taxanomy: "ST",
                cpc: location,
                tray_grade: grade,
                brand: brandAndModel.brand_name,
                model: brandAndModel.model_name,
              },
              {
                sort_id: "STX-Utility In-progress",
                type_taxanomy: "ST",
                cpc: location,
                tray_grade: grade,
                brand: brandAndModel.brand_name,
                model: brandAndModel.model_name,
              },
            ],
          });
          let spArr = [];
          // SP TRAY
          if (findStxTray.length !== 0) {
            for (let spt of findStxTray) {
              // CHECK TRAY IS FULL OR NOT
              if (parseInt(spt.limit) > parseInt(spt.items.length)) {
                spArr.push(spt);
              }
            }
          }
          resolve({ status: 2, trayData: spArr, muiDetails: obj });
        } else {
          resolve({ status: 1 });
        }
      } else {
        //UIC NOT EXISTS IN OUR MAIN DELIVERY COLLECTION
        resolve({ status: 0 });
      }
    });
  },
  // UNIT ADD TO STX
  stxUtilityAddItems: (
    uic,
    stXTrayId,
    ctxTrayId,
    brand,
    model,
    muic,
    screen,
    actUser,
    grade,
    system_status
  ) => {
    return new Promise(async (resolve, reject) => {
      let obj = {};
      if (system_status == "IN STX" || system_status == "IN CTX") {
        let removeFromCurrentTray = await masters.updateOne(
          { "items.uic": uic },
          {
            $pull: {
              items: {
                uic: uic,
              },
            },
          }
        );
        if (removeFromCurrentTray.modifiedCount == 0) {
          resolve({ status: 2 });
        }
      } else if (system_status == "IN SALES BIN") {
        const removeSalesBing = await delivery.updateOne(
          { "uic_code.code": uic },
          {
            $unset: {
              sales_bin_date: 1,
              sales_bin_status: 1,
              sales_bin_grade: 1,
              sales_bin_wh_agent_name: 1,
              sales_bin_desctiption: 1,
            },
          }
        );
        if (removeSalesBing.modifiedCount == 0) {
          resolve({ status: 2 });
        }
      } else if (system_status == "IN BILLED BIN") {
        const removeBilledsBing = await delivery.updateOne(
          { "uic_code.code": uic },
          {
            $unset: {
              item_moved_to_billed_bin: 1,
              item_moved_to_billed_bin_date: 1,
              item_moved_to_billed_bin_done_username: 1,
            },
          }
        );
        if (removeBilledsBing.modifiedCount == 0) {
          resolve({ status: 2 });
        }
      }
      const getDelivery = await delivery.findOneAndUpdate(
        { "uic_code.code": uic },
        {
          $set: {
            stx_tray_id: stXTrayId,
            updated_at: Date.now(),
            final_grade: grade,
          },
        }
      );
      obj = {
        tracking_id: getDelivery?.tracking_id,
        bot_agent: getDelivery?.agent_name,
        tray_id: getDelivery?.tray_id,
        uic: uic,
        imei: getDelivery?.imei,
        muic: muic,
        brand_name: brand,
        model_name: model,
        order_id: getDelivery?.order_id,
        charging: getDelivery?.charging,
        bqc_report: getDelivery?.bqc_report,
        audit_report: getDelivery?.audit_report,
        rdl_fls_report: getDelivery?.rdl_fls_one_report,
        rdl_repair_report: getDelivery?.rdl_two_report,
      };

      let updateStx = await masters.findOneAndUpdate(
        { code: stXTrayId },
        {
          $set: {
            sort_id: "STX-Utility In-progress",
          },
          $push: {
            items: obj,
          },
        }
      );
      if (updateStx) {
        let updateStxUtility = await stxUtility.updateMany(
          { uic: uic, type: "Stx-to-stx" },
          {
            $set: {
              added_status: "Added",
            },
          }
        );
        const addLogsofUnits = await unitsActionLog.create({
          action_type: "Stx Utility",
          created_at: Date.now(),
          uic: uic,
          tray_id: stXTrayId,
          user_name_of_action: actUser,
          track_tray: "Units",
          user_type: "Sales Warehouse",
          description: `Units adde through Stx Utility  by the :${actUser}`,
        });
        resolve({ status: 1 });
      } else {
        resolve({ status: 0 });
      }
    });
  },
  // GET TRAY IN STX-UTILITY IN-PROGRESS
  stxUtilityTrayInproGress: (location) => {
    return new Promise(async (resolve, reject) => {
      const getTray = await masters.find({
        type_taxanomy: "ST",
        cpc: location,
        sort_id: "STX-Utility In-progress",
      });
      resolve(getTray);
    });
  },
  getTheTrayInRack: (location) => {
    return new Promise(async (resolve, reject) => {
      const trayInRack = await masters.aggregate([
        {
          $match: {
            prefix: "tray-master",
            cpc: location,
            issued_user_name: null,
            sort_id: {
              $nin: ["Assigned to warehouae for rack change", "No Status"],
            },
            code: { $nin: ["T051", "T071"] },
          },
        },
        {
          $lookup: {
            from: "trayracks",
            localField: "rack_id",
            foreignField: "rack_id",
            as: "rackData",
          },
        },
        {
          $project: {
            rackData: 1,
            code: 1,
            rack_id: 1,
            brand: 1,
            model: 1,
            sort_id: 1,
            created_at: 1,
            limit: 1,
            type_taxanomy: 1,
            items_length: {
              $cond: {
                if: { $isArray: "$items" },
                then: { $size: "$items" },
                else: 0,
              },
            },
            actual_items: {
              $cond: {
                if: { $isArray: "$actual_items" },
                then: { $size: "$actual_items" },
                else: 0,
              },
            },
          },
        },
      ]);
      resolve(trayInRack);
    });
  },
  getWarehouseUsers: (location, warehouse) => {
    return new Promise(async (resolve, reject) => {
      const getWarehouseUsers = await user.find({
        cpc: location,
        warehouse: warehouse,
        user_type: "Warehouse",
        status: "Active",
      });
      resolve(getWarehouseUsers);
    });
  },
  assignForRackChange: (tray, scanOutWh, scanInWh, actUser) => {
    return new Promise(async (resolve, reject) => {
      let updateTheTray;
      for (let x of tray) {
        const findTray = await masters.findOne({ code: x }, { sort_id: 1 });
        updateTheTray = await masters.findOneAndUpdate(
          { code: x },
          {
            $set: {
              issued_user_name: scanOutWh,
              rdl_2_user_temp: scanInWh,
              requested_date: Date.now(),
              temp_status: findTray.sort_id,
              actual_items: [],
              sort_id: "Assigned to warehouae for rack change",
            },
          }
        );
        if (updateTheTray) {
          let state = "Tray";
          if (updateTheTray.items?.length == 0) {
            await unitsActionLog.create({
              action_type: "Assigned to warehouae for rack change",
              created_at: Date.now(),
              user_name_of_action: actUser,
              agent_name: scanOutWh,
              user_type: "PRC MIS",
              tray_id: x,
              track_tray: state,
              description: `Assigned to warehouae for rack change to agent scan out :${scanOutWh} by mis :${actUser}`,
            });
          }
          for (let y of updateTheTray.items) {
            await unitsActionLog.create({
              action_type: "Assigned to warehouae for rack change",
              created_at: Date.now(),
              user_name_of_action: actUser,
              agent_name: scanOutWh,
              user_type: "PRC MIS",
              uic: y.uic,
              tray_id: x,
              track_tray: state,
              description: `Assigned to warehouae for rack change to agent scan out :${scanOutWh} by mis :${actUser}`,
            });
            state = "Units";
          }
        }
      }
      if (updateTheTray) {
        resolve({ status: 1 });
      } else {
        resolve({ status: 2 });
      }
    });
  },
  changeRackByMis: (trayId, rackId) => {
    return new Promise(async (resolve, reject) => {
      const updateRack = await masters.updateOne(
        { code: trayId },
        {
          $set: {
            temp_rack: rackId,
          },
        }
      );
      if (updateRack.modifiedCount !== 0) {
        resolve({ status: 1 });
      } else {
        resolve({ status: 2 });
      }
    });
  },
  /*--------------------------------BAG TRANSFER-------------------------------------------*/
  getBagTransferAndReceive: (location, status) => {
    return new Promise(async (resolve, reject) => {
      let data;
      if (status == "Closed") {
        data = await masters
          .find({
            $or: [
              {
                cpc: location,
                prefix: "bag-master",
                sort_id: "Closed",
              },
              {
                cpc: location,
                prefix: "bag-master",
                sort_id: "Pre-closure",
              },
            ],
          })
          .catch((err) => {
            reject(err);
          });
      } else {
        data = await bagTransfer.find({ status: "Transferd", cpc: location });
      }
      resolve(data);
    });
  },
  sendTheBagViaCourierOrHand: (deliveryData) => {
    return new Promise(async (resolve, reject) => {
      let updateBag;
      const prefix = "RQ";
      const randomDigits = Math.floor(Math.random() * 90000) + 10000; // Generates a random 5-digit number
      const timestamp = Date.now().toString().slice(-5); // Uses the last 5 digits of the current timestamp
      deliveryData.req_id = prefix + timestamp + randomDigits;
      for (let x of deliveryData.bag_details) {
        let checkStatus = await masters.findOne({ code: x }, { sort_id: 1 });
        updateBag = await masters.findOneAndUpdate(
          {
            $or: [
              {
                code: x,
                sort_id: "Closed",
              },
              {
                code: x,
                sort_id: "Pre-closure",
              },
            ],
          },
          {
            $set: {
              sort_id: "Bag Transferred to new location",
              cpc: deliveryData.cpc,
              temp_status: checkStatus.sort_id,
            },
          }
        );
        if (updateBag) {
          // for (let x of updateBag.items) {
          //   await unitsActionLog
          //     .create({
          //       created_at: Date.now(),
          //       awbn_number: x.awbn_number,
          //       user_name_of_action: deliveryData.username,
          //       action_type: "Bag Transfer",
          //       user_type: `${deliveryData.warehouseType} Mis`,
          //       description: `Bag Transferred to this location ${deliveryData.cpc} ,warehoue name:${deliveryData?.warehoue} done by:${deliveryData.username}`,
          //       bag_id: x,
          //     })
          //     .catch((err) => reject(err));
          // }
        }
      }
      if (updateBag) {
        const createDelivery = await bagTransfer.create(deliveryData);
        if (createDelivery) {
          resolve({ status: 1 });
        } else {
          resolve({ status: 0 });
        }
      } else {
        resolve({ status: 0 });
      }
    });
  },
  bagTransferReceive: async (dataOfRequestReceive) => {
    try {
      for (let x of dataOfRequestReceive.bags) {
        let findTheBag = await masters.findOne(
          { code: x },
          { temp_status: 1, items: 1, cpc: 1 }
        );
        let updateBag = await masters.updateOne(
          { code: x, sort_id: "Bag Transferred to new location" },
          {
            $set: {
              sort_id: findTheBag.temp_status,
            },
          }
        );
        if (updateBag.modifiedCount == 0) {
          return { status: 0 };
        } else {
          let changeRequesStatus = await bagTransfer.updateOne(
            { req_id: dataOfRequestReceive.req_id },
            {
              $set: {
                status: "Received by mis",
              },
            }
          );
          if (changeRequesStatus.matchedCount == 0) {
            return 0;
          } else {
            for (let y of findTheBag.items) {
              let updatLocation = await orders.updateOne(
                { order_id: y.order_id },
                {
                  $set: {
                    partner_shop: findTheBag.cpc,
                  },
                }
              );
              let updateLocationDelivery = await orders.updateOne(
                { order_id: y.order_id },
                {
                  $set: {
                    partner_shop: findTheBag.cpc,
                  },
                }
              );
            }
          }
        }
      }
      return { status: 1 };
    } catch (error) {
      return error;
    }
  },
  /*---------------------------------------------RPA TO STX SORTING -----------------------------------------------*/
  getTrayForRpaToStxSorting: async (trayType, location, status) => {
    try {
      const data = await masters.aggregate([
        {
          $match: {
            sort_id: status,
            type_taxanomy: trayType,
            cpc: location,
          },
        },
        {
          $lookup: {
            from: "trayracks",
            localField: "rack_id",
            foreignField: "rack_id",
            as: "rackData",
          },
        },
      ]);
      return data;
    } catch (error) {
      return error;
    }
  },
  /* TRAY ASSIGNMENT TO WAREHOUSE FOR RPA TO STX */
  assignToWarehouseRpaToStx: async (tray, user_name, sortId, actUser) => {
    try {
      for (let x of tray) {
        let updateTray = await masters.findOneAndUpdate(
          {
            code: x,
            sort_id: "Ready to Transfer to STX",
          },
          {
            $set: {
              sort_id: "Assigned to Warehouse for Stx Sorting",
              actual_items: [],
              assigned_date: Date.now(),
              issued_user_name: user_name,
            },
          }
        );
        if (updateTray) {
          let state = "Tray";
          for (let y of updateTray.items) {
            await unitsActionLog.create({
              action_type: "Assigned to Warehouse for Stx Sorting",
              created_at: Date.now(),
              user_name_of_action: actUser,
              agent_name: user_name,
              user_type: "Sales MIS",
              uic: y.uic,
              tray_id: x,
              track_tray: state,
              description: `Assigned to Warehouse for Stx Sorting.Warehouse :${user_name} by mis :${actUser}`,
            });
            state = "Units";
            let updateDeliery = await delivery.updateOne(
              {
                "uic_code.code": y.uic,
              },
              {
                $set: {
                  rpa_to_stx_sorting_assigment_date: Date.now(),
                  updated_at: Date.now(),
                  tray_location: "Sales Warehouse",
                  tray_status: "Assigned to Warehouse for Stx Sorting",
                },
              }
            );
          }
        }
      }
      return { status: 1 };
    } catch (error) {
      return error;
    }
  },
  // REPORT OF DEVICE NOT REPAIRABLE UNITS
  deviceNotRepairableUnits: async (location) => {
    try {
      const findUpgardeUnits = await delivery.aggregate([
        {
          $match: {
            partner_shop: location,
            "rdl_two_report.reason": "Device not repairable",
            "audit_report.stage": {
              $nin: ["Accept", "Direct Downgrade", "Direct Upgrade"],
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

      return findUpgardeUnits;
    } catch (error) {
      return error;
    }
  },
  // SALES MIS STOCK REPORT
  salesMisStockReport: async () => {
    try {
      const salesStockReport = await delivery.aggregate([
        {
          $match: {
            stx_tray_id: { $exists: true },
            tray_type: "ST",
            item_moved_to_billed_bin: { $exists: false },
            "audit_report.sub_muic": { $exists: true },
          },
        },
        {
          $lookup: {
            from: "submuics",
            localField: `audit_report.sub_muic`,
            foreignField: "sub_muic",
            as: "subMuicData",
          },
        },
        {
          $group: {
            _id: {
              sub_muic: "$audit_report.sub_muic",
              final_grade: "$final_grade",
            },
            count: { $sum: 1 }, // Count the occurrences of each grade within each item_id
            old_item_details: { $first: "$old_item_details" }, // Include old_item_details in the result
            subMuicData: { $first: "$subMuicData" },
          },
        },
        {
          $group: {
            _id: "$_id.sub_muic",
            grades: {
              $push: {
                grade: "$_id.final_grade",
                count: "$count",
              },
            },
            subMuicData: { $first: "$subMuicData" },
            total: { $sum: "$count" }, // Calculate the total count for each item_id
            old_item_details: { $first: "$old_item_details" }, // Include old_item_details in the result
          },
        },
      ]);
      for (let main of salesStockReport) {
        if (main?.A == undefined) {
          main["A"] = 0;
        }
        if (main?.B == undefined) {
          main["B"] = 0;
        }
        if (main?.C == undefined) {
          main["C"] = 0;
        }
        if (main?.D == undefined) {
          main["D"] = 0;
        }
        if (main?.RB == undefined) {
          main["RB"] = 0;
        }
        if (main?.B2 == undefined) {
          main["B2"] = 0;
        }
        main["storage"] = main.subMuicData?.[0]?.storage;
        main["ram"] = main.subMuicData?.[0]?.ram;
        main["color"] = main.subMuicData?.[0]?.color;
        for (let sub of main.grades) {
          main[sub.grade] = sub.count;
        }
      }
      console.log(salesStockReport);
      return salesStockReport;
    } catch (error) {
      return error;
    }
  },
  // VIEW UIC IN SALES STOCK REPORT
  getSalesReportUicData: async (subMuic) => {
    try {
      const data = await delivery.aggregate([
        {
          $match: {
            stx_tray_id: { $exists: true },
            tray_type: "ST",
            item_moved_to_billed_bin: { $exists: false },
            "audit_report.sub_muic": subMuic,
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
          $project: {
            "uic_code.code": 1,
            old_item_details: 1,
            audit_report: 1,
            audit_done_date: 1,
            rdl_fls_one_report: 1,
            rdl_fls_one_user_name: 1,
            rdl_fls_closed_date: 1,
            products: 1,
            final_grade: 1,
          },
        },
      ]);
      let arr = [];
      for (let x of data) {
        // console.log(x.uic_code.code);
        let findTray = await masters.aggregate([
          {
            $match: {
              "items.uic": x.uic_code.code,
              prefix: "tray-master",
              type_taxanomy: { $nin: ["SPT"] },
            },
          },
          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackData",
            },
          },
          { $project: { code: 1, name: 1, rackData: 1 } },
        ]);
        let obj = {
          muic: x.products?.[0]?.muic,
          uic_code: x.uic_code,
          old_item_details: x.old_item_details,
          audit_report: x.audit_report,
          audit_done_date: x.audit_done_date,
          rdl_fls_one_report: x.rdl_fls_one_report,
          rdl_fls_one_user_name: x.rdl_fls_one_user_name,
          rdl_fls_closed_date: x.rdl_fls_closed_date,
          final_grade: x.final_grade,
        };
        if (findTray) {
          obj["current_tray_id"] = findTray[0].code;
          obj["current_tray_name"] = findTray[0].name;
          obj["current_tray_rack_display"] = findTray[0]?.rackData[0]?.display;
          obj["current_tray_rack_id"] = findTray[0]?.rackData[0]?.rack_id;
        } else {
          obj["current_tray_id"] = "";
          obj["current_tray_name"] = "";
        }
        arr.push(obj);
      }
      return arr;
    } catch (error) {
      return error;
    }
  },
  salesMisStockReportWithMuic: async () => {
    try {
      const salesStockReport = await delivery.aggregate([
        {
          $match: {
            stx_tray_id: { $exists: true },
            tray_type: "ST",
            item_moved_to_billed_bin: { $exists: false },
            "audit_report.sub_muic": { $exists: false },
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
          $group: {
            _id: {
              item_id: "$item_id",
              final_grade: "$final_grade",
            },
            count: { $sum: 1 }, // Count the occurrences of each grade within each item_id
            old_item_details: { $first: "$old_item_details" }, // Include old_item_details in the result
            products: { $first: "$products" }, // Include the products array in the result
          },
        },
        {
          $group: {
            _id: "$_id.item_id",
            grades: {
              $push: {
                grade: "$_id.final_grade",
                count: "$count",
              },
            },
            total: { $sum: "$count" }, // Calculate the total count for each item_id
            old_item_details: { $first: "$old_item_details" }, // Include old_item_details in the result
            products: { $first: "$products" }, // Include the products array in the result
          },
        },
      ]);
      for (let main of salesStockReport) {
        if (main?.A == undefined) {
          main["A"] = 0;
        }
        if (main?.B == undefined) {
          main["B"] = 0;
        }
        if (main?.C == undefined) {
          main["C"] = 0;
        }
        if (main?.D == undefined) {
          main["D"] = 0;
        }
        if (main?.RB == undefined) {
          main["RB"] = 0;
        }
        if (main?.B2 == undefined) {
          main["B2"] = 0;
        }
        for (let sub of main.grades) {
          main[sub.grade] = sub.count;
        }
        main["muic"] = main?.products[0]?.muic;
      }
      return salesStockReport;
    } catch (error) {
      return error;
    }
  },
  // VIEW UIC IN SALES STOCK REPORT BASED ON MUIC
  getSalesReportUicDataWithMuic: async (itemId) => {
    try {
      const data = await delivery.aggregate([
        {
          $match: {
            stx_tray_id: { $exists: true },
            tray_type: "ST",
            item_moved_to_billed_bin: { $exists: false },
            "audit_report.sub_muic": { $exists: false },
            item_id: itemId,
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
          $project: {
            "uic_code.code": 1,
            old_item_details: 1,
            audit_report: 1,
            audit_done_date: 1,
            rdl_fls_one_report: 1,
            rdl_fls_one_user_name: 1,
            rdl_fls_closed_date: 1,
            final_grade: 1,
            products: 1,
          },
        },
      ]);
      let arr = [];
      for (let x of data) {
        let findTray = await masters.aggregate([
          {
            $match: {
              "items.uic": x.uic_code.code,
              prefix: "tray-master",
              type_taxanomy: { $nin: ["SPT"] },
            },
          },
          {
            $lookup: {
              from: "trayracks",
              localField: "rack_id",
              foreignField: "rack_id",
              as: "rackData",
            },
          },
          { $project: { code: 1, name: 1, rackData: 1 } },
        ]);
        let obj = {
          muic: x.products?.[0]?.muic,
          uic_code: x.uic_code,
          old_item_details: x.old_item_details,
          audit_report: x.audit_report,
          audit_done_date: x.audit_done_date,
          rdl_fls_one_report: x.rdl_fls_one_report,
          rdl_fls_one_user_name: x.rdl_fls_one_user_name,
          rdl_fls_closed_date: x.rdl_fls_closed_date,
          final_grade: x.final_grade,
        };
        if (obj?.audit_report == undefined) {
          obj.audit_report = {
            orgGrade: "",
          };
        } else if (obj?.audit_report?.orgGrade == undefined) {
          obj.audit_report.orgGrade = "";
        }
        console.log(findTray);
        if (findTray.length != 0) {
          obj["current_tray_id"] = findTray[0].code;
          obj["current_tray_name"] = findTray[0].name;
          obj["current_tray_rack_display"] = findTray[0]?.rackData[0]?.display;
          obj["current_tray_rack_id"] = findTray[0]?.rackData[0]?.rack_id;
        } else {
          obj["current_tray_id"] = "";
          obj["current_tray_name"] = "";
        }
        // console.log(obj);
        arr.push(obj);
      }
      console.log(arr);
      return arr;
    } catch (error) {
      return error;
    }
  },
};
