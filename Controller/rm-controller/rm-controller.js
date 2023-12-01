const {
  partAndColor,
} = require("../../Model/Part-list-and-color/part-list-and-color");
const { box } = require("../../Model/boxModel/box");
const { masters } = require("../../Model/mastersModel");
const {
  partInventoryLedger,
} = require("../../Model/part-inventory-ledger/part-inventory-ledger");
const {
  toolsAndConsumablesIssueRequests,
} = require("../../Model/toolsAndConsumables-requests/toolsAndConsumablesIssue");
const { trayRack } = require("../../Model/tray-rack/tray-rack");
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
        sort_id: "Ready to RDL-2",
        cpc: location,
      });
      count.rdl_two = await masters.count({
        prefix: "tray-master",
        type_taxanomy: "WHT",
        sort_id: "Ready to RDL-2",
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
            for (let x of getTheTray?.items) {
              let checkBoxId = await partAndColor.findOne({
                part_code: x?.partId,
              });
              if (checkBoxId) {
                x["avl_qty_box"] = checkBoxId?.avl_stock;
              } else {
                x["avl_qty_box"] = "";
              }
            }
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
          $addToSet: {
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
  spTrayClose: (trayid, rackId) => {
    return new Promise(async (resolve, reject) => {
      const updateTheTray = await masters.findOneAndUpdate(
        { code: trayid },
        {
          $set: {
            sort_id: "Ready to RDL-2",
            temp_array: [],
            rack_id: rackId,
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
        sort_id: "Ready to RDL-2",
        type_taxanomy: "SPT",
        issued_user_name: username,
      });
      resolve(getTray);
    });
  },
  getSpTrayAfterRdlTwo: (location) => {
    return new Promise(async (resolve, reject) => {
      const data = await masters.find({
        $or: [
          {
            sort_id: "Received from RDL-2",
            type_taxanomy: "SPT",
            cpc: location,
          },
          {
            sort_id: "Closed by RDL-2",
            type_taxanomy: "SPT",
            cpc: location,
          },
        ],
      });
      resolve(data);
    });
  },
  partAddIntoBox: (
    partDetails,
    spTrayId,
    boxName,
    uniqueid,
    objId,
    username
  ) => {
    return new Promise(async (resolve, reject) => {
      const removeFromSpTray = await masters.findOneAndUpdate(
        { code: spTrayId },
        {
          $pull: {
            temp_array: {
              unique_id_gen: uniqueid,
            },
          },
        },
        {
          returnOriginal: false,
        }
      );
      if (objId == "Not used" || objId == "Not required") {
        const updateStock = await partAndColor.findOneAndUpdate(
          { part_code: partDetails },
          {
            $inc: {
              avl_stock: 1,
            },
          },
          {
            new: true,
          }
        );
        await partInventoryLedger.create({
          department: "SPWH",
          action: "Add Into Box",
          action_done_user: username,
          description: `Spare parts add into box after rdl-2 done by:${username}`,
          part_code: partDetails,
          in_stock: updateStock.avl_stock,
          tray_id: spTrayId,
        });
      }
      if (removeFromSpTray) {
        resolve({ status: 1 });
      } else {
        resolve({ status: 0 });
      }
    });
  },
  rdlTwoDoneCloseSpTray: (trayId, actionUser) => {
    return new Promise(async (resolve, reject) => {
      const closeSpTray = await masters.updateOne(
        { code: trayId },
        {
          $set: {
            sort_id: "Open",
            actual_items: [],
            temp_array: [],
            items: [],
            rdl_2_user_temp: null,
            issued_user_name: null,
          },
        }
      );
      if (closeSpTray.modifiedCount !== 0) {
        await unitsActionLog.create({
          action_type: "RDL-2 Done Closed by SP Warehouse",
          created_at: Date.now(),
          user_name_of_action: actionUser,
          user_type: "SP Warehouse",
          tray_id: trayId,
          track_tray: "Tray",
          description: `RDL-2 Done Closed by SP Warehouse:${actionUser}`,
        });
        resolve({ status: 1 });
      } else {
        resolve({ status: 0 });
      }
    });
  },
  getBoxData: (partId) => {
    return new Promise(async (resolve, reject) => {
      const findPart = await partAndColor.findOne({ part_code: partId });
      if (findPart) {
        let findBox = await box.find({ box_id: findPart?.box_id });
        resolve({ status: 1, boxData: findBox });
      } else {
        resolve({ status: 0 });
      }
    });
  },
  /*-------------------------------TOOLS AND CONSUMABLES-----------------------------------------*/
  getRequestsOfToolsAndConsumablesIssue: async (type) => {
    try {
      let data = [];
      if (type == "Assigned") {
        data = await toolsAndConsumablesIssueRequests.find({
          status: "Assigned",
        });
      } else {
        data = await toolsAndConsumablesIssueRequests.find();
      }
      return data;
    } catch (error) {
      return error;
    }
  },
  // GET ONLY ON REQUEST FROM TOOLS AND CONSUMABLES
  getOneRequestOfToolsAndConsumables: async (requestId,type) => {
    try {
      const data = await toolsAndConsumablesIssueRequests.findOne({
        request_id: requestId,
      });
      if (data) {
        if (data.status == type) {
          return { status: 1, requestData: data };
        }
        else if(type == "All"){
          return { status: 1, requestData: data };
        }
         else {
          return { status: 2 };
        }
      } else {
        return { status: 3 };
      }
    } catch (error) {
      return error;
    }
  },
  // APPROVE THE REQUEST OF TOOLS AND CONSUMABLES
  approveRequestForToolsAndConsumablesIssue: async (dataFromBody) => {
    try {
      const updateState =
        await toolsAndConsumablesIssueRequests.findOneAndUpdate(
          {
            request_id: dataFromBody.requestId,
          },
          {
            $set: {
              status: "Issued To Agent",
              issued_date: Date.now(),
            },
          }
        );
      if (updateState) {
        for (let x of updateState.tools_and_consumables_list) {
          await partInventoryLedger.create({
            department: "SP Warehouse",
            action: "Tools And Consumables Issued",
            action_done_user: dataFromBody.actionUser,
            description: `Tools and consumables Issued to :${updateState.issued_user_name}`,
            part_code: x.part_code,
          });
        }
        return { status: 1 };
      } else {
        return { status: 2 };
      }
    } catch (error) {
      return error;
    }
  },
};
