const {
  partAndColor,
} = require("../../Model/Part-list-and-color/part-list-and-color");
const { purchaseOrder } = require("../../Model/Purchase-order/purchase-order");
const {
  prOrderPlacedSchema,
} = require("../../Model/procurement-order-place/pr-order-place");
const { vendorMaster } = require("../../Model/vendorModel/vendorModel");
/****************************************************************** */

module.exports = {
  dashboardData: () => {
    let count = {
      purchaseCount: 0,
    };
    return new Promise(async (resolve, reject) => {
      count.purchaseCount = await purchaseOrder.count({});
      resolve(count);
    });
  },
  procurementRequestView: () => {
    return new Promise(async (resolve, reject) => {
      const data = await purchaseOrder.find({});
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
        });
        resolve({ status: 1, pageData: obj });
      } else {
        resolve({ status: 0 });
      }
    });
  },
  placeOrder: (dataOfOrder) => {
    return new Promise(async (resolve, reject) => {
      const data = await prOrderPlacedSchema.create(dataOfOrder);
      if (data) {
        resolve({ status: 1 });
      } else {
        resolve({ status: 0 });
      }
    });
  },
};
