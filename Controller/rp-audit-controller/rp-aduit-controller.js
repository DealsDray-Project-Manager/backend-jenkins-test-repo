const { masters } = require("../../Model/mastersModel");

/*------------------------------------------------------------------------------*/
module.exports = {
  dashboard: async (username) => {
    try {
      let obj = {
        issuedTrays: 0,
      };
      obj.issuedTrays = await masters.count({
        sort_id: "Issued to RP-Audit",
        issued_user_name: username,
      });

      return obj;
    } catch (error) {
      return error;
    }
  },
  // GET ISSUED TRAYS
  getIssuedTrays: async (username) => {
    try {
      const data = await masters.find({
        sort_id: "Issued to RP-Audit",
        issued_user_name: username,
      });
      return data;
    } catch (error) {
      return error;
    }
  },
};
