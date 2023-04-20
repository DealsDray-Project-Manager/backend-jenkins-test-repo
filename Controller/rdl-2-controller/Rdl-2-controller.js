const { masters } = require("../../Model/mastersModel");

module.exports = {
  dashboardCount: (username) => {
    return new Promise(async (resolve, reject) => {
      let count = {
        trayRequest: 0,
      };
      count.trayRequest = await masters.count({
        $or: [{ issued_user_name: username, sort_id: "Issued to RDL-2" }],
      });
      if (count) {
        resolve(count);
      }
    });
  },
  getAssignedTray: (username) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        $or: [{ issued_user_name: username, sort_id: "Issued to RDL-2" }],
      });
      if (data) {
        resolve(data);
      }
    });
  },
};
