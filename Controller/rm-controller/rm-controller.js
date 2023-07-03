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
  getSpTrayForPartissue: (username) => {
    console.log(username);
    return new Promise(async (resolve, reject) => {
      const getTray = await masters.find({
        prefix: "tray-master",
        sort_id: "Sent to sp warehouse",
        type_taxanomy: "SPT",
        issued_user_name: username,
      });
      resolve(getTray);
    });
  },
  spTrayPartIssuePage: (trayid, userName) => {
    return new Promise(async (resolve, reject) => {
      const getTheTray = await masters.findOne({ code: trayid });
      console.log(getTheTray);
      if (getTheTray) {
        if (getTheTray.sort_id == "Sent to sp warehouse") {
          if (getTheTray.issued_user_name == userName) {
            resolve({ status: 2, tray: getTheTray });
          } else {
            resolve({ status: 2 });
          }
        } else {
          resolve({ status: 1 });
        }
      } else {
        resolve({ status: 0 });
      }
    });
  },
  spTrayAddParts: (partId, trayId) => {
    return new Promise(async (resolve, reject) => {
      const updatePart = await masters.findOneAndUpdate(
        { code: trayId, "items.partId": partId },
        {
          $push: {
            actual_items: partId,
          },
          $set: {
            "items.$.status": "Added",
          },
        }
      );
      if (updatePart) {
        resolve({ status: 1 });
      } else {
        resolve({ status: 0 });
      }
    });
  },
  spTrayClose: (trayid) => {
    return new Promise(async (resolve, reject) => {
      const updateTheTray = await masters.findOneAndUpdate(
        { code: trayid },
        {
          $set: {
            sort_id: "Ready to RDL-Repair",
            actual_items: [],
          },
        }
      );
      if (updateTheTray) {
        resolve({ status: 1 });
      } else {
        resolve({ status: 0 });
      }
    });
  },
  getSpTrayForRdlRepair: (username) => {
    return new Promise(async (resolve, reject) => {
      const getTray = await masters.find({
        prefix: "tray-master",
        sort_id: "Ready to RDL-Repair",
        type_taxanomy: "SPT",
        issued_user_name: username,
      });
      resolve(getTray);
    });
  },
};
