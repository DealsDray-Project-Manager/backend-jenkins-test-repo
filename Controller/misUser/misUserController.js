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
        if (x.order_status == "NEW") {
          if (x?.imei.match(/[0-9]/g).join("").length !== 15) {
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
          });
          if (brand == null) {
            brand_name.push(x?.old_item_details?.split(":")[0]);
            err["brand_name_does_not_exist"] = brand_name;
          }
          let model = await products.findOne({
            model_name: {
              $regex: new RegExp(
                "^" + x?.old_item_details?.split(":")[1] + "$",
                "i"
              ),
            },
          });
          if (model == null) {
            model_name.push(x?.old_item_details?.split(":")[1]);
            err["model_name_does_not_exist"] = model_name;
          }
        } else {
          order_status.push(x.order_status);
          err["order_status"] = order_status;
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
      };
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
      count.bqc = await masters.count({
        prefix: "tray-master",
        type_taxanomy: "WHT",
        sort_id: "Ready to BQC",
        cpc: location,
      });
      count.ctxToStxSorting = await masters.count({
        prefix: "tray-master",
        type_taxanomy: {
          $nin: ["BOT", "PMT", "MMT", "WHT", "ST", "SPT", "RPT"],
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
              $nin: ["BOT", "PMT", "MMT", "WHT", "ST", "SPT", "RPT"],
            },
          },
          {
            prefix: "tray-master",
            cpc: location,
            sort_id: "Transferred to Processing",

            type_taxanomy: { $nin: ["BOT", "PMT", "MMT", "WHT", "SPT", "RPT"] },
          },
        ],
      });
      count.ctxMerge = await masters.count({
        prefix: "tray-master",
        cpc: location,
        sort_id: "Audit Done Closed By Warehouse",
        type_taxanomy: {
          $nin: ["BOT", "PMT", "MMT", "WHT", "ST", "SPT", "RPT"],
        },
      });
      count.stxMerge = await masters.count({
        prefix: "tray-master",
        cpc: location,
        sort_id: "Inuse",
        type_taxanomy: "ST",
      });
      count.readyToTransfer = await masters.count({
        $or: [
          {
            prefix: "tray-master",
            cpc: location,
            sort_id: "Ready to Transfer to Sales",
            type_taxanomy: {
              $nin: ["BOT", "PMT", "MMT", "WHT", "ST", "SPT", "RPT"],
            },
          },
          {
            prefix: "tray-master",
            cpc: location,
            sort_id: "Ready to Transfer to Processing",
            type_taxanomy: { $nin: ["BOT", "PMT", "MMT", "WHT", "SPT", "RPT"] },
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
        sort_id: "Ready to RDL",
        cpc: location,
      });
      count.rdl_two = await masters.countDocuments({
        cpc: location,
        sort_id: "Ready to RDL-Repair",
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
            sort_id: "Ready to RDL-Repair",
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
            $facet: {
              results: [{ $skip: skip }, { $limit: limit }],
              count: [{ $count: "count" }],
            },
          },
        ]);
      } else if (searchType == "order_date") {
        // let  date=new Date(value)
        // console.log(date);
        //  if(date == "Invalid Date"){
        //    value = moment(value, "DD-MM-YYYY HH:mm").toDate();
        //  }

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
        sort_id: { $ne: "No Status" },
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
        let data = await masters.updateOne(
          { code: bagData.bagId },
          {
            $set: {
              sort_id: "Requested to Warehouse",
              issued_user_name: bagData.bot_name,
              "track_tray.bag_assign_to_bot": Date.now(),
            },
          }
        );
        if (data.modifiedCount != 0) {
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
      // console.log(obj);
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
      let data = await masters.find({
        type_taxanomy: "BOT",
        prefix: "tray-master",
        sort_id: "Closed By Warehouse",
        cpc: location,
        closed_time_wharehouse_from_bot: new Date(
          date.toISOString().split("T")[0]
        ),
      });
      if (data) {
        resolve(data);
      }
    });
  },
  sortWhClosedBotTray: (date, location) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        type_taxanomy: "BOT",
        prefix: "tray-master",
        sort_id: "Closed By Warehouse",
        cpc: location,
        closed_time_wharehouse_from_bot: new Date(date),
      });
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
          if (parseInt(x.limit) >= parseInt(x.items.length)) {
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
          data = await masters.updateOne(
            { code: x },
            {
              $set: {
                sort_id: "Send for Recharging",
                issued_user_name: whtTrayData.user_name,
              },
            }
          );
        } else {
          data = await masters.updateOne(
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
      }
      if (data.matchedCount != 0) {
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
        .find({
          cpc: location,
          type_taxanomy: "MMT",
          prefix: "tray-master",
          sort_id: "Closed By Warehouse",
        })
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
  mmtMergeRequestSendToWh: (sortingAgent, fromTray, toTray) => {
    return new Promise(async (resolve, reject) => {
      let whtTray = await masters.findOne({ code: fromTray });
      if (
        whtTray.sort_id === "Audit Done Closed By Warehouse" &&
        whtTray.type_taxanomy == "WHT"
      ) {
        let updateFromTray = await masters.updateOne(
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
        if (updateFromTray.modifiedCount !== 0) {
          let updateToTray = await masters.updateOne(
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
          if (updateToTray.modifiedCount !== 0) {
            resolve({ status: 1 });
          }
        } else {
          resolve({ status: 0 });
        }
      } else if (
        whtTray.sort_id === "Ready to BQC" &&
        whtTray.type_taxanomy == "WHT"
      ) {
        let updateFromTray = await masters.updateOne(
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
        if (updateFromTray.modifiedCount !== 0) {
          let updateToTray = await masters.updateOne(
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
          if (updateToTray.modifiedCount !== 0) {
            resolve({ status: 1 });
          }
        } else {
          resolve({ status: 0 });
        }
      } else if (
        whtTray.sort_id === "Ready to Audit" &&
        whtTray.type_taxanomy == "WHT"
      ) {
        let updateFromTray = await masters.updateOne(
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
        if (updateFromTray.modifiedCount !== 0) {
          let updateToTray = await masters.updateOne(
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
          if (updateToTray.modifiedCount !== 0) {
            resolve({ status: 1 });
          }
        } else {
          resolve({ status: 0 });
        }
      } else if (
        whtTray.sort_id === "Ready to RDL-Repair" &&
        whtTray.type_taxanomy == "WHT"
      ) {
        let updateFromTray = await masters.updateOne(
          { code: fromTray },
          {
            $set: {
              sort_id: "Ready to RDL-Repair Merge Request Sent To Wharehouse",
              status_change_time: Date.now(),
              issued_user_name: sortingAgent,
              to_merge: toTray,
              actual_items: [],
            },
          }
        );
        if (updateFromTray.modifiedCount !== 0) {
          let updateToTray = await masters.updateOne(
            { code: toTray },
            {
              $set: {
                sort_id: "Ready to RDL-Repair Merge Request Sent To Wharehouse",
                status_change_time: Date.now(),
                issued_user_name: sortingAgent,
                from_merge: fromTray,
                to_merge: null,
                actual_items: [],
              },
            }
          );
          if (updateToTray.modifiedCount !== 0) {
            resolve({ status: 1 });
          }
        } else {
          resolve({ status: 0 });
        }
      } else {
        let updateFromTray = await masters.updateOne(
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
        if (updateFromTray.modifiedCount !== 0) {
          let updateToTray = await masters.updateOne(
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
          if (updateToTray.modifiedCount !== 0) {
            resolve({ status: 1 });
          }
        } else {
          resolve({ status: 0 });
        }
      }
    });
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
            $project: {
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
            $project: {
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
          {
            $match: {
              "track_tray.audit_done_close_wh": { $gte: threeDaysAgo },
              sort_id: "Ready to RDL",
              cpc: location,
            },
          },
          {
            $unwind: "$items",
          },
          {
            $project: {
              items: 1,
              brand: 1,
              model: 1,
              code: 1,
              closed_date_agent: 1,
            },
          },
        ]);
      } else if (type == "RDL two done closed by warehouse") {
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
            $project: {
              items: 1,
              brand: 1,
              model: 1,
              code: 1,
              "track_tray.rdl_two_done_closed_by_agent": 1,
            },
          },
        ]);
      } else {
        items = await masters.aggregate([
          {
            $match: {
              "track_tray.rdl_1_done_close_by_wh": { $gte: threeDaysAgo },
              sort_id: type,
              cpc: location,
            },
          },
          {
            $unwind: "$items",
          },
          {
            $project: {
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
            $project: {
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
            $project: {
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
          {
            $match: {
              "items.audit_report.stage": { $in: selectedStatus },
              sort_id: "Ready to RDL",
              cpc: location,
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
              sort_id: "Ready to RDL-Repair",
              cpc: location,
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
              brand: 1,
              model: 1,
              code: 1,
              closed_date_agent: 1,
            },
          },
          {
            $unwind: "$items",
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
            $unwind: "$items",
          },
          {
            $project: {
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
          { $match: { sort_id: "Ready to Audit", cpc: location } },
          {
            $unwind: "$items",
          },
          {
            $project: {
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
          { $match: { sort_id: "Ready to RDL", cpc: location } },
          {
            $unwind: "$items",
          },
          {
            $project: {
              items: 1,
              brand: 1,
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
            $unwind: "$items",
          },
          {
            $project: {
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
              sort_id: "Ready to Audit",
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
              sort_id: "Ready to RDL",
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
  pickupRequestSendToWh: (itemData) => {
    return new Promise(async (resolve, reject) => {
      let sendtoPickupRequest;
      for (let x of itemData.isCheck) {
        let getDeliveryData = await delivery.findOne({ "uic_code.code": x });
        if (getDeliveryData) {
          let toTray = await masters.updateOne(
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
          if (itemData.value == "RDL two done closed by warehouse") {
            sendtoPickupRequest = await masters.updateOne(
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
            sendtoPickupRequest = await masters.updateOne(
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
        }
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

      if (sendtoPickupRequest.matchedCount != 0) {
        resolve(sendtoPickupRequest);
      } else {
        resolve();
      }
    });
  },
  getAuditDone: (location) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        sort_id: "Ready to RDL",
        type_taxanomy: "WHT",
        cpc: location,
      });
      if (data) {
        resolve(data);
      }
    });
  },
  assignToAgentRequestToWhRdlFls: (tray, user_name, sortId) => {
    return new Promise(async (resolve, reject) => {
      let sendtoRdlMis;
      for (let x of tray) {
        if (sortId == "Send for RDL-two") {
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
          if (sendtoRdlMis) {
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
            sort_id: "Ready to RDL-Repair",
            type_taxanomy: "RPT",
            cpc: location,
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
        const sentToWarehouse = await masters.updateOne(
          { code: x },
          {
            $set: {
              sort_id: trayData.sort_id,
              requested_date: Date.now(),
              recommend_location: trayData.sales,
            },
          }
        );
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
            "items.rdl_fls_report.selected_status": "Repair Required",
            cpc: location,
            sort_id: "Ready to RDL-Repair",
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
              model: "$items.model_name",
              brand: "$items.brand_name",
              muic: "$items.muic",
            },
            count: { $sum: 1 },
          },
        },
      ]);

      resolve(findItem);
    });
  },
  whtToRpMuicListToRepairAssignForRepair: (location, brand, model) => {
    return new Promise(async (resolve, reject) => {
      const findItem = await masters.aggregate([
        {
          $match: {
            "items.rdl_fls_report.selected_status": "Repair Required",
            cpc: location,
            brand: brand,
            model: model,
            sort_id: "Ready to RDL-Repair",
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
          $project: {
            items: "$items",
            closed_date_agent: "$closed_date_agent",
            code: "$code",
          },
        },
      ]);
      if (findItem) {
        for (let x of findItem) {
          for (let y of x?.items?.rdl_fls_report?.partRequired) {
            const checkPart = await partAndColor.findOne({
              part_code: y?.part_id,
            });
            if (checkPart) {
              y["avl_qty"] = checkPart?.avl_stock;
            } else {
              y["avl_qty"] = 0;
            }
          }
        }
        resolve({ findItem: findItem, status: 1 });
      } else {
        resolve({ status: 2 });
      }
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
    selectedUic
  ) => {
    return new Promise(async (resolve, reject) => {
      let whtTrayArr = [];
      for (let uic of selectedUic) {
        const updateItem = await masters.findOneAndUpdate(
          {
            "items.uic": uic,
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
            whtTrayArr.push(updateItem.code);
          }
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
        if (rpTrayUpdation) {
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

          if (spTrayUpdation) {
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
  sortingCtxtoStxRequestSendToWh: (sortingAgent, fromTray, toTray) => {
    return new Promise(async (resolve, reject) => {
      const updateFromTray = await masters.updateOne(
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
      if (updateFromTray.modifiedCount !== 0) {
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
      let arr = [
        {
         "uic": 92110008462,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4601",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110006225,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4601",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110007981,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4601",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110009805,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4601",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100004320,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4601",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110006270,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4601",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110006258,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4601",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110008327,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4601",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110009875,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4601",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110009912,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4601",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110008859,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4601",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110009820,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4601",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110009885,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4601",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110008468,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4601",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110008795,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4601",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110008609,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4601",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110006120,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4601",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110006313,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4601",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110007965,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4601",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110008803,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4601",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110008209,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4601",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110009796,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4601",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100004323,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4601",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100004298,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4601",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100004378,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4601",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110008501,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4601",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110009093,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4601",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100004268,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4601",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110009028,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4601",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110008046,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4601",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110008809,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4601",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010961,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3013",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010703,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3013",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110005455,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3013",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100004443,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3013",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010648,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3013",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110010130,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3013",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100004856,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3013",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010610,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3013",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110005537,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3013",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010597,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3013",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010630,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3013",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010746,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3013",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110009711,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3013",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010933,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3013",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010579,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3013",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100004674,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3013",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110010022,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3013",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060011021,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3013",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100000643,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3013",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928050007459,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3013",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110005411,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3013",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010929,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3013",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110008983,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3013",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928050007106,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3013",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92080012340,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3013",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92070011785,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3013",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92090000085,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3013",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010927,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3013",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100000390,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3013",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92120010154,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3013",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92120010153,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3013",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110005481,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3013",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100004743,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3013",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100004891,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3013",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100004429,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3013",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110005428,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3013",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010975,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3013",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060011010,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3013",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100004756,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3013",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110010053,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3013",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928050005563,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3013",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928050007595,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3013",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010624,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3013",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010222,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010520,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010311,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010294,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010434,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010660,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010570,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010645,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92050004727,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92050003806,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010488,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010229,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010444,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010583,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92050004649,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010512,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010526,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010031,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010232,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010345,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010421,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010398,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010263,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010400,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010684,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010586,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010418,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010474,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010403,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010516,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010450,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010533,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010399,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010544,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010277,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010658,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010615,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010094,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92050003783,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92050008698,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTC3014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100002820,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4548",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001473,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4548",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100002569,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4548",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100005219,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4548",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100002432,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4548",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110005968,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4548",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110005695,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4548",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100005000,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4548",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100005155,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4548",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001823,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4548",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100005332,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4548",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001481,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4548",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001409,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4548",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100002798,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4548",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100005244,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4548",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110006014,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4548",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110005839,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4548",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100005290,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4548",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110006037,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4548",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001494,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4548",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100002136,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4548",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110006069,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4548",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001927,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4548",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100002694,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4548",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001391,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4548",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001183,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4534",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100003026,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4534",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110007935,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4534",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110007018,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4534",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110007287,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4534",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001890,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4534",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100003372,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4534",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001437,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4534",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100002083,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4534",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100002130,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4534",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110008134,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4534",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110006621,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4534",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100003124,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4534",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92090000101,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4534",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92090000179,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4534",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100003131,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4534",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100003035,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4534",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110008068,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4534",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001562,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4591",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110009157,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4591",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110007617,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4591",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110007755,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4591",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100003384,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4591",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110007769,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4591",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110009215,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4591",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110007808,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4591",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110007773,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4591",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001363,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4591",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001022,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4591",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100003568,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4591",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110009448,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4591",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100002261,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4591",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001539,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4591",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110008763,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4591",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110007750,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4591",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110009545,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4591",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100003371,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4591",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100003180,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4591",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110009398,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4591",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110008743,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4591",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001031,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4591",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110009230,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4591",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110007650,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4591",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100000659,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4591",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100000938,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4591",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110008776,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4591",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100000997,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4591",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110007658,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4591",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100000686,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4591",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001861,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4591",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110009233,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4591",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001006,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4591",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100000709,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4591",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100000942,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4591",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110009393,
         "model_name": "Xiaomi redmi note 5 pro",
         "grade": "C",
         "ctx_tray_id": "CTT4591",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928050005786,
         "model_name": "Xiaomi redmi note 4",
         "grade": "C",
         "ctx_tray_id": "CTT4589",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928050006013,
         "model_name": "Xiaomi redmi note 4",
         "grade": "C",
         "ctx_tray_id": "CTT4589",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100000868,
         "model_name": "Xiaomi redmi note 4",
         "grade": "C",
         "ctx_tray_id": "CTT4589",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110006788,
         "model_name": "Xiaomi redmi note 4",
         "grade": "C",
         "ctx_tray_id": "CTT4589",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100003957,
         "model_name": "Xiaomi redmi note 5   ",
         "grade": "C",
         "ctx_tray_id": "STC4055",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110009660,
         "model_name": "Xiaomi redmi note 5   ",
         "grade": "C",
         "ctx_tray_id": "STC4055",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110006580,
         "model_name": "Xiaomi redmi note 5   ",
         "grade": "C",
         "ctx_tray_id": "STC4055",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001616,
         "model_name": "Xiaomi redmi note 5   ",
         "grade": "C",
         "ctx_tray_id": "STC4055",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110005632,
         "model_name": "Xiaomi redmi note 5   ",
         "grade": "C",
         "ctx_tray_id": "STC4055",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110006093,
         "model_name": "Xiaomi redmi note 5   ",
         "grade": "C",
         "ctx_tray_id": "STC4055",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110005617,
         "model_name": "Xiaomi redmi note 5   ",
         "grade": "C",
         "ctx_tray_id": "STC4055",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100003577,
         "model_name": "Xiaomi redmi note 5   ",
         "grade": "C",
         "ctx_tray_id": "STC4055",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110010034,
         "model_name": "Xiaomi redmi note 5   ",
         "grade": "C",
         "ctx_tray_id": "STC4055",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92080013130,
         "model_name": "Xiaomi redmi note 5   ",
         "grade": "C",
         "ctx_tray_id": "STC4055",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928050009003,
         "model_name": "Xiaomi redmi note 5   ",
         "grade": "C",
         "ctx_tray_id": "STC4055",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110006679,
         "model_name": "Xiaomi redmi note 5   ",
         "grade": "C",
         "ctx_tray_id": "STC4055",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100004222,
         "model_name": "Xiaomi redmi note 5   ",
         "grade": "C",
         "ctx_tray_id": "STC4055",
         "date": "07\/24\/2023"
        },
        {
         "uic": 869781035928543,
         "model_name": "Xiaomi redmi note 5   ",
         "grade": "C",
         "ctx_tray_id": "STC4055",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92080013102,
         "model_name": "Xiaomi redmi note 5   ",
         "grade": "C",
         "ctx_tray_id": "STC4055",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110006891,
         "model_name": "Xiaomi redmi note 5   ",
         "grade": "C",
         "ctx_tray_id": "STC4055",
         "date": "07\/24\/2023"
        },
        {
         "uic": 861171035038857,
         "model_name": "OPPO F1s",
         "grade": "C",
         "ctx_tray_id": "STC4042",
         "date": "07\/24\/2023"
        },
        {
         "uic": 863795031348817,
         "model_name": "OPPO F1s",
         "grade": "C",
         "ctx_tray_id": "STC4042",
         "date": "07\/24\/2023"
        },
        {
         "uic": "0E1JMU_F",
         "model_name": "OPPO F1s",
         "grade": "C",
         "ctx_tray_id": "STC4042",
         "date": "07\/24\/2023"
        },
        {
         "uic": 864725035423992,
         "model_name": "OPPO F1s",
         "grade": "C",
         "ctx_tray_id": "STC4042",
         "date": "07\/24\/2023"
        },
        {
         "uic": "0EFC5E_C",
         "model_name": "OPPO F1s",
         "grade": "C",
         "ctx_tray_id": "STC4042",
         "date": "07\/24\/2023"
        },
        {
         "uic": 863084032729238,
         "model_name": "OPPO F1s",
         "grade": "C",
         "ctx_tray_id": "STC4042",
         "date": "07\/24\/2023"
        },
        {
         "uic": 863795031471395,
         "model_name": "OPPO F1s",
         "grade": "C",
         "ctx_tray_id": "STC4042",
         "date": "07\/24\/2023"
        },
        {
         "uic": 864725030049636,
         "model_name": "OPPO F1s",
         "grade": "C",
         "ctx_tray_id": "STC4042",
         "date": "07\/24\/2023"
        },
        {
         "uic": "0DVLOP_J",
         "model_name": "OPPO F1s",
         "grade": "C",
         "ctx_tray_id": "STC4042",
         "date": "07\/24\/2023"
        },
        {
         "uic": 863084037693298,
         "model_name": "OPPO F1s",
         "grade": "C",
         "ctx_tray_id": "STC4042",
         "date": "07\/24\/2023"
        },
        {
         "uic": 863795031481931,
         "model_name": "OPPO F1s",
         "grade": "C",
         "ctx_tray_id": "STC4042",
         "date": "07\/24\/2023"
        },
        {
         "uic": 863795033810376,
         "model_name": "OPPO F1s",
         "grade": "C",
         "ctx_tray_id": "STC4042",
         "date": "07\/24\/2023"
        },
        {
         "uic": 861171036704135,
         "model_name": "OPPO F1s",
         "grade": "C",
         "ctx_tray_id": "STC4042",
         "date": "07\/24\/2023"
        },
        {
         "uic": 864725030875113,
         "model_name": "OPPO F1s",
         "grade": "C",
         "ctx_tray_id": "STC4042",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92080013283,
         "model_name": "OPPO A3S",
         "grade": "C",
         "ctx_tray_id": "CTC3021",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92050008797,
         "model_name": "OPPO A3S",
         "grade": "C",
         "ctx_tray_id": "CTC3021",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92080012888,
         "model_name": "OPPO A3S",
         "grade": "C",
         "ctx_tray_id": "CTC3021",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92090000001,
         "model_name": "OPPO A3S",
         "grade": "C",
         "ctx_tray_id": "CTC3021",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92080012824,
         "model_name": "OPPO A3S",
         "grade": "C",
         "ctx_tray_id": "CTC3021",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92080012554,
         "model_name": "OPPO A3S",
         "grade": "C",
         "ctx_tray_id": "CTC3021",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92080012823,
         "model_name": "OPPO A3S",
         "grade": "C",
         "ctx_tray_id": "CTC3021",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92080012536,
         "model_name": "OPPO A3S",
         "grade": "C",
         "ctx_tray_id": "CTC3021",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92070011827,
         "model_name": "OPPO A3S",
         "grade": "C",
         "ctx_tray_id": "CTC3021",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92080012563,
         "model_name": "OPPO A3S",
         "grade": "C",
         "ctx_tray_id": "CTC3021",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92080012562,
         "model_name": "OPPO A3S",
         "grade": "C",
         "ctx_tray_id": "CTC3021",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92080012885,
         "model_name": "OPPO A3S",
         "grade": "C",
         "ctx_tray_id": "CTC3021",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92080012676,
         "model_name": "OPPO A3S",
         "grade": "C",
         "ctx_tray_id": "CTC3021",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92080012921,
         "model_name": "OPPO A3S",
         "grade": "C",
         "ctx_tray_id": "CTC3021",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92080012893,
         "model_name": "OPPO A3S",
         "grade": "C",
         "ctx_tray_id": "CTC3021",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92080012384,
         "model_name": "OPPO A3S",
         "grade": "C",
         "ctx_tray_id": "CTC3021",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92080012737,
         "model_name": "OPPO A3S",
         "grade": "C",
         "ctx_tray_id": "CTC3021",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92050004736,
         "model_name": "OPPO A3S",
         "grade": "C",
         "ctx_tray_id": "CTC3021",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92080012698,
         "model_name": "OPPO A3S",
         "grade": "C",
         "ctx_tray_id": "CTC3021",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92080012420,
         "model_name": "OPPO A3S",
         "grade": "C",
         "ctx_tray_id": "CTC3021",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92080013197,
         "model_name": "OPPO A3S",
         "grade": "C",
         "ctx_tray_id": "CTC3021",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92080013405,
         "model_name": "OPPO A3S",
         "grade": "C",
         "ctx_tray_id": "CTC3021",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100003829,
         "model_name": "Xiaomi redmi note 5 ",
         "grade": "C",
         "ctx_tray_id": "CTT4607",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110007932,
         "model_name": "Xiaomi redmi note 5 ",
         "grade": "C",
         "ctx_tray_id": "CTT4607",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100003135,
         "model_name": "Xiaomi redmi note 5 ",
         "grade": "C",
         "ctx_tray_id": "CTT4607",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100005130,
         "model_name": "Xiaomi redmi note 5 ",
         "grade": "C",
         "ctx_tray_id": "CTT4607",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110005709,
         "model_name": "Xiaomi redmi note 5 ",
         "grade": "C",
         "ctx_tray_id": "CTT4607",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100000395,
         "model_name": "Xiaomi redmi note 5 ",
         "grade": "C",
         "ctx_tray_id": "CTT4607",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100003310,
         "model_name": "Xiaomi redmi note 5 ",
         "grade": "C",
         "ctx_tray_id": "CTT4607",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100000613,
         "model_name": "Xiaomi redmi note 5 ",
         "grade": "C",
         "ctx_tray_id": "CTT4607",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100000565,
         "model_name": "Xiaomi redmi note 5 ",
         "grade": "C",
         "ctx_tray_id": "CTT4607",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100004120,
         "model_name": "Xiaomi redmi note 5 ",
         "grade": "C",
         "ctx_tray_id": "CTT4607",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110009485,
         "model_name": "Xiaomi redmi note 5 ",
         "grade": "C",
         "ctx_tray_id": "CTT4607",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110005668,
         "model_name": "Xiaomi redmi note 5 ",
         "grade": "C",
         "ctx_tray_id": "CTT4607",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100003072,
         "model_name": "Xiaomi redmi note 5 ",
         "grade": "C",
         "ctx_tray_id": "CTT4607",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110007672,
         "model_name": "Xiaomi redmi note 5 ",
         "grade": "C",
         "ctx_tray_id": "CTT4607",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92080012877,
         "model_name": "Xiaomi redmi note 5 ",
         "grade": "C",
         "ctx_tray_id": "CTT4607",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001571,
         "model_name": "Xiaomi redmi note 5 ",
         "grade": "C",
         "ctx_tray_id": "CTT4607",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100003348,
         "model_name": "Xiaomi redmi note 5 ",
         "grade": "C",
         "ctx_tray_id": "CTT4607",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110007482,
         "model_name": "Xiaomi redmi note 5 ",
         "grade": "C",
         "ctx_tray_id": "CTT4607",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001349,
         "model_name": "Xiaomi redmi note 5 ",
         "grade": "C",
         "ctx_tray_id": "CTT4607",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100003097,
         "model_name": "Xiaomi redmi note 5 ",
         "grade": "C",
         "ctx_tray_id": "CTT4607",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110007733,
         "model_name": "Xiaomi redmi note 5 ",
         "grade": "C",
         "ctx_tray_id": "CTT4607",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110006282,
         "model_name": "Xiaomi redmi note 5 ",
         "grade": "C",
         "ctx_tray_id": "CTT4607",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110006759,
         "model_name": "Xiaomi redmi note 5 ",
         "grade": "C",
         "ctx_tray_id": "CTT4607",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100002572,
         "model_name": "Xiaomi redmi note 5 ",
         "grade": "C",
         "ctx_tray_id": "CTT4607",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100003962,
         "model_name": "Xiaomi redmi note 5 ",
         "grade": "C",
         "ctx_tray_id": "CTT4607",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100004028,
         "model_name": "Xiaomi redmi note 5 ",
         "grade": "C",
         "ctx_tray_id": "CTT4607",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100004299,
         "model_name": "Xiaomi redmi note 5 ",
         "grade": "C",
         "ctx_tray_id": "CTT4607",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110009968,
         "model_name": "Xiaomi redmi note 5 ",
         "grade": "C",
         "ctx_tray_id": "CTT4607",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110007097,
         "model_name": "Xiaomi redmi note 5 ",
         "grade": "C",
         "ctx_tray_id": "CTT4607",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100002528,
         "model_name": "Xiaomi redmi note 5 ",
         "grade": "C",
         "ctx_tray_id": "CTT4607",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110009624,
         "model_name": "Xiaomi redmi note 5 ",
         "grade": "C",
         "ctx_tray_id": "CTT4607",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001041,
         "model_name": "Xiaomi redmi note 5 ",
         "grade": "C",
         "ctx_tray_id": "CTT4607",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928050003309,
         "model_name": "Xiaomi redmi note 3",
         "grade": "C",
         "ctx_tray_id": "CTC3024",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010590,
         "model_name": "Xiaomi redmi note 3",
         "grade": "C",
         "ctx_tray_id": "CTC3024",
         "date": "07\/24\/2023"
        },
        {
         "uic": 862188039597083,
         "model_name": "Xiaomi redmi note 3",
         "grade": "C",
         "ctx_tray_id": "CTC3024",
         "date": "07\/24\/2023"
        },
        {
         "uic": 861375036831448,
         "model_name": "Xiaomi redmi note 3",
         "grade": "C",
         "ctx_tray_id": "CTC3024",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928050005303,
         "model_name": "Xiaomi redmi note 3",
         "grade": "C",
         "ctx_tray_id": "CTC3024",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928050006569,
         "model_name": "Xiaomi redmi note 3",
         "grade": "C",
         "ctx_tray_id": "CTC3024",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010937,
         "model_name": "Xiaomi redmi note 3",
         "grade": "C",
         "ctx_tray_id": "CTC3024",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928050009457,
         "model_name": "Xiaomi redmi note 3",
         "grade": "C",
         "ctx_tray_id": "CTC3024",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010932,
         "model_name": "Xiaomi redmi note 3",
         "grade": "C",
         "ctx_tray_id": "CTC3024",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92070012286,
         "model_name": "Xiaomi redmi note 3",
         "grade": "C",
         "ctx_tray_id": "CTC3024",
         "date": "07\/24\/2023"
        },
        {
         "uic": 862188038102372,
         "model_name": "Xiaomi redmi note 3",
         "grade": "C",
         "ctx_tray_id": "CTC3024",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928050005816,
         "model_name": "Xiaomi redmi note 3",
         "grade": "C",
         "ctx_tray_id": "CTC3024",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92090000247,
         "model_name": "Xiaomi redmi note 3",
         "grade": "C",
         "ctx_tray_id": "CTC3024",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110005715,
         "model_name": "Xiaomi redmi note 3",
         "grade": "C",
         "ctx_tray_id": "CTC3024",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92050008817,
         "model_name": "Xiaomi redmi note 3",
         "grade": "C",
         "ctx_tray_id": "CTC3024",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010669,
         "model_name": "Xiaomi redmi note 3",
         "grade": "C",
         "ctx_tray_id": "CTC3024",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92050003657,
         "model_name": "Xiaomi redmi note 3",
         "grade": "C",
         "ctx_tray_id": "CTC3024",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010409,
         "model_name": "Xiaomi redmi note 3",
         "grade": "C",
         "ctx_tray_id": "CTC3024",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010484,
         "model_name": "Xiaomi redmi note 3",
         "grade": "C",
         "ctx_tray_id": "CTC3024",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92050008855,
         "model_name": "Xiaomi redmi note 3",
         "grade": "C",
         "ctx_tray_id": "CTC3024",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100003881,
         "model_name": "Xiaomi redmi note 3",
         "grade": "C",
         "ctx_tray_id": "CTC3024",
         "date": "07\/24\/2023"
        },
        {
         "uic": 869589025538705,
         "model_name": "Xiaomi redmi note 3",
         "grade": "C",
         "ctx_tray_id": "CTC3024",
         "date": "07\/24\/2023"
        },
        {
         "uic": 861375039307149,
         "model_name": "Xiaomi redmi note 3",
         "grade": "C",
         "ctx_tray_id": "CTC3024",
         "date": "07\/24\/2023"
        },
        {
         "uic": 863217033171139,
         "model_name": "Xiaomi redmi note 3",
         "grade": "C",
         "ctx_tray_id": "CTC3024",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92080012718,
         "model_name": "Xiaomi redmi note 3",
         "grade": "C",
         "ctx_tray_id": "CTC3024",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100004732,
         "model_name": "Xiaomi redmi note 3",
         "grade": "C",
         "ctx_tray_id": "CTC3024",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928050004041,
         "model_name": "Xiaomi redmi note 3",
         "grade": "C",
         "ctx_tray_id": "CTC3024",
         "date": "07\/24\/2023"
        },
        {
         "uic": 863217036991863,
         "model_name": "Xiaomi redmi note 3",
         "grade": "C",
         "ctx_tray_id": "CTC3024",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010249,
         "model_name": "Xiaomi redmi note 3",
         "grade": "C",
         "ctx_tray_id": "CTC3024",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92060010479,
         "model_name": "Xiaomi redmi note 3",
         "grade": "C",
         "ctx_tray_id": "CTC3024",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92080012374,
         "model_name": "Xiaomi redmi note 3",
         "grade": "C",
         "ctx_tray_id": "CTC3024",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110007137,
         "model_name": "Xiaomi redmi note 3",
         "grade": "C",
         "ctx_tray_id": "CTC3024",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110007281,
         "model_name": "Xiaomi redmi 9A",
         "grade": "C",
         "ctx_tray_id": "STC4064",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110008181,
         "model_name": "Xiaomi redmi 9A",
         "grade": "C",
         "ctx_tray_id": "STC4064",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100003322,
         "model_name": "Xiaomi redmi 9A",
         "grade": "C",
         "ctx_tray_id": "STC4064",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110009686,
         "model_name": "Xiaomi redmi 9A",
         "grade": "C",
         "ctx_tray_id": "STC4064",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100002348,
         "model_name": "Xiaomi redmi 9A",
         "grade": "C",
         "ctx_tray_id": "STC4064",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110006110,
         "model_name": "Xiaomi redmi 9A",
         "grade": "C",
         "ctx_tray_id": "STC4064",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110007158,
         "model_name": "Xiaomi redmi 9A",
         "grade": "C",
         "ctx_tray_id": "STC4064",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110008010,
         "model_name": "Xiaomi redmi 9A",
         "grade": "C",
         "ctx_tray_id": "STC4064",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100002270,
         "model_name": "Xiaomi redmi 9A",
         "grade": "C",
         "ctx_tray_id": "STC4064",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110007230,
         "model_name": "Xiaomi redmi 9A",
         "grade": "C",
         "ctx_tray_id": "STC4064",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001160,
         "model_name": "Xiaomi redmi 9A",
         "grade": "C",
         "ctx_tray_id": "STC4064",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001519,
         "model_name": "Xiaomi redmi 9A",
         "grade": "C",
         "ctx_tray_id": "STC4064",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100003642,
         "model_name": "Xiaomi redmi 9A",
         "grade": "C",
         "ctx_tray_id": "STC4064",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100003258,
         "model_name": "Xiaomi redmi 9A",
         "grade": "C",
         "ctx_tray_id": "STC4064",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100005265,
         "model_name": "Xiaomi redmi 9A",
         "grade": "C",
         "ctx_tray_id": "STC4064",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100005239,
         "model_name": "Xiaomi redmi 9A",
         "grade": "C",
         "ctx_tray_id": "STC4064",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110009325,
         "model_name": "Xiaomi redmi 9A",
         "grade": "C",
         "ctx_tray_id": "STC4064",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100002869,
         "model_name": "Xiaomi redmi 9A",
         "grade": "C",
         "ctx_tray_id": "STC4064",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100000381,
         "model_name": "Xiaomi redmi 9A",
         "grade": "C",
         "ctx_tray_id": "STC4064",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001452,
         "model_name": "Xiaomi redmi 9A",
         "grade": "C",
         "ctx_tray_id": "STC4064",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100003077,
         "model_name": "Xiaomi redmi 9A",
         "grade": "C",
         "ctx_tray_id": "STC4064",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100002987,
         "model_name": "Xiaomi redmi 9A",
         "grade": "C",
         "ctx_tray_id": "STC4064",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110009269,
         "model_name": "Xiaomi redmi 9A",
         "grade": "C",
         "ctx_tray_id": "STC4064",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100000991,
         "model_name": "Xiaomi redmi 9A",
         "grade": "C",
         "ctx_tray_id": "STC4064",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100003811,
         "model_name": "Xiaomi redmi 9A",
         "grade": "C",
         "ctx_tray_id": "STC4064",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001549,
         "model_name": "Xiaomi redmi 9A",
         "grade": "C",
         "ctx_tray_id": "STC4064",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928070011859,
         "model_name": "Xiaomi redmi 9A",
         "grade": "C",
         "ctx_tray_id": "STC4064",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100000784,
         "model_name": "Xiaomi redmi note 4",
         "grade": "C",
         "ctx_tray_id": "CTT4532",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001068,
         "model_name": "Xiaomi redmi note 4",
         "grade": "C",
         "ctx_tray_id": "CTT4532",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100002743,
         "model_name": "Xiaomi redmi note 4",
         "grade": "C",
         "ctx_tray_id": "CTT4532",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100004133,
         "model_name": "Xiaomi redmi note 4",
         "grade": "C",
         "ctx_tray_id": "CTT4532",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001620,
         "model_name": "Xiaomi redmi note 4",
         "grade": "C",
         "ctx_tray_id": "CTT4532",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001319,
         "model_name": "Xiaomi redmi note 4",
         "grade": "C",
         "ctx_tray_id": "CTT4532",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100003569,
         "model_name": "Xiaomi redmi note 4",
         "grade": "C",
         "ctx_tray_id": "CTT4532",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100000480,
         "model_name": "Xiaomi redmi note 4",
         "grade": "C",
         "ctx_tray_id": "CTT4532",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110009961,
         "model_name": "Xiaomi redmi note 4",
         "grade": "C",
         "ctx_tray_id": "CTT4532",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001636,
         "model_name": "Xiaomi redmi note 4",
         "grade": "C",
         "ctx_tray_id": "CTT4532",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100002371,
         "model_name": "Xiaomi redmi note 4",
         "grade": "C",
         "ctx_tray_id": "CTT4532",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001194,
         "model_name": "Xiaomi redmi note 4",
         "grade": "C",
         "ctx_tray_id": "CTT4532",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110005901,
         "model_name": "Xiaomi redmi note 4",
         "grade": "C",
         "ctx_tray_id": "CTT4532",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001182,
         "model_name": "Xiaomi redmi note 4",
         "grade": "C",
         "ctx_tray_id": "CTT4532",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100002152,
         "model_name": "Xiaomi redmi note 4",
         "grade": "C",
         "ctx_tray_id": "CTT4532",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110005952,
         "model_name": "Xiaomi redmi note 4",
         "grade": "C",
         "ctx_tray_id": "CTT4532",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100003742,
         "model_name": "Xiaomi redmi note 4",
         "grade": "C",
         "ctx_tray_id": "CTT4532",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100002284,
         "model_name": "Xiaomi redmi note 4",
         "grade": "C",
         "ctx_tray_id": "CTT4532",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001507,
         "model_name": "Xiaomi redmi note 4",
         "grade": "C",
         "ctx_tray_id": "CTT4532",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100002135,
         "model_name": "Xiaomi redmi note 4",
         "grade": "C",
         "ctx_tray_id": "CTT4532",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001204,
         "model_name": "Xiaomi redmi note 4",
         "grade": "C",
         "ctx_tray_id": "CTT4532",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100003916,
         "model_name": "Xiaomi redmi note 4",
         "grade": "upgrade",
         "ctx_tray_id": "CTT4532",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928050003913,
         "model_name": "Xiaomi redmi 9a",
         "grade": "C",
         "ctx_tray_id": "STC4072",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110007288,
         "model_name": "Xiaomi redmi 9a",
         "grade": "C",
         "ctx_tray_id": "STC4072",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110009886,
         "model_name": "Xiaomi redmi 9a",
         "grade": "C",
         "ctx_tray_id": "STC4072",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928050008421,
         "model_name": "Xiaomi redmi 9a",
         "grade": "C",
         "ctx_tray_id": "STC4072",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110006083,
         "model_name": "Xiaomi redmi 9a",
         "grade": "C",
         "ctx_tray_id": "STC4072",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928050005887,
         "model_name": "Xiaomi redmi 9a",
         "grade": "C",
         "ctx_tray_id": "STC4072",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110009023,
         "model_name": "Xiaomi redmi 9a",
         "grade": "C",
         "ctx_tray_id": "STC4072",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100004765,
         "model_name": "Xiaomi redmi 9a",
         "grade": "C",
         "ctx_tray_id": "STC4072",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928030001363,
         "model_name": "Xiaomi redmi 9a",
         "grade": "C",
         "ctx_tray_id": "STC4072",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928050005189,
         "model_name": "Xiaomi redmi 9a",
         "grade": "C",
         "ctx_tray_id": "STC4072",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928030000677,
         "model_name": "Xiaomi redmi 9a",
         "grade": "C",
         "ctx_tray_id": "STC4072",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928050008545,
         "model_name": "Xiaomi redmi 9a",
         "grade": "C",
         "ctx_tray_id": "STC4072",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928050002925,
         "model_name": "Xiaomi redmi 9a",
         "grade": "C",
         "ctx_tray_id": "STC4072",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928030001159,
         "model_name": "Xiaomi redmi 9a",
         "grade": "C",
         "ctx_tray_id": "STC4072",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100005010,
         "model_name": "Xiaomi redmi 9a",
         "grade": "C",
         "ctx_tray_id": "STC4072",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928050008417,
         "model_name": "Xiaomi redmi 9a",
         "grade": "C",
         "ctx_tray_id": "STC4072",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928050003990,
         "model_name": "Xiaomi redmi 9a",
         "grade": "C",
         "ctx_tray_id": "STC4072",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928050005971,
         "model_name": "Xiaomi redmi 9a",
         "grade": "C",
         "ctx_tray_id": "STC4072",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928050006925,
         "model_name": "Xiaomi redmi 9a",
         "grade": "C",
         "ctx_tray_id": "STC4072",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928050008550,
         "model_name": "Xiaomi redmi 9a",
         "grade": "C",
         "ctx_tray_id": "STC4072",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928030000481,
         "model_name": "Xiaomi redmi 9a",
         "grade": "C",
         "ctx_tray_id": "STC4072",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928030000586,
         "model_name": "Xiaomi redmi 9a",
         "grade": "C",
         "ctx_tray_id": "STC4072",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100004430,
         "model_name": "Xiaomi redmi 9a",
         "grade": "C",
         "ctx_tray_id": "STC4072",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928050003150,
         "model_name": "Xiaomi redmi 9a",
         "grade": "C",
         "ctx_tray_id": "STC4072",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928050005470,
         "model_name": "Xiaomi redmi 9a",
         "grade": "C",
         "ctx_tray_id": "STC4072",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928030000782,
         "model_name": "Xiaomi redmi 9a",
         "grade": "C",
         "ctx_tray_id": "STC4072",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928050005578,
         "model_name": "Xiaomi redmi 9a",
         "grade": "C",
         "ctx_tray_id": "STC4072",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100004289,
         "model_name": "Xiaomi redmi 9a",
         "grade": "C",
         "ctx_tray_id": "STC4072",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928050007814,
         "model_name": "Xiaomi redmi 9a",
         "grade": "C",
         "ctx_tray_id": "STC4072",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928050009162,
         "model_name": "Xiaomi redmi 9a",
         "grade": "C",
         "ctx_tray_id": "STC4072",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928050003401,
         "model_name": "Xiaomi redmi 9a",
         "grade": "C",
         "ctx_tray_id": "STC4072",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110007959,
         "model_name": "Xiaomi redmi 9a",
         "grade": "C",
         "ctx_tray_id": "STC4072",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110009831,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "STC4014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110006627,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "STC4014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110007007,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "STC4014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110009873,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "STC4014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928050002947,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "STC4014",
         "date": "07\/24\/2023"
        },
        {
         "uic": "0FEJ0B_N",
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "STC4014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001219,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "STC4014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100005279,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "STC4014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928050004043,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "STC4014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100000957,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "STC4014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001066,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "STC4014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928050007844,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "STC4014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100002889,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "STC4014",
         "date": "07\/24\/2023"
        },
        {
         "uic": "0DT67T_Q",
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "STC4014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100005185,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "STC4014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110009431,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "STC4014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100003393,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "STC4014",
         "date": "07\/24\/2023"
        },
        {
         "uic": "0E2GPB_D",
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "STC4014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110006477,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "STC4014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110006728,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "STC4014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110007441,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "STC4014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928050004270,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "STC4014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928050006465,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "STC4014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928050004001,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "STC4014",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001003,
         "model_name": "Xiaomi redmi 8a",
         "grade": "C",
         "ctx_tray_id": "CTT4565",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001306,
         "model_name": "Xiaomi redmi 8a",
         "grade": "C",
         "ctx_tray_id": "CTT4565",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100000588,
         "model_name": "Xiaomi redmi 8a",
         "grade": "C",
         "ctx_tray_id": "CTT4565",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001588,
         "model_name": "Xiaomi redmi 8a",
         "grade": "C",
         "ctx_tray_id": "CTT4565",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110008017,
         "model_name": "Xiaomi redmi 8a",
         "grade": "C",
         "ctx_tray_id": "CTT4565",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100002094,
         "model_name": "Xiaomi redmi 8a",
         "grade": "C",
         "ctx_tray_id": "CTT4565",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100000746,
         "model_name": "Xiaomi redmi 8a",
         "grade": "C",
         "ctx_tray_id": "CTT4565",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100000605,
         "model_name": "Xiaomi redmi 8a",
         "grade": "C",
         "ctx_tray_id": "CTT4565",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100002030,
         "model_name": "Xiaomi redmi 8a",
         "grade": "C",
         "ctx_tray_id": "CTT4565",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100000626,
         "model_name": "Xiaomi redmi 8a",
         "grade": "C",
         "ctx_tray_id": "CTT4565",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001720,
         "model_name": "Xiaomi redmi 8a",
         "grade": "C",
         "ctx_tray_id": "CTT4565",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100002503,
         "model_name": "Xiaomi redmi 8a",
         "grade": "C",
         "ctx_tray_id": "CTT4565",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001054,
         "model_name": "Xiaomi redmi 8a",
         "grade": "C",
         "ctx_tray_id": "CTT4565",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100002267,
         "model_name": "Xiaomi redmi 8a",
         "grade": "C",
         "ctx_tray_id": "CTT4565",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110006422,
         "model_name": "Xiaomi redmi 8a",
         "grade": "C",
         "ctx_tray_id": "CTT4565",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100002610,
         "model_name": "Xiaomi redmi 8a",
         "grade": "C",
         "ctx_tray_id": "CTT4565",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001719,
         "model_name": "Xiaomi redmi 8a",
         "grade": "C",
         "ctx_tray_id": "CTT4565",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100002682,
         "model_name": "Xiaomi redmi 8a",
         "grade": "C",
         "ctx_tray_id": "CTT4565",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110006622,
         "model_name": "POCO M2",
         "grade": "C",
         "ctx_tray_id": "CTT4555",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100004863,
         "model_name": "POCO M2",
         "grade": "C",
         "ctx_tray_id": "CTT4555",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110008261,
         "model_name": "POCO M2",
         "grade": "C",
         "ctx_tray_id": "CTT4555",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100004326,
         "model_name": "POCO M2",
         "grade": "C",
         "ctx_tray_id": "CTT4555",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100004223,
         "model_name": "POCO M2",
         "grade": "C",
         "ctx_tray_id": "CTT4555",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100004906,
         "model_name": "POCO M2",
         "grade": "C",
         "ctx_tray_id": "CTT4555",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110007567,
         "model_name": "POCO M2",
         "grade": "C",
         "ctx_tray_id": "CTT4555",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100004904,
         "model_name": "POCO M2",
         "grade": "C",
         "ctx_tray_id": "CTT4555",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110005818,
         "model_name": "Samsung galaxy m31",
         "grade": "C",
         "ctx_tray_id": "CTC3042",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100004008,
         "model_name": "Samsung galaxy m31",
         "grade": "C",
         "ctx_tray_id": "CTC3042",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110006613,
         "model_name": "Samsung galaxy m31",
         "grade": "C",
         "ctx_tray_id": "CTC3042",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001190,
         "model_name": "Samsung galaxy m31",
         "grade": "C",
         "ctx_tray_id": "CTC3042",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110005527,
         "model_name": "Samsung galaxy m31",
         "grade": "C",
         "ctx_tray_id": "CTC3042",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110008003,
         "model_name": "Samsung galaxy m31",
         "grade": "C",
         "ctx_tray_id": "CTC3042",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100000434,
         "model_name": "Samsung galaxy m31",
         "grade": "C",
         "ctx_tray_id": "CTC3042",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100000815,
         "model_name": "Samsung galaxy m31",
         "grade": "C",
         "ctx_tray_id": "CTC3042",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100003676,
         "model_name": "Samsung galaxy m31",
         "grade": "C",
         "ctx_tray_id": "CTC3042",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100002622,
         "model_name": "Xiaomi redmi 5",
         "grade": "C",
         "ctx_tray_id": "CTC3049",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100002721,
         "model_name": "Xiaomi redmi 5",
         "grade": "C",
         "ctx_tray_id": "CTC3049",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110005798,
         "model_name": "Xiaomi redmi 5",
         "grade": "C",
         "ctx_tray_id": "CTC3049",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100002287,
         "model_name": "Xiaomi redmi 5",
         "grade": "C",
         "ctx_tray_id": "CTC3049",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110008761,
         "model_name": "Xiaomi redmi 5",
         "grade": "C",
         "ctx_tray_id": "CTC3049",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100002542,
         "model_name": "Xiaomi redmi 5",
         "grade": "C",
         "ctx_tray_id": "CTC3049",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110005723,
         "model_name": "Xiaomi redmi 5",
         "grade": "C",
         "ctx_tray_id": "CTC3049",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001892,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "CTT4598",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928050004172,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "CTT4598",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928050004230,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "CTT4598",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001463,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "CTT4598",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110009678,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "CTT4598",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110007652,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "CTT4598",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100002689,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "CTT4598",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110007886,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "CTT4598",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001232,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "CTT4598",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110007426,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "CTT4598",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110007415,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "CTT4598",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100000765,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "CTT4598",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110007027,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "CTT4598",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110005434,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "CTT4598",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001313,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "CTT4598",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001641,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "CTT4598",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100002311,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "CTT4598",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110006263,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "CTT4598",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001424,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "CTT4598",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100001779,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "CTT4598",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100005381,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "CTT4598",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100002636,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "CTT4598",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92100004657,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "CTT4598",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110007885,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "CTT4598",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110005978,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "CTT4598",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928050007527,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "CTT4598",
         "date": "07\/24\/2023"
        },
        {
         "uic": 928050007660,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "CTT4598",
         "date": "07\/24\/2023"
        },
        {
         "uic": 92110008056,
         "model_name": "Xiaomi redmi 6",
         "grade": "C",
         "ctx_tray_id": "CTT4598",
         "date": "07\/24\/2023"
        }
       ]
       let arr1=[]
      for (let x of arr) {
        let checkPresentIntray = await delivery.findOne({
          "uic_code.code": x.uic?.toString(),
        });
      
        if (checkPresentIntray == null) {
          arr1.push(x.uic)
        } 
      }
      resolve({ status: 1,data:arr1 });
    });
  },
  //SEARCH UIC FROM STX UTILITY COLLECTION
  stxUtilityScanUic: (uic) => {
    // PROMISE FOR GET DATA
    return new Promise(async (resolve, reject) => {
      // FETCH DATA / CHECK UIC VALID OR NOT
      const fetchData = await stxUtility.find({ uic: uic });
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
  stxUtilityGetStx: (uic, location, grade) => {
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
              if (parseInt(spt.limit) > parseInt(spt.items.length + 1)) {
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
  stxUtilityAddItems: (uic, stXTrayId, ctxTrayId, brand, model, muic) => {
    return new Promise(async (resolve, reject) => {
      const getDelivery = await delivery.findOneAndUpdate(
        { "uic_code.code": uic },
        {
          $set: {
            stx_tray_id: stXTrayId,
            ctx_tray_id: ctxTrayId,
            updated_at: Date.now(),
          },
        }
      );
      let obj = {
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
};
