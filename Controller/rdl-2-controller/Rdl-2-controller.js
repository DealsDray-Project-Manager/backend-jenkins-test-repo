const { masters } = require("../../Model/mastersModel");
const { delivery } = require("../../Model/deliveryModel/delivery");
const { products } = require("../../Model/productModel/product");
const { orders } = require("../../Model/ordersModel/ordersModel");

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
                sort_id: "Rdl-2 inprogress",
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
      let tray = await masters.findOne({ code: trayData.trayId });
      if (tray?.items?.length == trayData.counts) {
        let data = await masters.findOneAndUpdate(
          { code: trayData.trayId },
          {
            $set: {
              sort_id: "Rdl-2 inprogress",
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
    });
  },
  receiveRpTray: (trayid) => {
    return new Promise(async (resolve, reject) => {
      const updateTray = await masters.findOneAndUpdate(
        { code: trayid },
        {
          $set: {
            sort_id: "Rdl-2 inprogress",
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
        resolve({ status: 4 });
      }
    });
  },
  repairDoneAction: (trayItemData) => {
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
        checkAlreadyAdded.items[0].rdl_repair_report =
          trayItemData.rdl_repair_report;
        let data = await masters.updateOne(
          { code: trayItemData.trayId },
          {
            $push: {
              actual_items: checkAlreadyAdded.items[0],
            },
            $pull: {
              items: {
                uic: trayItemData.uic,
              },
            },
          }
        );
        if (data.matchedCount != 0) {
          resolve({ status: 1 });
        } else {
          resolve({ status: 2 });
        }
      }
    });
  },
  traySummery: (trayId, user_name) => {
    return new Promise(async (resolve, reject) => {
      const getTheTray = await masters.findOne({ code: trayId });
      if (getTheTray.sort_id == "Rdl-2 inprogress") {
        if (getTheTray.issued_user_name == user_name) {
          if (getTheTray.items.length == 0) {
            let obj={
              morePartRequred:[],
              partNotAvailable:[],
              usedParts:[],
              partFaulty:[],
              notReapairable:[],
            }
            for(let x of getTheTray.actual_items){
              if(x.rdl_repair_report.more_part_required.length !== 0){
                obj.morePartRequred.push(x)
              }
              if(x.rdl_repair_report.part_not_available.length !== 0){
                obj.partNotAvailable.push(x)
              }
              if(x.rdl_repair_report.used_parts.length !== 0){
                obj.usedParts.push(x)
              }
              if(x.rdl_repair_report.part_faulty.length !== 0){
                obj.partFaulty.push(x)
              }
              if(x.rdl_repair_report.part_not_available.length !== 0){
                obj.notReapairable.push(x)
              }
             
            }
            resolve({ status: 1, tray: getTheTray,summery:obj });
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
};
