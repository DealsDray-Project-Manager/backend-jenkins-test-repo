const {
  partAndColor,
} = require("../../Model/Part-list-and-color/part-list-and-color");
const { purchaseOrder } = require("../../Model/Purchase-order/purchase-order");
const { payment } = require("../../Model/paymentModel/payment");
const {
  purchaseOrderPlaced,
} = require("../../Model/procurement-order-place/pr-order-place");
const { vendorMaster } = require("../../Model/vendorModel/vendorModel");
const { warranty } = require("../../Model/warrantyModel/warranty");
/****************************************************************** */

module.exports = {
  dashboardData: () => {
    let count = {
      purchaseCount: 0,
      orderDetails: 0,
    };
    return new Promise(async (resolve, reject) => {
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
        console.log(data);
      } else {
        data = await purchaseOrder.find({ status: { $ne: "Order Placed" } });
      }
      resolve(data);
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
          { muic: dataOfOrder.muic, spare_part_number: dataOfOrder.spnNumber },
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
            vendor_id: vendors,
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
      let totalAmount = 0;
      if (dataofOrderRm.length == 0) {
        resolve({ filterData: dataofOrderRm, totalAmount: totalAmount });
      } else {
        for (let x of dataofOrderRm) {
          console.log(x.total_price);
          totalAmount = totalAmount + Number(x.total_price);
        }
        console.log(totalAmount);
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
  getVendorsForDrop: () => {
    return new Promise(async (resolve, reject) => {
      let arr = [];
      const data = await vendorMaster
        .find()
        .sort({ name: 1 })
        .collation({ locale: "en_US", numericOrdering: true });
      for (let x of data) {
        const findOrder = await purchaseOrderPlaced.findOne({
          vendor_id: x.name,
        });
        if (findOrder) {
          arr.push(x);
        }
      }
      resolve(arr);
    });
  },
};
