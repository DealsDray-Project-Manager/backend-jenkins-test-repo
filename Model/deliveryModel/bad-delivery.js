const mongoose = require("mongoose")

const badDeliverySchema = mongoose.Schema({
    tracking_id: {
        type: String
    },
    order_id: {
        type: String
    },
    order_date: {
        type: Date
    },
    item_id: {
        type: String
    },
    gep_order: {
        type: String
    },
    imei: {
        type: String
    },
    partner_purchase_price: {
        type: Number
    },
    partner_shop: {
        type: String
    },
    base_disscount: {
        type: Number
    },
    diagnostics_discount: {
        type: Number
    },
    storage_discount: {
        type: Number
    },
    buyback_category: {
        type: String
    },
    doorstep_diagnostics: {
        type: String
    },
    delivery_date: {
        type: Date
    },
    uic_status: {
        type: String,
        default: "Pending"
    },
    uic_code: {
        code: String,
        user: String,
        created_at: {
            type: Date,
           
        }
    },
    created_at:{
        type:Date
    },
    download_time:{
        type:Date
    },
    reason:{
        type:Array
    }
})

const badDelivery = mongoose.model("badDelivery", badDeliverySchema)
module.exports = {
    badDelivery: badDelivery
}