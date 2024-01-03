const { orders } = require("../../Model/ordersModel/ordersModel");
const { delivery } = require("../../Model/deliveryModel/delivery");
const { masters } = require("../../Model/mastersModel");
const Elasticsearch = require("../../Elastic-search/elastic");
const {
  partAndColor,
} = require("../../Model/Part-list-and-color/part-list-and-color");
const { unitsActionLog } = require("../../Model/units-log/units-action-log");

module.exports = {
  getAssignedTray: (username) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        $or: [{ issued_user_name: username, sort_id: "Issued to RDL-1" }],
      });
      if (data) {
        resolve(data);
      }
    });
  },
  dashboardCount: (username) => {
    return new Promise(async (resolve, reject) => {
      let count = {
        charging: 0,
      };
      count.charging = await masters.count({
        $or: [{ issued_user_name: username, sort_id: "Issued to RDL-1" }],
      });
      if (count) {
        resolve(count);
      }
    });
  },
  getRDLoneRequest: (status, location) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        $or: [
          {
            prefix: "tray-master",
            type_taxanomy: "WHT",
            sort_id: status,
            cpc: location,
          },
        ],
      });
      if (data) {
        resolve(data);
      }
    });
  },
  addWhtActual: (trayItemData) => {
    return new Promise(async (resolve, reject) => {
      let dupEntrey = await masters.findOne({
        code: trayItemData.trayId,
        "actual_items.uic": trayItemData.uic,
      });
      if (dupEntrey) {
        resolve({ status: 3 });
      } else {
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
          }
        );
        checkAlreadyAdded.items[0].rdl_fls_report = trayItemData.rdl_fls_report;
        let data = await masters.updateOne(
          { code: trayItemData.trayId },
          {
            $push: {
              actual_items: checkAlreadyAdded.items[0],
            },
          }
        );
        if (data.matchedCount != 0) {
          let deliveryUpdate = await delivery.findOneAndUpdate(
            { "uic_code.code": trayItemData.uic },
            {
              $set: {
                rdl_fls_done_units_date: Date.now(),
              },
            }
          );
          resolve({ status: 1 });
        } else {
          resolve({ status: 2 });
        }
      }
    });
  },
  rdlFlsDoneClose: (trayData) => {
    return new Promise(async (resolve, reject) => {
      let dataz = await masters.findOne({ code: trayData.trayId });
      let dataSwitch = await masters.findOneAndUpdate(
        { code: trayData.trayId },
        {
          $set: {
            items: dataz?.actual_items,
            actual_items: [],
            description: trayData?.description,
            temp_array: [],
            sort_id: "Closed by RDL-1",
            closed_date_agent: Date.now(),
          },
        },
        {
          new: true,
        }
      );
      if (dataSwitch) {
        let state = "Tray";
        for (let x of dataSwitch.items) {
          const addLogsofUnits = await unitsActionLog.create({
            action_type: "Closed by RDL-1",
            created_at: Date.now(),
            uic: x.uic,
            tray_id: trayData.trayId,
            user_name_of_action: dataSwitch.issued_user_name,
            report: x.rdl_fls_report,
            user_type: "PRC RDL-1",
            description: `Closed by RDL-1 agent:${dataSwitch.issued_user_name}`,
            track_tray: state,
          });
          state = "Units";
          let deliveryUpdate = await delivery.findOneAndUpdate(
            { tracking_id: x.tracking_id },
            {
              $set: {
                rdl_fls_one_user_name: dataSwitch?.issued_user_name,
                rdl_fls_closed_date: Date.now(),
                rdl_fls_one_report: x?.rdl_fls_report,
                location: "Warehouse",
                updated_at: Date.now(),
              },
            },
            {
              new: true,
              projection: { _id: 0 },
            }
          );
          // let elasticSearchUpdate = await Elasticsearch.uicCodeGen(
          //   deliveryUpdate
          // );

          if (deliveryUpdate) {
            resolve(deliveryUpdate);
          } else {
            resolve();
          }
        }
      }
    });
  },
  rdlFlsFetchPartList: (muic) => {
    return new Promise(async (resolve, reject) => {
      const partList = await partAndColor
        .find({ "muic_association.muic": muic, status: "Active" })
        .catch((err) => {
          reject(err);
        });
      if (partList) {
        resolve(partList);
      }
    });
  },
};
