/* config */
const fs = require("fs");
const { Client } = require("@elastic/elasticsearch");
const { delivery } = require("../Model/deliveryModel/delivery");
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
    for(let x of findDeliveryData){
      let bulk = await client.index({
        index: "prexo-delivery",
        //if you need to customise "_id" otherwise elastic will create this
        body: x,
      });
      console.log(bulk);
    }
  },
  searchData:async(searchInput)=>{
  let data=  await client.search({
      index: 'prexo-delivery',
      // type: '_doc', // uncomment for Elasticsearch ≤ 6
      body: {
        query: {
          match: { tracking_id: searchInput }
        }
      }
    })
    let arr=[]
    for(let result of data.hits.hits){
      result["delivery"]=result["_source"]
      arr.push(result)
    }
    // console.log(arr);
    return arr
  }
};
