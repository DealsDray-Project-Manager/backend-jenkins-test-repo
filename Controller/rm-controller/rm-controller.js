const { box } = require("../../Model/boxModel/box");
const { masters } = require("../../Model/mastersModel");
/****************************************************************** */

module.exports = {
  dashboardData: (location, username) => {
    return new Promise(async (resolve, reject) => {
      let count = {
        rdl_two: 0,
        rdl2Request: 0,
        partIssue: 0,
        issueToRdl2: 0,
      };
      count.partIssue = await masters.count({
        prefix: "tray-master",
        type_taxanomy: "SPT",
        issued_user_name: username,
        sort_id: "Assigned to sp warehouse",
        cpc: location,
      });
      count.issueToRdl2 = await masters.count({
        prefix: "tray-master",
        type_taxanomy: "SPT",
        issued_user_name: username,
        sort_id: "Ready to RDL-Repair",
        cpc: location,
      });
      count.rdl_two = await masters.count({
        prefix: "tray-master",
        type_taxanomy: "WHT",
        sort_id: "Ready to RDL-Repair",
        cpc: location,
      });
      count.rdl2Request = await masters.count({
        prefix: "tray-master",
        type_taxanomy: "WHT",
        sort_id: "Send for RDL-two",
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
        sort_id: "Assigned to sp warehouse",
        type_taxanomy: "SPT",
        issued_user_name: username,
      });
      resolve(getTray);
    });
  },
  spTrayPartIssuePage: (trayid, userName, status) => {
    return new Promise(async (resolve, reject) => {
      const getTheTray = await masters.findOne({ code: trayid });
      if (getTheTray) {
        if (getTheTray.sort_id == "Assigned to sp warehouse") {
          if (getTheTray.issued_user_name == userName) {
            resolve({ status: 2, tray: getTheTray });
          } else {
            resolve({ status: 2 });
          }
        } else if (getTheTray.sort_id == status) {
          resolve({ status: 2, tray: getTheTray });
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
            temp_array: partId,
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
            temp_array: [],
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
  getSpTrayAfterRdlTwo: (location) => {
    return new Promise(async (resolve, reject) => {
      const data = await masters.find({
        sort_id: "Closed by RDL-two",
        type_taxanomy: "SPT",
        cpc: location,
      });
      resolve(data);
    });
  },
  partAddIntoBox: (partDetails, spTrayId, boxName,objId) => {
    return new Promise(async (resolve, reject) => {
      const addIntoBot = await box.findOneAndUpdate(
        { name: boxName },
        {
          $push: {
            sp_items: partDetails,
          },
        }
      );
      if (addIntoBot) {
        const removeFromSpTray = await masters.findOneAndUpdate(
          { code: spTrayId },
          {
            $pull: {
              temp_array: {
                part_id: partDetails,
                rdl_two_status: objId,
              },
            },
          },
          {
            returnOriginal: false,
          }
        );
        
        if (removeFromSpTray) {
          resolve({ status: 1 });
        } else {
          resolve({ status: 0 });
        }
      } else {
        resolve({ status: 0 });
      }
    });
  },
  rdlTwoDoneCloseSpTray:(trayId)=>{
    return new Promise(async(resolve,reject)=>{
      const closeSpTray=await masters.updateOne({code:trayId},{
        $set:{
          sort_id:"Open",
          actual_items:[],
          temp_array:[],
          items:[]
        }
      })
      if(closeSpTray.modifiedCount !== 0){
        resolve({status:1})
      }
      else{
        resolve({status:0})
      }
    
    })
  }
};
