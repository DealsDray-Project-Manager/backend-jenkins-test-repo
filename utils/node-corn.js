/* REQUIRE NODE CRON */
const corn = require("node-cron");
/* REQUIRE MASTERS MODULE */
const { masters } = require("../Model/mastersModel");
const { delivery } = require("../Model/deliveryModel/delivery");
/***************************************** */

exports = module.exports = () => {
  try {
    corn.schedule("55 23 * * *", async () => {
      let getIssueTray = await masters.find({
        $or: [
          { type_taxanomy: "PMT", prefix: "tray-master", sort_id: "Issued" },
          { type_taxanomy: "MMT", prefix: "tray-master", sort_id: "Issued" },
        ],
      });
      for (let x of getIssueTray) {
        for (let y of x.items) {
          let deliveryTrack = await delivery.updateMany(
            { tracking_id: x.awbn_number },
            {
              $set: {
                tray_closed_by_bot: Date.now(),
                tray_status: "Closed By Bot",
              },
            }
          );
        }
      }
      let getData = await masters.updateMany(
        {
          $or: [
            { type_taxanomy: "PMT", prefix: "tray-master", sort_id: "Issued" },
            { type_taxanomy: "MMT", prefix: "tray-master", sort_id: "Issued" },
          ],
        },
        {
          $set: {
            sort_id: "Closed By Bot",
            closed_time_bot: Date.now(),
          },
        }
      );
      console.log(getData);
    });
  } catch (error) {
    console.log(error);
  }
};
