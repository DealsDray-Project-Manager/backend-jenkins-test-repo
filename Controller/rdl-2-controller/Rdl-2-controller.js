const { masters } = require("../../Model/mastersModel");
const { delivery } = require("../../Model/deliveryModel/delivery");
const { products } = require("../../Model/productModel/product");
const { orders } = require("../../Model/ordersModel/ordersModel");
const { unitsActionLog } = require("../../Model/units-log/units-action-log");
const {
  partInventoryLedger,
} = require("../../Model/part-inventory-ledger/part-inventory-ledger");

module.exports = {
  dashboardCount: (username) => {
    return new Promise(async (resolve, reject) => {
      let count = {
        trayRequest: 0,
      };
      count.trayRequest = await masters.count({
        $or: [
          {
            issued_user_name: username,
            sort_id: "Issued to RDL-2",
            type_taxanomy: "RPT",
          },
          {
            issued_user_name: username,
            sort_id: "Rdl-2 in-progress",
            type_taxanomy: "RPT",
          },
        ],
      });
      if (count) {
        resolve(count);
      }
    });
  },
  getAssignedTray: (username) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.aggregate([
        {
          $match: {
            $or: [
              {
                issued_user_name: username,
                sort_id: "Issued to RDL-2",
                type_taxanomy: "RPT",
              },
              {
                issued_user_name: username,
                sort_id: "Rdl-2 in-progress",
                type_taxanomy: "RPT",
              },
            ],
          },
        },
        {
          $lookup: {
            from: "masters",
            localField: "sp_tray",
            foreignField: "code",
            as: "spTray",
          },
        },
      ]);
      if (data) {
        resolve(data);
      }
    });
  },
  receiveSpTray: (trayData) => {
    return new Promise(async (resolve, reject) => {
      let selectedQtySum = 0;
      let tray = await masters.findOne({ code: trayData.trayId });

      if (tray) {
        for (const item of tray.items) {
          selectedQtySum += parseInt(item.selected_qty);
        }

        if (selectedQtySum == trayData.counts) {
          let data = await masters.findOneAndUpdate(
            { code: trayData.trayId },
            {
              $set: {
                sort_id: "Rdl-2 in-progress",
                actual_items: [],
              },
            }
          );
          if (data) {
            resolve({ status: 1 });
          } else {
            resolve({ status: 2 });
          }
        } else {
          resolve({ status: 3 });
        }
      } else {
        resolve({ status: 0 });
      }
    });
  },
  receiveRpTray: (trayid) => {
    return new Promise(async (resolve, reject) => {
      const updateTray = await masters.findOneAndUpdate(
        { code: trayid },
        {
          $set: {
            sort_id: "Rdl-2 in-progress",
            actual_items: [],
          },
        }
      );
      if (updateTray) {
        resolve({ status: 1 });
      } else {
        resolve({ status: 0 });
      }
    });
  },
  getDataOfUic: (uic, trayId) => {
    return new Promise(async (resolve, reject) => {
      let obj = {};
      let checkIntray = await masters.findOne({
        code: trayId,
        "items.uic": uic,
      });
      if (checkIntray) {
        let checkAlreadyAdded = await masters.findOne({
          type_taxanomy: "RPT",
          prefix: "tray-master",
          "actual_items.uic": uic,
        });
        if (checkAlreadyAdded) {
          resolve({ status: 5 });
        } else {
          let uicExists = await delivery.findOne(
            { "uic_code.code": uic },
            {
              uic_code: 1,
              tracking_id: 1,
              order_id: 1,
              charging: 1,
              bqc_report: 1,
              bqc_done_close: 1,
              item_id: 1,
              charging_done_date: 1,
              audit_report: 1,
              agent_name: 1,
              agent_name_bqc: 1,
              bqc_out_date: 1,
              tray_closed_by_bot: 1,
              rdl_fls_one_report: 1,
              bqc_software_report: 1,
              imei: 1,
            }
          );
          if (uicExists) {
            let getOrder = await orders.findOne({
              order_id: uicExists.order_id,
            });
            let muicFind = await products.findOne({
              vendor_sku_id: uicExists.item_id,
            });
            obj.delivery = uicExists;
            obj.order = getOrder;
            obj.checkIntray = checkIntray;
            obj.muic = muicFind;

            resolve({ status: 1, data: obj });
          } else {
            resolve({ status: 2 });
          }
        }
      } else {
        let alAddCheck = await masters.findOne({
          type_taxanomy: "RPT",
          prefix: "tray-master",
          "actual_items.uic": uic,
        });
        if (alAddCheck) {
          resolve({ status: 5 });
        } else {
          resolve({ status: 4 });
        }
      }
    });
  },
  repairDoneAction: async (trayItemData) => {
    try {
      let trayType = "RPT";
      let checkAlreadyAdded = await masters.findOne(
        {
          code: trayItemData.trayId,
          "items.uic": trayItemData.uic,
        },
        {
          _id: 0,
          items: {
            $elemMatch: { uic: trayItemData.uic },
          },
          sort_id: 1,
          issued_user_name: 1,
        }
      );
      if (checkAlreadyAdded.sort_id == "Rdl-2 in-progress") {
        let dupEntry = await masters.findOne({
          code: trayItemData.trayId,
          "actual_items.uic": trayItemData.uic,
        });
        if (dupEntry) {
          return { status: 3 };
        }
        checkAlreadyAdded.items[0].rdl_repair_report =
          trayItemData.rdl_repair_report;
        if (trayItemData.rpbqc_username !== "") {
          let obj = {
            rpbqc_username: trayItemData.rpbqc_username,
            rbqc_tray: trayItemData.rbqc_tray,
          };
          checkAlreadyAdded.items[0]["rpbqc_info"] = obj;
          checkAlreadyAdded.items[0]["rpt_tray"] = trayItemData.trayId;
          let updateToRbqc = await masters.updateOne(
            {
              code: trayItemData.rbqc_tray,
              sort_id: "Issued to RP-BQC",
              issued_user_name: trayItemData.rpbqc_username,
            },
            {
              $addToSet: {
                temp_array: checkAlreadyAdded.items[0],
              },
            }
          );
          if (updateToRbqc.modifiedCount !== 0) {
            trayType = "RPB";
            let updateOfRepair = await masters.updateOne(
              { code: trayItemData.trayId },
              {
                $addToSet: {
                  temp_array: checkAlreadyAdded.items[0].uic,
                },
              }
            );
          } else {
            return { status: 6 };
          }
        }
        for (let x of trayItemData.rdl_repair_report.rdl_two_part_status) {
          if (x.rdl_two_status !== "Used") {
            await masters.updateOne(
              {
                code: trayItemData.spTray,
              },
              {
                $addToSet: {
                  temp_array: x,
                },
              }
            );
          }
          if (
            x.rdl_two_status == "Used" ||
            x.rdl_two_status == "Not used" ||
            x.rdl_two_status == "Not required"
          ) {
            await masters.updateOne(
              {
                code: trayItemData.trayId,
                "items.uic": trayItemData.uic,
              },
              {
                $pull: {
                  "items.$.rdl_fls_report.partRequired": { part_id: x.part_id },
                },
              }
            );
          }
          await partInventoryLedger.create({
            department: "PRC RDL-2",
            action: "Repair Done",
            action_done_user: checkAlreadyAdded.issued_user_name,
            description: `Repair done by agent:${checkAlreadyAdded.issued_user_name},finel status of this ${x.rdl_two_status}`,
            tray_id: trayItemData.spTray,
            part_code: x.part_id,
          });
        }

        if (trayItemData.rdl_repair_report.more_part_required?.length !== 0) {
          await masters.updateOne(
            {
              code: trayItemData.trayId,
              "items.uic": trayItemData.uic,
            },
            {
              $addToSet: {
                "items.$.rdl_fls_report.partRequired": {
                  $each: trayItemData.rdl_repair_report.more_part_required,
                },
              },
            }
          );
        }
        await masters.updateOne(
          {
            code: trayItemData.spTray,
          },
          {
            $addToSet: {
              actual_items: {
                $each: trayItemData.rdl_repair_report.rdl_two_part_status,
              },
            },
          }
        );

        let data = await masters.updateOne(
          { code: trayItemData.trayId },
          {
            $addToSet: {
              actual_items: checkAlreadyAdded.items[0],
            },
            $pull: {
              items: {
                uic: trayItemData.uic,
              },
            },
          }
        );

        if (data.matchedCount !== 0) {
          let updateDelivery = await delivery.findOneAndUpdate(
            { "uic_code.code": trayItemData.uic },
            {
              $set: {
                rdl_two_report: trayItemData.rdl_repair_report,
                tray_type: trayType,
                updated_at: Date.now(),
                rdl_two_closed_date_units: Date.now(),
                rp_bqc_tray: trayItemData.rbqc_tray,
              },
            }
          );
          await unitsActionLog.create({
            action_type: "Repair Done",
            created_at: Date.now(),
            uic: trayItemData.uic,
            tray_id: trayItemData.trayId,
            user_name_of_action: checkAlreadyAdded.issued_user_name,
            report: trayItemData.rdl_repair_report,
            track_tray: "Units",
            user_type: "PRC RDL-2",
            description: `Repair Done by agent:${checkAlreadyAdded.issued_user_name}`,
          });
          return { status: 1 };
        } else {
          return { status: 2 };
        }
      } else {
        return { status: 5 };
      }
    } catch (error) {
      console.error("Error in repairDoneAction:", error);
      throw error;
    }
  },
  traySummary: (trayId, user_name) => {
    return new Promise(async (resolve, reject) => {
      const getTheTray = await masters.findOne({ code: trayId });
      if (getTheTray.sort_id == "Rdl-2 in-progress") {
        if (getTheTray.issued_user_name == user_name) {
          if (getTheTray.items.length == 0) {
            let obj = {
              morePartRequred: [],
            };
            obj.spTray = await masters.findOne({
              sort_id: "Rdl-2 in-progress",
              type_taxanomy: "SPT",
              issued_user_name: user_name,
            });
            for (let x of getTheTray.actual_items) {
              if (x.rdl_repair_report.more_part_required.length !== 0) {
                obj.morePartRequred.push(x);
              }
            }
            resolve({ status: 1, tray: getTheTray, summary: obj });
          } else {
            resolve({ status: 2 });
          }
        } else {
          resolve({ status: 2 });
        }
      } else {
        resolve({ status: 3 });
      }
    });
  },
  closeSpAndRp: (trayData) => {
    return new Promise(async (resolve, reject) => {
      const getRpTray = await masters.findOne({ code: trayData.rpTrayId });
      let updateRpTray, updateSpTray;
      if (getRpTray.sort_id == "Rdl-2 in-progress") {
        updateRpTray = await masters.findOneAndUpdate(
          { code: trayData.rpTrayId },
          {
            $set: {
              items: getRpTray.actual_items,
              actual_items: [],
              temp_array: [],
              sort_id: "Closed by RDL-2",
              "track_tray.rdl_two_done_closed_by_agent": Date.now(),
            },
          }
        );
        if (updateRpTray) {
          updateSpTray = await masters.updateOne(
            { code: trayData.sptrayId },
            {
              $set: {
                sort_id: "Closed by RDL-2",
                "track_tray.rdl_two_done_closed_by_agent": Date.now(),
              },
            }
          );
          if (updateRpTray) {
            let state = "Tray";
            await unitsActionLog.create({
              action_type: "Closed by RDL-2",
              created_at: Date.now(),
              tray_id: trayData.sptrayId,
              user_name_of_action: getRpTray.issued_user_name,
              track_tray: "Tray",
              user_type: "PRC RDL-2",
              description: `RDL-2 done and sent to warehouse by agent:${updateRpTray.issued_user_name}`,
            });
            for (let x of getRpTray.actual_items) {
              const addLogsofUnits = await unitsActionLog.create({
                action_type: "Closed by RDL-2",
                created_at: Date.now(),
                uic: x.uic,
                tray_id: trayData.rpTrayId,
                user_name_of_action: getRpTray.issued_user_name,
                report: x.rdl_repair_report,
                track_tray: state,
                user_type: "PRC RDL-2",
                description: `RDL-2 done and sent to warehouse by agent:${updateRpTray.issued_user_name}`,
              });
              state = "Units";
              let updateDelivery = await delivery.findOneAndUpdate(
                { "uic_code.code": x.uic },
                {
                  $set: {
                    rdl_two_closed_date: Date.now(),
                    rdl_fls_one_report: x.rdl_fls_report,
                    rdl_two_report: x.rdl_repair_report,
                    tray_status: "Closed by RDL-2",
                    tray_type: "RPT",
                    updated_at: Date.now(),
                  },
                }
              );
            }
            resolve({ status: 1 });
          } else {
            resolve({ status: 5 });
          }
        } else {
          resolve({ status: 5 });
        }
      } else {
        resolve({ status: 0 });
      }
    });
  },
};
