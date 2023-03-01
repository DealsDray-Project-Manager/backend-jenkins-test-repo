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
  mappings: async () => {
    let data = await client.indices.putMapping({
      index: "prexo-delivery",
      body: {
        properties: {
          tracking_id: {
            type: "text",
          },
          order_id: {
            type: "text",
          },
          order_date: {
            type: "text",
          },
          item_id: {
            type: "text",
          },
          gep_order: {
            type: "text",
          },
          imei: {
            type: "text",
          },
          partner_purchase_price: {
            type: "text",
          },
          partner_shop: {
            type: "text",
          },
          base_discount: {
            type: "text",
          },
          diagnostics_discount: {
            type: "text",
          },
          storage_discount: {
            type: "text",
          },
          buyback_category: {
            type: "text",
          },
          doorstep_diagnostics: {
            type: "text",
          },
          delivery_date: {
            type: "date",
          },
          uic_status: {
            type: "text",
          },
          uic_code: {
            type: "object",
          },
          created_at: {
            type: "date",
          },
          download_time: {
            type: "date",
          },
          stockin_date: {
            type: "date",
          },
          bag_id: {
            type: "text",
          },
          agent_name: {
            type: "text",
          },
          agent_name_charging: {
            type: "text",
          },
          agent_name_bqc: {
            type: "text",
          },
          tray_id: {
            type: "text",
          },
          assign_to_agent: {
            type: "date",
          },
          assign_to_agent_charging: {
            type: "date",
          },
          assign_to_agent_bqc: {
            type: "date",
          },
          stock_in_status: {
            type: "text",
          },
          bag_close_date: {
            type: "date",
          },
          warehouse_close_date: {
            type: "date",
          },
          tray_status: {
            type: "text",
          },
          tray_type: {
            type: "text",
          },
          tray_location: {
            type: "text",
          },
          tray_closed_by_bot: {
            type: "date",
          },
          handover_sorting_date: {
            type: "date",
          },
          sorting_agent_name: {
            type: "text",
          },
          wht_tray: {
            type: "text",
          },
          wht_tray_assigned_date: {
            type: "date",
          },
          tray_close_wh_date: {
            type: "date",
          },
          charging_in_date: {
            type: "date",
          },
          charging_done_date: {
            type: "text",
          },
          bqc_in_date: {
            type: "date",
          },
          bqc_out_date: {
            type: "date",
          },
          bot_done_received: {
            type: "date",
          },
          charging_done_received: {
            type: "date",
          },
          bqc_done_received: {
            type: "date",
          },
          charging_done_close: {
            type: "date",
          },
          bqc_done_close: {
            type: "date",
          },
          received_from_sorting: {
            type: "date",
          },
          closed_from_sorting: {
            type: "date",
          },
          charging: {
            type: "object",
          },
          bot_report: {
            type: "object",
          },
          bqc_report: {
            type: "object",
          },
          bqc_software_report: {
            type: "object",
          },
          issued_to_audit: {
            type: "date",
          },
          audit_user_name: {
            type: "text",
          },
          audit_report: {
            type: "object",
          },
          audit_done_date: {
            type: "date",
          },
          audit_done_recieved: {
            type: "date",
          },
          audit_done_close: {
            type: "date",
          },
          sales_bin_date: {
            type: "date",
          },
          sales_bin_status: {
            type: "text",
          },
          sales_bin_grade: {
            type: "text",
          },
          sales_bin_wh_agent_name: {
            type: "text",
          },
          sales_bin_desctiption: {
            type: "text",
          },

          issued_to_rdl_fls_one_date: {
            type: "date",
          },
          pickup_request_sent_to_wh_date: {
            type: "date",
          },
        },
      },
    });
    console.log(data);
  },
  bulkImportToElastic: async () => {
    let findDeliveryData = await delivery.find({}, { _id: 0, __v: 0 });
    for (let x of findDeliveryData) {
      const checkOrder = await orders.findOne({ order_id: x.order_id });
      if (checkOrder) {
        x.delivery_status = "Delivered";
        let bulk = await client.index({
          index: "prexo-delivery",
          //if you need to customise "_id" otherwise elastic will create this
          body: x,
        });
        console.log(bulk);
      } else {
        x.delivery_status = "Pending";
      }
    }
  },
  addinToElastic: async (dataOfDelivery) => {
    for (let x of dataOfDelivery) {
      x.uic_status = "Pending";
      x.created_at = Date.now();
      x.delivery_status = "Delivered";
      let bulk = await client.index({
        index: "prexo-delivery",
        //if you need to customise "_id" otherwise elastic will create this
        body: x,
      });
      console.log(bulk);
    }
    return;
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
      result.delivery_status = "Delivered";
      result["delivery"] = result["_source"];

      arr.push(result);
    }
    console.log(arr);

    return arr;
  },
  //UPDATE STOCKIN STATUS
  updateUic: async (tracking_id, bag_id) => {
    let data = await client.updateByQuery({
      index: "prexo-delivery",
      refresh: true,
      body: {
        script: {
          lang: "painless",
          source: `ctx._source.bag_id = '${bag_id}'; ctx._source.stockin_date = params.stockin_date; ctx._source.stock_in_status = 'Valid'`,
          params: {
            stockin_date: Date.now(),
          },
        },
        query: {
          match: {
            tracking_id: tracking_id,
          },
        },
      },
    });
    console.log(data);
    return data;
  },
  //CLOSE BAG
  closeBagAfterItemPuted: async (tracking_id) => {
    let data = await client.updateByQuery({
      index: "prexo-delivery",
      refresh: true,
      body: {
        script: {
          lang: "painless",
          source: ` ctx._source.bag_close_date = params.bag_close_date`,
          params: {
            bag_close_date: Date.now(),
          },
        },
        query: {
          match: {
            tracking_id: tracking_id,
          },
        },
      },
    });

    return data;
  },
  uicCodeGen: async (deliveryData) => {
   let deleteDoc =await client.deleteByQuery({
    index: "prexo-delivery",
    body: {
      query: {
        match: {
          tracking_id: deliveryData.tracking_id,
        }
      }
    }
   })
    let bulk = await client.index({
      index: "prexo-delivery",
      //if you need to customise "_id" otherwise elastic will create this
      body: deliveryData,
    });
    console.log(bulk);
  }
  
  
  
};
