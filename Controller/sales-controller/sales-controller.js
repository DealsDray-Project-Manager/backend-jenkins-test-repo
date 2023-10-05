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
  dashboardCount: (location, username) => {
    return new Promise(async (resolve, reject) => {
      let count = {
        viewPriceCount: 0,
        viewPriceCountMuicBasis: 0,
        buyerCount: 0,
        readyForSalesCount: 0,
      };
      count.buyerCount = await user.count({
        user_type: "Buyer",
        sales_users: username,
      });
      count.viewPriceCount = await delivery.aggregate([
        {
          $match: {
            tray_type: "ST",
            item_moved_to_billed_bin: { $exists: false },
            stx_tray_id: { $exists: true },
            sp_price: { $exists: true }, // Filter out documents with null or missing sp_price
            mrp_price: { $exists: true },
            final_grade: { $exists: true },
            "audit_report.sub_muic": { $exists: true },
          },
        },
        {
          $group: {
            _id: {
              grade: "$final_grade",
              sub_muic: "$audit_report.sub_muic",
            },
          },
        },
      ]);
       count.viewPriceCountMuicBasis = await delivery.aggregate([
        {
          $match: {
            tray_type: "ST",
            item_moved_to_billed_bin: { $exists: false },
            stx_tray_id: { $exists: true },
            sp_price: { $exists: true, $ne: null },
            mrp_price: { $exists: true, $ne: null },
            final_grade: { $exists: true },
            "audit_report.sub_muic": { $exists: false },
          },
        },
        {
          $group: {
            _id: {
              grade: "$final_grade",
              item_id: "$item_id",
            },
          },
        },
      ]);
      count.viewPriceCountMuicBasis = count.viewPriceCountMuicBasis.length;
      count.viewPriceCount = count.viewPriceCount.length;
      count.readyForSalesCount = await masters.aggregate([
        {
          $match: {
            type_taxanomy: "ST",
            sort_id: { $in: ["Inuse"] },
            sp_price: { $exists: true, $ne: null },
            mrp_price: { $exists: true, $ne: null },
          },
        },
        {
          $group: {
            _id: null,
            itemCount: { $sum: { $size: "$items" } },
            muic: { $first: "$items.muic" },
            sp: { $first: "$sp_price" },
            mrp: { $first: "$mrp_price" },
          },
        },
      ]);
      count.readyForSalesCount =
        count.readyForSalesCount.length > 0
          ? count.readyForSalesCount[0].itemCount
          : 0;
      if (count) {
        resolve(count);
      }
    });
  },
  /*----------------------------------VIEW PRICE--------------------------------------------*/

  viewPrice: (location) => {
    //PROMISE
    return new Promise(async (resolve, reject) => {
      const getBasedOnMuic = await delivery.aggregate([
        {
          $match: {
            tray_type: "ST",
            item_moved_to_billed_bin: { $exists: false },
            stx_tray_id: { $exists: true },
            sp_price: { $exists: true, $ne: null },
            mrp_price: { $exists: true, $ne: null },
            final_grade: { $exists: true },
            "audit_report.sub_muic": { $exists: true },
          },
        },
        {
          $group: {
            _id: {
              grade: "$final_grade",
              sub_muic: "$audit_report.sub_muic",
            },
            itemCount: { $sum: 1 },
            item_id: { $first: "$item_id" },
            sp: { $first: "$sp_price" },
            mrp: { $first: "$mrp_price" },
            sub_muic: { $first: "$audit_report.sub_muic" },
            price_updation_date: { $first: "$price_updation_date" },
            price_creation_date: { $first: "$price_creation_date" },
          },
        },
        {
          $lookup: {
            from: "products", // Replace with the name of the collection you want to lookup from
            localField: "item_id",
            foreignField: "vendor_sku_id",
            as: "muicDetails",
          },
        },
        {
          $lookup: {
            from: "submuics", // Replace with the name of the collection you want to lookup from
            localField: "sub_muic",
            foreignField: "sub_muic",
            as: "subMuicDetails",
          },
        },
      ]);

      for (let x of getBasedOnMuic) {
        x["muic_one"] = x.muicDetails?.[0]?.muic;
        x["item_id"] = x.muicDetails?.[0]?.vendor_sku_id;
        x["ram"] = x.subMuicDetails?.[0]?.ram;
        x["storage"] = x.subMuicDetails?.[0]?.storage;
        x["color"] = x.subMuicDetails?.[0]?.color;
        x["brand_name"] = x.muicDetails?.[0]?.brand_name;
        x["model_name"] = x.muicDetails?.[0]?.model_name;
      }
      console.log(getBasedOnMuic);
      resolve(getBasedOnMuic);
    });
  },
  viewPriceBasisMuic: (location) => {
    //PROMISE
    return new Promise(async (resolve, reject) => {
      const getBasedOnMuic = await delivery.aggregate([
        {
          $match: {
            tray_type: "ST",
            item_moved_to_billed_bin: { $exists: false },
            stx_tray_id: { $exists: true },
            sp_price: { $exists: true, $ne: null },
            mrp_price: { $exists: true, $ne: null },
            final_grade: { $exists: true },
            "audit_report.sub_muic": { $exists: false },
          },
        },
        {
          $group: {
            _id: {
              grade: "$final_grade",
              sub_muic: "$item_id",
            },
            itemCount: { $sum: 1 },
            item_id: { $first: "$item_id" },
            sp: { $first: "$sp_price" },
            mrp: { $first: "$mrp_price" },
            price_updation_date: { $max: "$price_updation_date" },
            price_creation_date: { $max: "$price_creation_date" },
          },
        },
        {
          $lookup: {
            from: "products", // Replace with the name of the collection you want to lookup from
            localField: "item_id",
            foreignField: "vendor_sku_id",
            as: "muicDetails",
          },
        },
      ]);

      for (let x of getBasedOnMuic) {
        x["muic_one"] = x.muicDetails?.[0]?.muic;
        x["brand_name"] = x.muicDetails?.[0]?.brand_name;
        x["model_name"] = x.muicDetails?.[0]?.model_name;
      }
      console.log(getBasedOnMuic);
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
            sort_id: { $ne: "Open" },
            brand: brand,
            model: model,
            tray_grade: grade,
            price_creation_date: new Date(new Date(date)),
          },
        },
        {
          $unwind: "$items",
        },
        {
          $project: {
            items: "$items",
            mrp_price: "$mrp_price",
            sp_price: "$sp_price",
            tray_grade: "$tray_grade",
            code: "$code",
          },
        },
      ]);
      let arr = [];
      for (let x of getBasedOnMuic) {
        let obj = {
          uic: x.items.uic,
          muic: x.items.muic,
          brand_name: x.items.brand_name,
          model_name: x.items.model_name,
          code: x.code,
          tray_grade: x.tray_grade,
          mrp_price: x.mrp_price,
          sp_price: x.sp_price,
        };
        arr.push(obj);
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
            sort_id: { $ne: "Open" },
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
            mrp_price: "$mrp_price",
            sp_price: "$sp_price",
            tray_grade: "$tray_grade",
            code: "$code",
          },
        },
      ]);
      let arr = [];
      for (let x of getBasedOnMuic) {
        let obj = {
          uic: x.items.uic,
          muic: x.items.muic,
          brand_name: x.items.brand_name,
          model_name: x.items.model_name,
          code: x.code,
          tray_grade: x.tray_grade,
          mrp_price: x.mrp_price,
          sp_price: x.sp_price,
        };
        arr.push(obj);
      }
      resolve(arr);
    });
  },
};
