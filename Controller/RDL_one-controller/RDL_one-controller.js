const { orders } = require("../../Model/ordersModel/ordersModel");
const { delivery } = require("../../Model/deliveryModel/delivery");
const { masters } = require("../../Model/mastersModel");
const Elasticsearch = require("../../Elastic-search/elastic");

module.exports = {
  getAssignedTray: (username) => {
  
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        $or: [{ issued_user_name: username, sort_id: "Issued to RDL-FLS" }],
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
        $or: [{ issued_user_name: username, sort_id: "Issued to RDL-FLS" }],
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
      let dupEntrey=await masters.findOne({code:trayItemData.trayId,"actual_items.uic":trayItemData.uic})
      if(dupEntrey){
        resolve({status:3})
      }
      else{

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
            sort_id: "Closed by RDL-FLS",
            closed_date_agent: Date.now(),
          },
        },
        {
          new: true,
        }
      );
      if (dataSwitch) {
        for (let x of dataSwitch.items) {
          let deliveryUpdate = await delivery.findOneAndUpdate(
            { tracking_id: x.tracking_id },
            {
              $set: {
                rdl_fls_one_user_name: dataSwitch?.issued_user_name,
                rdl_fls_closed_date: Date.now(),
                rdl_fls_one_report: x?.rdl_fls_report,
                location:"Warehouse"
              },
            },
            {
              new: true,
              projection: { _id: 0 },
            }
          );
          let elasticSearchUpdate = await Elasticsearch.uicCodeGen(
            deliveryUpdate
          );

          if (deliveryUpdate) {
            resolve(deliveryUpdate);
          } else {
            resolve();
          }
        }
      }
    });
  },
};
