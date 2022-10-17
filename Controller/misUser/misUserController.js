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
const { pickList } = require("../../Model/picklist_model/model");
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
      let i = 0;
      let order_date = [];
      let order_timestamp = [];
      let delivery_date = [];
      let gc_redeem_time = [];
      let order_status = [];
      for (let x of ordersData.item) {
        if (x.order_status == "NEW") {
          let orderExists = await orders.findOne({
            order_id: x.order_id,
          });
          console.log(orderExists);
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
          // if(x.order_date != undefined){
          //   let dateCheck=new Date(x.order_date)
          //   if(dateCheck == "Invalid Date"){
          //     order_date.push(x.order_date)
          //     err["order_date"]=order_date
          //   }
          // }
          // if(x.order_timestamp != undefined){
          //   let dateCheck=new Date(x.order_timestamp)
          //   if(dateCheck == "Invalid Date"){
          //     order_timestamp.push(x.order_timestamp)
          //     err["order_timestamp"]=order_timestamp
          //   }
          // }
          // if(x.delivery_date != undefined){
          //   let dateCheck=new Date(x.delivery_date)
          //   if(dateCheck == "Invalid Date"){
          //     delivery_date.push(x.delivery_date)
          //     err["delivery_date"]=delivery_date
          //   }
          // }
          // if(x.gc_redeem_time != undefined){
          //   let dateCheck=new Date(x.gc_redeem_time)
          //   if(dateCheck == "Invalid Date"){
          //     gc_redeem_time.push(x.gc_redeem_time)
          //     err["gc_redeem_time"]=gc_redeem_time
          //   }
          // }
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
  importOrdersData: (ordersData) => {
    console.log(ordersData.invalidItem.length);
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
  getOrders: (location) => {
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
        // {
        //     $unwind: "$products"
        // }
      ]);

      if (allOrders) {
        resolve(allOrders);
      }
    });
  },
  getBadOrders: (location) => {
    console.log(location);
    return new Promise(async (resolve, reject) => {
      let data = await badOrders.find({ partner_shop: location });

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
          // {
          //     $unwind: "$products"
          // }
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
          { $match: { imei: { $regex: ".*" + value + ".*", $options: "i" } } },
          {
            $lookup: {
              from: "products",
              localField: `item_id`,
              foreignField: "vendor_sku_id",
              as: "products",
            },
          },
          // {
          //     $unwind: "$products"
          // }
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
          // {
          //     $unwind: "$products"
          // }
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
        ]);
      } else if (searchType == "imei") {
        allOrders = await badOrders.aggregate([
          { $match: { imei: { $regex: ".*" + value + ".*", $options: "i" } } },
          {
            $lookup: {
              from: "products",
              localField: `item_id`,
              foreignField: "vendor_sku_id",
              as: "products",
            },
          },
          // {
          //     $unwind: "$products"
          // }
        ]);
      } else if (searchType == "order_status") {
        console.log("ff");
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
        ]);
      }
      if (allOrders) {
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
  getDeliveredOrders: (location) => {
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
      ]);
      resolve(data);
    });
  },
  getUicPage: (location) => {
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
          $unwind: "$order",
        },
      ]);
      resolve(data);
    });
  },
  searchUicPageAll: (searchType, value, location, uic_status) => {
    console.log(uic_status);
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
  notDeliveredOrders: (location) => {
    return new Promise(async (resolve, reject) => {
      let data = await orders.find({
        partner_shop: location,
        delivery_status: "Pending",
      });
      resolve(data);
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
              tracking_id: { $regex: ".*" + value + ".*", $options: "i" },
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
    console.log(deliveryData);
    return new Promise(async (resolve, reject) => {
      let err = {};
      let tracking_id = [];
      let order_id = [];
      let item_id = [];
      let partner_shop = [];
      let notDelivered = [];

      for (let i = 0; i < deliveryData.item.length; i++) {
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
  getDelivery: (location) => {
    return new Promise(async (resolve, reject) => {
      let allDeliveryData = await delivery.aggregate([
        { $match: { partner_shop: location } },
        {
          $lookup: {
            from: "orders",
            localField: "order_id",
            foreignField: "order_id",
            as: "result",
          },
        },
      ]);
      resolve(allDeliveryData);
    });
  },
  getBadDelivery: (location) => {
    return new Promise(async (resolve, reject) => {
      let data = await badDelivery.find({ partner_shop: location });
      if (data) {
        resolve(data);
      }
    });
  },
  searchDeliveryData: (searchType, value, location) => {
    return new Promise(async (resolve, reject) => {
      let allOrders;
      if (searchType == "order_id") {
        allOrders = await delivery.find({
          partner_shop: location,
          order_id: { $regex: "^" + value + ".*", $options: "i" },
        });
      } else if (searchType == "tracking_id") {
        allOrders = await delivery.find({
          partner_shop: location,
          tracking_id: { $regex: ".*" + value + ".*", $options: "i" },
        });
      } else if (searchType == "imei") {
        allOrders = await delivery.find({
          imei: { $regex: ".*" + value + ".*", $options: "i" },
          partner_shop: location,
        });
      } else if (searchType == "uic_status") {
        allOrders = await delivery.find({
          partner_shop: location,
          order_status: { $regex: "^" + value + ".*", $options: "i" },
        });
      } else if (searchType == "order_date") {
        value = value.split("/");
        value = value.reverse();
        value = value.join("-");
        allOrders = await delivery.find({
          partner_shop: location,
          order_date: { $regex: ".*" + value + ".*", $options: "i" },
        });
      } else if (searchType == "item_id") {
        allOrders = await delivery.find({
          partner_shop: location,
          item_id: { $regex: "^" + value + ".*", $options: "i" },
        });
      }

      if (allOrders) {
        resolve(allOrders);
      }
    });
  },
  searchBagDeliveryData: (searchType, value, location) => {
    return new Promise(async (resolve, reject) => {
      let allOrders;
      if (searchType == "order_id") {
        allOrders = await badDelivery.find({
          partner_shop: location,
          order_id: { $regex: "^" + value + ".*", $options: "i" },
        });
      } else if (searchType == "tracking_id") {
        allOrders = await badDelivery.find({
          partner_shop: location,
          tracking_id: { $regex: ".*" + value + ".*", $options: "i" },
        });
      } else if (searchType == "imei") {
        allOrders = await badDelivery.find({
          partner_shop: location,
          imei: { $regex: ".*" + value + ".*", $options: "i" },
        });
      } else if (searchType == "uic_status") {
        console.log("ff");
        allOrders = await badDelivery.find({
          partner_shop: location,
          order_status: { $regex: "^" + value + ".*", $options: "i" },
        });
      } else if (searchType == "order_date") {
        value = value.split("/");
        value = value.reverse();
        value = value.join("-");
        allOrders = await badDelivery.find({
          partner_shop: location,
          order_date: { $regex: ".*" + value + ".*", $options: "i" },
        });
      } else if (searchType == "item_id") {
        allOrders = await badDelivery.find({
          partner_shop: location,
          item_id: { $regex: "^" + value + ".*", $options: "i" },
        });
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
      console.log(count);
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
        console.log(data);
        resolve(data);
      } else {
        resolve();
      }
    });
  },
  getUicRecon: (status) => {
    return new Promise(async (resolve, reject) => {
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
      ]);
      console.log(data[0]);
      resolve(data);
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
  getStockin: () => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        sort_id: { $ne: "No Status" },
        prefix: "bag-master",
      });
      console.log(data);
      resolve(data);
    });
  },
  getBot: () => {
    return new Promise(async (resolve, reject) => {
      let data = await user.aggregate([
        { $match: { user_type: "Bag Opening" } },
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
        let arr = [];
        let status = false;
        for (let i = 0; i < data.length; i++) {
          if (data[i]?.bag?.length == 0) {
            arr.push(data[i]);
          } else {
            for (let x of data[i]?.bag) {
              if (x.prefix == "bag-master") {
                status = true;
                break;
              }
            }
            if (status != true) {
              arr.push(data[i]);
            }
          }
        }
        resolve(arr);
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
        console.log(x);
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
    console.log(badOrdersData);
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
      for (let x of data[0].delivery) {
        for (let y of data[0].orders) {
          if (x.order_id == y.order_id) {
            x.order_order_date = y.order_date;
            x.order_old_item_detail = y.old_item_details;
          }
        }
      }
      if (data) {
        resolve(data);
      }
    });
  },
  getPickUpListData: () => {
    return new Promise(async (resolve, reject) => {
      let data = await delivery.aggregate([
        {
          $match: {
            tray_type: "BOT",
            tray_status: "Closed By Warehouse",
          },
        },
        {
          $lookup: {
            from: "products",
            localField: "item_id",
            foreignField: "vendor_sku_id",
            as: "product",
          },
        },
        {
          $unwind: "$product",
        },
      ]);
      console.log(data);
      if (data) {
        resolve(data);
      }
    });
  },
  createPickList: (pickListData) => {
    return new Promise(async (resolve, reject) => {
      let data = await pickList.create({
        created_at: Date.now(),
        item: pickListData,
      });
      if (data) {
        for (let x of pickListData) {
          let deliveryTrack = await delivery.updateOne(
            { tracking_id: x.tracking_id },
            {
              $set: {
                pick_list_status: "Created",
              },
            }
          );
        }
        resolve(data);
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
  getChargingUsers: () => {
    return new Promise(async (resolve, reject) => {
      let data = await user.find({ user_type: "Charging" });
      if (data) {
        resolve(data);
      }
    });
  },
  whtSendToWh: (whtTrayData) => {
    return new Promise(async (resolve, reject) => {
      let data;
      for (let x of whtTrayData.tray) {
        data = await masters.updateOne(
          { code: x },
          {
            $set: {
              sort_id: "Send for charging",
              issued_user_name: whtTrayData.user_name,
            },
          }
        );
      }
      if (data.matchedCount != 0) {
        resolve(data);
      } else {
        resolve();
      }
    });
  },
};
