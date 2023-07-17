const { purchaseOrder } = require("../../Model/Purchase-order/purchase-order");
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
};
