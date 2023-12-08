const {
  partAndColor,
} = require("../../Model/Part-list-and-color/part-list-and-color");
const { purchaseOrder } = require("../../Model/Purchase-order/purchase-order");
const { payment } = require("../../Model/paymentModel/payment");
const {
  purchaseOrderPlaced,
} = require("../../Model/procurement-order-place/pr-order-place");
const {
  procurmentToolsAndConsumables,
} = require("../../Model/procurement-order-place/procurement-order-place");
const { vendorMaster } = require("../../Model/vendorModel/vendorModel");
const { warranty } = require("../../Model/warrantyModel/warranty");
/****************************************************************** */

module.exports = {
  dashboardData: () => {
    let count = {
      purchaseCount: 0,
      orderDetails: 0,
      purchaseCountOfToolsAndConsumables:0
    };
    return new Promise(async (resolve, reject) => {
      count.purchaseCountOfToolsAndConsumables = await procurmentToolsAndConsumables.count({
        status: { $ne: "Order Placed" },
      });
      count.purchaseCount = await purchaseOrder.count({
        status: { $ne: "Order Placed" },
      });
      count.orderDetails = await purchaseOrderPlaced.count({});
      resolve(count);
    });
  },
  procurementRequestView: (status) => {
    return new Promise(async (resolve, reject) => {
      let data;
      if (status == "Order Placed") {
        data = await purchaseOrderPlaced.aggregate([
          { $match: {} },
          {
            $lookup: {
              from: "partandcolors",
              localField: "spn_number",
              foreignField: "part_code",
              as: "partDetails",
            },
          },
        ]);
      } else {
        data = await purchaseOrder.find({ status: { $ne: "Order Placed" } });
      }
      resolve(data);
    });
  },
  getProcurementOrderSummary: () => {
    return new Promise(async (resolve, reject) => {
      const data = await purchaseOrderPlaced.aggregate([
        {
          $match: {
            // You can add any specific match conditions here if needed
          },
        },
        {
          $addFields: {
            total_price_numeric: { $toDouble: "$total_price" }, // Convert total_price to a numeric field
            total_qty: { $toDouble: "$quantity" }, // Convert total_price to a numeric field
          },
        },
        {
          $group: {
            _id: "$vendor_id", // Grouping by vendor_id
            total_price: { $sum: "$total_price_numeric" }, // Calculating total price
            quantity: { $sum: "$total_qty" }, // Calculating total quantity
            last_placed_date: { $max: "$placed_date" }, // Finding the latest placed date
          },
        },
        {
          $sort: {
            last_placed_date: -1,
          },
        },
        {
          $project: {
            _id: 0, // Exclude the default _id field from the output
            vendor_id: "$_id", // Rename _id to vendor_id if needed
            total_price: 1,
            quantity: 1,
            last_placed_date: 1,
          },
        },
      ]);
      let totalAmount = 0;
      for (let x of data) {
        totalAmount = totalAmount + Number(x.total_price);
      }
      resolve({ data: data, totalAmount: totalAmount });
    });
  },
  placeOrderScreenDataFetch: (spnNumber, muic) => {
    return new Promise(async (resolve, reject) => {
      let obj = {
        findTheSpnDetails: null,
        vendor: [],
        purchaseHistory: [],
        purchaseRequest: {},
      };
      obj.findTheSpnDetails = await partAndColor.findOne({
        part_code: spnNumber,
      });
      if (obj.findTheSpnDetails) {
        obj.purchaseRequest = await purchaseOrder.findOne({
          spare_part_number: spnNumber,
          muic: muic,
          status: { $ne: "Order Placed" },
        });
        obj.vendor = await vendorMaster.find({
          deals: { $in: obj.findTheSpnDetails.sp_category },
          status: "Active",
        });
        obj.purchaseHistory = await purchaseOrderPlaced.find({
          spn_number: spnNumber,
          muic: muic,
        });
        resolve({ status: 1, pageData: obj });
      } else {
        resolve({ status: 0 });
      }
    });
  },
  placeOrder: (dataOfOrder) => {
    return new Promise(async (resolve, reject) => {
      const prefix = "POI";
      const randomDigits = Math.floor(Math.random() * 90000) + 10000; // Generates a random 5-digit number
      const timestamp = Date.now().toString().slice(-5); // Uses the last 5 digits of the current timestamp
      dataOfOrder.dataOfOrder.poid = prefix + timestamp + randomDigits;
      const data = await purchaseOrderPlaced.create(dataOfOrder.dataOfOrder);
      if (data) {
        const updateRequest = await purchaseOrder.findOneAndUpdate(
          {
            muic: dataOfOrder.muic,
            spare_part_number: dataOfOrder.spnNumber,
            status: { $ne: "Order Placed" },
          },
          {
            $set: {
              status: "Order Placed",
            },
          }
        );
        resolve({ status: 1 });
      } else {
        resolve({ status: 0 });
      }
    });
  },
  placeOrderDateFilter: (fromDate, toDate, type, vendors) => {
    return new Promise(async (resolve, reject) => {
      let dataofOrderRm;
      if (vendors == "" || vendors == undefined) {
        const fromDateTimestamp = new Date(fromDate);
        fromDateTimestamp.setHours(0, 0, 0, 0); // Set time to the beginning of the day
        const toDateTimestamp = new Date(toDate);
        toDateTimestamp.setHours(23, 59, 59, 999);
        dataofOrderRm = await purchaseOrderPlaced.aggregate([
          {
            $match: {
              placed_date: {
                $gte: new Date(fromDateTimestamp),
                $lte: new Date(toDateTimestamp),
              },
            },
          },
          {
            $lookup: {
              from: "partandcolors",
              localField: "spn_number",
              foreignField: "part_code",
              as: "partDetails",
            },
          },
        ]);
      } else {
        const fromDateTimestamp = new Date(fromDate);
        fromDateTimestamp.setHours(0, 0, 0, 0); // Set time to the beginning of the day
        const toDateTimestamp = new Date(toDate);
        toDateTimestamp.setHours(23, 59, 59, 999);
        dataofOrderRm = await purchaseOrderPlaced.aggregate([
          {
            $match: {
              $or: [
                {
                  placed_date: {
                    $gte: new Date(fromDateTimestamp),
                    $lte: new Date(toDateTimestamp),
                  },
                  vendor_id: vendors,
                },
              ],
            },
          },
          {
            $lookup: {
              from: "partandcolors",
              localField: "spn_number",
              foreignField: "part_code",
              as: "partDetails",
            },
          },
        ]);
      }
      let totalAmount = 0;
      if (dataofOrderRm.length == 0) {
        resolve({ filterData: dataofOrderRm, totalAmount: totalAmount });
      } else {
        for (let x of dataofOrderRm) {
          totalAmount = totalAmount + Number(x.total_price);
        }

        resolve({ filterData: dataofOrderRm, totalAmount: totalAmount });
      }
    });
  },
  fetchWarrantyAndTerms: () => {
    return new Promise(async (resolve, reject) => {
      let obj = {
        warranty: [],
        payments: [],
      };
      obj.warranty = await warranty.find();
      obj.payments = await payment.find();
      resolve(obj);
    });
  },
  getVendorsForDrop: (fromDate, toDate) => {
    return new Promise(async (resolve, reject) => {
      let arr = [];
      const fromDateTimestamp = new Date(fromDate);
      fromDateTimestamp.setHours(0, 0, 0, 0); // Set time to the beginning of the day
      const toDateTimestamp = new Date(toDate);
      toDateTimestamp.setHours(23, 59, 59, 999);
      const data = await vendorMaster
        .find()
        .sort({ name: 1 })
        .collation({ locale: "en_US", numericOrdering: true });
      for (let x of data) {
        const findOrder = await purchaseOrderPlaced.findOne({
          vendor_id: x.name,
          placed_date: {
            $gte: new Date(fromDateTimestamp),
            $lte: new Date(toDateTimestamp),
          },
        });
        if (findOrder) {
          arr.push(x);
        }
      }
      resolve(arr);
    });
  },
  // VIEW TOOLS AND CONSUMABLES PROCUREMNET
  procurementToolsAndConsumablesRequestView: async (status) => {
    try {
      let data = await procurmentToolsAndConsumables.find({
        status: { $ne: "Order Placed" },
      });
      return data;
    } catch (error) {
      return error;
    }
  },
  // PLACE ORDER PAGE TOOLS AND CONSUMABLES
  placeOrderScreenDataFetchToolsAndConsuamables: (request_id) => {
    return new Promise(async (resolve, reject) => {
      let obj = {
        findTheSpnDetails: null,
        vendor: [],
        purchaseHistory: [],
        purchaseRequest: {},
      };
      obj.purchaseRequest = await procurmentToolsAndConsumables.findOne({
        request_id: request_id,
        status: { $ne: "Order Placed" },
      });
      if (obj.purchaseRequest) {
        obj.findTheSpnDetails = await partAndColor.findOne({
          part_code: obj.purchaseRequest.part_number,
        });
        obj.vendor = await vendorMaster.find({
          deals: { $in: obj.findTheSpnDetails.sp_category },
          status: "Active",
        });
        obj.purchaseHistory = await purchaseOrderPlaced.find({
          spn_number: obj.purchaseRequest.part_number,
        });
        resolve({ status: 1, pageData: obj });
      } else {
        resolve({ status: 0 });
      }
    });
  },
  // PLACE THE ORDER TOOLS AND CONSUMABLES
  placeOrderToolsAndConsumables: (dataOfOrder) => {
    console.log(dataOfOrder);
    return new Promise(async (resolve, reject) => {
      const prefix = "POI";
      const randomDigits = Math.floor(Math.random() * 90000) + 10000; // Generates a random 5-digit number
      const timestamp = Date.now().toString().slice(-5); // Uses the last 5 digits of the current timestamp
      dataOfOrder.dataOfOrder.poid = prefix + timestamp + randomDigits;
      const data = await purchaseOrderPlaced.create(dataOfOrder.dataOfOrder);
      if (data) {
        const updateRequest =
          await procurmentToolsAndConsumables.findOneAndUpdate(
            {
              part_number: dataOfOrder.spnNumber,
              status: { $ne: "Order Placed" },
            },
            {
              $set: {
                status: "Order Placed",
              },
            }
          );
          if(updateRequest){

            resolve({ status: 1 });
          }
      } else {
        resolve({ status: 0 });
      }
    });
  },
};
