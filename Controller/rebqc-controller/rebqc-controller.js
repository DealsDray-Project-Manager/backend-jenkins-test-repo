const { delivery } = require("../../Model/deliveryModel/delivery");
const { masters } = require("../../Model/mastersModel");
const { unitsActionLog } = require("../../Model/units-log/units-action-log");
/*----------------------------------------------------------------*/

module.exports = {
  dashboard: async (username) => {
    try {
      let obj = {
        issuedTray: 0,
        reBqcPending: 0,
        reBqcDone: 0,
      };
      obj.issuedTray = await masters.count({
        sort_id: "Issued to REBQC",
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
        sort_id: "Issued to REBQC",
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
      console.log(trayId);
      const data = await masters.findOne({
        code: trayId,
        issued_user_name: username,
        sort_id: "Issued to REBQC",
      });
      console.log(data);
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
  getDataofPendingItems: async (username, uic) => {
    try {
      const getTray = await masters.findOne({
        issued_user_name: username,
        sort_id: "Issued to REBQC",
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
  // ITEM ADD INTO TRAY AFTER REBQC
  addReBqcData: async (dataOfReBqc) => {
    try {
      let itemData = await masters.findOne(
        {
          sort_id: "Issued to REBQC",
          issued_user_name: dataOfReBqc.username,
          "temp_array.uic": dataOfReBqc.uic,
        },
        {
          _id: 0,
          temp_array: {
            $elemMatch: { uic: dataOfReBqc.uic },
          },
          code: 1,
        }
      );
      console.log(itemData);
      if (itemData) {
        let obj = {
          status: dataOfReBqc.status,
          username_of_rebqc: dataOfReBqc.username,
        };
        let addIntoTray1, addIntoTray2;
        itemData.temp_array[0]["re_bqc_status"] = obj;
        if (dataOfReBqc.status == "REBQC Fail") {
          addIntoTray1 = await masters.updateOne(
            {
              code: itemData.temp_array[0]?.rdl_repair_report.rp_tray,
            },
            {
              $addToSet: {
                items: itemData.temp_array[0],
              },
              $pull: {
                temp_array: dataOfReBqc.uic,
              },
            }
          );
          addIntoTray2 = await masters.updateOne(
            {
              code: itemData.code,
            },
            {
              $pull: {
                temp_array: {
                  uic: dataOfReBqc.uic,
                },
              },
            }
          );
        } else {
          addIntoTray1 = await masters.updateOne(
            {
              code: itemData.code,
            },
            {
              $addToSet: {
                items: itemData.temp_array[0],
              },
              $pull: {
                temp_array: {
                  uic: dataOfReBqc.uic,
                },
              },
            }
          );
          addIntoTray2 = await masters.updateOne(
            {
              code: itemData.temp_array[0]?.rdl_repair_report.rp_tray,
            },
            {
              $pull: {
                temp_array: dataOfReBqc.uic,
              },
            }
          );
        }
        if (addIntoTray1.modifiedCount !== 0) {
          await unitsActionLog.create({
            action_type: "REBQC Done",
            created_at: Date.now(),
            tray_id: itemData.code,
            user_name_of_action: dataOfReBqc.username,
            track_tray: "Units",
            uic: dataOfReBqc.uic,
            user_type: "PRC REBQC",
            report: dataOfReBqc,
            description: `REBQC done by the agent :${dataOfReBqc.username}. status:${dataOfReBqc.status}`,
          });
          await delivery.updateOne(
            { "uic_code.code": dataOfReBqc.uic },
            {
              $set: {
                re_bqc_report: dataOfReBqc,
                re_bqc_done_date: Date.now(),
              },
            }
          );
        }
        if (addIntoTray1.modifiedCount !== 0) {
          if (dataOfReBqc.status == "REBQC Fail") {
            return { status: 2, trayId: itemData.temp_array[0]?.rp_tray };
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
  // CLOSE THE REBQC TRAY
  closeRebqcTray: async (trayData) => {
    try {
      const data = await masters.findOneAndUpdate(
        { code: trayData.trayId, sort_id: "Issued to REBQC" },
        {
          $set: {
            sort_id: "Closed by REBQC",
            actual_items: [],
            closed_date_agent: Date.now(),
            description: trayData.description,
          },
        }
      );
      if (data) {
        let state = "Tray";
        for (let x of data.items) {
          await unitsActionLog.create({
            action_type: "REBQC Done and Closed",
            created_at: Date.now(),
            tray_id: itemData.code,
            user_name_of_action: data.issued_user_name,
            track_tray: state,
            user_type: "PRC REBQC",
            uic: x.uic,
            description: `REBQC done by the agent :${data.issued_user_name} and closed the tray.`,
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
