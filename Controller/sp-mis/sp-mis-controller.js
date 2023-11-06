const { delivery } = require("../../Model/deliveryModel/delivery");
const { masters } = require("../../Model/mastersModel");
const {
  partAndColor,
} = require("../../Model/Part-list-and-color/part-list-and-color");
const { purchaseOrder } = require("../../Model/Purchase-order/purchase-order");

module.exports = {
  dashboardData: (location, username) => {
    return new Promise(async (resolve, reject) => {
      // Step 1: Create the pipeline for aggregation
      const pipeline = [
        {
          $match: {
            "items.rdl_fls_report.selected_status": "Repair Required",
            cpc: location,
            sort_id: "Ready to RDL-2",
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
              brand: "$items.brand_name",
              model: "$items.model_name",
              muic: "$items.muic",
              part_id: "$items.rdl_fls_report.partRequired.part_id",
            },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: {
              brand: "$_id.brand",
              model: "$_id.model",
              muic: "$_id.muic",
            },
            parts: {
              $push: {
                part_id: "$_id.part_id",
                count: "$count",
              },
            },
          },
        },
      ];

      // Step 2: Execute the aggregation pipeline
      const findItem = await masters
        .aggregate(pipeline)
        .allowDiskUse(true)
        .exec();

      // Step 3: Extract all part codes
      const partCodes = findItem.flatMap((x) =>
        x.parts.map((part) => part.part_id[0])
      );

      // Step 4: Fetch all partAndColor data in bulk
      const partAndColorData = await partAndColor.find({
        part_code: { $in: partCodes },
      });

      // Step 5: Calculate the required_qty and filter out the unnecessary data
      const resolvedArr = findItem.reduce((result, x) => {
        let required_qty = 0;
        x.parts.forEach((y) => {
          const checkThePart = partAndColorData.find(
            (part) => part.part_code === y.part_id[0]
          );
          if (checkThePart) {
            let qty = checkThePart.avl_stock - y.count;
            if (qty < 0) {
              let required = Math.abs(qty);
              required_qty += required;
            }
          } else {
            required_qty += y.count;
          }
        });

        if (required_qty !== 0) {
          x["required_qty"] = required_qty;
          result.push(x);
        }

        return result;
      }, []);

      // Step 6: Calculate the count and resolve the final result
      const count = { precourmentCount: resolvedArr.length };
     
      resolve(count);
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
            sort_id: "Ready to RDL-2",
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
        {
          $sort: {
            _id: 1, // Sort by part_id in ascending order
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
              status: { $ne: "Order Placed" },
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
        if (Number(x.required_qty) > 0) {
          const uniqueID = generateUniqueID();
          let obj = {
            request_id: uniqueID,
            request_date: new Date(Date.now()),
          };
          let checkSpExists = await purchaseOrder.findOne({
            spare_part_number: x.part_id,
            muic: x.muic,
            status: { $ne: "Order Placed" },
          });
          if (checkSpExists) {
            updateData = await purchaseOrder.findOneAndUpdate(
              {
                spare_part_number: x.part_id,
                status: { $ne: "Order Placed" },
                muic: x.muic,
              },
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
              }
            );
          } else {
            updateData = await purchaseOrder.create({
              spare_part_number: x.part_id,
              muic: x.muic,
              request_id: [uniqueID],
              request_date: Date.now(),
              spare_part_name: x.part_name,
              requred_qty: x.required_qty,
            });
          }
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
