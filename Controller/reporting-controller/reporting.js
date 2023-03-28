const { delivery } = require("../../Model/deliveryModel/delivery");
/*--------------------------------------------------------------*/

/************************************************** */
//REPORTING AGENT OPERATIONS//
/************************************************** */

module.exports = {
  getUnitsCond: (location, limit, skip) => {
    return new Promise(async (resolve, reject) => {
      const units = await delivery
        .find({ partner_shop: location })
        .limit( limit )
        .skip(skip);
      const forCount = await delivery.count({ partner_shop: location });
      resolve({ units: units, forCount: forCount });
    });
  },
};
