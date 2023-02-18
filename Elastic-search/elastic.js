/* config */
const fs = require("fs");
const { Client } = require("@elastic/elasticsearch");
const { delivery } = require("../Model/deliveryModel/delivery");
const { orders } = require("../Model/ordersModel/ordersModel");
const client = new Client({
  node: "http://localhost:9200",
});

/*--------------------------------------------------------------*/

// CREATE INDEXING
module.exports = {
  creatIndex: async () => {
    const result = await client.indices.create({ index: "prexo-delivery" });
    console.log(result);
  },
  bulkImportToElastic: async () => {
    let findDeliveryData = await delivery.find({}, { _id: 0, __v: 0 });
    for (let x of findDeliveryData) {
      const checkOrder = await orders.findOne({ order_id: x.order_id });
      if (checkOrder) {
        x.delivery_status = "Delivered";
      } else {
        x.delivery_status = "Pending";
      }
      
      let bulk = await client.index({
        index: "prexo-delivery",
        //if you need to customise "_id" otherwise elastic will create this
        body: x,
      });
      console.log(bulk);
    }
  },

  superAdminTrackItemSearchData: async (searchInput, from, size) => {
    let data = await client.search({
      index: "prexo-delivery",
      // type: '_doc', // uncomment for Elasticsearch ≤ 6
      body: {
        from: from,
        size: size,
        query: {
          multi_match: {
            query: searchInput,
            fields: ["*"],
          },
        },
      },
    });
    let arr = [];
   
    for (let result of data.hits.hits) {
      console.log(result["_source"].delivery_status);
      result["delivery"] = result["_source"];

      arr.push(result);
    }

    return arr;
  },
};
