const {delivery} = require("../../Model/deliveryModel/delivery");
const { masters } = require("../../Model/mastersModel");
/****************************************************************** */
module.exports = {
  getAssignedTray: (username) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.find({
        $or: [
          { issued_user_name: username, sort_id: "Issued to BQC" },
          { issued_user_name: username, sort_id: "BQC IN" },
        ],
      });
      if (data) {
        resolve(data);
      }
    });
  },
  getWhtTrayitem: (trayId) => {
   
    return new Promise(async (resolve, reject) => {
      let data = await masters.findOne({ code: trayId });
      resolve(data);
    });
  },
  bqcIn: (trayData) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.findOneAndUpdate(
        { code: trayData.trayId },
        {
          $set: {
            sort_id: "BQC IN",
            closed_time_bot: Date.now(),
            description: trayData.description,
            actual_items: [],
          },
        }
      );
      if (data) {
        for (let x of data.items) {
          let deliveryUpdate = await delivery.updateOne(
            {
              tracking_id: x.tracking_id,
            },
            {
              $set: {
                bqc_in_date: Date.now(),
                tray_status: "BQC IN",
                tray_location: "BQC",
              },
            }
          );
        }
        resolve(data);
      } else {
        resolve();
      }
    });
  },
  bqcOut: (trayData) => {
    return new Promise(async (resolve, reject) => {
      let data = await masters.findOneAndUpdate(
        { code: trayData.trayId },
        {
          $set: {
            sort_id: "BQC Done",
            closed_time_bot: Date.now(),
            
            description: trayData.description,
            items: [],
          },
        }
      );
      if (data) {
        for (let x of data.items) {
          let deliveryUpdate = await delivery.updateOne(
            {
              tracking_id: x.tracking_id,
            },
            {
              $set: {
                bqc_out_date: Date.now(),
                tray_status: "BQC Done",
                tray_location: "BQC",
              },
            }
          );
        }
        resolve(data);
      } else {
        resolve();
      }
    });
  },
};
