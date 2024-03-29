/* config */
const fs = require("fs");
const { Client } = require("@elastic/elasticsearch");
const { delivery } = require("../Model/deliveryModel/delivery");
const { orders } = require("../Model/ordersModel/ordersModel");
const { products } = require("../Model/productModel/product");
const client = new Client({
  node: "http://localhost:9200",
});

/*--------------------------------------------------------------*/

// CREATE INDEXING
module.exports = {
  creatIndex: async () => {
    const result = await client.indices.create({ index: "prexo-delivery" });
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
          // bqc_software_report: {
          //   type: "object",
          // },
          issued_to_audit: {
            type: "date",
          },
          audit_user_name: {
            type: "text",
          },
          // audit_report: {
          //   type: "object",
          // },
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
          rdl_fls_one_user_name: {
            type: "text",
          },
          rdl_fls_issued_date: {
            type: "date",
          },
          rdl_fls_closed_date: {
            type: "date",
          },
          rdl_fls_done_recieved_date: {
            type: "date",
          },
          rdl_fls_done_closed_wh: {
            type: "date",
          },
        },
      },
    });
  },
  bulkImportToElastic: async () => {
    let findDeliveryData = await delivery.find({}, { _id: 0, __v: 0 });
    console.log(findDeliveryData[0]);

    for (let x of findDeliveryData) {
      if (x.bqc_software_report !== undefined) {
        let obj = {
          _ro_ril_miui_imei0: x?.bqc_software_report?._ro_ril_miui_imei0,
          mobile_imei: x?.bqc_software_report?.mobile_imei,
          mobile_imei2: x?.bqc_software_report?.mobile_imei2,
        };
        x.bqc_software_report = obj;
      }
      const checkOrder = await orders.findOne({ order_id: x.order_id });
      if (checkOrder) {
        x.delivery_status = "Delivered";
        x.order_date = checkOrder?.order_date;
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
      track_total_hits: true,
    });
    let arr = [];
    let count = data?.hits?.total?.value;
    for (let result of data.hits.hits) {
      console.log(result["_source"].delivery_status);
      result.delivery_status = "Delivered";
      result["delivery"] = result["_source"];

      arr.push(result);
    }
    console.log(arr);

    return { searchResult: arr, count: count };
  },
  superMisItemSearchData: async (searchInput, limit, skip, location, type) => {
    let count = 0;
    let data = await client.search({
      index: "prexo-delivery",
      // type: '_doc', // uncomment for Elasticsearch ≤ 6
      body: {
        from: skip,
        size: limit,
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query: searchInput,
                  fields: ["*"],
                },
              },
              {
                match: {
                  partner_shop: location,
                },
              },
            ],
          },
        },
        track_total_hits: true,
      },
    });
    count = data?.hits?.total?.value;
    let arr1 = [];
    if (type !== "only-limited-data") {
      let dataForDownload = await client.search({
        index: "prexo-delivery",
        size: 10000,
        // type: '_doc', // uncomment for Elasticsearch ≤ 6
        body: {
          query: {
            bool: {
              must: [
                {
                  multi_match: {
                    query: searchInput,
                    fields: ["*"],
                  },
                },
                {
                  match: {
                    partner_shop: location,
                  },
                },
              ],
            },
          },
        },
        track_total_hits: true,
      });
      for (let result of dataForDownload.hits.hits) {
        result.delivery_status = "Delivered";
        result["delivery"] = result["_source"];
        arr1.push(result);
      }
    }
    let arr = [];
    for (let result of data.hits.hits) {
      result.delivery_status = "Delivered";
      result["delivery"] = result["_source"];

      arr.push(result);
    }

    return { limitedResult: arr, allMatchedResult: arr1, count: count };
  },
  searchDataOfDeliveryReporting: async (searchInput, limit, skip, location) => {
    let data = await client.search({
      index: "prexo-delivery",
      // type: '_doc', // uncomment for Elasticsearch ≤ 6
      body: {
        from: skip,
        size: limit,
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query: searchInput,
                  fields: ["*"],
                },
              },
              {
                match: {
                  partner_shop: location,
                },
              },
            ],
          },
        },
      },
      track_total_hits: true,
    });
    let dataForDownload = await client.search({
      index: "prexo-delivery",
      size: 10000,
      // type: '_doc', // uncomment for Elasticsearch ≤ 6
      body: {
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query: searchInput,
                  fields: ["*"],
                },
              },
              {
                match: {
                  partner_shop: location,
                },
              },
            ],
          },
        },
      },
      track_total_hits: true,
    });
    let arr1 = [];
    for (let result of dataForDownload.hits.hits) {
      let findData = await products.find(
        { vendor_sku_id: result["_source"]?.item_id },
        { out_of_stock: 0 }
      );
      if (findData) {
        result["_source"]["products"] = findData;
      }
      console.log(result["_source"]);
      arr1.push(result["_source"]);
    }
    let arr = [];
    let count = data?.hits?.total?.value;

    for (let result of data.hits.hits) {
      let findData = await products.find(
        { vendor_sku_id: result["_source"]?.item_id },
        { out_of_stock: 0 }
      );
      if (findData) {
        result["_source"]["products"] = findData;
      }
      console.log(result["_source"]);
      arr1.push(result["_source"]);
      arr.push(result["_source"]);
    }

    return { searchResult: arr, count: count, dataForDownload: arr1 };
  },
  searchUnverifiedImei: async (searchInput, limit, skip, location) => {
    let data = await client.search({
      index: "prexo-delivery",
      // type: '_doc', // uncomment for Elasticsearch ≤ 6
      body: {
        from: skip,
        size: limit,
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query: searchInput,
                  fields: ["*"],
                },
              },
              {
                match: {
                  partner_shop: location,
                },
              },
              {
                match: {
                  unverified_imei_status: "Unverified",
                },
              },
            ],
          },
        },
      },
      track_total_hits: true,
    });
    let dataForDownload = await client.search({
      index: "prexo-delivery",
      size: 10000,
      // type: '_doc', // uncomment for Elasticsearch ≤ 6
      body: {
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query: searchInput,
                  fields: ["*"],
                },
              },
              {
                match: {
                  partner_shop: location,
                },
              },
              {
                match: {
                  unverified_imei_status: "Unverified",
                },
              },
            ],
          },
        },
      },
      track_total_hits: true,
    });
    let arr1 = [];
    for (let result of dataForDownload.hits.hits) {
      arr1.push(result["_source"]);
    }
    let arr = [];
    let count = data?.hits?.total?.value;

    for (let result of data.hits.hits) {
      console.log(result["_source"]);

      arr.push(result["_source"]);
    }

    return { searchResult: arr, count: count, dataForDownload: arr1 };
  },
  searchUnverifiedImeiSupAdmin: async (searchInput, limit, skip) => {
    let data = await client.search({
      index: "prexo-delivery",
      // type: '_doc', // uncomment for Elasticsearch ≤ 6
      body: {
        from: skip,
        size: limit,
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query: searchInput,
                  fields: ["*"],
                },
              },
              {
                match: {
                  unverified_imei_status: "Unverified",
                },
              },
            ],
          },
        },
      },
      track_total_hits: true,
    });
    let arr = [];
    let count = data?.hits?.total?.value;
    for (let result of data.hits.hits) {
      arr.push(result["_source"]);
    }

    return { searchResult: arr, count: count };
  },
  searchForUpgradeUnits: async (searchInput, limit, skip, location) => {
    let data = await client.search({
      index: "prexo-delivery",
      // type: '_doc', // uncomment for Elasticsearch ≤ 6
      body: {
        from: skip,
        size: limit,
        query: {
          bool: {
            must: [
              {
                multi_match: {
                  query: searchInput,
                  fields: ["*"],
                },
              },
              {
                match: {
                  partner_shop: location,
                },
              },
              {
                match: {
                  "audit_report.stage": "Upgrade",
                },
              },
            ],
          },
        },
      },
      track_total_hits: true,
    });

    let arr = [];
    let count = data?.hits?.total?.value;

    for (let result of data.hits.hits) {
      console.log(result["_source"]);

      arr.push(result["_source"]);
    }

    return { searchResult: arr, count: count };
  },
  searchRdlOneDoneUnits: async (searchInput, limit, skip, location) => {
    let data = await client.search({
      index: "prexo-delivery",
      // type: '_doc', // uncomment for Elasticsearch ≤ 6
      body: {
        from: skip,
        size: limit,
        query: {
          bool: {
            must: [
              {
                exists: {
                  field: "rdl_fls_closed_date",
                },
              },
              {
                multi_match: {
                  query: searchInput,
                  fields: ["*"],
                },
              },
              {
                match: {
                  partner_shop: location,
                },
              },
            ],
          },
        },
      },
      track_total_hits: true,
    });
    let arr = [];
    let count = data?.hits?.total?.value;
    for (let result of data.hits.hits) {
      arr.push(result["_source"]);
    }
    return { searchResult: arr, count: count };
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
    try {
      let deleteDoc = await client.deleteByQuery({
        index: "prexo-delivery",
        body: {
          query: {
            match: {
              tracking_id: deliveryData.tracking_id,
            },
          },
        },
        conflicts: "proceed",
        refresh: true,
      });
      let bulk = await client.index({
        index: "prexo-delivery",
        //if you need to customise "_id" otherwise elastic will create this
        body: deliveryData,
      });
    } catch (error) {
      if (error.meta.statusCode === 409) {
        console.error("Version conflict:", error.body.error);
        // Handle version conflict error here
      } else {
        console.error("An error occurred:", error);
      }
    }
  },
};
