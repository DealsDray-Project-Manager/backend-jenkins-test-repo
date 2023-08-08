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
  dashboardCount: (location) => {
    return new Promise(async (resolve, reject) => {
      let count = {
        viewPriceCount: 0,
      };
      count.viewPriceCount = await masters.aggregate([
        {
          $match: {
            type_taxanomy: "ST",
            cpc: location,
            sort_id: "Ready to Pricing",
            sp_price: { $exists: true, $ne: null }, // Filter out documents with null or missing sp_price
            mrp_price: { $exists: true, $ne: null }, // Filter out documents with null or missing mrp_price
          },
        },
        {
          $group: {
            _id: {
              model: "$model",
              brand: "$brand",
              grade: "$tray_grade",
            },
            itemCount: { $sum: { $size: "$items" } },
            muic: { $first: "$items.muic" },
            sp: { $first: "$sp_price" },
            mrp: { $first: "$mrp_price" },
          },
        },
      ]);
      count.viewPriceCount = count.viewPriceCount.length;
      if (count) {
        resolve(count);
      }
    });
  },
  /*----------------------------------VIEW PRICE--------------------------------------------*/

  viewPrice: (location) => {
    //PROMISE
    return new Promise(async (resolve, reject) => {
      const getBasedOnMuic = await masters.aggregate([
        {
          $match: {
            type_taxanomy: "ST",
            cpc: location,
            sort_id: "Ready to Pricing",
            sp_price: { $exists: true, $ne: null }, // Filter out documents with null or missing sp_price
            mrp_price: { $exists: true, $ne: null }, // Filter out documents with null or missing mrp_price
          },
        },
        {
          $group: {
            _id: {
              model: "$model",
              brand: "$brand",
              grade: "$tray_grade",
            },
            itemCount: { $sum: { $size: "$items" } },
            muic: { $first: "$items.muic" },
            sp: { $first: "$sp_price" },
            mrp: { $first: "$mrp_price" },
          },
        },
      ]);
      resolve(getBasedOnMuic);
    });
  },
};
