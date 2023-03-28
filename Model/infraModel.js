const mongoose=require("mongoose")

const infraSchema=mongoose.Schema({
    name:{
        type:String
    },
    code:{
        type:String
    },
    category:{
        type:String
    },
    address:{
        type:String
    },
    city:{
        type:String
    },
    state:{
        type:String
    },
    country:{
        type:String
    },
    pincode:{
        type:String
    },
    type_taxanomy:{
        type:String,
     
    },
    parent_id:{
        type:String,
        default:null
    },
    warehouse_type:{
        type:String
    },
    location_type:{
        type:String
    }
})

const infra=mongoose.model("infra",infraSchema)
module.exports={
    infra:infra
}