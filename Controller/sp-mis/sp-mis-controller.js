const { delivery } = require("../../Model/deliveryModel/delivery");
const { masters } = require("../../Model/mastersModel");
const {
  partAndColor,
} = require("../../Model/Part-list-and-color/part-list-and-color");
const { purchaseOrder } = require("../../Model/Purchase-order/purchase-order");

module.exports = {
  dashboardData: (location,username) => {
    return new Promise(async (resolve, reject) => {
      let count = {
        precourmentCount:0
      };
      count.precourmentCount =await masters.aggregate([
        {
          $match: {
            "items.rdl_fls_report.selected_status": "Repair Required",
            cpc: location,
            sort_id: "Ready to RDL-Repair",
          },
        },
        {
          $unwind: "$items",
        },
        {
          $match: {
            "items.rdl_fls_report.selected_status": "Repair Required",
          },
        },
        {
          $group: {
            _id: {
              model: "$items.model_name",
              brand: "$items.brand_name",
              muic: "$items.muic",
            },
            count: { $sum: 1 },
          },
        },
      ]);
      count.precourmentCount=count.precourmentCount.length
      if (count) {
        resolve(count);
      }
    });
  },
  procureMentCreation: (location, brand, model) => {
    return new Promise(async (resolve, reject) => {
      const findItem = await masters.aggregate([
        {
          $match: {
            "items.rdl_fls_report.selected_status": "Repair Required",
            cpc: location,
            brand: brand,
            model: model,
            sort_id: "Ready to RDL-Repair",
          },
        },
        {
          $unwind: "$items",
        },
        {
          $match: {
            "items.rdl_fls_report.selected_status": "Repair Required",
            "items.procurement_status": { $ne: "Created" },
          },
        },
        {
          $project: {
            part_id: "$items.rdl_fls_report.partRequired.part_id",
            part_name: "$items.rdl_fls_report.partRequired.part_name",
            muic: "$items.muic",
          },
        },
        {
          $unwind: "$part_id",
        },
        {
          $group: {
            _id: "$part_id",
            part_name: { $first: "$part_name" },
            muic: { $first: "$muic" },
            count: { $sum: 1 },
          },
        },
      ]);

      if (findItem) {
        let arr = [];
        if (findItem.length !== 0) {
          for (let x of findItem) {
            let obj = {
              part_id: "",
              part_name: "",
              brand: "",
              mode: "",
              aval_qty: 0,
              required_qty: 0,
              muic: "",
            };
            const checkThePart = await partAndColor.findOne({
              part_code: x._id,
            });
            let checkHistoryOfProcurement = await purchaseOrder.findOne({
              spare_part_number: x._id,
            });
            if (checkThePart) {
              let qty = checkThePart.avl_stock - x.count;
              if (qty < 0) {
                let required_qty = Math.abs(qty);
                obj = {
                  part_id: checkThePart.part_code,
                  part_name: checkThePart.name,
                  aval_qty: checkThePart.avl_stock,
                  brand: brand,
                  model: model,
                  muic: x.muic,
                  required_qty: required_qty,
                  requested_qtc: "0",
                };
                if (checkHistoryOfProcurement) {
                  obj.requested_qtc = checkHistoryOfProcurement.requred_qty;
                }
                arr.push(obj);
              }
            } else {
              obj = {
                part_id: x._id,
                part_name: x.part_name[0],
                aval_qty: 0,
                brand: brand,
                model: model,
                muic: x.muic,
                required_qty: x.count,
                requested_qtc: "0",
              };
              if (checkHistoryOfProcurement) {
                obj.requested_qtc = checkHistoryOfProcurement.requred_qty;
              }
              arr.push(obj);
            }
          }
        }
        // Process the grouped results here
        resolve({ findItem: arr, status: 1 });
      } else {
        resolve({ status: 2 });
      }
    });
  },
  ProcurementRequestCreation: (spData, model, brand) => {
    return new Promise(async (resolve, reject) => {
      let updateData;
      function generateUniqueID() {
        const prefix = "P";
        const randomDigits = Math.floor(Math.random() * 90000) + 10000; // Generates a random 5-digit number
        const timestamp = Date.now().toString().slice(-5); // Uses the last 5 digits of the current timestamp

        return prefix + timestamp + randomDigits;
      }
      for (let x of spData) {
        const uniqueID = generateUniqueID();
        let obj = {
          request_id: uniqueID,
          request_date: new Date(Date.now()),
        };
        let checkSpExists = await purchaseOrder.findOne({
          spare_part_number: x.part_id,
          muic: x.muic,
        });
        if (checkSpExists) {
          updateData = await purchaseOrder.findOneAndUpdate(
            { spare_part_number: x.part_id },
            {
              $inc: {
                requred_qty: parseInt(x.required_qty),
              },
              $push: {
                request_id: uniqueID.toString(),
              },
              $set: {
                updated_at: Date.now(),
              },
            },
            
          );
          //   if (updateData) {
          //     let updateMaster = await masters.findOneAndUpdate(
          //       {
          //         model: model,
          //         brand: brand,
          //         "items.rdl_fls_report.partRequired": {
          //           $elemMatch: { part_id: x.part_id },
          //         },
          //       },
          //       {
          //         $set: {
          //           "items.$.procurement_status": "Created",
          //         },
          //       }
          //     );
          //     console.log(updateMaster.code);
          //   }
        } else {
          updateData = await purchaseOrder.create({
            spare_part_number: x.part_id,
            muic: x.muic,
            request_id: [uniqueID],
            request_date: Date.now(),
            spare_part_name: x.part_name,
            requred_qty: x.required_qty,
          });
          //   if (updateData) {
          //     let updateMaster = await masters.updateMany(
          //       {
          //         model: model,
          //         brand: brand,
          //         "items.rdl_fls_report.partRequired": {
          //           $elemMatch: { part_id: x.part_id },
          //         },
          //       },
          //       {
          //         $set: {
          //           "items.$.procurement_status": "Created",
          //         },
          //       }
          //     );
          //     console.log(updateMaster);
          //   }
        }
      }
      if (updateData) {
        resolve({ status: 1 });
      } else {
        resolve({ status: 0 });
      }
    });
  },
 
};
