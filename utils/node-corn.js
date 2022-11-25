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
        if (x.items.length == 0) {
          let getData = await masters.updateOne(
            {
              code: x.code,
            },
            {
              $set: {
                sort_id: "Closed By Bot",
                closed_time_bot: Date.now(),
              },
            }
          );
        }
      }
    });
  } catch (error) {
  }
};
