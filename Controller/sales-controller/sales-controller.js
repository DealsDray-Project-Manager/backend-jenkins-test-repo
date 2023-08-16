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
  dashboardCount: (location,username) => {
    return new Promise(async (resolve, reject) => {
      let count = {
        viewPriceCount: 0,
        buyerCount: 0,
      }; 
       count.buyerCount = await user.count({
      user_type: 'Buyer',sales_users:username});
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
            price_updation_date: { $first: "$price_updation_date" },
            price_creation_date: { $first: "$price_creation_date" },
          },
        },
      ]);
      for (let x of getBasedOnMuic) {
        x["muic_one"] = x.muic[0];
      }
      resolve(getBasedOnMuic);
    });
  },
  getItemsForReadyForSales: (location, brand, model, grade, date) => {
    //PROMISE
    return new Promise(async (resolve, reject) => {
      const getBasedOnMuic = await masters.aggregate([
        {
          $match: {
            type_taxanomy: "ST",
            cpc: location,
            sort_id: "Ready to Pricing",
            brand:brand,
            model:model,
            tray_grade:grade,
            price_creation_date:new Date(
              new Date(date)
            ),
          },
        },
        {
          $unwind: "$items",
        },
        {
          $project: {
            items: "$items",
            mrp_price:"$mrp_price",
            sp_price:"$sp_price",
            tray_grade:"$tray_grade",
            code: "$code",
          },
        },
      ]);
      let arr=[]
      for(let x of getBasedOnMuic){
         let obj={
          uic:x.items.uic,
          muic:x.items.muic,
          brand_name:x.items.brand_name,
          model_name:x.items.model_name,
          code:x.code,
          tray_grade:x.tray_grade,
          mrp_price:x.mrp_price,
          sp_price:x.sp_price
         }
         arr.push(obj)
      }
      resolve(arr);
    });
  },

  ReadyForSalesUnits: (location) => {
    //PROMISE
    return new Promise(async (resolve, reject) => {
      const getBasedOnMuic = await masters.aggregate([
        {
          $match: {
            type_taxanomy: "ST",
            cpc: location,
            sort_id: "Ready to Pricing",
            sp_price: { $exists: true, $ne: null }, 
            mrp_price: { $exists: true, $ne: null },
          },
        },
        {
          $unwind: "$items",
        },
        {
          $project: {
            items: "$items",
            mrp_price:"$mrp_price",
            sp_price:"$sp_price",
            tray_grade:"$tray_grade",
            code: "$code",
          },
        },
      ]);
      let arr=[]
      for(let x of getBasedOnMuic){
         let obj={
          uic:x.items.uic,
          muic:x.items.muic,
          brand_name:x.items.brand_name,
          model_name:x.items.model_name,
          code:x.code,
          tray_grade:x.tray_grade,
          mrp_price:x.mrp_price,
          sp_price:x.sp_price
         }
         arr.push(obj)
      }
      resolve(arr);
    });
  },


};
