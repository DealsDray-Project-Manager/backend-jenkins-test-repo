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
        viewPriceCount:0,
        unitsCount:0,
        unitsCountSales:0
      };
      count.unitsCount = await masters.aggregate([
        {
          $match: {
            type_taxanomy: "ST",
            cpc: location,
            sort_id:{$in:["Ready to Pricing","Inuse"]},
            sp_price: { $exists: false },
            mrp_price: { $exists: false},
          },
        },
        {
          $group: {
            _id: null, // Group all documents together
            itemCountSum: { $sum: { $size: "$items" } }, // Sum the itemCount for all documents
          },
        },
      ]) // Convert aggregation result to an array
      if (count.unitsCount.length > 0) {
        count.unitsCount = count.unitsCount[0].itemCountSum; // Extract the sum from the result
      } else {
        count.unitsCount = 0; // If there are no results, set unitsCount to 0
      }
      count.unitsCountSales = await masters.aggregate([
        {
          $match: {
            type_taxanomy: "ST",
            cpc: location,
            sort_id:{$in:["Ready to Pricing","Inuse"]},
            sp_price: { $exists: true },
            mrp_price: { $exists: true},
          },
        },
        {
          $group: {
            _id: null, // Group all documents together
            itemCountSum: { $sum: { $size: "$items" } }, // Sum the itemCount for all documents
          },
        },
      ]) // Convert aggregation result to an array
      if (count.unitsCountSales.length > 0) {
        count.unitsCountSales = count.unitsCountSales[0].itemCountSum; // Extract the sum from the result
      } else {
        count.unitsCountSales = 0; // If there are no results, set unitsCount to 0
      }
      
      count.radyForPricing = await masters.aggregate([
        {
          $match: {
            type_taxanomy: "ST",
            cpc: location,
            sort_id:{$in:["Ready to Pricing","Inuse"]},
            sp_price: { $exists: false }, // Filter out documents with null or missing sp_price
            mrp_price: { $exists: false },
          },
        },
        {
          $group: {
            _id: {
              model: "$model",
              brand: "$brand",
              grade: "$tray_grade",
            },
            // Count the number of items in the 'items' array within each group
          },
        },
      ]);
      count.viewPriceCount = await masters.aggregate([
        {
          $match: {
            type_taxanomy: "ST",
            cpc: location,
            sort_id:{$in:["Ready to Pricing","Inuse"]},
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
      count.radyForPricing = count.radyForPricing.length;
      console.log(count);
      if (count) {
        resolve(count);
      }
    });
  },
  /*---------------------------READY FOR PRICING SCREEN --------------------------------------------*/
  readyForPricingScreen: (location) => {
    // PROMIS
    return new Promise(async (resolve, reject) => {
      const getBasedOnMuic = await masters.aggregate([
        {
          $match: {
            type_taxanomy: "ST",
            cpc: location,
            sort_id:{$in:["Ready to Pricing","Inuse"]},
            sp_price: { $exists: false }, // Filter out documents with null or missing sp_price
            mrp_price: { $exists: false },
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
            // Count the number of items in the 'items' array within each group
          },
        },
        {
          $lookup: {
            from: "products", // Replace with the name of the collection you want to lookup from
            localField: "muic",
            foreignField: "muic",
            as: "muicDetails",
          },
        },
      ]);
      for (let x of getBasedOnMuic) {
        x["muic_one"] = x.muic[0];
      }
      console.log(getBasedOnMuic);
      resolve(getBasedOnMuic);
    });
  },
  /*--------------------------------------ADD PRICE----------------------------------*/
  addPrice: (muicDetails, location,screen) => {
    //PROMISE
    console.log(muicDetails);
    return new Promise(async (resolve, reject) => {
      // LOOP THE MUIC DETAILS
      // SET FLAG
      let flag = true;
      for (let x of muicDetails) {
     
        let updatePriceTrayWise;
        const findSkuId = await products.findOne({ muic: x.muic });
         if(screen =="Price updation"){
          updatePriceTrayWise = await masters.updateMany(
            {
              brand: findSkuId.brand_name,
              model: findSkuId.model_name,
              tray_grade: x.grade,
              type_taxanomy: "ST",
              cpc: location,
              sort_id:{$in:["Ready to Pricing","Inuse"]},
              sp_price: { $exists: true }, // Filter out documents with null or missing sp_price
              mrp_price: { $exists: true },
            },
            {
              $set: {
                sp_price: parseInt(x.sp),
                mrp_price: parseInt(x.mrp),
                price_updation_date: Date.now(),
              },
            }
          );
        }
         else {
          // FIND OUT SKUID OF THE PRODUCT USING MUIC
          // UPDATE THE PRICE IN TRAY WAISE
          updatePriceTrayWise = await masters.updateMany(
           { $or:[
              {
                brand: findSkuId.brand_name,
                model: findSkuId.model_name,
                tray_grade: x.grade,
                type_taxanomy: "ST",
                cpc: location,
                sort_id:{$in:["Ready to Pricing","Inuse"]},
              },
            
            ]},
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
