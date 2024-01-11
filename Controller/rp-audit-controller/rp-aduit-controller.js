const { delivery } = require("../../Model/deliveryModel/delivery");
const { masters } = require("../../Model/mastersModel");
const { unitsActionLog } = require("../../Model/units-log/units-action-log");

/*------------------------------------------------------------------------------*/
module.exports = {
  dashboard: async (username) => {
    try {
      let obj = {
        issuedTrays: 0,
        rpAuditPending: 0,
      };
      obj.issuedTrays = await masters.count({
        sort_id: { $in: ["Issued to RP-Audit", "RP-Audit In Progress"] },
        issued_user_name: username,
      });
      let dataOfTray = await masters.findOne({
        sort_id: { $in: ["Issued to RP-Audit", "RP-Audit In Progress"] },
        issued_user_name: username,
      });
      if (dataOfTray) {
        obj.rpAuditPending = dataOfTray?.temp_array?.length;
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
        sort_id: { $in: ["Issued to RP-Audit", "RP-Audit In Progress"] },
        issued_user_name: username,
      });
      return data;
    } catch (error) {
      return error;
    }
  },
  // START RP-AUDIT
  getDataforStartRPAudit: async (uic, username) => {
    try {
      let checkUic = await masters.findOne({
        "temp_array.uic": uic,
        issued_user_name: username,
        sort_id: { $in: ["Issued to RP-Audit", "RP-Audit In Progress"] },
      });
      if (checkUic) {
        let obj = {
          orderAndDelivery: [],
          preBqcData: {},
          preChargeData: {},
        };
        obj.orderAndDelivery = await delivery.aggregate([
          {
            $match: {
              "uic_code.code": uic,
            },
          },
          {
            $lookup: {
              from: "orders",
              foreignField: "order_id",
              localField: "order_id",
              as: "order",
            },
          },
          {
            $lookup: {
              from: "products",
              localField: `item_id`,
              foreignField: "vendor_sku_id",
              as: "products",
            },
          },
          {
            $project: {
              uic_code: 1,
              tracking_id: 1,
              order_id: 1,
              charging: 1,
              bqc_report: 1,
              bqc_done_close: 1,
              bqc_software_report: 1,
              bot_report: 1,
              item_id: 1,
              charging_done_date: 1,
              audit_report: 1,
              agent_name: 1,
              agent_name_bqc: 1,
              bqc_out_date: 1,
              tray_closed_by_bot: 1,
              imei: 1,
              rdl_fls_one_report: 1,
              rdl_two_report: 1,
              rp_bqc_report: 1,
              rp_bqc_software_report: 1,
              products: 1,
              rp_bqc_done_date: 1,
            },
          },
        ]);
        let previousBqc = await unitsActionLog
          .findOne({ uic: uic, action_type: "BQC Done" })
          .sort({ _id: -1 })
          .skip(1);
        if (previousBqc) {
          obj.preBqcData = previousBqc;
        }
        const previousCharging = await unitsActionLog
          .findOne({ uic: uic, action_type: "Charging Done" })
          .sort({ _id: -1 })
          .skip(1);
        if (previousCharging) {
          obj.preChargeData = previousCharging;
        }
        return { status: 1, allData: obj };
      } else {
        return { status: 2 };
      }
    } catch (error) {
      next(error);
    }
  },
  // RU-AUDIT DONE ACTION
  addRpAuditData: async (dataOfRpAudit, currentSubMuicCount) => {
    try {
      dataOfRpAudit.subMuic = currentSubMuicCount;
      let itemData = await masters.findOne(
        {
          sort_id: { $in: ["Issued to RP-Audit", "RP-Audit In Progress"] },
          issued_user_name: dataOfRpAudit.username,
          "temp_array.uic": dataOfRpAudit.uic,
        },
        {
          _id: 0,
          temp_array: {
            $elemMatch: { uic: dataOfRpAudit.uic },
          },
          code: 1,
        }
      );
      if (itemData) {
        let obj = {
          status: dataOfRpAudit.status,
          username_of_rpaudit: dataOfRpAudit.username,
          grade: dataOfRpAudit.grade,
          description: dataOfRpAudit.description,
          sub_muic: currentSubMuicCount,
          ram_verification: dataOfRpAudit.ram_verification,
          storage_verification: dataOfRpAudit.storage_verification,
          color: dataOfRpAudit.color,
        };
        let addIntoTray1, addIntoTray2, addIntoTray3;
        itemData.temp_array[0]["rp_audit_status"] = obj;
        if (dataOfRpAudit.status == "RP-Audit Failed") {
          itemData.temp_array[0].rpbqc_info.rbqc_tray = null;
          itemData.temp_array[0].rpbqc_info.rpbqc_username=null
          addIntoTray1 = await masters.findOneAndUpdate(
            {
              code: itemData.temp_array[0]?.rdl_repair_report.rdl_two_tray,
            },
            {
              $addToSet: {
                items: itemData.temp_array[0],
              },
              $pull: {
                actual_items: {
                  uic: dataOfRpAudit.uic,
                },
              },
            }
          );
          addIntoTray3 = await masters.findOneAndUpdate(
            {
              code: itemData.temp_array[0]?.rdl_repair_report.rdl_two_tray,
            },
            {
              $pull: {
                temp_array: dataOfRpAudit.uic,
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
                  uic: dataOfRpAudit.uic,
                },
              },
            }
          );
        } else {
          addIntoTray2 = await masters.findOneAndUpdate(
            {
              code: itemData.temp_array[0]?.rdl_repair_report.rdl_two_tray,
            },
            {
              $pull: {
                actual_items: {
                  uic: dataOfRpAudit.uic,
                },
              },
              $addToSet:{
                wht_tray:itemData.temp_array[0]
              }
            },
          );
          addIntoTray3 = await masters.findOneAndUpdate(
            {
              code: itemData.temp_array[0]?.rdl_repair_report.rdl_two_tray,
            },
            {
              $pull: {
                temp_array: dataOfRpAudit.uic,
              },
            }
          );
          addIntoTray1 = await masters.findOneAndUpdate(
            {
              code: itemData.code,
            },
            {
              $addToSet: {
                items: itemData.temp_array[0],
              },
              $pull: {
                temp_array: {
                  uic: dataOfRpAudit.uic,
                },
              },
            }
          );
        }
        if (addIntoTray1.modifiedCount !== 0) {
          await unitsActionLog.create({
            action_type: "RP-Audit Done",
            created_at: Date.now(),
            tray_id: itemData.code,
            user_name_of_action: dataOfRpAudit.username,
            track_tray: "Units",
            uic: dataOfRpAudit.uic,
            user_type: "PRC RP-Audit",
            report: dataOfRpAudit,
            tray_id: itemData.code,
            description: `RP-Audit done by the agent :${dataOfRpAudit.username}. status:${dataOfRpAudit.status}`,
          });
          await delivery.updateOne(
            { "uic_code.code": dataOfRpAudit.uic },
            {
              $set: {
                rp_audit_report: dataOfRpAudit,
                rp_audit_done_date: Date.now(),
                final_grade: dataOfRpAudit.grade,
                "audit_report.sub_muic": currentSubMuicCount,
              },
            }
          );
        }
        if (addIntoTray1.modifiedCount !== 0) {
          if (dataOfRpAudit.status == "RP-Audit Failed") {
            return {
              status: 2,
              trayId: itemData.temp_array[0]?.rdl_repair_report.rdl_two_tray,
              usernameOfRDL2: addIntoTray3?.issued_user_name,
            };
          } else {
            return { status: 1, trayId: itemData.code };
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
  //GET DATA FOR CLOSE PAGE
  getTrayForClosepage: async (username, trayId) => {
    try {
      const data = await masters.findOne({
        code: trayId,
        issued_user_name: username,
        sort_id: { $in: ["Issued to RP-Audit", "RP-Audit In Progress"] },
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
  closeRpAuditTray: async (trayData) => {
    try {
      const data = await masters.findOneAndUpdate(
        {
          code: trayData.trayId,
          sort_id: { $in: ["Issued to RP-Audit", "RP-Audit In Progress"] },
        },
        {
          $set: {
            sort_id: "Closed by RP-Audit",
            actual_items: [],
            closed_date_agent: Date.now(),
          },
        }
      );
      if (data) {
        let state = "Tray";
        for (let x of data?.items) {
          await unitsActionLog.create({
            action_type: "RP-Audit Done and Closed",
            created_at: Date.now(),
            tray_id: trayData.trayId,
            user_name_of_action: data.issued_user_name,
            track_tray: state,
            user_type: "PRC RP-Audit",
            uic: x.uic,
            description: `RP-Audit done by the agent :${data.issued_user_name} and closed the tray.`,
          });
          state = "Units";
        }
        return { status: 1 };
      } else {
        return { status: 0 };
      }
    } catch (error) {
      return error;
    }
  },
};
