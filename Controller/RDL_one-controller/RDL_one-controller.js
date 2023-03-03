const { orders } = require("../../Model/ordersModel/ordersModel");
const { delivery } = require("../../Model/deliveryModel/delivery");
const { infra } = require("../../Model/infraModel");
const { products } = require("../../Model/productModel/product");
const { brands } = require("../../Model/brandModel/brand");
const { user } = require("../../Model/userModel");
const { masters } = require("../../Model/mastersModel");
const { badOrders } = require("../../Model/ordersModel/bad-orders-model");
const { badDelivery } = require("../../Model/deliveryModel/bad-delivery");



module.exports = {

  getAssignedTray: (username) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        $or: [
          { issued_user_name: username, sort_id: "Issued to RDL_one" },
        ],
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
        $or: [
          { issued_user_name: username, sort_id: "Issued to RDL_one" },

        ],
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
          }
        ],
      });
      if (data) {
        resolve(data);
      }
    })
  },


  // 
  addWhtActual: (trayItemData) => {
    return new Promise(async (resolve, reject) => {
      let checkAlreadyAdded = await masters.findOne({
        code: trayItemData.trayId,
        "actual_items.uic": trayItemData.item.uic,
      });
      if (checkAlreadyAdded) {
        resolve({ status: 3 });
      } else {
        let data = await masters.updateOne(
          { code: trayItemData.trayId },
          {
            $push: {
              actual_items: trayItemData.item,
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




  issueToagentWht: (trayData) => {
    return new Promise(async (resolve, reject) => {
      let data;
      if (trayData.sortId == "Issued to RDL_one") {
        let dataz = await masters.findOne({ code: trayData.trayId })
        let dataSwitch = await masters.findOneAndUpdate(
          { code: trayData.trayId },
          {  $set: { items: dataz?.actual_items } }
        )
        if(dataSwitch){
          data = await masters.findOneAndUpdate( 
            { code: trayData.trayId },
            {
              $set: {
                actual_items: [],
                description: trayData?.description,
                temp_array: [],
                sort_id: "RDL_one_done_send_to_warehouse",
                assigned_date: Date.now(),
              },
            }
          );
        }
        if (data) {
          for (let x of data.items) {
            let deliveryUpdate = await delivery.updateOne(
              { tracking_id: x.tracking_id },
              {
                $set: {
                  rdl_fls_one_user_name: data?.issued_user_name,
                  rdl_fls_done_recieved_date: Date.now(),
                  rdl_fls_one_report:x?.Rdl_status
                },
              }
            );
            if (deliveryUpdate) {
              resolve(data);
            } else {
              resolve();
            }
          }
        }
      }
      })
  },
}