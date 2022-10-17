const mongoose=require("mongoose")

const stockInSchema=mongoose.Schema({
    bag_id:{
        type:String
    },
    awbn_number: {
        type:String
    },
    uic_code:{
        type:Boolean
    },
    sleaves:{
        type:Boolean
    },
    stock_in:{
        type:Date
    },
    status:{
        type:String
    }
})

const stockIn=mongoose.model("stockIn",stockInSchema)
module.exports={
    stockIn:stockIn
}