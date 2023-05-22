const { masters } = require("../../Model/mastersModel");
/****************************************************************** */

module.exports = {
  dashboardData: (location) => {
    return new Promise(async (resolve, reject) => {
      let count = {
        rdl_two: 0,
        rdl2Request: 0,
      };
      count.rdl_two = await masters.count({
        prefix: "tray-master",
        type_taxanomy: "WHT",
        sort_id: "Ready to RDL-Repair",
        cpc: location,
      });
      count.rdl2Request = await masters.count({
        prefix: "tray-master",
        type_taxanomy: "WHT",
        sort_id: "Send for RDL-2",
        cpc: location,
      });
      if (count) {
        resolve(count);
      }
    });
  },
};
