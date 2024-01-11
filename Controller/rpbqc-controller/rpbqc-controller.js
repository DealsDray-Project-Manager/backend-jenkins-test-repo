const { delivery } = require("../../Model/deliveryModel/delivery");
const { masters } = require("../../Model/mastersModel");
const { unitsActionLog } = require("../../Model/units-log/units-action-log");
/*----------------------------------------------------------------*/

module.exports = {
  dashboard: async (username) => {
    try {
      let obj = {
        issuedTray: 0,
        rpBqcPending: 0,
        rpBqcDone: 0,
      };
      obj.issuedTray = await masters.count({
        sort_id: { $in: ["Issued to RP-BQC", "RP-BQC In Progress"] },
        issued_user_name: username,
      });
      let dataOfTray = await masters.findOne({
        sort_id: { $in: ["Issued to RP-BQC", "RP-BQC In Progress"] },
        issued_user_name: username,
      });
      if (dataOfTray) {
        obj.rpBqcPending = dataOfTray?.temp_array?.length;
      }
      return obj;
    } catch (error) {
      return error;
    }
  },
  // GET ISSUED TRAYS
  getIssuedTrays: async (username) => {
    try {
      const data = await masters.find({
        sort_id: { $in: ["Issued to RP-BQC", "RP-BQC In Progress"] },
        issued_user_name: username,
      });
      return data;
    } catch (error) {
      return error;
    }
  },
  //GET DATA FOR CLOSE PAGE
  getTrayForClosepage: async (username, trayId) => {
    try {
      const data = await masters.findOne({
        code: trayId,
        issued_user_name: username,
        sort_id: { $in: ["Issued to RP-BQC", "RP-BQC In Progress"] },
      });
      if (data) {
        return { status: 1, trayData: data };
      } else {
        return { status: 0 };
      }
    } catch (error) {
      return error;
    }
  },
  // GET PENDING ITEMS
  getDataofPendingItems: async (username, uic, type) => {
    try {
      const getTray = await masters.findOne({
        issued_user_name: username,
        sort_id: type,
        "temp_array.uic": uic,
      });
      if (getTray) {
        let findData = await delivery.findOne(
          { "uic_code.code": uic },
          {
            old_item_details: 1,
            charging: 1,
            rdl_fls_one_report: 1,
            rdl_two_report: 1,
            rp_audit_report:1,
            rp_bqc_report:1
          }
        );
        return { status: 1, findData: findData };
      } else {
        return { status: 0 };
      }
    } catch (error) {
      return error;
    }
  },
  // ITEM ADD INTO TRAY AFTER RPBQC
  addRpBqcData: async (dataOfRpBqc) => {
    try {
      let itemData = await masters.findOne(
        {
          sort_id: { $in: ["Issued to RP-BQC", "RP-BQC In Progress"] },
          issued_user_name: dataOfRpBqc.username,
          "temp_array.uic": dataOfRpBqc.uic,
        },
        {
          _id: 0,
          temp_array: {
            $elemMatch: { uic: dataOfRpBqc.uic },
          },
          code: 1,
        }
      );
      if (itemData) {
        let obj = {
          status: dataOfRpBqc.status,
          username_of_rpbqc: dataOfRpBqc.username,
        };
        let addIntoTray1, addIntoTray2, addIntoTray3;
        itemData.temp_array[0]["rp_bqc_report"] = obj;
        if (dataOfRpBqc.status == "RP-BQC Failed") {
          itemData.temp_array[0].rbqc_tray = null;
          addIntoTray1 = await masters.findOneAndUpdate(
            {
              code: itemData.temp_array[0]?.rdl_repair_report.rdl_two_tray,
            },
            {
              $addToSet: {
                items: itemData.temp_array[0],
              },
              $pull: {
                temp_array: dataOfRpBqc.uic,
              },
            }
          );
          addIntoTray3 = await masters.findOneAndUpdate(
            {
              code: itemData.temp_array[0]?.rdl_repair_report.rdl_two_tray,
            },
            {
              $pull: {
                actual_items: {
                  uic: dataOfRpBqc.uic,
                },
              },
            }
          );
          addIntoTray2 = await masters.findOneAndUpdate(
            {
              code: itemData.code,
            },
            {
              $pull: {
                temp_array: {
                  uic: dataOfRpBqc.uic,
                },
              },
            }
          );
        } else {
          addIntoTray1 = await masters.findOneAndUpdate(
            {
              code: dataOfRpBqc.rpa_tray,
            },
            {
              $set: {
                sort_id: "RP-Audit In Progress",
              },
              $addToSet: {
                temp_array: itemData.temp_array[0],
              },
            }
          );
          addIntoTray2 = await masters.findOneAndUpdate(
            {
              code: itemData.code,
            },
            {
              $pull: {
                temp_array: {
                  uic: dataOfRpBqc.uic,
                },
              },
            }
          );
        }
        if (addIntoTray1.modifiedCount !== 0) {
          await unitsActionLog.create({
            action_type: "RP-BQC Done",
            created_at: Date.now(),
            tray_id: itemData.code,
            user_name_of_action: dataOfRpBqc.username,
            track_tray: "Units",
            uic: dataOfRpBqc.uic,
            user_type: "PRC RP-BQC",
            report: dataOfRpBqc,
            tray_id: itemData.code,
            description: `RP-BQC done by the agent :${dataOfRpBqc.username}. status:${dataOfRpBqc.status}`,
          });
          await delivery.updateOne(
            { "uic_code.code": dataOfRpBqc.uic },
            {
              $set: {
                rp_bqc_report: dataOfRpBqc,
                rp_bqc_done_date: Date.now(),
              },
            }
          );
        }
        if (addIntoTray1.modifiedCount !== 0) {
          if (dataOfRpBqc.status == "RP-BQC Failed") {
            return {
              status: 2,
              trayId: itemData.temp_array[0]?.rpt_tray,
              username: addIntoTray3?.issued_user_name,
            };
          } else {
            return { status: 1, trayId: dataOfRpBqc.rpa_tray };
          }
        } else {
          return { status: 0 };
        }
      } else {
        return { status: 0 };
      }
    } catch (error) {
      return error;
    }
  },
  // CLOSE THE RPBQC TRAY
  closeRpbqcTray: async (trayData) => {
    try {
      const data = await masters.findOneAndUpdate(
        {
          code: trayData.trayId,
          sort_id: { $in: ["Issued to RP-BQC", "RP-BQC In Progress"] },
        },
        {
          $set: {
            sort_id: "Closed by RP-BQC",
            actual_items: [],
            closed_date_agent: Date.now(),
          },
        }
      );
      if (data) {
        await unitsActionLog.create({
          action_type: "RP-BQC Done and Closed",
          created_at: Date.now(),
          tray_id: trayData.trayId,
          user_name_of_action: data.issued_user_name,
          track_tray: "Tray",
          user_type: "PRC RP-BQC",
          description: `RP-BQC done by the agent :${data.issued_user_name} and closed the tray.`,
        });
        return { status: 1 };
      } else {
        return { status: 0 };
      }
    } catch (error) {
      return error;
    }
  },
  // GET RPB TRAY FOR RDL-2 SELECTION
  getRpbqcTrayForRdlSelection: async (username) => {
    try {
      const data = await masters.find({
        sort_id: { $in: ["Issued to RP-BQC", "RP-BQC In Progress"] },
        issued_user_name: username,
      });
      let arr = [];
      for (let x of data) {
        let checkBoth = x.temp_array?.length + x.items.length;
        let count = x.limit - checkBoth;
        if (count >= 1) {
          arr.push(x);
        }
      }
      return arr;
    } catch (error) {
      return error;
    }
  },
  getRpAuditTrayForRpBqcelection: async (username) => {
    const data = await masters.find({
      sort_id: { $in: ["Issued to RP-Audit", "RP-Audit In Progress"] },
      issued_user_name: username,
    });
    let arr = [];
    for (let x of data) {
      let checkBoth = x.temp_array?.length + x.items.length;
      let count = x.limit - checkBoth;
      if (count >= 1) {
        arr.push(x);
      }
    }
    return arr;
  },
};
