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
        radyForPricing: 0,
        readyForPricingMuicBasis: 0,
        viewPriceCount: 0,
        viewPricedCountMuicBasis: 0,
        unitsCount: 0,
        unitsCountMuicBasis: 0,
        unitsCountSales: 0,
        unitsCountSalesMuicBasis: 0,
      };
      count.unitsCount = await delivery.count({
        tray_type: "ST",
        item_moved_to_billed_bin: { $exists: false },
        stx_tray_id: { $exists: true },
        sp_price: { $exists: false },
        mrp_price: { $exists: false },
        final_grade: { $exists: true },
        "audit_report.sub_muic": { $exists: true },
      });
      count.unitsCountMuicBasis = await delivery.count({
        tray_type: "ST",
        item_moved_to_billed_bin: { $exists: false },
        stx_tray_id: { $exists: true },
        sp_price: { $exists: false },
        mrp_price: { $exists: false },
        final_grade: { $exists: true },
        "audit_report.sub_muic": { $exists: false },
      });

      count.unitsCountSales = await delivery.count({
        tray_type: "ST",
        item_moved_to_billed_bin: { $exists: false },
        stx_tray_id: { $exists: true },
        sp_price: { $exists: true, $ne: null },
        mrp_price: { $exists: true, $ne: null },
        final_grade: { $exists: true },
        "audit_report.sub_muic": { $exists: true },
      });
      count.unitsCountSalesMuicBasis = await delivery.count({
        tray_type: "ST",
        item_moved_to_billed_bin: { $exists: false },
        stx_tray_id: { $exists: true },
        sp_price: { $exists: true, $ne: null },
        mrp_price: { $exists: true, $ne: null },
        final_grade: { $exists: true },
        "audit_report.sub_muic": { $exists: false },
      });
      count.radyForPricing = await delivery.aggregate([
        {
          $match: {
            tray_type: "ST",
            item_moved_to_billed_bin: { $exists: false },
            stx_tray_id: { $exists: true },
            sp_price: { $exists: false },
            mrp_price: { $exists: false },
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
            // Count the number of items in the 'items' array within each group
          },
        },
      ]);
      count.readyForPricingMuicBasis = await delivery.aggregate([
        {
          $match: {
            tray_type: "ST",
            item_moved_to_billed_bin: { $exists: false },
            stx_tray_id: { $exists: true },
            sp_price: { $exists: false }, // Filter out documents with null or missing sp_price
            mrp_price: { $exists: false },
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
            // Count the number of items in the 'items' array within each group
          },
        },
      ]);
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
      count.viewPricedCountMuicBasis = await delivery.aggregate([
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
      count.viewPriceCount = count.viewPriceCount.length;
      count.radyForPricing = count.radyForPricing.length;
      count.viewPricedCountMuicBasis = count.viewPricedCountMuicBasis.length;
      count.readyForPricingMuicBasis = count.readyForPricingMuicBasis.length;

      if (count) {
        resolve(count);
      }
    });
  },
  /*---------------------------READY FOR PRICING SCREEN --------------------------------------------*/
  readyForPricingScreen: (location) => {
    // PROMISE
    return new Promise(async (resolve, reject) => {
      const getBasedOnMuic = await delivery.aggregate([
        {
          $match: {
            tray_type: "ST",
            item_moved_to_billed_bin: { $exists: false },
            stx_tray_id: { $exists: true },
            sp_price: { $exists: false }, // Filter out documents with null or missing sp_price
            mrp_price: { $exists: false },
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
            documentCount: { $sum: 1 },
            item_id: { $first: "$item_id" },
            sp: { $first: "$sp_price" },
            mrp: { $first: "$mrp_price" },
            sub_muic: { $first: "$audit_report.sub_muic" },
            // Count the number of items in the 'items' array within each group
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
        x["ram"] = x.subMuicDetails?.[0]?.ram;
        x["storage"] = x.subMuicDetails?.[0]?.storage;
        x["color"] = x.subMuicDetails?.[0]?.color;
        x["brand_name"] = x.muicDetails?.[0]?.brand_name;
        x["model_name"] = x.muicDetails?.[0]?.model_name;
      }

      resolve(getBasedOnMuic);
    });
  },
  readyForPricingBasisMuicScreen: (location) => {
    // PROMISE
    return new Promise(async (resolve, reject) => {
      const getBasedOnMuic = await delivery.aggregate([
        {
          $match: {
            tray_type: "ST",
            item_moved_to_billed_bin: { $exists: false },
            stx_tray_id: { $exists: true },
            sp_price: { $exists: false }, // Filter out documents with null or missing sp_price
            mrp_price: { $exists: false },
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
            documentCount: { $sum: 1 },
            item_id: { $first: "$item_id" },
            sp: { $first: "$sp_price" },
            mrp: { $first: "$mrp_price" },

            // Count the number of items in the 'items' array within each group
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

      resolve(getBasedOnMuic);
    });
  },
  /*--------------------------------------ADD PRICE----------------------------------*/
  addPrice: (muicDetails, location, screen) => {
    //PROMISE
    return new Promise(async (resolve, reject) => {
      // LOOP THE MUIC DETAILS
      // SET FLAG
      let flag = true;
      for (let x of muicDetails) {
        let updatePriceTrayWise;
        console.log(x);
        if (screen == "Price updation") {
          updatePriceTrayWise = await delivery.updateMany(
            {
              item_moved_to_billed_bin: { $exists: false },
              stx_tray_id: { $exists: true },
              tray_type: "ST",
              sp_price: { $exists: true }, // Filter out documents with null or missing sp_price
              mrp_price: { $exists: true },
              final_grade: x.grade,
              "audit_report.sub_muic": x.submuic,
            },
            {
              $set: {
                sp_price: parseInt(x.sp),
                mrp_price: parseInt(x.mrp),
                price_updation_date: Date.now(),
              },
            }
          );
        } else {
          // FIND OUT SKUID OF THE PRODUCT USING MUIC
          // UPDATE THE PRICE IN TRAY WAISE
          updatePriceTrayWise = await delivery.updateMany(
            {
              item_moved_to_billed_bin: { $exists: false },
              stx_tray_id: { $exists: true },
              tray_type: "ST",
              final_grade: x.grade,
              "audit_report.sub_muic": x.submuic,
            },
            {
              $set: {
                price_creation_date: new Date(
                  new Date().toISOString().split("T")[0]
                ),
                sp_price: parseInt(x.sp),
                mrp_price: parseInt(x.mrp),
                price_updation_date: Date.now(),
              },
            }
          );
        }
        console.log(updatePriceTrayWise);
        if (updatePriceTrayWise.modifiedCount == 0) {
          flag = false;
        }
      }
      if (flag) {
        resolve({ status: true });
      } else {
        resolve({ status: false });
      }
    });
  },
  addPriceMuicBasis: (muicDetails, location, screen) => {
    //PROMISE
    return new Promise(async (resolve, reject) => {
      // LOOP THE MUIC DETAILS
      // SET FLAG
      let flag = true;
      for (let x of muicDetails) {
        let updatePriceTrayWise;
        let findProduct = await products.findOne({ muic: x.muic });
        if (screen == "Price updation") {
          updatePriceTrayWise = await delivery.updateMany(
            {
              item_moved_to_billed_bin: { $exists: false },
              stx_tray_id: { $exists: true },
              tray_type: "ST",
              sp_price: { $exists: true }, // Filter out documents with null or missing sp_price
              mrp_price: { $exists: true },
              final_grade: x.grade,
              "audit_report.sub_muic": { $exists: false },
              item_id: findProduct.vendor_sku_id,
            },
            {
              $set: {
                sp_price: parseInt(x.sp),
                mrp_price: parseInt(x.mrp),
                price_updation_date: Date.now(),
              },
            }
          );
        } else {
          // FIND OUT SKUID OF THE PRODUCT USING MUIC
          // UPDATE THE PRICE IN TRAY WAISE
          updatePriceTrayWise = await delivery.updateMany(
            {
              item_moved_to_billed_bin: { $exists: false },
              stx_tray_id: { $exists: true },
              tray_type: "ST",
              final_grade: x.grade,
              "audit_report.sub_muic": { $exists: false },
              item_id: findProduct.vendor_sku_id,
            },
            {
              $set: {
                price_creation_date: new Date(
                  new Date().toISOString().split("T")[0]
                ),
                sp_price: parseInt(x.sp),
                mrp_price: parseInt(x.mrp),
                price_updation_date: Date.now(),
              },
            }
          );
        }
        if (updatePriceTrayWise.modifiedCount == 0) {
          flag = false;
        }
      }
      if (flag) {
        resolve({ status: true });
      } else {
        resolve({ status: false });
      }
    });
  },
};
