const { orders } = require("../../Model/ordersModel/ordersModel");
const { delivery } = require("../../Model/deliveryModel/delivery");
const { infra } = require("../../Model/infraModel");
const { products } = require("../../Model/productModel/product");
const { brands } = require("../../Model/brandModel/brand");
const { user } = require("../../Model/userModel");
const { masters } = require("../../Model/mastersModel");
const { badOrders } = require("../../Model/ordersModel/bad-orders-model");
const { badDelivery } = require("../../Model/deliveryModel/bad-delivery");
const moment = require("moment");
const elasticsearch = require("../../Elastic-search/elastic");
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
      let i = 0;
      for (let x of ordersData.item) {
        if (x.order_status == "NEW") {
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
          let imei_nmuber = await orders.findOne({
            imei: x?.imei,
            order_status: x?.order_status,
          });
          if (imei_nmuber) {
            let obj = {
              imei: x?.imei,
              status: x?.order_status,
            };
            imei.push(obj);
            err["imei_number_is_duplicate"] = imei;
          } else {
            if (
              ordersData.item.some(
                (data, index) =>
                  data?.imei == x?.imei &&
                  data?.order_status == x?.order_status &&
                  index != i
              )
            ) {
              let obj = {
                imei: x?.imei,
                status: x?.order_status,
              };
              imei.push(obj);
              err["imei_number_is_duplicate"] = imei;
            }
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
      };
      count.orders = await orders.count({ partner_shop: location });

      count.badOrders = await badOrders.count({ partner_shop: location });
      count.delivered = await orders.count({
        partner_shop: location,
        delivery_status: "Delivered",
      });
      count.notDelivered = await orders.count({
        partner_shop: location,
        delivery_status: "Pending",
      });
      count.delivery = await delivery.count({ partner_shop: location });
      count.badDelivery = await badDelivery.count({ partner_shop: location });
      count.uicGented = await delivery.count({
        partner_shop: location,
        uic_status: "Created",
      });
      count.uicDownloaded = await delivery.count({
        partner_shop: location,
        uic_status: "Printed",
      });
      count.uicNotGenrated = await delivery.count({
        partner_shop: location,
        uic_status: "Pending",
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
      count.botToWht = await masters.count({
        type_taxanomy: "BOT",
        prefix: "tray-master",
        sort_id: "Closed By Warehouse",
        cpc: location,
      });
      count.whtMerge = await masters.count({
        prefix: "tray-master",
        type_taxanomy: "WHT",
        sort_id: "Inuse",
        cpc: location,
      });
      count.mmtMerge = await masters.count({
        cpc: location,
        type_taxanomy: "MMT",
        prefix: "tray-master",
        sort_id: "Closed By Warehouse",
      });
      count.trackItem = await orders.count({
        partner_shop: location,
        delivery_status: "Delivered",
      });
      console.log(count);
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
  getBadOrders: (location) => {
    return new Promise(async (resolve, reject) => {
      let data = await badOrders
        .find({ partner_shop: location }, { _id: 0, __v: 0 })
        .sort({ _id: -1 });

      console.log(data);

      if (data) {
        resolve(data);
      }
    });
  },
  searchOrders: (searchType, value, location) => {
    return new Promise(async (resolve, reject) => {
      let allOrders;
      if (searchType == "order_id") {
        allOrders = await orders.aggregate([
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
            $limit: 50,
          },
        ]);
      } else if (searchType == "tracking_id") {
        allOrders = await orders.aggregate([
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
        ]);
      } else if (searchType == "imei") {
        allOrders = await orders.aggregate([
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
        ]);
      } else if (searchType == "order_status") {
        allOrders = await orders.aggregate([
          {
            $match: {
              partner_shop: location,
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
        ]);
      } else if (searchType == "item_id") {
        allOrders = await orders.aggregate([
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
        ]);
      } else if (searchType == "old_item_details") {
        allOrders = await orders.aggregate([
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
        ]);
      }

      if (allOrders) {
        resolve(allOrders);
      }
    });
  },
  getOrdersCount: (location) => {
    return new Promise(async (resolve, reject) => {
      let data = await orders.count({ partner_shop: location });
      resolve(data);
    });
  },
  badOrdersSearch: (searchType, value, location) => {
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
            $limit: 50,
          },
          {
            $project: { _id: 0, __v: 0 },
          },
          // {
          //     $unwind: "$products"
          // }
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
            $project: { _id: 0, __v: 0 },
          },
          // {
          //     $unwind: "$products"
          // }
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
            $project: { _id: 0, __v: 0 },
          },
        ]);
      }
      if (allOrders) {
        console.log(allOrders);
        resolve(allOrders);
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
  searchUicPageAll: (searchType, value, location, uic_status) => {
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
        ]);
      }

      if (allOrders) {
        resolve(allOrders);
      }
    });
  },
  searchUicPageAllPage: (searchType, value, location) => {
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
        ]);
      }

      if (allOrders) {
        resolve(allOrders);
      }
    });
  },
  notDeliveredOrders: (location, limit, skip) => {
    return new Promise(async (resolve, reject) => {
      let data = await orders
        .find({
          partner_shop: location,
          delivery_status: "Pending",
        })
        .limit(limit)
        .skip(skip);
      let count = await orders.count({
        partner_shop: location,
        delivery_status: "Pending",
      });
      resolve({ data: data, count: count });
    });
  },
  searchDeliveredOrders: (searchType, value, location) => {
    return new Promise(async (resolve, reject) => {
      let allOrders;
      if (searchType == "order_id") {
        allOrders = await orders.aggregate([
          {
            $match: {
              order_id: { $regex: "^" + value + ".*", $options: "i" },
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
            $unwind: "$delivery",
          },
        ]);
      } else if (searchType == "tracking_id") {
        allOrders = await orders.aggregate([
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
        ]);
      } else if (searchType == "imei") {
        allOrders = await orders.aggregate([
          {
            $match: {
              imei: { $regex: ".*" + value + ".*", $options: "i" },
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
            $unwind: "$delivery",
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
      } else if (searchType == "item_id") {
        allOrders = await orders.aggregate([
          {
            $match: {
              partner_shop: location,
              item_id: { $regex: "^" + value + ".*", $options: "i" },
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
      }
      if (allOrders) {
        resolve(allOrders);
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
      let addtoElasticSearch = elasticsearch.bulkImportToElastic(
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
      let data = await delivery.count({ partner_shop: location });
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
  getBadDelivery: (location) => {
    return new Promise(async (resolve, reject) => {
      let data = await badDelivery
        .find({ partner_shop: location }, { _id: 0, __v: 0 })
        .sort({ _id: -1 });

      if (data) {
        resolve(data);
      }
    });
  },
  searchDeliveryData: (searchType, value, location) => {
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
        ]);
      }
      if (allOrders) {
        resolve(allOrders);
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
        allOrders = await badDelivery.find(
          {
            partner_shop: location,
            order_id: { $regex: "^" + value + ".*", $options: "i" },
          },
          { _id: 0, __v: 0 }
        );
      } else if (searchType == "tracking_id") {
        allOrders = await badDelivery.find(
          {
            partner_shop: location,
            tracking_id: { $regex: ".*" + value + ".*", $options: "i" },
          },
          { _id: 0, __v: 0 }
        );
      } else if (searchType == "imei") {
        allOrders = await badDelivery.find(
          {
            partner_shop: location,
            imei: { $regex: ".*" + value + ".*", $options: "i" },
          },
          { _id: 0, __v: 0 }
        );
      } else if (searchType == "uic_status") {
        allOrders = await badDelivery.find(
          {
            partner_shop: location,
            order_status: { $regex: "^" + value + ".*", $options: "i" },
          },
          { _id: 0, __v: 0 }
        );
      } else if (searchType == "order_date") {
        value = value.split("/");
        value = value.reverse();
        value = value.join("-");
        allOrders = await badDelivery.find(
          {
            partner_shop: location,
            order_date: { $regex: ".*" + value + ".*", $options: "i" },
          },
          { _id: 0, __v: 0 }
        );
      } else if (searchType == "item_id") {
        allOrders = await badDelivery.find(
          {
            partner_shop: location,
            item_id: { $regex: "^" + value + ".*", $options: "i" },
          },
          { _id: 0, __v: 0 }
        );
      }
      if (allOrders) {
        resolve(allOrders);
      }
    });
  },
  addUicCode: (uicData) => {
    return new Promise(async (resolve, reject) => {
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

      let count = "";
      if (codeHighst[0].Max == null) {
        count = "0000001";
      } else {
        let number = Number(codeHighst[0].Max.slice(-7)).toString();
        let total = (Number(number) + 1).toString();
        if (total.length == 1) {
          count = "000000" + total;
        } else if (total.length == 2) {
          count = "00000" + total;
        } else if (total.length == 3) {
          count = "0000" + total;
        } else if (total.length == 4) {
          count = "000" + total;
        } else if (total.length == 5) {
          count = "00" + total;
        } else if (total.length == 6) {
          count = "0" + total;
        }
      }

      var date = new Date();
      let uic_code =
        "9" +
        new Date().getFullYear().toString().slice(-1) +
        (date.getMonth() + 1).toLocaleString("en-US", {
          minimumIntegerDigits: 2,
          useGrouping: false,
        }) +
        count;
      let data = await delivery.updateOne(
        { _id: uicData._id },
        {
          $set: {
            "uic_code.code": uic_code,
            "uic_code.user": uicData.email,
            "uic_code.created_at": Date.now(),
            uic_status: "Created",
          },
        },
        { upsert: true }
      );
      if (data.modifiedCount != 0) {
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
      let data = await delivery.updateOne(
        { _id: id },
        {
          $set: {
            uic_status: "Printed",
            download_time: Date.now(),
          },
        }
      );
      if (data.modifiedCount != 0) {
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
    console.log(trayData);
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
        console.log(obj);
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
    status
  ) => {
    return new Promise(async (resolve, reject) => {
      let arr = [];
      let whtTray;
      if (status == "Audit Done Closed By Warehouse") {
        whtTray = await masters
          .find({
            prefix: "tray-master",
            type_taxanomy: "WHT",
            brand: brand,
            model,
            model,
            cpc: location,
            sort_id: "Audit Done Closed By Warehouse",
            code: { $ne: fromTray },
          })
          .catch((err) => reject(err));
      } else {
        whtTray = await masters
          .find({
            prefix: "tray-master",
            type_taxanomy: "WHT",
            brand: brand,
            model,
            model,
            cpc: location,
            items: { $ne: [] },
            sort_id: "Inuse",
            code: { $ne: fromTray },
          })
          .catch((err) => reject(err));
      }
      if (whtTray.length !== 0) {
        for (let x of whtTray) {
          let count = itemCount + x.items.length;
          if (count == x.limit) {
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
        console.log(data);
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
      console.log(whtTray);
      if (whtTray.length !== 0) {
        for (let x of whtTray) {
          let count = x.items.length + itemsCount;
          if (count >= itemsCount) {
            arr.push(x);
          }
        }
        if (arr.length !== 0) {
          console.log(arr);
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
      if (whtTray.sort_id === "Audit Done Closed By Warehouse") {
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
          console.log("dataaa");
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
        let orderItems = await orders.find({ imei: value });
        if (orderItems.length == 0) {
          restOfStr = value.slice(1);
          orderItems = await orders.find({ imei: restOfStr });
          if (orderItems) {
            resolve(orderItems);
          } else {
            resolve({ status: 2 });
          }
        } else {
          resolve(orderItems);
        }
      } else if (firstChar.match(/[a-zA-Z0-9]/)) {
        let orderItems = await orders.find({ imei: value });
        if (orderItems.length == 0) {
          let orderItems = await orders.find({ imei: `'${value}` });
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

  // imeiSearchOrder: (value) => {
  //   return new Promise(async (resolve, reject) => {
  //     firstChar = value.charAt(0);
  //     if (firstChar.match(/[^a-zA-Z0-9]/)) {
  //       let orderItems = await orders.find({ imei: value });
  //       console.log('orderItems');
  //       if (orderItems?.length !== 0) {
  //         resolve(orderItems)
  //       } else {
  //         resolve({ status: 2 })
  //       }
  //     } else {
  //       let orderItems = await orders.find({ imei: `'${value}` });
  //       if (orderItems?.length !== 0) {
  //         resolve(orderItems)
  //       } else {
  //         resolve({ status: 2 })
  //       }
  //     }
  //   })
  // }
};
